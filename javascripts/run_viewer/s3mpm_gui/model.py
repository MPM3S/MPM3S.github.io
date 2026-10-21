# copied from MPM3SGui/s3mpm_gui/model.py by make_run_viewer_files.py - do not edit
"""The scene: every key the MPM3S reader (MPM3S/src/setup/*.jl) understands, as dataclasses.

The JSON is the only interface to the solver, so this module is the contract. It follows the READER, not
the example files (the examples use the stale "percent"/"directory" output keys; `from_dict` migrates
them and records a note). Keys this module does not know are kept in `extra` and written back unchanged,
so opening and saving a file never drops anything.

Everything is GLOBAL coordinates, exactly as the reader expects: STLs are used where they were drawn and
only a system's "offset" moves them.
"""
from __future__ import annotations

import copy
import json
from dataclasses import dataclass, field
from typing import Any, Optional, Union

# ── vocabularies (the strings the reader accepts) ──────────────────────────────────────────────────────
MATERIAL_TYPES = ("elastic", "von mises", "willam warnke")
FACE_BC = ("free", "roller", "fixed")
TRACK_TYPES = ("off", "roller", "fixed")
TRACK_ADVANCE = ("positive", "negative", "both")
ADAPTIVITY_TYPES = ("none", "uniform", "rigid body surface")
STAGE_TYPES = ("static", "dynamic")
STATIC_LOADS = ("gravity ramp", "full")
CONSTRAINT_TYPES = ("coincidence", "rotation lock", "distance lock", "distance stop")
DOMAIN_UPDATES = ("none", "stretch")
MP_FIELD_NAMES = sorted(["initial position", "position", "lp", "displacement", "velocity", "acceleration",
                         "deformation gradient", "stress", "strain", "volume", "initial volume"])
RB_FIELD_NAMES = sorted(["position", "velocity", "acceleration", "angular velocity", "angular acceleration",
                         "mass", "reaction force", "reaction moment"])
DOF_LABELS = ("ux", "uy", "uz", "θx", "θy", "θz")

# a rigid-body BC slot: "free" | "fixed" | a float (prescribed increment per nominal step)
BCSlot = Union[str, float]
Vec3 = list  # [x, y, z] floats


def _pop(d: dict, key: str, default: Any = None) -> Any:
    return d.pop(key) if key in d else default


def _vec(v, n=3) -> list:
    v = [float(x) for x in v]
    if len(v) != n:
        raise ValueError(f"expected {n} numbers, got {len(v)}")
    return v


def _onoff(v: Any, key: str) -> bool:
    if v not in ("on", "off"):
        raise ValueError(f'"{key}" must be "on" or "off", got {v!r}')
    return v == "on"


def _oo(b: bool) -> str:
    return "on" if b else "off"


# ── materials and the soil block ───────────────────────────────────────────────────────────────────────
@dataclass
class Material:
    type: str = "elastic"
    E: float = 1.0e7
    nu: float = 0.3
    density: float = 1800.0
    yield_stress: float = 1.0e5          # von mises
    friction_angle: float = 30.0         # willam warnke, DEGREES
    dilation_angle: float = 0.0          # willam warnke, DEGREES
    cohesion: float = 1.0e3              # willam warnke
    overburden: bool = False             # optional "E overburden" block
    reference_stress: float = 1.0e5
    exponent: float = 0.5
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "Material":
        d = dict(d)
        m = cls(type=_pop(d, "type", "elastic"))
        m.E = float(_pop(d, "E", m.E))
        m.nu = float(_pop(d, "nu", m.nu))
        m.density = float(_pop(d, "density", m.density))
        m.yield_stress = float(_pop(d, "yield stress", m.yield_stress))
        m.friction_angle = float(_pop(d, "friction angle", m.friction_angle))
        m.dilation_angle = float(_pop(d, "dilation angle", m.dilation_angle))
        m.cohesion = float(_pop(d, "cohesion", m.cohesion))
        ob = _pop(d, "E overburden")
        if ob is not None:
            m.overburden = True
            m.reference_stress = float(ob.get("reference stress", m.reference_stress))
            m.exponent = float(ob.get("exponent", m.exponent))
        m.extra = d
        return m

    def to_dict(self) -> dict:
        d: dict = {"type": self.type, "E": self.E, "nu": self.nu}
        if self.type == "von mises":
            d["yield stress"] = self.yield_stress
        elif self.type == "willam warnke":
            d["friction angle"] = self.friction_angle
            d["dilation angle"] = self.dilation_angle
            d["cohesion"] = self.cohesion
        d["density"] = self.density
        if self.overburden:
            d["E overburden"] = {"reference stress": self.reference_stress, "exponent": self.exponent}
        d.update(self.extra)
        return d


@dataclass
class Layer:
    thickness: float = 1.0
    material: Material = field(default_factory=Material)
    name: str = ""                       # GUI label, written as "name" (the reader ignores it)
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "Layer":
        d = dict(d)
        return cls(thickness=float(_pop(d, "thickness", 1.0)),
                   material=Material.from_dict(_pop(d, "material", {})),
                   name=str(_pop(d, "name", "")), extra=d)

    def to_dict(self) -> dict:
        d: dict = {}
        if self.name:
            d["name"] = self.name
        d["thickness"] = self.thickness
        d["material"] = self.material.to_dict()
        d.update(self.extra)
        return d


@dataclass
class MaterialPoints:
    extra_capacity: float = 1.2
    element_size: float = 0.2
    npart: int = 2                       # "number of material points per element 1" — per AXIS
    size_min: list = field(default_factory=lambda: [0.0, 0.0])   # written, not read (the block min is 0)
    size_max: list = field(default_factory=lambda: [4.0, 1.0])   # footprint (x, y)
    layers: list = field(default_factory=lambda: [Layer(thickness=1.0, name="Layer 1")])
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "MaterialPoints":
        d = dict(d)
        size = dict(_pop(d, "material size", {}))
        mp = cls(extra_capacity=float(_pop(d, "extra capacity", 1.2)),
                 element_size=float(_pop(d, "element size", 0.2)),
                 npart=int(_pop(d, "number of material points per element 1", 2)),
                 size_min=_vec(size.pop("min", [0.0, 0.0]), 2),
                 size_max=_vec(size.pop("max", [4.0, 1.0]), 2),
                 layers=[Layer.from_dict(x) for x in _pop(d, "layers", [])])
        if size:
            d["material size"] = size   # unknown sub-keys survive (merged back in to_dict)
        mp.extra = d
        return mp

    def to_dict(self) -> dict:
        size = {"min": list(self.size_min), "max": list(self.size_max)}
        extra = dict(self.extra)
        size.update(extra.pop("material size", {}))
        d = {"extra capacity": self.extra_capacity,
             "element size": self.element_size,
             "number of material points per element 1": int(self.npart),
             "material size": size,
             "layers": [l.to_dict() for l in self.layers]}
        d.update(extra)
        return d


# ── rigid bodies: point systems ────────────────────────────────────────────────────────────────────────
def bc_slot_from_json(x: Any) -> BCSlot:
    if isinstance(x, str):
        if x not in ("free", "fixed"):
            raise ValueError(f'a point BC slot must be "free", "fixed" or {{"prescribed": q}}, got {x!r}')
        return x
    return float(x["prescribed"])


def bc_slot_to_json(x: BCSlot) -> Any:
    return x if isinstance(x, str) else {"prescribed": float(x)}


@dataclass
class RBPoint:
    position: list = field(default_factory=lambda: [0.0, 0.0, 0.0])
    mass: float = 1.0
    inertia: list = field(default_factory=lambda: [1.0, 1.0, 1.0])
    bcs: list = field(default_factory=lambda: ["free"] * 6)
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "RBPoint":
        d = dict(d)
        bcs = [bc_slot_from_json(x) for x in _pop(d, "boundary conditions", ["free"] * 6)]
        if len(bcs) != 6:
            raise ValueError(f'a point needs 6 "boundary conditions" slots, got {len(bcs)}')
        return cls(position=_vec(_pop(d, "position", [0, 0, 0])), mass=float(_pop(d, "mass", 1.0)),
                   inertia=_vec(_pop(d, "rotational inertia", [1, 1, 1])), bcs=bcs, extra=d)

    def to_dict(self) -> dict:
        d = {"position": list(self.position), "mass": self.mass, "rotational inertia": list(self.inertia),
             "boundary conditions": [bc_slot_to_json(x) for x in self.bcs]}
        d.update(self.extra)
        return d


@dataclass
class Constraint:
    type: str = "coincidence"
    points: list = field(default_factory=lambda: [1, 2])          # 1-based, within the system
    stiffness: float = 1.0e9
    position1: list = field(default_factory=lambda: [0.0, 0.0, 0.0])
    position2: list = field(default_factory=lambda: [0.0, 0.0, 0.0])
    rotation_centre: list = field(default_factory=lambda: [0.0, 0.0, 0.0])
    direction1: list = field(default_factory=lambda: [0.0, 1.0, 0.0])
    direction2: list = field(default_factory=lambda: [0.0, 1.0, 0.0])
    rotational_stiffness: float = 1.0e8
    distance: float = 1.0
    angle_limit: float = 30.0            # DEGREES
    extra: dict = field(default_factory=dict)

    # which keys each type carries (and therefore which editors the GUI shows)
    FIELDS = {
        "coincidence": ("position 1", "position 2"),
        "rotation lock": ("rotation centre", "direction 1", "direction 2", "rotational stiffness"),
        "distance lock": ("position 1", "position 2", "distance"),
        "distance stop": ("position 1", "position 2", "rotation centre", "angle limit"),
    }

    @classmethod
    def from_dict(cls, d: dict) -> "Constraint":
        d = dict(d)
        c = cls(type=str(_pop(d, "type", "coincidence")))
        c.points = [int(x) for x in _pop(d, "points", [1, 2])]
        c.stiffness = float(_pop(d, "stiffness", c.stiffness))
        c.position1 = _vec(_pop(d, "position 1", c.position1))
        c.position2 = _vec(_pop(d, "position 2", c.position2))
        c.rotation_centre = _vec(_pop(d, "rotation centre", c.rotation_centre))
        c.direction1 = _vec(_pop(d, "direction 1", c.direction1))
        c.direction2 = _vec(_pop(d, "direction 2", c.direction2))
        c.rotational_stiffness = float(_pop(d, "rotational stiffness", c.rotational_stiffness))
        c.distance = float(_pop(d, "distance", c.distance))
        c.angle_limit = float(_pop(d, "angle limit", c.angle_limit))
        c.extra = d
        return c

    def to_dict(self) -> dict:
        d: dict = {"type": self.type, "points": [int(p) for p in self.points]}
        values = {"position 1": list(self.position1), "position 2": list(self.position2),
                  "rotation centre": list(self.rotation_centre), "direction 1": list(self.direction1),
                  "direction 2": list(self.direction2), "rotational stiffness": self.rotational_stiffness,
                  "distance": self.distance, "angle limit": self.angle_limit}
        for k in self.FIELDS.get(self.type, ()):
            d[k] = values[k]
        d["stiffness"] = self.stiffness
        d.update(self.extra)
        return d


@dataclass
class StlFile:
    name: str = ""
    stl: str = ""                        # path, relative to the JSON's directory (the reader joins it)
    mesh_cache: str = ""                 # Gmsh tet mesh cache — generated by the solver if missing
    point: int = 1                       # 1-based point of the system it is welded to
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "StlFile":
        d = dict(d)
        return cls(name=str(_pop(d, "name", "")), stl=str(_pop(d, "stl", "")),
                   mesh_cache=str(_pop(d, "mesh cache", "")), point=int(_pop(d, "point", 1)), extra=d)

    def to_dict(self) -> dict:
        d = {"name": self.name, "stl": self.stl, "mesh cache": self.mesh_cache, "point": int(self.point)}
        d.update(self.extra)
        return d


@dataclass
class TrackedNode:
    point: int = 1
    position: list = field(default_factory=lambda: [0.0, 0.0, 0.0])
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "TrackedNode":
        d = dict(d)
        return cls(point=int(_pop(d, "point", 1)), position=_vec(_pop(d, "position", [0, 0, 0])), extra=d)

    def to_dict(self) -> dict:
        d = {"point": int(self.point), "position": list(self.position)}
        d.update(self.extra)
        return d


@dataclass
class RigidSystem:
    name: str = ""                       # GUI label, written as "name" (the reader ignores it)
    offset: Optional[list] = None        # optional [dx, dy, dz] — the ONLY way the solver moves a system
    points: list = field(default_factory=lambda: [RBPoint()])
    constraints: list = field(default_factory=list)
    stl_files: list = field(default_factory=list)
    tracked_nodes: list = field(default_factory=list)
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "RigidSystem":
        d = dict(d)
        off = _pop(d, "offset")
        return cls(name=str(_pop(d, "name", "")),
                   offset=_vec(off) if off is not None else None,
                   points=[RBPoint.from_dict(p) for p in _pop(d, "points", [])],
                   constraints=[Constraint.from_dict(c) for c in _pop(d, "constraints", [])],
                   stl_files=[StlFile.from_dict(s) for s in _pop(d, "stl files", [])],
                   tracked_nodes=[TrackedNode.from_dict(t) for t in _pop(d, "tracked nodes", [])],
                   extra=d)

    def to_dict(self) -> dict:
        d: dict = {}
        if self.name:
            d["name"] = self.name
        if self.offset is not None:
            d["offset"] = list(self.offset)
        d["points"] = [p.to_dict() for p in self.points]
        if self.constraints:
            d["constraints"] = [c.to_dict() for c in self.constraints]
        if self.stl_files:
            d["stl files"] = [s.to_dict() for s in self.stl_files]
        if self.tracked_nodes:
            d["tracked nodes"] = [t.to_dict() for t in self.tracked_nodes]
        d.update(self.extra)
        return d

    def offset_vec(self) -> list:
        return list(self.offset) if self.offset is not None else [0.0, 0.0, 0.0]


# ── the analysis: stages ───────────────────────────────────────────────────────────────────────────────
@dataclass
class Adaptivity:
    type: str = "none"
    element_size: float = 0.1            # "rigid body surface"
    use_region: bool = False             # "region" + "element size in region" — both or neither
    region: float = 0.1
    element_size_in_region: float = 0.1
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "Adaptivity":
        d = dict(d)
        a = cls(type=str(_pop(d, "type", "none")))
        a.element_size = float(_pop(d, "element size", a.element_size))
        r, er = _pop(d, "region"), _pop(d, "element size in region")
        if r is not None or er is not None:
            a.use_region = True
            a.region = float(r if r is not None else a.region)
            a.element_size_in_region = float(er if er is not None else a.element_size_in_region)
        a.extra = d
        return a

    def to_dict(self) -> dict:
        d: dict = {"type": self.type}
        if self.type == "rigid body surface":
            d["element size"] = self.element_size
            if self.use_region:
                d["region"] = self.region
                d["element size in region"] = self.element_size_in_region
        d.update(self.extra)
        return d


@dataclass
class FaceBCs:
    min: list = field(default_factory=lambda: ["roller", "roller", "fixed"])
    max: list = field(default_factory=lambda: ["roller", "roller", "free"])

    @classmethod
    def from_dict(cls, d: dict) -> "FaceBCs":
        return cls(min=[str(x) for x in d.get("min", ["free"] * 3)], max=[str(x) for x in d.get("max", ["free"] * 3)])

    def to_dict(self) -> dict:
        return {"min": list(self.min), "max": list(self.max)}


@dataclass
class TrackFace:
    type: list = field(default_factory=lambda: ["off", "off", "off"])
    distance: list = field(default_factory=lambda: [0.0, 0.0, 0.0])
    advance: list = field(default_factory=lambda: ["positive", "positive", "positive"])
    remove: list = field(default_factory=lambda: [False, False, False])

    @classmethod
    def from_dict(cls, d: dict) -> "TrackFace":
        return cls(type=[str(x) for x in d.get("type", ["off"] * 3)],
                   distance=_vec(d.get("distance", [0, 0, 0])),
                   advance=[str(x) for x in d.get("advance", ["positive"] * 3)],
                   remove=[x == "yes" for x in d.get("remove", ["no"] * 3)])

    def to_dict(self) -> dict:
        return {"type": list(self.type), "distance": list(self.distance), "advance": list(self.advance),
                "remove": ["yes" if r else "no" for r in self.remove]}


@dataclass
class PointBCOverride:
    system: int = 1                      # 1-based
    point: int = 1                       # 1-based, within the system
    bcs: list = field(default_factory=lambda: ["fixed"] * 6)

    @classmethod
    def from_dict(cls, d: dict) -> "PointBCOverride":
        return cls(system=int(d.get("system", 1)), point=int(d.get("point", 1)),
                   bcs=[bc_slot_from_json(x) for x in d.get("boundary conditions", ["fixed"] * 6)])

    def to_dict(self) -> dict:
        return {"system": int(self.system), "point": int(self.point),
                "boundary conditions": [bc_slot_to_json(x) for x in self.bcs]}


@dataclass
class Stage:
    name: str = ""                       # GUI label, written as "name" (the reader ignores it)
    type: str = "static"
    # static
    load_steps: int = 10
    load: str = "gravity ramp"
    # dynamic
    dt: float = 5.0e-3
    final_time: float = 1.0
    beta: float = 0.5
    gamma: float = 1.0
    rigid_bodies: bool = False
    placement: Optional[bool] = None     # "rigid body surface placement" — None ⇒ key absent (off)
    adaptivity: Optional[Adaptivity] = None   # None ⇒ key absent ⇒ NoAdaptivity
    bcs: Optional[FaceBCs] = field(default_factory=FaceBCs)   # None ⇒ key absent ⇒ every face free
    track: Optional[tuple] = None        # (TrackFace min, TrackFace max) or None
    point_bcs: list = field(default_factory=list)   # "rigid body boundary conditions" overrides
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "Stage":
        d = dict(d)
        s = cls(name=str(_pop(d, "name", "")), type=str(_pop(d, "type", "static")))
        s.load_steps = int(_pop(d, "load steps", s.load_steps))
        s.load = str(_pop(d, "load", s.load))
        s.dt = float(_pop(d, "dt", s.dt))
        s.final_time = float(_pop(d, "final time", s.final_time))
        s.beta = float(_pop(d, "beta", s.beta))
        s.gamma = float(_pop(d, "gamma", s.gamma))
        s.rigid_bodies = _onoff(_pop(d, "rigid bodies", "off"), "rigid bodies")
        pl = _pop(d, "rigid body surface placement")
        s.placement = None if pl is None else _onoff(pl, "rigid body surface placement")
        ad = _pop(d, "adaptivity")
        s.adaptivity = None if ad is None else Adaptivity.from_dict(ad)
        bc = _pop(d, "boundary conditions")
        s.bcs = None if bc is None else FaceBCs.from_dict(bc)
        tr = _pop(d, "boundary track")
        s.track = None if tr is None else (TrackFace.from_dict(tr.get("min", {})), TrackFace.from_dict(tr.get("max", {})))
        s.point_bcs = [PointBCOverride.from_dict(e) for e in _pop(d, "rigid body boundary conditions", [])]
        s.extra = d
        return s

    def to_dict(self) -> dict:
        d: dict = {}
        if self.name:
            d["name"] = self.name
        d["type"] = self.type
        if self.type == "dynamic":
            d.update({"dt": self.dt, "final time": self.final_time, "beta": self.beta, "gamma": self.gamma})
        else:
            d.update({"load steps": int(self.load_steps), "load": self.load})
        d["rigid bodies"] = _oo(self.rigid_bodies)
        if self.placement is not None:
            d["rigid body surface placement"] = _oo(self.placement)
        if self.adaptivity is not None:
            d["adaptivity"] = self.adaptivity.to_dict()
        if self.point_bcs:
            d["rigid body boundary conditions"] = [e.to_dict() for e in self.point_bcs]
        if self.bcs is not None:
            d["boundary conditions"] = self.bcs.to_dict()
        if self.track is not None:
            d["boundary track"] = {"min": self.track[0].to_dict(), "max": self.track[1].to_dict()}
        d.update(self.extra)
        return d

    def n_steps(self) -> int:
        return int(round(self.final_time / self.dt)) if self.type == "dynamic" else int(self.load_steps)

    def label(self, i: int) -> str:
        what = (f"dynamic, {self.n_steps()} steps of {self.dt:g} s" if self.type == "dynamic"
                else f"static, {self.load_steps} steps, {self.load}")
        return f"{i + 1}. {self.name or what}" + (f"  ({what})" if self.name else "")


# ── solver controls and output ─────────────────────────────────────────────────────────────────────────
@dataclass
class Solver:
    tolerance: float = 1.0e-6
    max_newton: int = 20
    max_linear: Optional[int] = None     # optional, reader default 100
    poor_factor: float = 0.25
    ghost_factor: float = 0.025
    ghost_factor_mass: float = 0.25
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "Solver":
        d = dict(d)
        ml = _pop(d, "max linear iterations")
        return cls(tolerance=float(_pop(d, "tolerance", 1e-6)), max_newton=int(_pop(d, "max newton iterations", 20)),
                   max_linear=None if ml is None else int(ml), poor_factor=float(_pop(d, "poor factor", 0.25)),
                   ghost_factor=float(_pop(d, "ghost factor", 0.025)),
                   ghost_factor_mass=float(_pop(d, "ghost factor mass", 0.25)), extra=d)

    def to_dict(self) -> dict:
        d: dict = {"tolerance": self.tolerance, "max newton iterations": int(self.max_newton)}
        if self.max_linear is not None:
            d["max linear iterations"] = int(self.max_linear)
        d.update({"poor factor": self.poor_factor, "ghost factor": self.ghost_factor,
                  "ghost factor mass": self.ghost_factor_mass})
        d.update(self.extra)
        return d


@dataclass
class Output:
    vtk: bool = True
    vtk_dir: str = "vtk"
    vtk_pct: float = 1.0
    csv: bool = True
    csv_dir: str = "csv"
    csv_pct: float = 1.0
    # None ⇒ the key is OMITTED ⇒ the reader writes EVERY field; [] ⇒ none. Opposite meanings (reader rule).
    vtk_mp_fields: Optional[list] = None
    vtk_rb_fields: Optional[list] = None
    csv_mp_fields: Optional[list] = None
    csv_rb_fields: Optional[list] = None
    extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict, notes: Optional[list] = None) -> "Output":
        d = dict(d)
        notes = notes if notes is not None else []
        legacy_dir, legacy_pct = _pop(d, "directory"), _pop(d, "percent")
        o = cls(vtk=_onoff(_pop(d, "vtk", "off"), "output/vtk"), csv=_onoff(_pop(d, "csv", "off"), "output/csv"))
        o.vtk_dir = str(_pop(d, "vtk directory", legacy_dir if legacy_dir is not None else o.vtk_dir))
        o.csv_dir = str(_pop(d, "csv directory", legacy_dir if legacy_dir is not None else o.csv_dir))
        o.vtk_pct = float(_pop(d, "vtk percent", legacy_pct if legacy_pct is not None else o.vtk_pct))
        o.csv_pct = float(_pop(d, "csv percent", legacy_pct if legacy_pct is not None else o.csv_pct))
        if legacy_dir is not None:
            notes.append(f'output: legacy "directory" ({legacy_dir!r}) migrated to "vtk directory"/"csv directory"')
        if legacy_pct is not None:
            notes.append(f'output: legacy "percent" ({legacy_pct}) migrated to "vtk percent"/"csv percent"')

        def names(key):
            v = _pop(d, key)
            return None if v is None else [str(x) for x in v]
        o.vtk_mp_fields = names("vtk material point fields")
        o.vtk_rb_fields = names("vtk rigid body fields")
        o.csv_mp_fields = names("csv material point fields")
        o.csv_rb_fields = names("csv rigid body fields")
        o.extra = d
        return o

    def to_dict(self) -> dict:
        d: dict = {"vtk": _oo(self.vtk)}
        if self.vtk:
            d["vtk directory"] = self.vtk_dir
            d["vtk percent"] = self.vtk_pct
            if self.vtk_mp_fields is not None:
                d["vtk material point fields"] = list(self.vtk_mp_fields)
            if self.vtk_rb_fields is not None:
                d["vtk rigid body fields"] = list(self.vtk_rb_fields)
        d["csv"] = _oo(self.csv)
        if self.csv:
            d["csv directory"] = self.csv_dir
            d["csv percent"] = self.csv_pct
            if self.csv_mp_fields is not None:
                d["csv material point fields"] = list(self.csv_mp_fields)
            if self.csv_rb_fields is not None:
                d["csv rigid body fields"] = list(self.csv_rb_fields)
        d.update(self.extra)
        return d


# ── the whole file ─────────────────────────────────────────────────────────────────────────────────────
@dataclass
class Scene:
    gpu: bool = False
    gravity: list = field(default_factory=lambda: [0.0, 0.0, -9.81])
    domain_update: Optional[str] = None  # optional "none" | "stretch"
    material_points: MaterialPoints = field(default_factory=MaterialPoints)
    rigid_bodies: list = field(default_factory=list)
    friction: float = 0.3
    analysis: list = field(default_factory=lambda: [Stage(name="Gravity settlement")])
    solver: Solver = field(default_factory=Solver)
    output: Output = field(default_factory=Output)
    extra: dict = field(default_factory=dict)
    domain_extra: dict = field(default_factory=dict)
    contact_extra: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict, notes: Optional[list] = None) -> "Scene":
        d = copy.deepcopy(d)
        notes = notes if notes is not None else []
        dom = dict(_pop(d, "domain", {}))
        con = dict(_pop(d, "contact", {}))
        legacy_size = _pop(dom, "size")
        if legacy_size is not None:   # the reader dropped it: the octree cube follows the material box
            notes.append(f'domain: legacy "size" ({legacy_size}) dropped — the cube is sized from the material box')
        s = cls(gpu=_onoff(_pop(d, "GPU", "off"), "GPU"),
                gravity=_vec(_pop(dom, "gravity", [0, 0, -9.81])),
                domain_update=_pop(d, "domain update"),
                material_points=MaterialPoints.from_dict(_pop(d, "material points", {})),
                rigid_bodies=[RigidSystem.from_dict(x) for x in _pop(d, "rigid bodies", [])],
                friction=float(_pop(con, "friction coefficient", 0.3)),
                analysis=[Stage.from_dict(x) for x in _pop(d, "analysis", [])],
                solver=Solver.from_dict(_pop(d, "solver", {})),
                output=Output.from_dict(_pop(d, "output", {}), notes))
        s.domain_extra, s.contact_extra, s.extra = dom, con, d
        return s

    def to_dict(self) -> dict:
        d: dict = {"GPU": _oo(self.gpu)}
        if self.domain_update is not None:
            d["domain update"] = self.domain_update
        d["domain"] = {"gravity": list(self.gravity), **self.domain_extra}
        d["material points"] = self.material_points.to_dict()
        d["rigid bodies"] = [s.to_dict() for s in self.rigid_bodies]
        d["contact"] = {"friction coefficient": self.friction, **self.contact_extra}
        d["analysis"] = [s.to_dict() for s in self.analysis]
        d["solver"] = self.solver.to_dict()
        d["output"] = self.output.to_dict()
        d.update(self.extra)
        return d

    def clone(self) -> "Scene":
        return copy.deepcopy(self)


def new_scene() -> Scene:
    """A small, runnable starting point: one elastic layer settling under gravity."""
    return Scene()


# ── file I/O ───────────────────────────────────────────────────────────────────────────────────────────
def load(path: str, notes: Optional[list] = None) -> Scene:
    with open(path, encoding="utf-8") as f:
        return Scene.from_dict(json.load(f), notes)


def _scalar(x: Any) -> bool:
    return isinstance(x, (int, float, str, bool)) or x is None


def _inline(v: Any) -> bool:
    """Short lists go on one line: [x, y, z], field names, and BC slots like ["free", {"prescribed": q}]."""
    return isinstance(v, list) and all(
        _scalar(x) or (isinstance(x, dict) and len(x) == 1 and _scalar(next(iter(x.values())))) for x in v)


def _compact(x: Any) -> str:
    if isinstance(x, dict):
        return "{" + ", ".join(f"{json.dumps(k, ensure_ascii=False)}: {_compact(v)}" for k, v in x.items()) + "}"
    if isinstance(x, (int, float)) and not isinstance(x, bool):
        return _fmt_num(x)
    return json.dumps(x, ensure_ascii=False)


def _fmt_num(x: Union[int, float]) -> str:
    """Ints as ints; floats always with a '.' or exponent (the reader casts with T(), so 2.0 and 2 both
    work — but a float stays recognisably a float); very large/small magnitudes as 2.4e6 / 1.0e-6."""
    if isinstance(x, bool):
        return "true" if x else "false"
    if isinstance(x, int):
        return str(x)
    x = float(x)
    a = abs(x)
    if a != 0 and (a >= 1e5 or a < 1e-3):
        mant, exp = f"{x:.15e}".split("e")
        mant = mant.rstrip("0")
        mant = mant + "0" if mant.endswith(".") else mant
        s = f"{mant}e{int(exp)}"
        if float(s) == x:
            return s
    if x == int(x) and a < 1e15:
        return f"{x:.1f}"
    return repr(x)


def dumps(obj: Any, indent: int = 4, _level: int = 0) -> str:
    """JSON in the house style of the example inputs: nested objects indented, short vectors inline."""
    pad, pad1 = " " * (indent * _level), " " * (indent * (_level + 1))
    if isinstance(obj, dict):
        if not obj:
            return "{}"
        items = [f"{pad1}{json.dumps(k, ensure_ascii=False)}: {dumps(v, indent, _level + 1)}" for k, v in obj.items()]
        return "{\n" + ",\n".join(items) + "\n" + pad + "}"
    if isinstance(obj, list):
        if not obj:
            return "[]"
        if _inline(obj):
            return "[" + ", ".join(_compact(x) for x in obj) + "]"
        return "[\n" + ",\n".join(pad1 + dumps(x, indent, _level + 1) for x in obj) + "\n" + pad + "]"
    if isinstance(obj, (int, float)) and not isinstance(obj, bool):
        return _fmt_num(obj)
    return json.dumps(obj, ensure_ascii=False)


def save(scene: Scene, path: str) -> None:
    text = dumps(scene.to_dict()) + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
