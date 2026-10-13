# The `input_data.json` format

MPM3S drives every analysis from a single [JSON](https://en.wikipedia.org/wiki/JSON) file, typically named `input_data.json`. The file is one JSON object with nine top-level keys, each documented on its own page.

For worked examples see the [tutorial problems](../../TutorialProblems/TutorialProblems.md); each has a [complete input file](#complete-examples).

## The file at a glance

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

<div class="small-table" markdown>

| Key                  | Status   | Purpose                                                                   | Reference                                                       |
|----------------------|----------|---------------------------------------------------------------------------|-----------------------------------------------------------------|
| `"GPU"`              | Required | Run on a CUDA GPU or on the CPU.                                          | [Domain and material points](domain_and_material_points.md#gpu)            |
| `"domain update"`    | Optional | Whether the material-point domains stretch with the deformation.          | [Domain and material points](domain_and_material_points.md#domain-update)  |
| `"domain"`           | Required | Minimum size of the background grid, and gravity.                         | [Domain and material points](domain_and_material_points.md#domain)         |
| `"material points"`  | Required | Element size, material-point packing, footprint and soil layers.          | [Domain and material points](domain_and_material_points.md#material-points)|
| `"rigid bodies"`     | Required | Rigid-body systems: points, constraints, STL geometry. May be empty `[]`. | [Rigid bodies](rigid_bodies.md)                                            |
| `"contact"`          | Required | Friction between the soil and the rigid bodies. Needed even with no bodies.| [Contact properties](contact.md)                                          |
| `"analysis"`         | Required | The stages, run in order. At least one.                                   | [Analysis stages](analysis.md)                                             |
| `"solver"`           | Required | Newton-Raphson controls and ghost stabilisation.                          | [Solver](solver.md)                                                        |
| `"output"`           | Required | VTK and CSV output.                                                       | [Output](output.md)                                                        |

</div>

The order of the keys in the file does not matter.

## Running an analysis

From Julia, with the MPM3S project active:

```julia
using MPM3S
MPM3S.non_linear_solve("input_data.json")
```

The file can have any name; `MPM3S.non_linear_solve()` with no argument reads `input_data.json`. See [Install and run](../../GettingStarted/install_and_run.md) for the full command on each platform.

`non_linear_solve` takes one optional keyword argument. It is not part of the input file:

<div class="small-table" markdown>

| Argument      | Default | Description                                                                                                               |
|---------------|---------|---------------------------------------------------------------------------------------------------------------------------|
| `line_search` | `true`  | Armijo line search on each Newton-Raphson update. `MPM3S.non_linear_solve("input_data.json"; line_search = false)` takes the full update every iteration. |

</div>

## How to read these pages

Every key is given one of four statuses:

<div class="small-table" markdown>

| Status          | Meaning                                                                                                                                                                  |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Required**    | Must be present. If it is missing the analysis stops before it starts, with a message naming the key and where it was expected, e.g. `missing key "tolerance" (path: solver → tolerance)`. |
| **Optional**    | Can be left out, in which case the default shown is used.                                                                                                                |
| **Conditional** | Required only in the situation stated - for example `"yield stress"` for a `"von mises"` material - and ignored otherwise.                                              |
| **Ignored**     | Never read. It can be left out, or kept as a label.                                                                                                                      |

</div>

!!! warning "Misspelt keys"
    Keys that are not in this reference are ignored without any warning. A misspelt **required** key stops the analysis, but a misspelt **optional** key is silently treated as absent and its default is used - for example `"adaptivty"` gives a stage with no mesh refinement. Check the spelling of optional keys carefully.

JSON allows no comments and no trailing commas. Because unknown keys are ignored, a note can be kept in the file as an extra key, e.g. `"comment": "Dr = 38 %"`.

## Conventions

- **SI units** throughout: metres, seconds, kilograms, pascals.
- **Stress is tension positive.**
- **Angles are in degrees.**
- **Vectors are `[x, y, z]`**, with $z$ vertical; plan quantities are `[x, y]`. Gravity normally points in $-z$.
- **All positions are global coordinates** - rigid-body points, constraint anchors, tracked nodes and the STL geometry itself are all given in the same world frame.
- Switches take `"on"` / `"off"`, except the boundary track's `"remove"`, which takes `"yes"` / `"no"`.
- Rigid-body systems, and the points within a system, are numbered from **1** in the order they appear in the file.

## Every key in one list

??? plain "The complete key list, with statuses and defaults"

    ```text
    {
      "GPU"                                          required      "on" | "off"
      "domain update"                                optional      "none" | "stretch"           default "none"
      "domain": {                                    required
          "size"                                     required      number (m)
          "gravity"                                  required      [x, y, z] (m/s²)
      }
      "material points": {                           required
          "extra capacity"                           required      number ≥ 1
          "element size"                             required      number (m)
          "number of material points per element 1"  required      integer ≥ 1
          "material size": {                         required
              "max"                                  required      [x, y] (m)
              "min"                                  ignored
          }
          "layers": [ {                              required      one entry per layer, top to bottom
              "thickness"                            required      number (m)
              "material": {                          required
                  "type"                             required      "elastic" | "von mises" | "willam warnke"
                  "E", "nu", "density"               required
                  "yield stress"                     conditional   "von mises" only
                  "friction angle"                   conditional   "willam warnke" only
                  "dilation angle"                   conditional   "willam warnke" only
                  "cohesion"                         conditional   "willam warnke" only
                  "E overburden": {                  optional      default: E is constant
                      "reference stress"             required
                      "exponent"                     required
                  }
              }
          } ]
      }
      "rigid bodies": [ {                            required      may be an empty list []
          "points": [ {                              required
              "position"                             required      [x, y, z] (m)
              "mass"                                 required      number (kg)
              "rotational inertia"                   required      [Ixx, Iyy, Izz] (kg·m²)
              "boundary conditions"                  required      6 × ("free" | "fixed" | {"prescribed": q})
          } ]
          "constraints": [ {                         optional      default: none
              "type"                                 required      "coincidence" | "rotation lock" |
                                                                   "distance lock" | "distance stop"
              "points"                               required      [a, b]
              "stiffness"                            required      number
              "position 1", "position 2"             conditional   all types except "rotation lock"
              "rotation centre"                      conditional   "rotation lock", "distance stop"
              "direction 1", "direction 2"           conditional   "rotation lock"
              "rotational stiffness"                 conditional   "rotation lock"
              "distance"                             conditional   "distance lock"
              "angle limit"                          conditional   "distance stop"
          } ]
          "stl files": [ {                           optional      default: none
              "stl", "mesh cache", "point"           required
              "name"                                 ignored
          } ]
          "tracked nodes": [ {                       optional      default: none
              "position", "point"                    required
          } ]
          "offset"                                   optional      [x, y, z] (m)                default [0, 0, 0]
      } ]
      "contact": {                                   required
          "friction coefficient"                     required      number ≥ 0
      }
      "analysis": [ {                                required      one entry per stage, run in order
          "type"                                     required      "static" | "dynamic"
          "rigid bodies"                             required      "on" | "off"
          "load steps"                               conditional   static only
          "load"                                     conditional   static only: "gravity ramp" | "full"
          "dt", "final time", "beta", "gamma"        conditional   dynamic only
          "boundary conditions": {                   optional      default: every face free
              "min", "max"                           required      [x, y, z] of "free" | "roller" | "fixed"
          }
          "adaptivity": {                            optional      default: "type": "none"
              "type"                                 required      "none" | "uniform" | "rigid body surface"
              "element size"                         conditional   "rigid body surface" only
              "region"                               optional      "rigid body surface" only, together with
              "element size in region"               optional      "element size in region"; default: no region
          }
          "rigid body surface placement"             optional      "on" | "off"                 default "off"  (1)
          "rigid body boundary conditions": [ {      optional      default: the points' own conditions  (1)
              "system", "point", "boundary conditions"   required
          } ]
          "boundary track": {                        optional      default: no track  (1)
              "min", "max": {                        required
                  "type", "distance", "advance", "remove"   required   each [x, y, z]
              }
          }
      } ]
      "solver": {                                    required
          "tolerance"                                required      number
          "max newton iterations"                    required      integer
          "max linear iterations"                    optional      integer                      default 100
          "poor factor"                              required      number
          "ghost factor"                             required      number
          "ghost factor mass"                        required      number
      }
      "output": {                                    required
          "vtk", "csv"                               required      "on" | "off"
          "vtk directory", "vtk percent"             conditional   when "vtk": "on"
          "csv directory", "csv percent"             conditional   when "csv": "on"
          "vtk material point fields"                optional      list of names                default: every field
          "vtk rigid body fields"                    optional      list of names                default: every field
          "csv material point fields"                optional      list of names                default: every field
          "csv rigid body fields"                    optional      list of names                default: every field
      }
    }

    (1) ignored in a stage with "rigid bodies": "off"
    ```

## Complete examples

Each tutorial has a complete, working input file:

<div class="small-table" markdown>

| Tutorial                                                                  | Input file                                                      | Features used                                                                                               |
|---------------------------------------------------------------------------|-----------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| [1 - Self-weight column](../../TutorialProblems/Tutorial_1.md)            | [input file](../../TutorialProblems/Tutorial_1_input_data.md)   | Static stage, gravity ramp, `"domain update"`, CSV and VTK output.                                          |
| [2 - Compaction via a rigid body](../../TutorialProblems/Tutorial_2.md)   | [input file](../../TutorialProblems/Tutorial_2_input_data.md)   | Rigid body from an STL, prescribed displacement, surface placement.                                         |
| [3 - Vertical penetration (CPT)](../../TutorialProblems/Tutorial_3.md)    | [input file](../../TutorialProblems/Tutorial_3_input_data.md)   | Two stages, Willam-Warnke sand with `"E overburden"`, stage point boundary conditions, adaptivity, friction.|
| [5 - Rolling sphere](../../TutorialProblems/Tutorial_5.md)                | [input file](../../TutorialProblems/Tutorial_5_input_data.md)   | Dynamic stage, tilted gravity, a free rigid body, boundary track.                                           |
| [6 - Drag anchor](../../TutorialProblems/Tutorial_6.md)                   | [input file](../../TutorialProblems/Tutorial_6_input_data.md)   | Three points joined by a hinge, an angle stop and a pull line; three stages; boundary track.                |

</div>
