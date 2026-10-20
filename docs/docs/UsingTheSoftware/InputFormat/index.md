# The `input_data.json` format

Every MPM3S analysis is set up by one JSON file. It has nine top-level sections, and each has its own reference page.

```json
{
    "GPU": "off",
    "domain update": "stretch",
    "domain": { ... },
    "material points": { ... },
    "rigid bodies": [ ... ],
    "contact": { ... },
    "analysis": [ ... ],
    "solver": { ... },
    "output": { ... }
}
```

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

## Running a file

```julia
using MPM3S
MPM3S.non_linear_solve("input_data.json")
```

See [install and run](../../GettingStarted/install_and_run.md) for the full commands.

## How to read these pages

Every key on the reference pages is given one of four statuses:

- **Required** - must be present; a missing one stops the analysis before it starts, naming the key, e.g. `missing key "tolerance" (path: solver → tolerance)`.
- **Optional** - can be left out, and the default is used.
- **Conditional** - required only in the situation stated, e.g. `"yield stress"` for a `"von mises"` material.
- **Ignored** - never read; can be kept as a label.

## Other ways in

<div class="grid cards" markdown>

-   :material-format-list-numbered:{ .lg .middle } __Writing an input file__

    ---

    Build a file in nine steps, from the machine to the output.

    [:octicons-arrow-right-24: Writing an input file](../writing_an_input_file.md)

-   :material-table-search:{ .lg .middle } __Quick reference__

    ---

    Every key on one page, with its status, values and default.

    [:octicons-arrow-right-24: Quick reference](quick_reference.md)

-   :material-lightbulb-on-outline:{ .lg .middle } __Common tasks__

    ---

    "I want to..." - the keys, reference and tutorial for each common goal.

    [:octicons-arrow-right-24: Common tasks](../common_tasks.md)

</div>

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
