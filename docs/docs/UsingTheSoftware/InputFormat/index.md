# The `input_data.json` format

Every MPM3S analysis is set up by one JSON file with nine top-level sections. Each tile below links to the reference page for a section, and the [quick reference](#quick-reference) underneath lists every key. To run a file, see [install and run](../../GettingStarted/install_and_run.md).

## The sections

<div class="grid cards" markdown>

-   :material-chip:{ .lg .middle } __GPU__

    ---

    `"GPU"` runs the analysis on an NVIDIA GPU or the CPU.

    [:octicons-arrow-right-24: GPU](gpu.md)

-   :material-earth:{ .lg .middle } __Domain__

    ---

    `"gravity"`. The background mesh itself is sized automatically from the soil.

    [:octicons-arrow-right-24: Domain](domain.md)

-   :material-dots-grid:{ .lg .middle } __Material points__

    ---

    The soil block: element size, material points per element, footprint, and the layers and their materials; and `"domain update"`, which lets the material points' domains stretch.

    [:octicons-arrow-right-24: Material points](material_points.md)

-   :material-anchor:{ .lg .middle } __Rigid bodies__

    ---

    Structures that touch the soil: points, the constraints joining them, STL surfaces and tracked nodes. `[]` for none.

    [:octicons-arrow-right-24: Rigid bodies](rigid_bodies.md)

-   :material-gesture-swipe:{ .lg .middle } __Contact__

    ---

    The friction coefficient between the soil and the rigid bodies. Needed even with no bodies.

    [:octicons-arrow-right-24: Contact properties](contact.md)

-   :material-timeline-clock:{ .lg .middle } __Analysis__

    ---

    The stages, run in order: static or dynamic, loading, boundary conditions, mesh refinement and the boundary track.

    [:octicons-arrow-right-24: Analysis stages](analysis.md)

-   :material-calculator-variant:{ .lg .middle } __Solver__

    ---

    Newton-Raphson tolerance and iterations, and the ghost stabilisation of poorly filled elements.

    [:octicons-arrow-right-24: Solver](solver.md)

-   :material-file-chart:{ .lg .middle } __Output__

    ---

    VTK files for ParaView and CSV files for your own scripts: where, how often and which fields.

    [:octicons-arrow-right-24: Output](output.md)

-   :material-school:{ .lg .middle } __Complete examples__

    ---

    Every tutorial comes with a complete, working input file. Start from the one closest to your problem.

    [:octicons-arrow-right-24: Tutorial problems](../../TutorialProblems/TutorialProblems.md)

</div>

## Quick reference

Every key of the input file, by section. **R** required · **O** optional (the default is used) · **C** conditional (required only as stated) · **–** ignored; see [how to read these pages](#how-to-read-these-pages). Each tab links to the full reference for its keys.

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

## How to read these pages

Every key on the reference pages is given one of four statuses:

- **Required** - must be present; a missing one stops the analysis before it starts, naming the key, e.g. `missing key "tolerance" (path: solver → tolerance)`.
- **Optional** - can be left out, and the default is used.
- **Conditional** - required only in the situation stated, e.g. `"yield stress"` for a `"von mises"` material.
- **Ignored** - never read; can be kept as a label.

## Details

??? note "Conventions"

    - **SI units**: metres, seconds, kilograms, pascals. **Angles in degrees.**
    - **Stress is tension positive.**
    - **Vectors are `[x, y, z]`**, with $z$ vertical; plan quantities are `[x, y]`.
    - **Positions are global**: points, anchors, tracked nodes and STL geometry share one frame.
    - Switches take `"on"` / `"off"`, except the boundary track's `"remove"` (`"yes"` / `"no"`).
    - Rigid-body systems, and the points in each, are numbered from **1** in file order.

??? note "The `line_search` keyword"

    `MPM3S.non_linear_solve("input_data.json"; line_search = false)` takes the full Newton-Raphson update every iteration, instead of the default Armijo line search. It is a keyword of the function, not a key of the file.
