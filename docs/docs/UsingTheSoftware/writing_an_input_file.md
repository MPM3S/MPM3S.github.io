# Writing an input file

Every MPM3S analysis is set up by one JSON file. This page builds one in nine steps, from the machine to the output. Each step shows the part of the file it adds and links to the full reference for those keys.

!!! tip "Start from a tutorial file"
    Each [tutorial](../TutorialProblems/TutorialProblems.md) has a complete, working input file. Copying the one closest to your problem and changing it is usually quicker than starting from nothing.

## 1. Choose where it runs

- `"GPU": "on"` runs on an NVIDIA GPU; `"off"` runs on the CPU, with as many threads as Julia was started with.
- For a compression problem, add `"domain update": "stretch"` so the material-point domains can shrink with the soil.

```json
"GPU": "off",
"domain update": "stretch",
```

[Reference: GPU →](InputFormat/gpu.md) · [Domain update →](InputFormat/material_points.md#domain-update)

## 2. Set gravity

- Gravity is the only key in `"domain"`; the background mesh is sized automatically to hold the soil.
- It does not have to point straight down - [Tutorial 5](../TutorialProblems/Tutorial_5.md) tilts it to model a slope.

```json
"domain": {
    "gravity": [0.0, 0.0, -9.81]
},
```

[Reference: Domain →](InputFormat/domain.md)

## 3. Describe the soil

- The base `"element size"`, and the material points per element along each axis.
- The footprint, `"material size"` `"max"`, from the origin.
- The layers from the top down, each with a thickness and a material: `"elastic"`, `"von mises"` or `"willam warnke"`.

```json
"material points": {
    "extra capacity": 1.2,
    "element size": 0.05,
    "number of material points per element 1": 2,
    "material size": { "min": [0.0, 0.0], "max": [0.05, 0.05] },
    "layers": [
        { "thickness": 0.8,
          "material": { "type": "elastic", "E": 283.0, "nu": 0.0, "density": 50.0 } }
    ]
},
```

MPM3S rounds the element sizes and the block's dimensions to fit its octree mesh - see [how element sizes set the mesh](InputFormat/material_points.md#how-element-sizes-set-the-mesh).

[Reference: Material points →](InputFormat/material_points.md)

## 4. Add the rigid bodies

- `[]` if there are none.
- Otherwise each system is built from **points** (6 degrees of freedom, with a mass and inertia), STL **surfaces** welded to them, and **constraints** joining the points.

```json
"rigid bodies": [],
```

[Reference: Rigid bodies →](InputFormat/rigid_bodies.md) · [Example: Tutorial 2's rigid cube](../TutorialProblems/Tutorial_2.md)

## 5. Set the friction

- The Coulomb friction coefficient between the soil and the rigid bodies. Required even with no bodies.

```json
"contact": {
    "friction coefficient": 0.0
},
```

[Reference: Contact properties →](InputFormat/contact.md)

## 6. Define the stages

- A list of stages, run in order. Most analyses start with a static stage that ramps gravity up to set the initial stresses.
- Each stage sets its own boundary conditions, and can switch the rigid bodies on, refine the mesh around them, move them, and track them with a moving window of soil.

```json
"analysis": [
    {
        "type": "static",
        "load steps": 50,
        "load": "gravity ramp",
        "rigid bodies": "off",
        "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "free"] }
    }
],
```

[Reference: Analysis stages →](InputFormat/analysis.md)

## 7. Set the solver

- The Newton-Raphson tolerance and iteration limit, and the ghost stabilisation of poorly filled elements.
- These values suit most problems; the tutorials use them throughout.

```json
"solver": {
    "tolerance": 1.0e-6,
    "max newton iterations": 20,
    "poor factor": 0.25,
    "ghost factor": 0.025,
    "ghost factor mass": 0.25
},
```

[Reference: Solver →](InputFormat/solver.md)

## 8. Choose the output

- VTK files for ParaView and CSV files for your own scripts, each with a folder, how often to write (`percent` of each stage's steps; `0` for every step) and which fields.

```json
"output": {
    "vtk": "on",
    "vtk directory": "vtk_column",
    "vtk percent": 0,

    "csv": "on",
    "csv directory": "csv_column",
    "csv percent": 0
}
```

[Reference: Output →](InputFormat/output.md)

## 9. Run it

```julia
using MPM3S
MPM3S.non_linear_solve("input_data.json")
```

- Wrap the nine parts in `{ }`; their order does not matter.
- If a required key is missing, the run stops before it starts and names it, e.g. `missing key "tolerance" (path: solver → tolerance)`.
- See [install and run](../GettingStarted/install_and_run.md) for the full commands.

??? note "Conventions"

    SI units; angles in degrees; tension positive; vectors `[x, y, z]` with $z$ vertical; all positions in one global frame; switches `"on"` / `"off"` (the boundary track's `"remove"` takes `"yes"` / `"no"`); systems and points numbered from 1.
