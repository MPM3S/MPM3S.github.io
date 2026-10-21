# copied from MPM3SGui/s3mpm_gui/joints.py by make_run_viewer_files.py - do not edit
"""Try a body's joints by hand: its constraints as plain KINEMATICS, no forces.

The geometry is the solver's (MPM3S/lib/RigidBodies/src/constraints.jl, read by setup_rigid_body.jl
input_constraints!): every row ties two points and owns arms about them, measured in the DRAWN frame —
  rotation lock — the HINGE: a pin at "rotation centre" and an axis; leaves the turn about the axis
  coincidence   — a ball joint at its anchor
  distance lock — a rod between its two anchors
  distance stop — a cable: nothing until its chord reaches s = √(l₁² + l₂² − 2·l₁·l₂·cos ψ_max), with l the
                  anchor-to-centre arms (stop_length) — which is how it caps a hinge at "angle limit".
Two rotation locks with different axes between the same pair are a weld (the pair moves as one).

What moves is one joint at a time, as a tree: grab a part and it turns — with everything hanging off it —
about the joint that ties it to the rest, which stays put; grab the root and the root's side turns instead.
The turn stops where a cable goes taut. Constraints that close a loop are not solved for: `unmet` lists the
ones a pose breaks. Point boundary conditions play no part — this is the mechanism, not the run.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from . import model as M

JOINT_NAMES = {"hinge": "Hinge", "ball": "Ball joint", "rod": "Rod"}


def turn(v) -> np.ndarray:
    """Rotation vector → matrix (Rodrigues)."""
    v = np.asarray(v, float)
    th = float(np.linalg.norm(v))
    if th < 1e-15:
        return np.eye(3)
    k = v / th
    K = np.array([[0.0, -k[2], k[1]], [k[2], 0.0, -k[0]], [-k[1], k[0], 0.0]])
    return np.eye(3) + math.sin(th) * K + (1.0 - math.cos(th)) * (K @ K)


def stop_length(l1: float, l2: float, psi_max: float) -> float:
    """stop_length: the chord that caps a hinge at ψ_max (radians) — law of cosines on the two anchor arms."""
    return math.sqrt(max(0.0, l1 * l1 + l2 * l2 - 2.0 * l1 * l2 * math.cos(psi_max)))


@dataclass
class Joint:
    kind: str                      # "hinge" | "ball" | "rod"
    a: int                         # the two points it ties (0-based), as the constraint lists them
    b: int
    constraint: int                # index of the constraint that makes it
    arm_a: np.ndarray              # its anchor about each point, drawn frame
    arm_b: np.ndarray
    axis_a: Optional[np.ndarray] = None   # hinge: the unit axis as each point carries it
    axis_b: Optional[np.ndarray] = None
    angle: float = 0.0             # hinge: turn of b relative to a about the axis, from the drawn pose


@dataclass
class Stop:
    a: int
    b: int
    constraint: int
    arm_a: np.ndarray
    arm_b: np.ndarray
    s: float


@dataclass
class Grab:
    joint: Joint
    moving: list                   # the points that turn
    pivot: np.ndarray              # the joint's anchor on the side that stays, as it is now
    axis: Optional[np.ndarray]     # hinge: the unit axis, as it is now
    sign: float                    # hinge: +1 when b's side turns, −1 when a's does (the joint angle is b about a)
    point: np.ndarray              # where the part was grabbed
    c0: np.ndarray                 # the pose when it was grabbed
    R0: np.ndarray
    angle0: float                  # hinge: its angle then
    limits: Optional[tuple] = None  # hinge: (lo, hi) joint angles where a cable goes taut; None either side = free
    phi: float = 0.0               # hinge: the turn asked for so far in this drag


@dataclass
class Readout:
    text: str
    at_stop: bool = False
    unmet: list = field(default_factory=list)   # constraint indices this pose breaks (loops are not solved)


def misplaced_stops(sy: M.RigidSystem) -> list:
    """The distance stops that do NOT cap their hinge at the "angle limit" they ask for: (stop index, hinge
    index, the hinge's pin, the stops that hinge really gets from it).

    The reader sizes a stop's cable from arms about the stop's OWN "rotation centre" (stop_length), while the
    parts turn about the rotation lock's pin and axis. The two agree — the angle between the anchors' arms is
    capped at the limit — only when that centre is the point of the hinge's axis level with the anchors. Move
    the lock without the stop (or the reverse) and the cable goes taut early or late, silently."""
    mech = Mechanism(sy)
    cables, out = mech.stops, []
    for st in cables:
        c = sy.constraints[st.constraint]
        for j in mech.joints:
            if j.kind != "hinge" or {j.a, j.b} != {st.a, st.b}:
                continue
            mech.stops = [st]                                  # this cable alone
            got = mech.hinge_stops(j)
            mech.stops = cables
            if got is None:                                    # a hinge that closes a loop: not one the tree turns
                continue
            # the range asked for: the anchors' arms about the AXIS start ψ0 apart (b's ahead of a's), and may
            # open to ±ψ_max — so the hinge may turn from −ψ_max − ψ0 to +ψ_max − ψ0
            pin, axis = mech.pos0[j.a] + j.arm_a, j.axis_a
            ra, rb = ((mech.pos0[i] + arm - pin) for i, arm in ((st.a, st.arm_a), (st.b, st.arm_b)))
            ra, rb = ra - axis * float(np.dot(ra, axis)), rb - axis * float(np.dot(rb, axis))
            if j.a != st.a:
                ra, rb = rb, ra
            psi0 = math.atan2(float(np.dot(np.cross(ra, rb), axis)), float(np.dot(ra, rb)))
            lim = math.radians(c.angle_limit)
            want = [x if abs(x) < math.pi else None for x in (-lim - psi0, lim - psi0)]
            if any((g is None) != (w is None) or (g is not None and abs(g - w) > 1e-4) for g, w in zip(got, want)):
                out.append((st.constraint, j.constraint, pin, got))
    return out


class Mechanism:
    """One point system as a mechanism, and the pose it has been pulled into (drawn frame, no offset)."""

    def __init__(self, sy: M.RigidSystem):
        self.n = n = len(sy.points)
        self.pos0 = np.array([p.position for p in sy.points], float).reshape(-1, 3)
        self.types = [c.type for c in sy.constraints]
        self.stops: list = []
        self._rows: list = []          # (kind, constraint index, a, b, …) for `unmet`
        pairs: dict = {}
        for k, c in enumerate(sy.constraints):
            pts = [p - 1 for p in c.points[:2]]
            if len(pts) < 2 or pts[0] == pts[1] or not all(0 <= p < n for p in pts):
                continue
            a, b = pts
            pa, pb = self.pos0[a], self.pos0[b]
            if c.type == "rotation lock":
                cen = np.array(c.rotation_centre, float)
                da, db = np.array(c.direction1, float), np.array(c.direction2, float)
                if np.linalg.norm(da) == 0 or np.linalg.norm(db) == 0:
                    continue
                row = ("hinge", k, a, b, cen - pa, cen - pb, da / np.linalg.norm(da), db / np.linalg.norm(db))
            elif c.type == "distance lock":
                row = ("rod", k, a, b, np.array(c.position1, float) - pa, np.array(c.position2, float) - pb, c.distance)
            elif c.type == "distance stop":
                p1, p2, cen = (np.array(x, float) for x in (c.position1, c.position2, c.rotation_centre))
                s = stop_length(float(np.linalg.norm(p1 - cen)), float(np.linalg.norm(p2 - cen)),
                                math.radians(c.angle_limit))
                self.stops.append(Stop(a, b, k, p1 - pa, p2 - pb, s))
                row = ("stop", k, a, b, p1 - pa, p2 - pb, s)
            else:                      # "coincidence" — and, as the reader has it, anything unknown
                row = ("ball", k, a, b, np.array(c.position1, float) - pa, np.array(c.position2, float) - pb)
            self._rows.append(row)
            if row[0] != "stop":
                pairs.setdefault((min(a, b), max(a, b)), []).append(row)

        # one joint per pair of points: the hinge if there is one (two skew hinges weld), else the ball, else the rod
        root = list(range(n))

        def find(i):
            while root[i] != i:
                root[i] = root[root[i]]
                i = root[i]
            return i
        self.joints: list = []
        for rows in pairs.values():
            hinges = [r for r in rows if r[0] == "hinge"]
            balls = [r for r in rows if r[0] == "ball"]
            if len(hinges) > 1 and any(abs(float(np.dot(hinges[0][6], h[6]))) < 1 - 1e-9 for h in hinges[1:]):
                root[find(hinges[0][3])] = find(hinges[0][2])            # a weld
            elif hinges:
                _, k, a, b, ra, rb, da, db = hinges[0]
                self.joints.append(Joint("hinge", a, b, k, ra, rb, da, db))
            elif balls:
                _, k, a, b, ra, rb = balls[0]
                self.joints.append(Joint("ball", a, b, k, ra, rb))
            else:
                _, k, a, b, ra, rb, _ = rows[0]
                self.joints.append(Joint("rod", a, b, k, ra, rb))
        self.group = [find(i) for i in range(n)]

        # a spanning tree over the welded groups, each rooted at its lowest point; the joints left over close loops
        self.parent: dict = {}         # group → (parent group, joint)
        self.children: dict = {}
        seen: set = set()
        for g0 in sorted(set(self.group)):
            if g0 in seen:
                continue
            seen.add(g0)
            queue = [g0]
            while queue:
                g = queue.pop(0)
                for j in self.joints:
                    ga, gb = self.group[j.a], self.group[j.b]
                    other = gb if ga == g else ga if gb == g else None
                    if other is None or other in seen:
                        continue
                    seen.add(other)
                    self.parent[other] = (g, j)
                    self.children.setdefault(g, []).append(other)
                    queue.append(other)
        self.reset()

    # ── the pose ──
    def reset(self):
        self.c = self.pos0.copy()
        self.R = np.tile(np.eye(3), (self.n, 1, 1))
        for j in self.joints:
            j.angle = 0.0

    @property
    def posed(self) -> bool:
        return not (np.array_equal(self.c, self.pos0) and all(np.array_equal(R, np.eye(3)) for R in self.R))

    def poses(self, offset=(0.0, 0.0, 0.0)) -> list:
        """(position, frame) of every point, the system's offset added."""
        off = np.array(offset, float)
        return [(self.c[i] + off, self.R[i]) for i in range(self.n)]

    def _anchor(self, i, arm, c=None, R=None):
        c, R = (self.c, self.R) if c is None else (c, R)
        return c[i] + R[i] @ arm

    def _taut(self, c, R) -> Optional[Stop]:
        """The first cable stretched past its length in that pose (a hair of slack for round-off)."""
        for st in self.stops:
            if np.linalg.norm(self._anchor(st.b, st.arm_b, c, R) - self._anchor(st.a, st.arm_a, c, R)) > st.s * (1 + 1e-9) + 1e-12:
                return st
        return None

    def unmet(self, tol: float = 1e-6) -> list:
        """The constraints this pose breaks, by index — a tree move keeps its own joint, never a loop's."""
        size = max(float(np.ptp(self.pos0, axis=0).max()) if self.n else 1.0, 1e-12)
        out = []
        for row in self._rows:
            kind, k, a, b, ra, rb = row[:6]
            gap = float(np.linalg.norm(self._anchor(b, rb) - self._anchor(a, ra)))
            if kind == "hinge":
                bad = gap > tol * size or 1.0 - float(np.dot(self.R[a] @ row[6], self.R[b] @ row[7])) > tol
            elif kind == "ball":
                bad = gap > tol * size
            elif kind == "rod":
                bad = abs(gap - row[6]) > tol * size
            else:
                bad = gap > row[6] * (1 + 1e-9) + tol * size
            if bad:
                out.append(k)
        return out

    # ── grab a part, pull it ──
    def _subtree(self, g) -> set:
        out, stack = set(), [g]
        while stack:
            x = stack.pop()
            out.add(x)
            stack += self.children.get(x, [])
        return out

    def grab(self, point: int, at) -> Optional[Grab]:
        """Take hold of `point`'s part at `at` (drawn frame). None when nothing ties it to another part."""
        g = self.group[point]
        if g in self.parent:                     # it turns, with what hangs off it, about the joint to its parent
            _, joint = self.parent[g]
            groups = self._subtree(g)
        elif self.children.get(g):               # the root: its side turns about the joint to its first child
            child = self.children[g][0]
            joint = self.parent[child][1]
            groups = {x for x in set(self.group) if self._component(x) == g} - self._subtree(child)
        else:
            return None
        moving = [i for i in range(self.n) if self.group[i] in groups]
        b_moves = self.group[joint.b] in groups
        stay, arm, axis = (joint.a, joint.arm_a, joint.axis_a) if b_moves else (joint.b, joint.arm_b, joint.axis_b)
        grab = Grab(joint, moving, self._anchor(stay, arm), None if axis is None else self.R[stay] @ axis,
                    1.0 if b_moves else -1.0, np.array(at, float), self.c.copy(), self.R.copy(), joint.angle)
        if joint.kind == "hinge":
            grab.limits = (self._limit(grab, -1.0), self._limit(grab, 1.0))
        return grab

    def hinge_stops(self, joint: Joint) -> Optional[tuple]:
        """(lo, hi) joint angles where a cable stops this hinge, from the drawn pose (None either way = free
        for half a turn). None when the hinge closes a loop, so is not one the tree turns."""
        for end in (joint.b, joint.a):
            if self.parent.get(self.group[end], (None, None))[1] is joint:
                return self.grab(end, self.c[end]).limits
        return None

    def _component(self, g):
        while g in self.parent:
            g = self.parent[g][0]
        return g

    def _moved(self, grab: Grab, w) -> tuple:
        """The grabbed pose with the moving points turned by the rotation vector `w` about the pivot."""
        Q = turn(w)
        c, R = grab.c0.copy(), grab.R0.copy()
        for i in grab.moving:
            c[i] = grab.pivot + Q @ (grab.c0[i] - grab.pivot)
            R[i] = Q @ grab.R0[i]
        return c, R

    def _reach(self, grab: Grab, w) -> float:
        """How far along the turn `w` (0…1) the cables allow, from the grabbed pose."""
        if not self.stops or self._taut(*self._moved(grab, w)) is None and float(np.linalg.norm(w)) < 0.2:
            return 1.0
        n = max(8, int(math.ceil(float(np.linalg.norm(w)) / math.radians(2.0))))    # 2° steps find the first stop
        lo = 0.0
        for k in range(1, n + 1):
            if self._taut(*self._moved(grab, np.asarray(w) * k / n)) is not None:
                hi = k / n
                for _ in range(40):                                                 # … bisection finds it exactly
                    mid = (lo + hi) / 2
                    lo, hi = (mid, hi) if self._taut(*self._moved(grab, np.asarray(w) * mid)) is None else (lo, mid)
                return lo
            lo = k / n
        return 1.0

    def _limit(self, grab: Grab, way: float) -> Optional[float]:
        """The joint angle at which a cable stops the hinge turning that way (None: free for half a turn)."""
        w = grab.axis * way * grab.sign * math.pi
        t = self._reach(grab, w)
        return None if t >= 1.0 else grab.angle0 + way * t * math.pi

    def pull(self, grab: Grab, origin, direction) -> Readout:
        """Turn the grabbed part so the point it was grabbed at follows the ray under the cursor, as far as
        the cables allow, and set the pose."""
        o, d = np.array(origin, float), np.array(direction, float)
        d = d / np.linalg.norm(d)
        j = grab.joint
        arm = grab.point - grab.pivot
        if j.kind == "hinge":
            a = grab.axis
            centre = grab.pivot + a * float(np.dot(arm, a))
            u = grab.point - centre
            r = float(np.linalg.norm(u))
            if r < 1e-12:
                return self._readout(grab, False)
            u /= r
            v = np.cross(a, u)

            def miss(phi):               # the grabbed point, turned by phi, to the ray
                p = centre + r * (math.cos(phi) * u + math.sin(phi) * v) - o
                return float(np.linalg.norm(p - d * np.dot(p, d)))
            # nearest to the ray, and of two equally near turns the one closer to where the drag already is
            grid = grab.phi + np.linspace(-math.pi, math.pi, 361)
            cost = [miss(x) ** 2 + 1e-4 * r * r * (x - grab.phi) ** 2 for x in grid]
            k = int(np.argmin(cost))
            lo, hi = grid[max(k - 1, 0)], grid[min(k + 1, len(grid) - 1)]
            for _ in range(40):
                m1, m2 = lo + (hi - lo) / 3, hi - (hi - lo) / 3
                lo, hi = (lo, m2) if miss(m1) < miss(m2) else (m1, hi)
            grab.phi = phi = (lo + hi) / 2
            w = a * phi
        else:                            # a ball joint, or a rod about its far anchor: the point rides a sphere
            r = float(np.linalg.norm(arm))
            if r < 1e-12:
                return self._readout(grab, False)
            oc = o - grab.pivot
            b = float(np.dot(oc, d))
            disc = b * b - (float(np.dot(oc, oc)) - r * r)
            if disc >= 0:
                hit = oc + d * (-b - math.sqrt(disc))             # the near side of the sphere
            else:
                q = oc - d * b                                     # past its edge: the nearest point on it
                hit = q / np.linalg.norm(q) * r
            axis = np.cross(arm, hit)
            s = float(np.linalg.norm(axis))
            w = np.zeros(3) if s < 1e-15 else axis / s * math.atan2(s, float(np.dot(arm, hit)))
        t = self._reach(grab, w)
        self.c, self.R = self._moved(grab, np.asarray(w) * t)
        if j.kind == "hinge":
            j.angle = grab.angle0 + grab.sign * t * float(np.dot(w, grab.axis))
        return self._readout(grab, t < 1.0)

    def _readout(self, grab: Grab, at_stop: bool) -> Readout:
        j = grab.joint
        name = f"{JOINT_NAMES[j.kind]} {j.a + 1}–{j.b + 1}"
        if j.kind == "hinge":
            lo, hi = grab.limits
            ends = ("free" if lo is None and hi is None else
                    f"stops at {'—' if lo is None else f'{math.degrees(lo):+.1f}°'} and "
                    f"{'—' if hi is None else f'{math.degrees(hi):+.1f}°'}")
            text = f"{name}: {math.degrees(j.angle):+.1f}°   ({ends})"
        else:
            rel = self.R[j.a].T @ self.R[j.b]
            ang = math.degrees(math.acos(max(-1.0, min(1.0, (float(np.trace(rel)) - 1.0) / 2.0))))
            text = f"{name}: turned {ang:.1f}° from the drawn pose"
        if at_stop:
            text += "   — at the stop"
        return Readout(text, at_stop, self.unmet())
