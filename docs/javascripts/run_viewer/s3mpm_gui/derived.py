# copied from MPM3SGui/s3mpm_gui/derived.py by make_run_viewer_files.py - do not edit
"""What the solver will DERIVE from the scene, computed here so the GUI can show it before a run.

A line-for-line port of the sizing rules in MPM3S/src/setup/setup_material_point.jl (min_element_size,
snap_to_min, cells_up, material_geometry, domain_box, input_depth, input_scaling, block_top,
block_positions + layer_of) and adaptivity_on_rigid_body.jl (input_adaptivity's depths). Keep the two in
step: tests/test_derived.py cross-checks these numbers against the Julia reader.

`validate` lists the problems the reader would throw on (errors) plus the ones it would silently accept
but that are almost certainly mistakes (warnings).
"""
from __future__ import annotations

import math
import os
from dataclasses import dataclass, field
from typing import Optional

from . import joints as J
from . import model as M

EPS = 2.220446049250313e-16
SQEPS = math.sqrt(EPS)


def min_element_size(s: M.Scene) -> float:
    sizes = [s.material_points.element_size]
    for st in s.analysis:
        a = st.adaptivity
        if a is not None and a.type == "rigid body surface":
            sizes.append(a.element_size)
            if a.use_region:
                sizes.append(a.element_size_in_region)
    return min(sizes)


def snap_to_min(x: float, h: float) -> float:
    return h * 2.0 ** math.floor(math.log2(x / h) + SQEPS)


def cells_up(x: float, dx: float) -> int:
    return max(1, math.ceil(x / dx - SQEPS))


@dataclass
class StageMesh:
    finest_depth: int = 0
    fine_size: Optional[float] = None      # snapped "element size" (rigid body surface)
    region_size: Optional[float] = None    # snapped "element size in region"
    region_radius: Optional[float] = None  # the radius after the reader's ratio scaling
    kind: str = "none"                     # what the solver will actually use for this stage


@dataclass
class Derived:
    h: float = 0.0                 # smallest element size anywhere — the ladder
    dx: float = 0.0                # base cell (snapped "element size")
    fx: float = 0.0                # footprint, snapped up to whole cells
    fy: float = 0.0
    thicknesses: list = field(default_factory=list)
    domain_box: tuple = (0.0, 0.0, 0.0)   # the material BC box: (fx, fy, 2·Σt snapped)
    domain_size: float = 0.0       # max(domain_box) — the cube must hold the material box's largest side
    depth: int = 0                 # base octree depth
    finest_depth: int = 0          # over every stage
    finest_cell: float = 0.0       # scaling / 2^finest_depth — the smallest element any stage uses
    contact_margin: float = 0.0    # 2·finest_cell: the per-tet narrow-phase search margin (make_rigid_bodies)
    scaling: float = 0.0           # the octree cube side L = dx·2^depth
    morton: str = "UInt16"
    s: float = 0.0                 # MP spacing dx/npart
    block_top: float = 0.0         # Σt snapped UP to whole MP rows
    nxyz: tuple = (0, 0, 0)
    n_mp: int = 0
    layer_z_bot: list = field(default_factory=list)   # interface heights, top → bottom (last = 0)
    layer_mp: list = field(default_factory=list)      # MPs per layer
    stages: list = field(default_factory=list)        # StageMesh per stage
    ok: bool = True
    error: str = ""


def derive(s: M.Scene) -> Derived:
    d = Derived()
    mp = s.material_points
    try:
        sizes_ok = mp.element_size > 0 and all(
            (st.adaptivity is None or st.adaptivity.type != "rigid body surface" or
             (st.adaptivity.element_size > 0 and (not st.adaptivity.use_region or st.adaptivity.element_size_in_region > 0)))
            for st in s.analysis)
        if not sizes_ok:
            raise ValueError("every element size must be > 0")
        if not mp.layers:
            raise ValueError("the soil block needs at least one layer")
        if any(l.thickness <= 0 for l in mp.layers):
            raise ValueError("every layer thickness must be > 0")
        if mp.npart < 1:
            raise ValueError('"number of material points per element 1" must be ≥ 1')
        if mp.size_max[0] <= 0 or mp.size_max[1] <= 0:
            raise ValueError("the footprint must be > 0 in x and y")
        d.h = min_element_size(s)
        d.dx = snap_to_min(mp.element_size, d.h)
        d.fx = cells_up(mp.size_max[0], d.dx) * d.dx
        d.fy = cells_up(mp.size_max[1], d.dx) * d.dx
        d.thicknesses = [l.thickness for l in mp.layers]
        T = sum(d.thicknesses)
        d.domain_box = (d.fx, d.fy, cells_up(2 * T, d.dx) * d.dx)
        d.domain_size = max(d.domain_box)
        d.depth = math.ceil(math.log2(d.domain_size / d.dx) - SQEPS)
        d.scaling = d.dx * 2.0 ** d.depth
        L = d.scaling

        # per-stage meshes (input_adaptivity) — every stage counts toward the finest depth, bodies on or off
        finest = 0
        for st in s.analysis:
            sm = StageMesh()
            a = st.adaptivity
            if a is None or a.type == "none":
                sm.kind = "none"
            elif a.type == "uniform":
                sm.kind = "uniform"
            else:
                sm.fine_size = snap_to_min(a.element_size, d.h)
                df = round(math.log2(L / sm.fine_size))
                dr = 0
                if a.use_region:
                    sm.region_size = snap_to_min(a.element_size_in_region, d.h)
                    sm.region_radius = a.region * sm.region_size / a.element_size_in_region
                    dr = round(math.log2(L / sm.region_size))
                sm.finest_depth = max(df, dr)
                sm.kind = "rigid body surface" if st.rigid_bodies else "none (bodies off)"
            finest = max(finest, sm.finest_depth)
            d.stages.append(sm)
        d.finest_depth = max(d.depth, finest)
        d.morton = "UInt16" if d.finest_depth <= 15 else "UInt32" if d.finest_depth <= 31 else "UInt64"
        d.finest_cell = d.scaling / 2.0 ** d.finest_depth           # setup_problem's `cell`
        d.contact_margin = 2 * d.finest_cell                        # make_rigid_bodies' per-tet search margin g

        # the block of MPs (block_top + block_positions) and its split into layers (layer_of)
        d.s = d.dx / mp.npart
        d.block_top = cells_up(T, d.s) * d.s
        nx, ny, nz = (round(d.fx / d.s), round(d.fy / d.s), round(d.block_top / d.s))
        d.nxyz = (nx, ny, nz)
        d.n_mp = nx * ny * nz
        nL = len(d.thicknesses)
        d.layer_z_bot = [0.0 if i == nL - 1 else T - sum(d.thicknesses[:i + 1]) for i in range(nL)]
        tol = SQEPS * d.scaling
        per = [0] * nL
        for k in range(nz):
            z = (k + 0.5) * d.s
            i = 0
            while i < nL - 1 and z < d.layer_z_bot[i] - tol:
                i += 1
            per[i] += nx * ny
        d.layer_mp = per
    except (ValueError, ZeroDivisionError, OverflowError) as e:
        d.ok = False
        d.error = str(e)
    return d


def layer_bounds(d: Derived) -> list:
    """(z_bottom, z_top) for each layer as drawn: the top layer reaches the block's actual top."""
    out, top = [], d.block_top
    for zb in d.layer_z_bot:
        out.append((zb, top))
        top = zb
    return out


# ── boundary track (boundary_data/boundary_track.jl) ──────────────────────────────────────────────────
def _advance(prev: float, raw: float, mode: str, dx: float) -> float:
    """`advance`: :positive floors + ratchets up, :negative ceils + ratchets down, :both rounds (no ratchet)."""
    if mode == "positive":
        return max(prev, math.floor(raw / dx) * dx)
    if mode == "negative":
        return min(prev, math.ceil(raw / dx) * dx)
    return round(raw / dx) * dx      # Julia round() and Python round() both break ties to even


def track_init(track: tuple, bb, d: Derived) -> tuple:
    """init_sleep!'s window: the body AABB `bb` ∓ distance snapped OUT to the base grid (lo floored, hi
    ceiled), bounded by the material box — a tracked axis is clamped to it, an "off" axis spans it. (lo, hi)."""
    tmin, tmax = track
    mlo, mhi = (0.0, 0.0, 0.0), d.domain_box
    lo = tuple(float(mlo[a] if tmin.type[a] == "off" else
                     max(mlo[a], math.floor((bb[0][a] - tmin.distance[a]) / d.dx) * d.dx)) for a in range(3))
    hi = tuple(float(mhi[a] if tmax.type[a] == "off" else
                     min(mhi[a], math.ceil((bb[1][a] + tmax.distance[a]) / d.dx) * d.dx)) for a in range(3))
    return lo, hi


def track_march(track: tuple, plane: tuple, bb, d: Derived) -> tuple:
    """update_sleep!'s window for one step: every tracked plane marched by its `advance` from the body's
    committed AABB `bb`, still inside the material box. (lo, hi)."""
    tmin, tmax = track
    mlo, mhi = (0.0, 0.0, 0.0), d.domain_box
    lo = tuple(float(mlo[a] if tmin.type[a] == "off" else
                     max(mlo[a], _advance(plane[0][a], bb[0][a] - tmin.distance[a], tmin.advance[a], d.dx)))
               for a in range(3))
    hi = tuple(float(mhi[a] if tmax.type[a] == "off" else
                     min(mhi[a], _advance(plane[1][a], bb[1][a] + tmax.distance[a], tmax.advance[a], d.dx)))
               for a in range(3))
    return lo, hi


def removal_box(track: tuple, lo: tuple, hi: tuple) -> tuple:
    """removal_box: a face bounds it only if it is a DELETE face — a trailing edge (min + positive, max +
    negative) with "remove": yes; otherwise ±∞. An MP that leaves the window sleeps while it is still inside
    this box; outside it (swept past a delete face) its slot is freed."""
    tmin, tmax = track
    rlo = tuple(lo[a] if tmin.remove[a] and tmin.advance[a] == "positive" else -math.inf for a in range(3))
    rhi = tuple(hi[a] if tmax.remove[a] and tmax.advance[a] == "negative" else math.inf for a in range(3))
    return rlo, rhi


def track_window(track: tuple, bb, d: Derived) -> dict:
    """The track planes the MPs first see: init_sleep!'s window marched once by update_sleep! at step 1 with
    the body not yet moved. A ratcheting face keeps the outward snap; a "both" face re-rounds to the nearest
    node. {("min"|"max", axis): value} for every face/axis whose type is not "off"."""
    lo, hi = track_march(track, track_init(track, bb, d), bb, d)
    out = {("min", a): lo[a] for a in range(3) if track[0].type[a] != "off"}
    out.update({("max", a): hi[a] for a in range(3) if track[1].type[a] != "off"})
    return out


def effective_face_bcs(st: M.Stage) -> M.FaceBCs:
    """The material-box BCs the solver uses for a stage (setup_analysis.jl: override_bc): on every face/axis
    whose boundary-track type is not "off" — bodies-on stages only — the TRACK type replaces the face's own
    (even a weaker one: box fixed + track roller ⇒ roller). No "boundary conditions" block ⇒ faces start free."""
    own = st.bcs or M.FaceBCs(["free"] * 3, ["free"] * 3)
    if not (st.rigid_bodies and st.track is not None):
        return M.FaceBCs(list(own.min), list(own.max))
    pick = lambda face, tf: [f if t == "off" else t for f, t in zip(face, tf.type)]
    return M.FaceBCs(pick(own.min, st.track[0]), pick(own.max, st.track[1]))


def track_gap_floor(face: str, advance: str, dist: float, dx: float) -> Optional[float]:
    """Smallest body-to-plane gap once the plane is marching (None = never below `dist`). A LEADING
    face (max + positive, min + negative) trails its target by < dx, so the gap can drop to just above
    dist − dx; a "both" face rounds, so dist − dx/2; a trailing face snaps outward and stays ≥ dist."""
    if advance == "both":
        return dist - dx / 2
    if (face == "max") == (advance == "positive"):
        return dist - dx
    return None


# ── validation ─────────────────────────────────────────────────────────────────────────────────────────
@dataclass
class Issue:
    level: str        # "error" | "warning" | "info"
    where: str        # a short location, e.g. "Stage 2 / adaptivity"
    message: str


def resolve(path: str, base_dir: Optional[str]) -> str:
    """A path from the JSON as the solver resolves it: relative to the JSON's directory."""
    if os.path.isabs(path) or not base_dir:
        return path
    return os.path.normpath(os.path.join(base_dir, path))


def validate(s: M.Scene, base_dir: Optional[str] = None, d: Optional[Derived] = None) -> list:
    d = d or derive(s)
    out: list = []
    E = lambda w, m: out.append(Issue("error", w, m))
    W = lambda w, m: out.append(Issue("warning", w, m))
    I = lambda w, m: out.append(Issue("info", w, m))

    if not d.ok:
        E("Soil block", d.error)
    mp = s.material_points
    if mp.extra_capacity < 1:
        E("Soil block", f'"extra capacity" is a factor ≥ 1 (1.2 = 20 % spare slots), got {mp.extra_capacity:g}')
    if d.ok:
        for i, (n, l) in enumerate(zip(d.layer_mp, mp.layers)):
            if n == 0:
                E(f"Layer {i + 1}", f"holds no material points — thinner ({l.thickness:g}) than the MP spacing {d.s:g}")
        if abs(d.fx - mp.size_max[0]) > 1e-12 or abs(d.fy - mp.size_max[1]) > 1e-12:
            I("Soil block", f"footprint {mp.size_max[0]:g} × {mp.size_max[1]:g} snaps up to whole cells: {d.fx:g} × {d.fy:g}")
        if abs(d.dx - mp.element_size) > 1e-12 * d.dx:
            I("Soil block", f'"element size" {mp.element_size:g} snaps down to {d.dx:g} (a power-of-two multiple of the finest size {d.h:g})')
        if d.finest_depth > 31:
            W("Mesh", f"finest octree depth {d.finest_depth} needs UInt64 Morton codes")
    for i, l in enumerate(mp.layers):
        m = l.material
        if m.type not in M.MATERIAL_TYPES:
            E(f"Layer {i + 1}", f'unknown material type "{m.type}"')
        if m.E <= 0:
            E(f"Layer {i + 1}", "E must be > 0")
        if not (-1 < m.nu < 0.5):
            E(f"Layer {i + 1}", f"Poisson's ratio must lie in (-1, 0.5), got {m.nu:g}")
        if m.density <= 0:
            W(f"Layer {i + 1}", "density ≤ 0 — the layer has no weight")
        if m.type == "willam warnke" and m.dilation_angle > m.friction_angle:
            W(f"Layer {i + 1}", "dilation angle exceeds the friction angle")

    # rigid bodies
    nsys = len(s.rigid_bodies)
    any_stl = False
    vec = lambda v: "(" + ", ".join(f"{x:g}" for x in v) + ")"
    for i, sy in enumerate(s.rigid_bodies):
        w = f"Body {i + 1}" + (f" ({sy.name})" if sy.name else "")
        npt = len(sy.points)
        if npt == 0:
            E(w, "a system needs at least one point")
        for j, p in enumerate(sy.points):
            if p.mass <= 0:
                W(f"{w} / point {j + 1}", "mass ≤ 0")
            if any(x <= 0 for x in p.inertia):
                W(f"{w} / point {j + 1}", "rotational inertia ≤ 0")
        for j, c in enumerate(sy.constraints):
            if c.type not in M.CONSTRAINT_TYPES:
                W(f"{w} / constraint {j + 1}", f'unknown type "{c.type}" — the reader treats it as a coincidence')
            if len(c.points) != 2 or not all(1 <= p <= npt for p in c.points):
                E(f"{w} / constraint {j + 1}", f"points {c.points} must be two of 1..{npt}")
            elif c.points[0] == c.points[1]:
                E(f"{w} / constraint {j + 1}", "a constraint joins two DIFFERENT points")
            # a hinge has ONE axis, carried by both points and held parallel (E = k·(1 − d̂1·d̂2)): directions that
            # start apart are a hinge that starts twisted, which the lock then turns the parts to close
            n1, n2 = math.hypot(*c.direction1), math.hypot(*c.direction2)
            if c.type == "rotation lock" and n1 > 0 and n2 > 0:
                cos = sum(a * b for a, b in zip(c.direction1, c.direction2)) / (n1 * n2)
                if cos < 1 - 1e-12:
                    W(f"{w} / constraint {j + 1}",
                      f'rotation lock: "direction 2" {vec(c.direction2)} is not along "direction 1" '
                      f"{vec(c.direction1)} — the hinge starts twisted by "
                      f"{math.degrees(math.acos(max(-1.0, cos))):.1f}° and the lock will turn the parts to close it. "
                      'On its page, "= direction 1" makes it follow')
        # a distance stop caps a hinge at its "angle limit" only from that hinge's pin: the reader sizes its cable
        # from arms about the stop's OWN "rotation centre" (stop_length), whatever the rotation lock turns about
        for j, hinge, pin, stops in J.misplaced_stops(sy):
            c = sy.constraints[j]
            got = ("is not stopped within half a turn" if stops == (None, None) else
                   "stops at " + " / ".join("—" if x is None else f"{math.degrees(x):+.1f}°" for x in stops))
            W(f"{w} / constraint {j + 1}",
              f'distance stop: its cable is sized from its own "rotation centre" {vec(c.rotation_centre)}, but the '
              f"hinge it caps (constraint {hinge + 1}) turns about {vec(pin)} — so the hinge {got}, not at the "
              f"{c.angle_limit:g}° asked for. Give the stop the hinge's rotation centre")
        for j, f in enumerate(sy.stl_files):
            any_stl = True
            ww = f"{w} / mesh {f.name or j + 1}"
            if not 1 <= f.point <= npt:
                E(ww, f'"point" {f.point} is out of range (the system has {npt} points)')
            if not f.stl:
                E(ww, "no STL file")
                continue
            p = resolve(f.stl, base_dir)
            if not os.path.isfile(p):
                E(ww, f"STL not found: {p}")
            if not f.mesh_cache:
                E(ww, 'no "mesh cache" path (the solver writes the Gmsh tet mesh there)')
            elif os.path.isfile(p):
                c = resolve(f.mesh_cache, base_dir)
                if not os.path.isfile(c):
                    I(ww, f"mesh cache {os.path.basename(c)} will be built by Gmsh on the first run")
                elif os.path.getmtime(c) < os.path.getmtime(p):
                    W(ww, f"mesh cache {os.path.basename(c)} is OLDER than the STL — the solver reuses a cache "
                          "as-is, so delete it to rebuild from the current STL")
        for j, t in enumerate(sy.tracked_nodes):
            if not 1 <= t.point <= npt:
                E(f"{w} / tracked node {j + 1}", f'"point" {t.point} is out of range (the system has {npt} points)')

    # analysis
    if not s.analysis:
        E("Analysis", "add at least one stage")
    npts = [len(sy.points) for sy in s.rigid_bodies]
    for i, st in enumerate(s.analysis):
        w = f"Stage {i + 1}"
        if st.type == "dynamic":
            if st.dt <= 0 or st.final_time <= 0:
                E(w, "dt and final time must be > 0")
            elif st.dt > st.final_time:
                E(w, "dt is longer than the final time")
            elif abs(st.final_time / st.dt - round(st.final_time / st.dt)) > 1e-6:
                I(w, f"final time / dt = {st.final_time / st.dt:.4g} is not a whole number of steps")
        else:
            if st.load_steps < 1:
                E(w, '"load steps" must be ≥ 1')
            if st.load not in M.STATIC_LOADS:
                E(w, f'"load" must be "gravity ramp" or "full", got "{st.load}"')
        if st.rigid_bodies and nsys == 0:
            W(w, 'rigid bodies "on" but the scene has no rigid bodies')
        if st.rigid_bodies and st.placement and not any_stl:
            W(w, "surface placement is on but no body carries an STL")
        a = st.adaptivity
        if a is not None and a.type == "rigid body surface":
            sm = d.stages[i] if d.ok and i < len(d.stages) else None
            if sm is not None:
                wa = f"{w} / adaptivity"
                depth = lambda size: round(math.log2(d.scaling / size))
                if abs(sm.fine_size - a.element_size) > 1e-12 * a.element_size:
                    I(wa, f'"element size" {a.element_size:g} snaps down to {sm.fine_size:g} (depth {depth(sm.fine_size)})')
                if a.use_region and abs(sm.region_size - a.element_size_in_region) > 1e-12 * a.element_size_in_region:
                    I(wa, f'"element size in region" {a.element_size_in_region:g} snaps down to {sm.region_size:g} '
                          f"(depth {depth(sm.region_size)}); the region half-width {a.region:g} scales with it to "
                          f"{sm.region_radius:g}")
            if not st.rigid_bodies:
                I(w, "rigid-body-surface adaptivity collapses to none while the stage's bodies are off")
            if a.element_size > mp.element_size:
                W(w, f"adaptivity element size {a.element_size:g} is coarser than the base {mp.element_size:g}")
        for j, e in enumerate(st.point_bcs):
            if not (1 <= e.system <= nsys and 1 <= e.point <= npts[e.system - 1]):
                E(f"{w} / point BC {j + 1}", f"names system {e.system} point {e.point}, which does not exist")
        if st.rigid_bodies and st.track is not None and d.ok:
            ax = "xyz"
            for face, tf in zip(("min", "max"), st.track):
                for a in range(3):
                    if tf.type[a] == "off":
                        continue
                    lowest = track_gap_floor(face, tf.advance[a], tf.distance[a], d.dx)
                    if lowest is not None and lowest < 0:
                        lead = "rounds to the nearest node" if tf.advance[a] == "both" else "is the leading face"
                        W(f"{w} / boundary track", f'{face} {ax[a]}: distance {tf.distance[a]:g} < '
                          f'{"dx/2" if tf.advance[a] == "both" else "dx"} ({d.dx:g}) and the plane {lead} — '
                          f"it can fall up to {-lowest:g} behind the body's {face} edge")
        if not st.rigid_bodies and (st.point_bcs or st.track is not None or st.placement):
            I(w, "point BCs / boundary track / placement are ignored while the stage's bodies are off")

    # solver + output
    sv = s.solver
    if sv.tolerance <= 0:
        E("Solver", "tolerance must be > 0")
    if sv.max_newton < 1:
        E("Solver", '"max newton iterations" must be ≥ 1')
    o = s.output
    for key, names, allowed in (("vtk material point fields", o.vtk_mp_fields, M.MP_FIELD_NAMES),
                                ("vtk rigid body fields", o.vtk_rb_fields, M.RB_FIELD_NAMES),
                                ("csv material point fields", o.csv_mp_fields, M.MP_FIELD_NAMES),
                                ("csv rigid body fields", o.csv_rb_fields, M.RB_FIELD_NAMES)):
        for n in names or []:
            if n not in allowed:
                E("Output", f'"{key}": unknown field "{n}"')
    for fmt, on, pct, dr in (("vtk", o.vtk, o.vtk_pct, o.vtk_dir), ("csv", o.csv, o.csv_pct, o.csv_dir)):
        if on and not dr:
            E("Output", f"{fmt} is on but has no directory")
        if on and not 0 <= pct <= 100:
            W("Output", f'"{fmt} percent" {pct:g} is outside 0–100')
    if not o.vtk and not o.csv:
        W("Output", "vtk and csv are both off — the run writes nothing")
    if nsys and any(not sy.stl_files for sy in s.rigid_bodies):
        I("Rigid bodies", "a system with no STL is a bare marker/handle — it takes no part in contact")
    return out
