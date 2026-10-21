# copied from MPM3SGui/s3mpm_gui/playback.py by make_run_viewer_files.py - do not edit
"""What a run will DO, stage by stage and step by step — as far as that is known before the solver runs.

A port of the stage walk in MPM3S/src/non_linear_solver.jl (solve!), kept to what is pure KINEMATICS:
  • stage start — this stage's point BCs (the scene's, with the stage's "rigid body boundary conditions"
    written over them: setup_analysis.jl stage_point_bcs), then the optional surface placement
    (rigid_body_placement.jl align_body_surface!: ONE dz for the whole scene, lowest body node → highest
    live MP top), then the boundary-track window (boundary_track.jl init_sleep!, which touches no MP);
  • every step — update_sleep! marches the window from the body's COMMITTED pose, wakes the MPs it now
    covers and sleeps / frees the active ones it left; then every held DOF moves by its prescribed
    increment (rigid_body_predictor: fixed ≡ prescribed 0).
Bodies off ⇒ no track, no placement, no motion, and every sleeper wakes (a freed slot never comes back).

What it cannot know is what the solver SOLVES: the free body DOFs and the soil's deformation. A free
translation is carried along by the driven points it is linked to through constraints (a dragged anchor
follows its line end); an undriven body stays where the stage found it.

The MPs are followed per BASE cell — the largest elements, which is what the window snaps to and so what
switches on and off. A cell counts as inside a box when its centre is. (The solver's test is "any GIMP
corner in the closed box", which also keeps the one MP row that touches a plane from outside — finer than
a base cell, and not shown.)
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Callable, Optional

import numpy as np

from . import derived as D
from . import model as M

ACTIVE, ASLEEP, REMOVED = 0, 1, 2      # a base cell's MPs: on · sleeping (kept, off) · freed
MAX_CELLS = 2_000_000                  # above this the per-cell picture is skipped (the window is still marched)
MAX_FRAMES = 3000                      # per stage: a longer one is shown every `stride`-th step


@dataclass
class Frame:
    stage: int
    step: int                      # 0 = the stage start; l = after step l
    window: Optional[tuple]        # (lo, hi) the track window step l used; None = no track this stage
    cells: int                     # index into Timeline.cells, −1 when cells are not followed


@dataclass
class StagePlay:
    first: int = 0                 # index of its step-0 frame
    steps: int = 0
    stride: int = 1
    bodies: bool = False
    bcs: list = field(default_factory=list)    # per system, per point: this stage's six slots
    c0: list = field(default_factory=list)     # per system: (n, 3) point positions at the stage start
    R0: list = field(default_factory=list)     # per system: (n, 3, 3) point frames at the stage start
    du: list = field(default_factory=list)     # per system: (n, 3) translation per nominal step
    dth: list = field(default_factory=list)    # per system: (n, 3) rotation vector per nominal step


@dataclass
class Timeline:
    frames: list = field(default_factory=list)
    stages: list = field(default_factory=list)
    cells: list = field(default_factory=list)  # the distinct (ncx, ncy, ncz) uint8 status arrays, in order
    notes: list = field(default_factory=list)  # what this preview leaves out

    def poses(self, k: int) -> list:
        """Per system, per point: (position, 3×3 frame) at frame k."""
        f = self.frames[k]
        return _poses(self.stages[f.stage], f.step)


def _shown(n: int, stride: int) -> list:
    """The steps of an n-step stage that get a frame: the first (it makes the capture), every stride-th, the last."""
    return sorted({1, n, *range(stride, n + 1, stride)}) if n > 0 else []


def n_frames(s: M.Scene, max_frames: int = MAX_FRAMES) -> int:
    """How many frames `build` will make, without walking the run."""
    return sum(1 + len(_shown(n, max(1, math.ceil(n / max_frames))))
               for n in (max(0, st.n_steps()) for st in s.analysis))


def cell_shape(d: D.Derived) -> tuple:
    """Base cells over the soil block (the top one may be part filled: the block top is on the MP grid)."""
    return (int(round(d.fx / d.dx)), int(round(d.fy / d.dx)), max(1, math.ceil(d.block_top / d.dx - D.SQEPS)))


def stage_point_bcs(s: M.Scene, st: M.Stage) -> list:
    """stage_point_bcs: the scene's slots, each override REPLACING all six of its point's."""
    bcs = [[list(p.bcs) for p in sy.points] for sy in s.rigid_bodies]
    for e in st.point_bcs:
        if 1 <= e.system <= len(bcs) and 1 <= e.point <= len(bcs[e.system - 1]):
            bcs[e.system - 1][e.point - 1] = list(e.bcs)
    return bcs


def _turn(v) -> np.ndarray:
    """Rotation vector → matrix (Rodrigues)."""
    v = np.asarray(v, float)
    th = float(np.linalg.norm(v))
    if th < 1e-15:
        return np.eye(3)
    k = v / th
    K = np.array([[0.0, -k[2], k[1]], [k[2], 0.0, -k[0]], [-k[1], k[0], 0.0]])
    return np.eye(3) + math.sin(th) * K + (1.0 - math.cos(th)) * (K @ K)


def _linked(n: int, constraints: list) -> list:
    """The points of a system grouped by the constraints that tie them together."""
    root = list(range(n))

    def find(i):
        while root[i] != i:
            root[i] = root[root[i]]
            i = root[i]
        return i
    for c in constraints:
        ks = [k - 1 for k in c.points if 1 <= k <= n]
        for k in ks[1:]:
            root[find(k)] = find(ks[0])
    groups: dict = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(i)
    return list(groups.values())


def _increments(s: M.Scene, bcs: list) -> tuple:
    """Per system: each point's translation and rotation vector per nominal step. Held slots take their
    prescribed increment (fixed = 0); a free TRANSLATION follows the mean of the prescribed ones in its
    linked group; a free rotation is not solved and stays 0."""
    du, dth = [], []
    for sy, sb in zip(s.rigid_bodies, bcs):
        n = len(sy.points)
        u, th = np.zeros((n, 3)), np.zeros((n, 3))
        for j, b in enumerate(sb):
            for a in range(3):
                u[j, a] = 0.0 if isinstance(b[a], str) else b[a]
                th[j, a] = 0.0 if isinstance(b[3 + a], str) else b[3 + a]
        for group in _linked(n, sy.constraints):
            for a in range(3):
                driven = [u[j, a] for j in group if not isinstance(sb[j][a], str)]
                if driven:
                    for j in group:
                        if sb[j][a] == "free":
                            u[j, a] = sum(driven) / len(driven)
        du.append(u)
        dth.append(th)
    return du, dth


def _poses(sp: StagePlay, step: int) -> list:
    out = []
    for c0, R0, u, th in zip(sp.c0, sp.R0, sp.du, sp.dth):
        out.append([(c0[j] + step * u[j], _turn(step * th[j]) @ R0[j] if th[j].any() else R0[j])
                    for j in range(len(c0))])
    return out


def _extent(welds: list, poses: list):
    """body_extent: the AABB of every body node in the scene (None when no point carries a mesh)."""
    lo, hi = np.full(3, np.inf), np.full(3, -np.inf)
    eye = np.eye(3)
    for i, j, arms, alo, ahi in welds:
        c, R = poses[i][j]
        if np.array_equal(R, eye):
            lo, hi = np.minimum(lo, alo + c), np.maximum(hi, ahi + c)
        else:
            p = arms @ R.T + c
            lo, hi = np.minimum(lo, p.min(axis=0)), np.maximum(hi, p.max(axis=0))
    return (lo, hi) if np.all(np.isfinite(lo)) else None


def _in_box(centres: tuple, lo, hi) -> np.ndarray:
    m = [(c > lo[a]) & (c < hi[a]) for a, c in enumerate(centres)]
    return m[0][:, None, None] & m[1][None, :, None] & m[2][None, None, :]


def _sweep(cells: np.ndarray, centres: tuple, lo, hi, rlo, rhi) -> np.ndarray:
    """update_sleep!'s two passes on the base cells: wake the sleepers the window covers, then every ACTIVE
    cell outside it sleeps if it is still inside the removal box and is freed if not."""
    inside = _in_box(centres, lo, hi)
    left = (cells == ACTIVE) & ~inside
    wake = (cells == ASLEEP) & inside
    if not (left.any() or wake.any()):
        return cells
    keep = _in_box(centres, rlo, rhi)
    new = cells.copy()
    new[wake] = ACTIVE
    new[left & keep] = ASLEEP
    new[left & ~keep] = REMOVED
    return new


def _mp_top(cells: Optional[np.ndarray], d: D.Derived) -> Optional[float]:
    """mp_surface_max_z: the highest LIVE MP top (None when nothing is live)."""
    if cells is None:
        return d.block_top
    live = (cells == ACTIVE).any(axis=(0, 1))
    if not live.any():
        return None
    return min((int(np.nonzero(live)[0].max()) + 1) * d.dx, d.block_top)


def build(s: M.Scene, d: D.Derived, mesh_nodes: Optional[Callable] = None, max_frames: int = MAX_FRAMES) -> Timeline:
    """Walk every stage. `mesh_nodes(i, j)` → the (N, 3) drawn-frame nodes of system i's j-th STL (or None):
    they give the body AABB the track window and the placement are measured from."""
    tl = Timeline()
    if not d.ok:
        return tl
    # the scene as read: every point at its drawn position + its system's offset, frames unturned
    c = [np.array([p.position for p in sy.points], float).reshape(-1, 3) + np.array(sy.offset_vec(), float)
         for sy in s.rigid_bodies]
    R = [np.tile(np.eye(3), (len(sy.points), 1, 1)) for sy in s.rigid_bodies]
    welds = []                     # (system, point, arms about the point, their AABB)
    for i, sy in enumerate(s.rigid_bodies):
        for j, f in enumerate(sy.stl_files):
            x = mesh_nodes(i, j) if mesh_nodes is not None and 1 <= f.point <= len(sy.points) else None
            if x is not None and len(x):
                arms = np.asarray(x, float) - np.array(sy.points[f.point - 1].position, float)
                welds.append((i, f.point - 1, arms, arms.min(axis=0), arms.max(axis=0)))

    shape = cell_shape(d)
    cells = np.zeros(shape, np.uint8) if shape[0] * shape[1] * shape[2] <= MAX_CELLS else None
    centres = tuple((np.arange(n) + 0.5) * d.dx for n in shape)
    if cells is None:
        tl.notes.append("too many base cells to show which are on")
    else:
        tl.cells.append(cells)
    if s.rigid_bodies:
        tl.notes.append("prescribed motion only — free DOFs and the soil's deformation are not solved")

    def frame(i, step, window):
        if cells is not None and cells is not tl.cells[-1]:
            tl.cells.append(cells)
        tl.frames.append(Frame(i, step, window, len(tl.cells) - 1 if cells is not None else -1))

    for i, st in enumerate(s.analysis):
        n = max(0, st.n_steps())
        on = st.rigid_bodies and bool(s.rigid_bodies)
        sp = StagePlay(first=len(tl.frames), steps=n, stride=max(1, math.ceil(n / max_frames)), bodies=on,
                       bcs=stage_point_bcs(s, st))
        if on:
            sp.du, sp.dth = _increments(s, sp.bcs)
        else:
            sp.du = [np.zeros_like(x) for x in c]
            sp.dth = [np.zeros_like(x) for x in c]
        bb = _extent(welds, [[(ci[j], Ri[j]) for j in range(len(ci))] for ci, Ri in zip(c, R)])
        if on and st.placement:
            top = _mp_top(cells, d)
            if bb is not None and top is not None:
                dz = top + D.SQEPS * d.scaling - bb[0][2]
                c = [ci + np.array([0.0, 0.0, dz]) for ci in c]
                bb = (bb[0] + np.array([0.0, 0.0, dz]), bb[1] + np.array([0.0, 0.0, dz]))
        sp.c0, sp.R0 = c, R
        track = st.track if on else None
        if track is not None and bb is None:
            tl.notes.append(f"stage {i + 1}: no body mesh for its boundary track to follow")
            track = None
        if track is None:
            window = None
            if cells is not None and (cells == ASLEEP).any():      # wake_all!
                cells = np.where(cells == ASLEEP, ACTIVE, cells).astype(np.uint8)
        else:
            window = D.track_init(track, bb, d)
        tl.stages.append(sp)
        frame(i, 0, window)
        if sp.stride > 1:
            tl.notes.append(f"stage {i + 1} is shown every {sp.stride} steps")
        swept = None
        for step in _shown(n, sp.stride):
            if track is not None:
                bb = _extent(welds, _poses(sp, step - 1))      # the pose the step starts from
                window = D.track_march(track, window, bb, d)
                if cells is not None and window != swept:
                    cells = _sweep(cells, centres, *window, *D.removal_box(track, *window))
                    swept = window
            frame(i, step, window)
        end = _poses(sp, n)
        c = [np.array([p[0] for p in sy]).reshape(-1, 3) for sy in end]
        R = [np.array([p[1] for p in sy]).reshape(-1, 3, 3) for sy in end]
    return tl
