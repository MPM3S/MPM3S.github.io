"""Scene → drawing primitives for the run viewer on the builder page (run_viewer.js draws them with three.js).

A port of MPM3SGui's scene_view.py and the Plater's play bar logic: the same parts, colours and playback
rules, but each VTK actor is a plain dict here. What the run does comes from MPM3SGui's own playback.py,
copied beside this file unchanged (make_run_viewer_files.py), so the viewer plays a run exactly as the
desktop GUI does - prescribed motion only, never the solved DOFs or the soil's deformation.

Primitives ("t"): box, outline, lines, quad, sphere, cube, arrow, support (a face's BC symbols), cells (the
base cells of one status, as float32 triangle / colour / edge buffers); a mesh is drawn from the STL run_viewer.js loaded, by file name.
Each build returns them by group, so a step of the run only replaces the groups that step changed.
"""
from __future__ import annotations

import json
import math
import os

import numpy as np

from s3mpm_gui import derived as D
from s3mpm_gui import model as M
from s3mpm_gui import playback as P

LAYER_COLORS = [(0.80, 0.66, 0.46), (0.66, 0.52, 0.35), (0.55, 0.43, 0.29), (0.72, 0.60, 0.43), (0.45, 0.36, 0.25)]
BODY_COLORS = [(0.96, 0.78, 0.30), (0.45, 0.70, 0.90), (0.62, 0.80, 0.45), (0.85, 0.55, 0.75), (0.95, 0.60, 0.40)]
FACE_COLORS = {"roller": (0.23, 0.51, 0.96), "fixed": (0.88, 0.11, 0.28)}
TRACK_COLOR = (0.55, 0.25, 0.85)
CONSTRAINT_COLORS = {"coincidence": (0.10, 0.10, 0.10), "rotation lock": (0.0, 0.55, 0.55),
                     "distance lock": (0.20, 0.35, 0.85), "distance stop": (0.80, 0.15, 0.55)}
POINT_LEGEND = [("point: free", (0.15, 0.65, 0.25), 1.0), ("point: partly fixed", (0.95, 0.60, 0.10), 1.0),
                ("point: fixed", (0.85, 0.15, 0.15), 1.0), ("point: prescribed", (0.55, 0.25, 0.85), 1.0)]


def layer_color(i: int):
    return LAYER_COLORS[i % len(LAYER_COLORS)]


def body_color(i: int):
    return BODY_COLORS[i % len(BODY_COLORS)]


def point_bc_color(bcs):
    if any(not isinstance(x, str) for x in bcs):
        return (0.55, 0.25, 0.85)       # something prescribed
    nfix = sum(x == "fixed" for x in bcs)
    if nfix == 6:
        return (0.85, 0.15, 0.15)
    if nfix == 0:
        return (0.15, 0.65, 0.25)
    return (0.95, 0.60, 0.10)


def mesh_name(path: str) -> str:
    """The solver reads a mesh beside the JSON, so the viewer finds it by file name alone."""
    return os.path.basename(path.replace("\\", "/"))


# ── primitives ─────────────────────────────────────────────────────────────────────────────────────────
def _v(x) -> list:
    return [float(a) for a in x]


def _box(lo, hi, color, opacity):
    return {"t": "box", "lo": _v(lo), "hi": _v(hi), "color": color, "opacity": opacity}


def _outline(lo, hi, color, lw=1.0, opacity=1.0):
    return {"t": "outline", "lo": _v(lo), "hi": _v(hi), "color": color, "lw": lw, "opacity": opacity}


def _lines(segments, color, lw=1.0, opacity=1.0):
    return {"t": "lines", "pts": [float(c) for p, q in segments for c in (*p, *q)], "color": color, "lw": lw,
            "opacity": opacity}


def _quad(corners, color, opacity):
    return {"t": "quad", "pts": [_v(c) for c in corners], "color": color, "opacity": opacity}


def _sphere(c, r, color):
    return {"t": "sphere", "c": _v(c), "r": float(r), "color": color}


def _cube(c, r, color):
    return {"t": "cube", "c": _v(c), "r": float(r), "color": color}


def _arrow(start, vec, color):
    return {"t": "arrow", "start": _v(start), "vec": _v(vec), "color": color}


def _plane(lo, hi, ax, v, side=1):
    """The rectangle of the box (lo, hi) on the plane x[ax] = v, wound to face `side` (±1) along ax: the
    viewer draws a see-through face's far side before the soil and its near side after it."""
    a, b = [k for k in range(3) if k != ax]
    out = []
    for ua, ub in ((lo[a], lo[b]), (hi[a], lo[b]), (hi[a], hi[b]), (lo[a], hi[b])):
        p = [0.0, 0.0, 0.0]
        p[ax], p[a], p[b] = v, ua, ub
        out.append(p)
    return out if side * (1 if ax != 1 else -1) > 0 else out[::-1]   # e_a × e_b is −e_y for ax = 1


def _supports(quad, ax, side, kind, s):
    """The BC symbols of a face: at its centre and, just in from its edges, its corners - a triangle with its
    apex on the face, on hatched ground (fixed) or on rollers (roller). run_viewer.js draws each `s` across,
    pointing along the outward normal and turned about it to face the camera. Across a side of the face too
    narrow for three symbols the corners close up onto its middle (a column's faces: one row; its base: one)."""
    q = np.array(quad, float)
    c = q.mean(axis=0)
    room = (q.max(axis=0) - q.min(axis=0)) >= 3 * s
    pts = []
    for p in [c] + [np.where(room, p + np.sign(c - p) * 0.6 * s, c) for p in q]:
        if not any(np.allclose(p, x) for x in pts):
            pts.append(p)
    n = [0.0, 0.0, 0.0]
    n[ax] = float(side)
    return {"t": "support", "kind": kind, "pts": [_v(p) for p in pts], "n": n, "s": float(s), "color": FACE_COLORS[kind]}


def _matrix(c, R, x0) -> list:
    """world = c + R·(x − x0), row-major 4×4: a mesh drawn about a point at x0, carried to the point's pose."""
    R = np.asarray(R, float)
    t = np.asarray(c, float) - R @ np.asarray(x0, float)
    return [float(x) for x in (*R[0], t[0], *R[1], t[1], *R[2], t[2], 0.0, 0.0, 0.0, 1.0)]


def _shift(off) -> list:
    return _matrix(off, np.eye(3), (0.0, 0.0, 0.0))


def _cell_surface(d: D.Derived, cells: np.ndarray, status: int, opacity: float, edges: bool):
    """The outer faces of the base cells with that status, coloured by layer (scene_view's _cell_grid +
    _cell_surface): each cell's z slab is cut again at the layer interfaces. None when there are none."""
    ncx, ncy, ncz = cells.shape
    tol = D.SQEPS * d.scaling
    zs = [min(k * d.dx, d.block_top) for k in range(ncz + 1)]
    zs += [zb for zb in d.layer_z_bot if all(abs(zb - z) > tol for z in zs) and 0 < zb < d.block_top]
    zs.sort()
    mid = [(a + b) / 2 for a, b in zip(zs, zs[1:])]
    iz = [min(int(m / d.dx), ncz - 1) for m in mid]
    layer = np.array([next(i for i, zb in enumerate(d.layer_z_bot) if m >= zb - tol) for m in mid])
    mask = cells[:, :, iz] == status
    if not mask.any():
        return None
    coords = (np.arange(ncx + 1) * d.dx, np.arange(ncy + 1) * d.dx, np.array(zs))
    quads, slab = [], []
    for ax in range(3):
        u, v = (ax + 1) % 3, (ax + 2) % 3          # u × v = +ax, so (u0v0, u1v0, u1v1, u0v1) faces +ax
        n = mask.shape[ax]
        pad = [(0, 0)] * 3
        pad[ax] = (1, 1)
        m = np.pad(mask, pad)
        before = np.take(m, np.arange(0, n + 1), axis=ax)
        after = np.take(m, np.arange(1, n + 2), axis=ax)
        idx = np.nonzero(before != after)          # idx[ax] is the plane between cell p − 1 and cell p
        if not len(idx[0]):
            continue
        out = before[idx]                          # the cell is before the plane: the face looks +ax
        q = np.empty((len(idx[0]), 4, 3))
        q[:, :, ax] = coords[ax][idx[ax]][:, None]
        u0, u1 = coords[u][idx[u]], coords[u][idx[u] + 1]
        v0, v1 = coords[v][idx[v]], coords[v][idx[v] + 1]
        q[:, :, u] = np.stack([u0, u1, u1, u0], axis=1)
        q[:, :, v] = np.stack([v0, v0, v1, v1], axis=1)
        q[~out] = q[~out][:, ::-1]                 # the cell is after it: wind the other way
        quads.append(q)
        slab.append(np.where(out, idx[2] - 1, idx[2]) if ax == 2 else idx[2])
    q, k = np.concatenate(quads), np.concatenate(slab)
    rgb = np.array([layer_color(i) for i in range(len(d.layer_z_bot))], np.float32)[layer[k]]
    tri = q[:, [0, 1, 2, 0, 2, 3]].astype(np.float32)
    seg = q[:, [0, 1, 1, 2, 2, 3, 3, 0]].astype(np.float32)
    return {"t": "cells", "pos": tri.tobytes(), "col": np.repeat(rgb, 6, axis=0).tobytes(),
            "edges": seg.tobytes() if edges else None, "opacity": opacity}


# ── the scene ──────────────────────────────────────────────────────────────────────────────────────────
class RunView:
    """One scene and the run it makes. `load` a JSON text, then `draw` the editing view of a stage or
    `frame(k)` a step of the run; each returns what to draw (see the module's docstring)."""

    def __init__(self):
        self.nodes: dict = {}            # STL file name → (N, 3) nodes, from the meshes run_viewer.js loaded
        # soil: draw it · frame: the material box outline and the gravity arrow · dim_bodies: fade the
        # bodies in a stage that has them off (the desktop Plater's defaults)
        self.opts = {"soil": True, "soil_opacity": 0.55, "frame": True, "grid": True, "octree": True,
                     "bc_faces": True, "track": True, "bodies": True, "dim_bodies": True, "body_opacity": 1.0}
        self.s = None
        self.d = None
        self.error = ""
        self.stage = 0
        self._tl = None
        self._frame = None               # the playback frame index drawn, None in the editing view
        self._bb = None
        self.size_hint = 1.0

    # ── input ──
    def set_mesh(self, name: str, xyz):
        """The nodes of one STL (any (N, 3) float sequence; a JS Float32Array from the browser)."""
        a = xyz.to_py() if hasattr(xyz, "to_py") else xyz
        self.nodes[name] = np.asarray(a, dtype=float).reshape(-1, 3)
        self._tl = None

    def load(self, text: str) -> dict:
        """Read the scene; what the page shows about it (stages, frames, sizes, the meshes it needs)."""
        self._tl, self._frame = None, None
        try:
            self.s = M.Scene.from_dict(json.loads(text))
            self.d = D.derive(self.s)
            self.error = "" if self.d.ok else self.d.error
        except Exception as e:           # a file half way through being written in the builder
            self.s, self.d, self.error = None, None, f"{type(e).__name__}: {e}"
        s, d = self.s, self.d
        if s is None:
            return {"ok": False, "error": self.error, "stages": [], "frames": 0, "meshes": [], "info": ""}
        self.stage = min(self.stage, max(0, len(s.analysis) - 1))
        info = ""
        if d.ok:
            steps = sum(st.n_steps() for st in s.analysis)
            info = (f"{d.n_mp:,} material points · base cell {d.dx:g} m, finest {d.scaling / 2 ** d.finest_depth:g} m"
                    f" · octree cube {d.scaling:g} m · soil block {d.fx:g} × {d.fy:g} × {d.block_top:g} m"
                    f" · {len(s.analysis)} stage{'s' * (len(s.analysis) != 1)}, {steps:,} steps")
        return {"ok": d.ok, "error": self.error, "stages": [st.label(i) for i, st in enumerate(s.analysis)],
                "frames": P.n_frames(s) if d.ok else 0, "info": info,
                "meshes": sorted({mesh_name(f.stl) for sy in s.rigid_bodies for f in sy.stl_files if f.stl})}

    def _mesh(self, f):
        return self.nodes.get(mesh_name(f.stl)) if f.stl else None

    def timeline(self) -> P.Timeline:
        """The run, walked once and kept until the scene or a mesh changes."""
        if self._tl is None:
            s = self.s
            self._tl = P.build(s, self.d, lambda i, j: self._mesh(s.rigid_bodies[i].stl_files[j]))
        return self._tl

    def stage_first(self, i: int) -> int:
        """The frame a stage starts at (picking a stage while the run is shown jumps there)."""
        st = self.timeline().stages
        return st[i].first if 0 <= i < len(st) else 0

    # ── bounds and sizes (scene_view's system_bounds, marker_radius, scene_body_bounds) ──
    def _system_bounds(self, sy):
        off = np.array(sy.offset_vec(), float)
        lo, hi = np.full(3, np.inf), np.full(3, -np.inf)
        for f in sy.stl_files:
            x = self._mesh(f)
            if x is not None and len(x):
                lo, hi = np.minimum(lo, x.min(axis=0) + off), np.maximum(hi, x.max(axis=0) + off)
        if not np.all(np.isfinite(lo)):
            for p in sy.points:
                lo, hi = np.minimum(lo, np.array(p.position) + off), np.maximum(hi, np.array(p.position) + off)
        return (lo, hi) if np.all(np.isfinite(lo)) else None

    def _marker_radius(self, sy, h: float) -> float:
        cap, sizes = 0.012 * h, []
        for f in sy.stl_files:
            x = self._mesh(f)
            if x is not None and len(x):
                e = x.max(axis=0) - x.min(axis=0)
                sizes.append(float(np.prod(np.maximum(e, 0.05 * e.max()))) ** (1 / 3))
        return min(cap, 0.1 * min(sizes)) if sizes and min(sizes) > 0 else cap

    def _body_bounds(self):
        lo, hi = np.full(3, np.inf), np.full(3, -np.inf)
        for sy in self.s.rigid_bodies:
            b = self._system_bounds(sy)
            if b is not None:
                lo, hi = np.minimum(lo, b[0]), np.maximum(hi, b[1])
        return (lo, hi) if np.all(np.isfinite(lo)) else None

    # ── what the page calls ──
    def draw(self, stage: int) -> dict:
        """The editing view of a stage: its BCs, its first track window, the bodies at their offsets."""
        self._frame = None
        return self._build(stage, None)

    def frame(self, k: int, full: bool = False) -> dict:
        """Step k of the run. Within the stage last drawn only what that step changed comes back (scene_view's
        show_frame); a new stage, the first frame, or `full` (the display options changed) is a full build."""
        tl = self.timeline()
        if not tl.frames:
            return {"full": False, "empty": True, "error": self.error or "the analysis has no stages"}
        k = max(0, min(int(k), len(tl.frames) - 1))
        was = tl.frames[self._frame] if self._frame is not None and not full else None
        f = tl.frames[k]
        self._frame = k
        if was is None or f.stage != was.stage:
            return self._build(f.stage, k)
        out = {"full": False, "groups": {}, "frame": k, "label": self._label(k), "overlay": self._overlay()}
        sp = tl.stages[f.stage]
        if (f.cells, f.window) == (was.cells, was.window) and not any(u.any() or th.any()
                                                                      for u, th in zip(sp.du, sp.dth)):
            return out                   # a step that changes nothing drawn (bodies off, or nothing driven)
        if f.cells != was.cells:
            out["groups"]["soil"] = self._soil(tl, f)[0]
        if f.window != was.window:
            out["groups"]["conditions"] = self._conditions(self.s.analysis[f.stage], f)[0]
        if self.opts["bodies"]:
            poses = tl.poses(k)
            out["poses"] = self._poses(poses)
            out["groups"]["markers"] = self._markers(tl, f, poses)
        return out

    # ── the build ──
    def _label(self, k) -> str:
        tl = self.timeline()
        f = tl.frames[k]
        return f"stage {f.stage + 1}/{len(tl.stages)} · step {f.step}/{tl.stages[f.stage].steps}"

    def _overlay(self) -> list:
        """The text over the view's top-left corner (the Plater's _overlay): [text, grey?]."""
        s = self.s
        if s is None or not s.analysis:
            return []
        st = s.analysis[self.stage]
        text = (f"Stage {self.stage + 1}: {st.type}" + (f" — {st.name}" if st.name else "") +
                ("" if st.rigid_bodies or not s.rigid_bodies else "  (rigid bodies OFF)"))
        lines = []
        if self._frame is not None:
            tl = self.timeline()
            text += f"  ·  step {tl.frames[self._frame].step} / {tl.stages[self.stage].steps}"
            lines = [["Preview: " + note, True] for note in tl.notes]
        return [[text, False]] + lines

    def _build(self, stage: int, k) -> dict:
        s, d, o = self.s, self.d, self.opts
        if s is None:
            return {"full": True, "error": self.error, "groups": {}, "meshes": [], "legend": [], "overlay": [],
                    "bounds": [0, 1, 0, 1, 0, 1]}
        tl = self.timeline() if k is not None and d.ok else None
        f = tl.frames[k] if tl is not None else None
        self.stage = f.stage if f is not None else max(0, min(int(stage), len(s.analysis) - 1))
        st = s.analysis[self.stage] if s.analysis else None
        bodies_on = st.rigid_bodies if st is not None else True
        groups = {"frame": [], "soil": [], "conditions": [], "markers": []}
        legend = []
        bb = self._bb = self._body_bounds()
        h = float(max(d.domain_box)) if d.ok else 1.0
        if bb is not None:
            h = max(h, float(max(bb[1] - bb[0])))
        self.size_hint = h
        gravity_box = None

        if d.ok:
            groups["soil"], lg = self._soil(tl, f)
            legend += lg
            lo, hi = (0.0, 0.0, 0.0), tuple(d.domain_box)
            if o["frame"]:
                groups["frame"].append(_outline(lo, hi, (0.25, 0.25, 0.30), 1.0, 0.8))
            groups["conditions"], lg = self._conditions(st, f)
            legend += lg
            if o["octree"]:
                groups["frame"].append(_outline((0, 0, 0), (d.scaling,) * 3, (0.35, 0.35, 0.40), 1.0, 0.35))
            g = np.array(s.gravity, float)
            gn = np.linalg.norm(g)
            if gn > 0 and o["frame"]:
                L = 0.15 * h
                start = np.array([d.fx + 0.06 * h, d.fy * 0.5, d.block_top]) - g / gn * L
                groups["frame"].append(_arrow(start, g / gn * L, (0.25, 0.25, 0.25)))
                gravity_box = (np.minimum(start, start + g / gn * L), np.maximum(start, start + g / gn * L))

        meshes = []
        if o["bodies"]:
            poses = tl.poses(k) if f is not None else None
            mats = self._poses(poses)
            n = 0
            for i, sy in enumerate(s.rigid_bodies):
                op = o["body_opacity"] if bodies_on or not o["dim_bodies"] else 0.25
                for f_ in sy.stl_files:
                    if self._mesh(f_) is None:
                        continue
                    meshes.append({"name": mesh_name(f_.stl), "color": body_color(i), "opacity": op, "m": mats[n]})
                    n += 1
            groups["markers"] = self._markers(tl, f, poses)
            if s.rigid_bodies:
                legend += POINT_LEGEND

        lo, hi = np.zeros(3), np.array(d.domain_box if d.ok else (1, 1, 1), float)
        if bb is not None:
            lo, hi = np.minimum(lo, bb[0]), np.maximum(hi, bb[1])
        if gravity_box is not None:
            lo, hi = np.minimum(lo, gravity_box[0]), np.maximum(hi, gravity_box[1])
        return {"full": True, "error": self.error, "groups": groups, "meshes": meshes,
                "legend": legend,
                "overlay": self._overlay(), "bounds": [float(lo[0]), float(hi[0]), float(lo[1]), float(hi[1]),
                                                       float(lo[2]), float(hi[2])],
                "size": h, "frame": k, "stage": self.stage, "label": self._label(k) if k is not None else ""}

    def _poses(self, poses) -> list:
        """Each drawn mesh's matrix, in the order `_build` lists them: at the system's offset, or carried
        with the point it is welded to."""
        out = []
        for i, sy in enumerate(self.s.rigid_bodies):
            pose = poses[i] if poses is not None else None
            for f in sy.stl_files:
                if self._mesh(f) is None:
                    continue
                if pose is not None and 1 <= f.point <= len(sy.points):
                    c, R = pose[f.point - 1]
                    out.append(_matrix(c, R, sy.points[f.point - 1].position))
                else:
                    out.append(_shift(sy.offset_vec()))
        return out

    def _soil(self, tl, frame) -> tuple:
        """The bed. Editing view: one box per layer and the base-cell grid on its top. Playback: the base
        cells that are ON (their edges are the grid), the sleeping ones as a ghost, the freed ones gone."""
        d, o, h = self.d, self.opts, self.size_hint
        if not o["soil"]:
            return [], []
        if frame is not None and frame.cells >= 0:
            cells = tl.cells[frame.cells]
            out = [_cell_surface(d, cells, P.ACTIVE, o["soil_opacity"], o["grid"]),
                   _cell_surface(d, cells, P.ASLEEP, 0.10, o["grid"]),
                   _outline((0, 0, 0), (d.fx, d.fy, d.block_top), (0.30, 0.22, 0.12), 1.0, 0.45)]
            return [x for x in out if x is not None], ([("soil asleep", layer_color(0), 70 / 255)]
                                                        if frame.window is not None else [])
        out = []
        for i, (zb, zt) in enumerate(D.layer_bounds(d)):
            if zt <= zb:
                continue
            out.append(_box((0, 0, zb), (d.fx, d.fy, zt), layer_color(i), o["soil_opacity"]))
            out.append(_outline((0, 0, zb), (d.fx, d.fy, zt), (0.30, 0.22, 0.12), 1.2))
        if o["grid"]:
            # the base-cell grid on all six faces of the block, as playback draws the cells' edges, lifted
            # just off each face; at most ~200 lines a direction
            e, X, Y, Z = 1e-4 * h, d.fx, d.fy, d.block_top

            def ticks(L, n):
                k = max(1, math.ceil(n / 200))
                t = [min(i * d.dx, L) for i in range(0, n + 1, k)]
                return t if t[-1] >= L - 1e-9 * max(L, 1.0) else t + [L]
            xs = ticks(X, int(round(X / d.dx)))
            ys = ticks(Y, int(round(Y / d.dx)))
            zs = ticks(Z, math.ceil(Z / d.dx - 1e-9))
            seg = []
            for z in (-e, Z + e):
                seg += [((x, 0, z), (x, Y, z)) for x in xs] + [((0, y, z), (X, y, z)) for y in ys]
            for y in (-e, Y + e):
                seg += [((x, y, 0), (x, y, Z)) for x in xs] + [((0, y, z), (X, y, z)) for z in zs]
            for x in (-e, X + e):
                seg += [((x, y, 0), (x, y, Z)) for y in ys] + [((x, 0, z), (x, Y, z)) for z in zs]
            out.append(_lines(seg, (0.25, 0.20, 0.15), 1.0, 0.55))
        return out, []

    def _conditions(self, stage, frame) -> tuple:
        """The stage's face conditions and its boundary track (scene_view's _conditions): editing view, the
        stage's own BCs on the material box and the window as the MPs first see it; playback, the condition
        the solver applies where it applies it - a tracked face on its moving plane."""
        d, o = self.d, self.opts
        out, legend = [], []
        if stage is None:
            return out, legend
        lo, hi = np.zeros(3), np.array(d.domain_box, float)
        window = frame.window if frame is not None else None
        bcs = (D.effective_face_bcs(stage) if frame is not None else stage.bcs) or M.FaceBCs(["free"] * 3, ["free"] * 3)
        used = set()

        size = 0.04 * self.size_hint     # the BC symbols, across (run_viewer.js keeps them 24 to 56 px)
        for side, kinds, w in (("min", bcs.min, 0), ("max", bcs.max, 1)):
            off = (1 if w else -1) * 5e-4 * self.size_hint      # a hair outside: a face shares its plane with the soil's
            for ax, kind in enumerate(kinds):
                if kind not in FACE_COLORS:
                    continue
                if window is not None and stage.track[w].type[ax] != "off":
                    if o["track"]:
                        quad = _plane(window[0], window[1], ax, window[w][ax] + off, 2 * w - 1)
                        out.append(_quad(quad, FACE_COLORS[kind], 0.30))
                        out.append(_lines(list(zip(quad, quad[1:] + quad[:1])), TRACK_COLOR, 2.0))
                        out.append(_supports(quad, ax, 2 * w - 1, kind, size))
                        used.update((kind, "track"))
                elif o["bc_faces"]:
                    quad = _plane(lo, hi, ax, (hi if w else lo)[ax] + off, 2 * w - 1)
                    out.append(_quad(quad, FACE_COLORS[kind], 0.10))
                    out.append(_supports(quad, ax, 2 * w - 1, kind, size))
                    used.add(kind)
        for kind in ("roller", "fixed"):
            if kind in used:
                legend.append((f"{kind} face", FACE_COLORS[kind], 1.0))
        if "track" in used:
            legend.append(("track plane (moving face)", TRACK_COLOR, 1.0))
        if frame is None and o["track"] and stage.track is not None and stage.rigid_bodies and self._bb is not None:
            planes = D.track_window(stage.track, self._bb, d)
            for (face, ax), v in planes.items():
                out.append(_quad(_plane(lo, hi, ax, v, 1 if face == "max" else -1), TRACK_COLOR, 0.22))
            if planes:
                legend.append(("track plane (step 1)", TRACK_COLOR, 1.0))
        return out, legend

    def _markers(self, tl, frame, poses) -> list:
        """Points (coloured by their BCs - the stage's own in playback), constraints and tracked nodes."""
        out, h = [], self.size_hint
        for i, sy in enumerate(self.s.rigid_bodies):
            r_pt = self._marker_radius(sy, h)
            at, along = _weld(sy, poses[i] if poses is not None else None)
            bcs = tl.stages[frame.stage].bcs[i] if frame is not None else [p.bcs for p in sy.points]
            for j, p in enumerate(sy.points):
                out.append(_sphere(at(j + 1, p.position), r_pt, point_bc_color(bcs[j])))
            for c in sy.constraints:
                ccol = CONSTRAINT_COLORS.get(c.type, (0.1, 0.1, 0.1))
                ks = [k for k in c.points if 1 <= k <= len(sy.points)]
                pts = [at(k, sy.points[k - 1].position) for k in ks]
                ka, kb = (list(c.points) + [0, 0])[:2]
                if c.type == "rotation lock":
                    cen = at(ka, c.rotation_centre)
                    segs = [(tuple(p), tuple(cen)) for p in pts]
                    ax = along(ka, c.direction1)
                    if np.linalg.norm(ax) > 0:
                        ax = ax / np.linalg.norm(ax) * 7 * r_pt
                        segs.append((tuple(cen - ax), tuple(cen + ax)))
                    out.append(_lines(segs, ccol, 3.0))
                    out.append(_sphere(cen, r_pt * 0.8, ccol))
                else:
                    a1, a2 = at(ka, c.position1), at(kb, c.position2)
                    segs = [(tuple(a1), tuple(a2))]
                    if len(pts) == 2:
                        segs += [(tuple(pts[0]), tuple(a1)), (tuple(pts[1]), tuple(a2))]
                    out.append(_lines(segs, ccol, 2.5))
                    out.append(_sphere(a1, r_pt * 0.6, ccol))
                    out.append(_sphere(a2, r_pt * 0.6, ccol))
                    if c.type == "distance stop":
                        out.append(_cube(at(ka, c.rotation_centre), r_pt * 0.6, ccol))
            for t in sy.tracked_nodes:
                out.append(_cube(at(t.point, t.position), r_pt * 0.8, (0.1, 0.1, 0.1)))
        return out


def _weld(sy: M.RigidSystem, pose):
    """Drawn-frame point / direction welded to point k (1-based) of the system → world. Editing view
    (`pose` None): the system's offset. Playback: point k's (position, frame)."""
    off = np.array(sy.offset_vec(), float)

    def at(k, x):
        x = np.array(x, float)
        if pose is None or not 1 <= k <= len(sy.points):
            return x + off
        c, R = pose[k - 1]
        return c + R @ (x - np.array(sy.points[k - 1].position, float))

    def along(k, v):
        v = np.array(v, float)
        return v if pose is None or not 1 <= k <= len(sy.points) else pose[k - 1][1] @ v
    return at, along
