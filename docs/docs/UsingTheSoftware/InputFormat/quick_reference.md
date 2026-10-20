# Quick reference

Every key of the input file, by section. **Status:** **R** required · **O** optional (the default is used) · **C** conditional (required only as stated) · **–** ignored. Each tab links to the full reference for its keys.

=== "Top level"

    | Key | Status | Values | Default |
    |-----|:------:|--------|---------|
    | `"GPU"` | R | `"on"` \| `"off"` | |
    | `"domain update"` | O | `"none"` \| `"stretch"` | `"none"` |
    | `"domain"` | R | object - see *Domain and soil* | |
    | `"material points"` | R | object - see *Domain and soil* | |
    | `"rigid bodies"` | R | list of systems, may be `[]` - see *Rigid bodies* | |
    | `"contact"` | R | object - see *Contact and solver* | |
    | `"analysis"` | R | list of stages - see *Stages* | |
    | `"solver"` | R | object - see *Contact and solver* | |
    | `"output"` | R | object - see *Output* | |

    [Full reference: GPU →](gpu.md) · [Domain update →](material_points.md#domain-update)

=== "Domain and soil"

    | Key | Status | Values | Default |
    |-----|:------:|--------|---------|
    | `"domain"` → `"gravity"` | R | `[x, y, z]` (m/s²) | |
    | `"extra capacity"` | R | number ≥ 1 | |
    | `"element size"` | R | number (m) | |
    | `"number of material points per element 1"` | R | integer ≥ 1 | |
    | `"material size"` → `"max"` | R | `[x, y]` (m) | |
    | `"material size"` → `"min"` | – | | |
    | `"layers"` | R | list, top to bottom | |
    | `"thickness"` | R | number (m) | |
    | `"material"` → `"type"` | R | `"elastic"` \| `"von mises"` \| `"willam warnke"` | |
    | `"E"`, `"nu"`, `"density"` | R | numbers (Pa, -, kg/m³) | |
    | `"yield stress"` | C | `"von mises"` only | |
    | `"friction angle"`, `"dilation angle"`, `"cohesion"` | C | `"willam warnke"` only | |
    | `"E overburden"` → `"reference stress"`, `"exponent"` | O | numbers | E constant |

    [Full reference: Domain →](domain.md) · [Material points →](material_points.md)

=== "Rigid bodies"

    | Key | Status | Values | Default |
    |-----|:------:|--------|---------|
    | `"points"` → `"position"` | R | `[x, y, z]` (m) | |
    | `"points"` → `"mass"` | R | number (kg) | |
    | `"points"` → `"rotational inertia"` | R | `[Ixx, Iyy, Izz]` (kg·m²) | |
    | `"points"` → `"boundary conditions"` | R | 6 × `"free"` \| `"fixed"` \| `{"prescribed": q}` | |
    | `"constraints"` | O | list | none |
    | → `"type"`, `"points"`, `"stiffness"` | R | `"coincidence"` \| `"rotation lock"` \| `"distance lock"` \| `"distance stop"`; `[a, b]`; N/m | |
    | → `"position 1"`, `"position 2"` | C | all but `"rotation lock"` | |
    | → `"rotation centre"` | C | `"rotation lock"`, `"distance stop"` | |
    | → `"direction 1"`, `"direction 2"`, `"rotational stiffness"` | C | `"rotation lock"` | |
    | → `"distance"` | C | `"distance lock"` | |
    | → `"angle limit"` | C | `"distance stop"` (degrees) | |
    | `"stl files"` → `"stl"`, `"mesh cache"`, `"point"` | R | file names, integer | none |
    | `"stl files"` → `"name"` | – | | |
    | `"tracked nodes"` → `"position"`, `"point"` | R | `[x, y, z]` (m), integer | none |
    | `"offset"` | O | `[x, y, z]` (m) | `[0, 0, 0]` |

    [Full reference: Rigid bodies →](rigid_bodies.md)

=== "Stages"

    | Key | Status | Values | Default |
    |-----|:------:|--------|---------|
    | `"type"` | R | `"static"` \| `"dynamic"` | |
    | `"rigid bodies"` | R | `"on"` \| `"off"` | |
    | `"load steps"`, `"load"` | C | static only; `"gravity ramp"` \| `"full"` | |
    | `"dt"`, `"final time"`, `"beta"`, `"gamma"` | C | dynamic only | |
    | `"boundary conditions"` → `"min"`, `"max"` | O | `[x, y, z]` of `"free"` \| `"roller"` \| `"fixed"` | every face free |
    | `"adaptivity"` → `"type"` | O | `"none"` \| `"uniform"` \| `"rigid body surface"` | `"none"` |
    | `"adaptivity"` → `"element size"` | C | `"rigid body surface"` only | |
    | `"adaptivity"` → `"region"`, `"element size in region"` | O | together, `"rigid body surface"` only | no region |
    | `"rigid body surface placement"` ¹ | O | `"on"` \| `"off"` | `"off"` |
    | `"rigid body boundary conditions"` ¹ | O | list of `"system"`, `"point"`, `"boundary conditions"` | the points' own |
    | `"boundary track"` ¹ → `"min"`, `"max"` | O | `"type"`, `"distance"`, `"advance"`, `"remove"`, each `[x, y, z]` | no track |

    ¹ Ignored in a stage with `"rigid bodies": "off"`.

    [Full reference: Analysis stages →](analysis.md)

=== "Contact and solver"

    | Key | Status | Values | Default |
    |-----|:------:|--------|---------|
    | `"contact"` → `"friction coefficient"` | R | number ≥ 0 | |
    | `"tolerance"` | R | number | |
    | `"max newton iterations"` | R | integer | |
    | `"max linear iterations"` | O | integer | 100 |
    | `"poor factor"` | R | number | |
    | `"ghost factor"`, `"ghost factor mass"` | R | numbers | |

    [Full reference: Contact →](contact.md) · [Solver →](solver.md)

=== "Output"

    | Key | Status | Values | Default |
    |-----|:------:|--------|---------|
    | `"vtk"`, `"csv"` | R | `"on"` \| `"off"` | |
    | `"vtk directory"`, `"vtk percent"` | C | when `"vtk": "on"` | |
    | `"csv directory"`, `"csv percent"` | C | when `"csv": "on"` | |
    | `"vtk material point fields"`, `"vtk rigid body fields"` | O | list of field names | every field |
    | `"csv material point fields"`, `"csv rigid body fields"` | O | list of field names | every field |

    [Full reference: Output →](output.md)

**Conventions:** SI units · angles in degrees · tension positive · vectors `[x, y, z]`, $z$ vertical · positions global · switches `"on"` / `"off"` (`"remove"`: `"yes"` / `"no"`) · systems and points numbered from 1.
