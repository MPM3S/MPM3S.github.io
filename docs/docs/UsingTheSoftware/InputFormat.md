# The `input_data.json` format

S3-MPM drives every analysis from a single [JSON](https://en.wikipedia.org/wiki/JSON) file, typically named `input_data.json`. The file is one JSON object whose top-level keys describe the machine, the [domain](#domain), the soil as [material points](#material-points), the [rigid bodies](#rigid-bodies) and their [contact](#contact), the sequence of [analysis](#analysis) stages, the [solver](#solver) controls and the [output](#output).

This page lists **every option the solver reads**, whether it is required, and the default used when an optional one is left out. For worked examples see the [tutorial problems](../TutorialProblems/TutorialProblems.md); each one has a [complete input file](#complete-examples).

## Running an analysis

From Julia, with the S3-MPM project active:

```julia
using S3MPM
S3MPM.non_linear_solve("input_data.json")
```

`non_linear_solve` takes one optional keyword argument. It is not part of the input file:

<div class="small-table" markdown>

| Argument      | Default | Description                                                                                                               |
|---------------|---------|---------------------------------------------------------------------------------------------------------------------------|
| `line_search` | `true`  | Armijo line search on each Newton-Raphson update. `S3MPM.non_linear_solve("input_data.json"; line_search = false)` takes the full update every iteration. |

</div>

## How to read this page

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
    Keys that are not on this page are ignored without any warning. A misspelt **required** key stops the analysis, but a misspelt **optional** key is silently treated as absent and its default is used - for example `"adaptivty"` gives a stage with no mesh refinement. Check the spelling of optional keys carefully.

JSON allows no comments and no trailing commas. Because unknown keys are ignored, a note can be kept in the file as an extra key, e.g. `"comment": "Dr = 38 %"`.

## Conventions

- **SI units** throughout: metres, seconds, kilograms, pascals.
- **Stress is tension positive.**
- **Angles are in degrees.**
- **Vectors are `[x, y, z]`**, with $z$ vertical; plan quantities are `[x, y]`. Gravity normally points in $-z$.
- **All positions are global coordinates** - rigid-body points, constraint anchors, tracked nodes and the STL geometry itself are all given in the same world frame.
- Switches take `"on"` / `"off"`, except the boundary track's `"remove"`, which takes `"yes"` / `"no"`.
- Rigid-body systems, and the points within a system, are numbered from **1** in the order they appear in the file.

## Quick reference

Every key in the file, with its status and, for optional keys, the default. The sections below describe each one.

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

## Top level

<div class="small-table" markdown>

| Key                  | Status   | Type             | Default  | Purpose                                                                    |
|----------------------|----------|------------------|----------|----------------------------------------------------------------------------|
| `"GPU"`              | Required | string           | -        | Run on a CUDA GPU or on the CPU.                                           |
| `"domain update"`    | Optional | string           | `"none"` | Whether the material-point domains stretch with the deformation.           |
| `"domain"`           | Required | object           | -        | Minimum size of the background grid, and gravity.                          |
| `"material points"`  | Required | object           | -        | Element size, material-point packing, footprint and soil layers.           |
| `"rigid bodies"`     | Required | array of objects | -        | Rigid-body systems: points, constraints, STL geometry. May be empty `[]`.  |
| `"contact"`          | Required | object           | -        | Friction between the soil and the rigid bodies. Needed even with no bodies.|
| `"analysis"`         | Required | array of objects | -        | The stages, run in order. At least one.                                    |
| `"solver"`           | Required | object           | -        | Newton-Raphson controls and ghost stabilisation.                           |
| `"output"`           | Required | object           | -        | VTK and CSV output.                                                        |

</div>

The order of the keys in the file does not matter.

## GPU

```json
"GPU": "on"
```

<div class="small-table" markdown>

| Key     | Status   | Options          | Default | Description                                                                                                                 |
|---------|----------|------------------|---------|-----------------------------------------------------------------------------------------------------------------------------|
| `"GPU"` | Required | `"on"`, `"off"`  | -       | `"on"` runs on an NVIDIA GPU through CUDA. `"off"` runs on the CPU, using as many threads as Julia was started with (`julia -t auto` uses every core). |

</div>

## Domain update

```json
"domain update": "stretch"
```

<div class="small-table" markdown>

| Key               | Status   | Options                | Default  | Description                                                                                                                                                                                                     |
|-------------------|----------|------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"domain update"` | Optional | `"none"`, `"stretch"`  | `"none"` | `"none"`: every material point's GIMP domain keeps its initial size. `"stretch"`: each half-width is scaled by the stretch $F_{ii}$ along its own axis, up to 1.99 times its initial size. Do not use `"stretch"` with one material point per element per axis. |

</div>

## Domain

```json
"domain": {
    "size": 10.0,
    "gravity": [0.0, 0.0, -9.81]
}
```

<div class="small-table" markdown>

| Key         | Status   | Type                     | Default | Description                                                                                                                                                                       |
|-------------|----------|--------------------------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"size"`    | Required | number (m)               | -       | Lower bound on the side of the cubic background grid. The grid is always enlarged to hold the soil (see [element sizes](#how-element-sizes-set-the-mesh)), so this only matters when a body needs more room to travel. |
| `"gravity"` | Required | [x, y, z] (m/s$^2$)      | -       | Gravitational acceleration, applied to the soil and to the rigid-body points. It must not be zero: convergence is measured relative to the weight of the soil (see `"tolerance"`), so an analysis without gravity cannot converge.                                                             |

</div>

## Material points

Describes the soil block: the background element size, how many material points are placed in each element, the plan footprint and the layers from the surface downwards.

```json
"material points": {
    "extra capacity": 1.2,
    "element size": 2.0,
    "number of material points per element 1": 2,
    "material size": { "min": [0.0, 0.0], "max": [10.0, 10.0] },
    "layers": [
        {
            "thickness": 20.0,
            "material": { "type": "elastic", "E": 2.0e7, "nu": 0.25, "density": 1800.0 }
        }
    ]
}
```

<div class="small-table" markdown>

| Key                                          | Status   | Type             | Default | Description                                                                                                               |
|----------------------------------------------|----------|------------------|---------|---------------------------------------------------------------------------------------------------------------------------|
| `"extra capacity"`                           | Required | number $\geq 1$  | -       | Storage reserved for material points, as a multiple of the initial number. Refinement splits material points, so leave headroom (1.2 = 20% extra). |
| `"element size"`                             | Required | number (m)       | -       | Size of the base background element, before [rounding](#how-element-sizes-set-the-mesh).                                  |
| `"number of material points per element 1"`  | Required | integer $\geq 1$ | -       | Material points per element **per axis**, so $n^3$ in each element. 2 is typical.                                         |
| `"material size"`                            | Required | object           | -       | Plan footprint of the soil block (below).                                                                                  |
| `"layers"`                                   | Required | array of objects | -       | The soil layers, listed **from the surface down**. The block rests on $z = 0$.                                             |

</div>

`"material size"`:

<div class="small-table" markdown>

| Key       | Status   | Type        | Default | Description                                                                                          |
|-----------|----------|-------------|---------|------------------------------------------------------------------------------------------------------|
| `"max"`   | Required | [x, y] (m)  | -       | Plan extent of the soil block. Rounded up to a whole number of base elements.                        |
| `"min"`   | Ignored  | [x, y]      | -       | The block always starts at $x = y = 0$. Writing `[0.0, 0.0]` keeps the file readable.                |

</div>

Each entry in `"layers"`:

<div class="small-table" markdown>

| Key            | Status   | Type           | Default | Description                                                                                                                          |
|----------------|----------|----------------|---------|--------------------------------------------------------------------------------------------------------------------------------------|
| `"thickness"`  | Required | number > 0 (m) | -       | Layer thickness. Interfaces sit exactly where requested. A layer thinner than the spacing between material points is rejected.      |
| `"material"`   | Required | object         | -       | The constitutive model and its properties (below).                                                                                  |

</div>

### Material models

`"type"` selects the model, and the model decides which other keys are needed:

- `"elastic"` - isotropic Hencky (logarithmic-strain) elasticity.
- `"von mises"` - elastic-perfectly plastic with a von Mises yield surface.
- `"willam warnke"` - frictional elasto-plasticity for sands: a Willam-Warnke yield surface set by the friction angle and cohesion, with a Drucker-Prager-type plastic potential set by the dilation angle (so the flow is non-associated even when $\psi = \phi$).

=== "elastic"

    ```json
    "material": { "type": "elastic", "E": 2.0e7, "nu": 0.25, "density": 1800.0 }
    ```

=== "von mises"

    ```json
    "material": { "type": "von mises", "E": 2.0e7, "nu": 0.3, "yield stress": 5.0e4, "density": 1800.0 }
    ```

=== "willam warnke"

    ```json
    "material": { "type": "willam warnke",
                  "E": 2.28e7, "nu": 0.25,
                  "friction angle": 32.75, "dilation angle": 2.75, "cohesion": 300.0,
                  "density": 1652.0 }
    ```

<div class="small-table" markdown>

| Key                  | `"elastic"` | `"von mises"` | `"willam warnke"` | Type               | Description                                                           |
|----------------------|-------------|---------------|-------------------|--------------------|-----------------------------------------------------------------------|
| `"type"`             | Required    | Required      | Required          | string             | The model name. Any other value stops the analysis.                   |
| `"E"`                | Required    | Required      | Required          | number (Pa)        | Young's modulus; the reference value when `"E overburden"` is given.  |
| `"nu"`               | Required    | Required      | Required          | number             | Poisson's ratio.                                                      |
| `"density"`          | Required    | Required      | Required          | number (kg/m$^3$)  | Density. Use the buoyant density for submerged soil.                  |
| `"yield stress"`     | Ignored     | Required      | Ignored           | number (Pa)        | Yield stress.                                                         |
| `"friction angle"`   | Ignored     | Ignored       | Required          | number (°)         | Friction angle $\phi$.                                                |
| `"dilation angle"`   | Ignored     | Ignored       | Required          | number (°)         | Dilation angle $\psi$.                                                |
| `"cohesion"`         | Ignored     | Ignored       | Required          | number (Pa)        | Cohesion $c$.                                                         |
| `"E overburden"`     | Optional    | Optional      | Optional          | object             | Stiffness that increases with depth (below). Default: $E$ is constant. |

</div>

See [Isotropic linear elasticity](../TechnicalReferences/LinearElasticity.md) and [Isotropic elasto-plasticity](../TechnicalReferences/ElastoPlasticity.md) for the theory behind each model.

#### Stress-dependent stiffness

With an `"E overburden"` block the Young's modulus of each material point depends on the vertical stress from the weight of the soil above its initial position,

$$
E = E_\text{ref} \left( \frac{\sigma_v}{\sigma_\text{ref}} \right)^m, \qquad \sigma_v = |g| \int \rho \, \text{d}z,
$$

measured from the top of the block down through every layer above. The modulus is set from the initial position once, so it does not change as the soil deforms.

```json
"E overburden": { "reference stress": 1.0e5, "exponent": 0.5 }
```

<div class="small-table" markdown>

| Key                   | Status                            | Type        | Default | Description                                                  |
|-----------------------|-----------------------------------|-------------|---------|--------------------------------------------------------------|
| `"reference stress"`  | Required (when the block is used) | number (Pa) | -       | $\sigma_\text{ref}$, the vertical stress at which $E = E_\text{ref}$. |
| `"exponent"`          | Required (when the block is used) | number      | -       | $m$.                                                         |

</div>

### How element sizes set the mesh

The background grid is an octree, so all element sizes must be power-of-two multiples of one another:

- The **smallest** element size requested anywhere in the file - the base `"element size"` or any stage's `"element size"` or `"element size in region"` - is used exactly.
- Every other size is rounded **down** to the nearest $h_\text{min} \cdot 2^n$. For example, a base size of 4.0 m with a refinement size of 0.1 m gives a base element of $0.1 \times 2^5 = 3.2$ m.
- The footprint `"max"` is rounded **up** to whole base elements, and the top of the block is rounded up to a whole row of material points.

The grid is a cube large enough to hold the footprint in $x$ and $y$ and **twice the total layer thickness in $z$** (also rounded up to whole base elements). The soil fills the bottom half; the top half is empty space for the surface to move into and for rigid bodies to start in. `"domain"` `"size"` can only make the cube larger.

## Rigid bodies

A list of rigid-body **systems**. Use `"rigid bodies": []` for an analysis without bodies.

Each system is built from **points**: 6-degree-of-freedom frames (3 displacements, 3 rotations) that carry mass and inertia. STL surfaces are welded to a point, several points can be joined by **constraints**, and a point without any geometry acts as a handle - for example the end of a towing line.

```json
"rigid bodies": [
    {
        "offset": [1.0, 0.0, 0.0],
        "points": [
            { "position": [0.6121, 0.0, -0.044805], "mass": 3291.6, "rotational inertia": [275.0, 275.0, 275.0],
              "boundary conditions": ["free", "fixed", "free", "fixed", "free", "fixed"] },
            { "position": [12.51226633, 0.0, -0.5703035], "mass": 1.0, "rotational inertia": [1.0e-6, 1.0e-6, 1.0e-6],
              "boundary conditions": ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }
        ],
        "constraints": [
            { "type": "distance lock", "points": [1, 2],
              "position 1": [0.0, 0.0, 0.0], "position 2": [12.51226633, 0.0, -0.5703035],
              "distance": 9.5, "stiffness": 1.0526e9 }
        ],
        "stl files": [
            { "name": "fluke", "stl": "AC14_fluke_rot20.stl", "mesh cache": "AC14_fluke_rot20_mesh.txt", "point": 1 }
        ],
        "tracked nodes": [
            { "position": [1.994, 0.6489, -0.5478], "point": 1 }
        ]
    }
]
```

Each system:

<div class="small-table" markdown>

| Key                | Status   | Type             | Default     | Description                                                                                                                                  |
|--------------------|----------|------------------|-------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `"points"`         | Required | array of objects | -           | The points of this system.                                                                                                                  |
| `"constraints"`    | Optional | array of objects | none        | Connections between pairs of points in this system.                                                                                          |
| `"stl files"`      | Optional | array of objects | none        | Surface geometry welded to points. Only surfaces take part in contact, so a system without STL files does not touch the soil.                |
| `"tracked nodes"`  | Optional | array of objects | none        | Marker positions that move with a point and are written to the output, e.g. to follow a fluke tip.                                            |
| `"offset"`         | Optional | [x, y, z] (m)    | `[0, 0, 0]` | Translates the whole system - points, anchors, STL surfaces and tracked nodes - after it is assembled, so it can be repositioned without editing its coordinates or STL files. |

</div>

### Points

<div class="small-table" markdown>

| Key                      | Status   | Type                     | Default | Description                                                                                                       |
|--------------------------|----------|--------------------------|---------|-------------------------------------------------------------------------------------------------------------------|
| `"position"`             | Required | [x, y, z] (m)            | -       | Position of the point, normally the centre of mass of the body welded to it.                                      |
| `"mass"`                 | Required | number (kg)              | -       | Mass.                                                                                                             |
| `"rotational inertia"`   | Required | [Ixx, Iyy, Izz] (kg·m$^2$) | -     | Moments of inertia about the $x$, $y$ and $z$ axes through the point; products of inertia are taken as zero.       |
| `"boundary conditions"`  | Required | array of 6 entries       | -       | One entry per degree of freedom $[u_x, u_y, u_z, \theta_x, \theta_y, \theta_z]$ (below).                          |

</div>

Each boundary-condition entry is one of:

<div class="small-table" markdown>

| Entry                   | Meaning                                                                                                                                                                                                    |
|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"free"`                | The degree of freedom is solved for. Any other string - including a typo such as `"fix"` - is also treated as `"free"`.                                                                                  |
| `"fixed"`               | Held: zero increment every step.                                                                                                                                                                           |
| `{"prescribed": q}`     | Moved by `q` (m, or radians for rotations) every step: every load step in a static stage, every `"dt"` in a dynamic stage. When the solver cuts a step, the increment is cut with it, so the prescribed path is unchanged. |

</div>

These are the conditions for every stage, unless a stage replaces them with its own [`"rigid body boundary conditions"`](#rigid-body-boundary-conditions) - for example to hold a body still while the soil settles and then pull it.

A point with no STL surface, such as a pull point, has nothing to resist its motion except its own mass and inertia, so either prescribe or fix its degrees of freedom, or give it mass.

### Constraints

Constraints join two points of the same system with penalty springs. Positions are global anchor points and directions are global vectors, both at the start of the analysis; each anchor then moves with its own point.

<div class="small-table" markdown>

| Key                       | `"coincidence"` | `"rotation lock"` | `"distance lock"` | `"distance stop"` | Type          | Description                                                                         |
|---------------------------|-----------------|-------------------|-------------------|-------------------|---------------|-------------------------------------------------------------------------------------|
| `"type"`                  | Required        | Required          | Required          | Required          | string        | Any value other than the four names is treated as `"coincidence"`.                  |
| `"points"`                | Required        | Required          | Required          | Required          | [a, b]        | The two points joined, numbered within this system.                                 |
| `"stiffness"`             | Required        | Required          | Required          | Required          | number (N/m)  | Penalty stiffness. For a rotation lock, the stiffness of the pin.                   |
| `"position 1"`            | Required        | Ignored           | Required          | Required          | [x, y, z] (m) | Anchor carried by point `a`.                                                         |
| `"position 2"`            | Required        | Ignored           | Required          | Required          | [x, y, z] (m) | Anchor carried by point `b`.                                                         |
| `"rotation centre"`       | Ignored         | Required          | Ignored           | Required          | [x, y, z] (m) | The hinge pin (rotation lock), or the centre the angle limit is measured about (distance stop). |
| `"direction 1"`           | Ignored         | Required          | Ignored           | Ignored           | [x, y, z]     | Hinge axis carried by point `a`.                                                     |
| `"direction 2"`           | Ignored         | Required          | Ignored           | Ignored           | [x, y, z]     | Hinge axis carried by point `b`, normally the same vector as `"direction 1"`.       |
| `"rotational stiffness"`  | Ignored         | Required          | Ignored           | Ignored           | number (N·m)  | Stiffness keeping the two axes aligned.                                              |
| `"distance"`              | Ignored         | Ignored           | Required          | Ignored           | number (m)    | Length of the rod.                                                                   |
| `"angle limit"`           | Ignored         | Ignored           | Ignored           | Required          | number (°)    | Opening angle at which the stop engages.                                             |

</div>

<div class="small-table" markdown>

| Type                 | Joint                | Behaviour                                                                                                                                                                                                     |
|----------------------|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"coincidence"`      | Ball joint           | The two anchors are held together. Removes 3 degrees of freedom.                                                                                                                                              |
| `"rotation lock"`    | Hinge                | The two points are pinned at the rotation centre and their axes are kept aligned, leaving rotation about the axis free. Removes 5.                                                                           |
| `"distance lock"`    | Rod                  | The two anchors are held the given distance apart. Removes 1.                                                                                                                                                  |
| `"distance stop"`    | Cable / angle stop   | One-sided: slack until the anchors are $s = \sqrt{l_1^2 + l_2^2 - 2 l_1 l_2 \cos\psi_\text{max}}$ apart, then resists further separation. $l_1$, $l_2$ are the anchors' distances from the rotation centre and $\psi_\text{max}$ the angle limit, so with a hinge it stops the hinge opening past the limit. |

</div>

A weld is a rotation lock plus a second rotation lock about a non-parallel axis.

### STL files

<div class="small-table" markdown>

| Key             | Status   | Type    | Default | Description                                                                                                                                                  |
|-----------------|----------|---------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"stl"`         | Required | string  | -       | STL file, relative to the folder containing the input file. It must be a closed surface. Its coordinates are global and are never scaled or recentred.      |
| `"mesh cache"`  | Required | string  | -       | File holding the tetrahedral mesh generated from the STL, relative to the input file. Written if it does not exist and reused if it does - **delete it whenever the STL changes**. |
| `"point"`       | Required | integer | -       | The point the surface is welded to. A point may carry several surfaces.                                                                                     |
| `"name"`        | Ignored  | string  | -       | A label for your own reference.                                                                                                                               |

</div>

### Tracked nodes

<div class="small-table" markdown>

| Key           | Status   | Type          | Default | Description                                                  |
|---------------|----------|---------------|---------|--------------------------------------------------------------|
| `"position"`  | Required | [x, y, z] (m) | -       | Global position of the marker at the start of the analysis.  |
| `"point"`     | Required | integer       | -       | The point it moves with.                                     |

</div>

Tracked nodes have no mass and no effect on the analysis. They are numbered in the output as `track1`, `track2`, ... and written to [`rigid_body.csv`](#output-files) and `tracked_*.vtu`.

## Contact

Frictional penalty contact between the material points and every rigid-body surface.

```json
"contact": {
    "friction coefficient": 0.33
}
```

<div class="small-table" markdown>

| Key                       | Status   | Type            | Default | Description                                                                               |
|---------------------------|----------|-----------------|---------|-------------------------------------------------------------------------------------------|
| `"friction coefficient"`  | Required | number $\geq 0$ | -       | Coulomb friction coefficient $\mu$, used for every contact. 0 gives frictionless contact. Required even when there are no rigid bodies. |

</div>

The normal and tangential penalty stiffnesses are calculated automatically from the Young's modulus and volume of the material points in contact, and cannot be set in the input file.

## Analysis

A list of **stages**, run in order. The material-point state, the rigid-body state and the output step count all carry from one stage to the next, so a typical analysis first settles the soil under gravity and then loads it with a body.

```json
"analysis": [
    {
        "type": "static",
        "load steps": 5,
        "load": "gravity ramp",
        "rigid bodies": "off",
        "adaptivity": { "type": "uniform" },
        "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
    },
    {
        "type": "dynamic",
        "dt": 5.0e-3,
        "final time": 1.0,
        "beta": 0.5625,
        "gamma": 1.0,
        "rigid bodies": "on",
        "rigid body surface placement": "on",
        "adaptivity": { "type": "rigid body surface", "element size": 0.05 },
        "boundary conditions": { "min": ["fixed", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
    }
]
```

<div class="small-table" markdown>

| Key                                 | `"static"` | `"dynamic"` | Type             | Default                     | Description                                                                                                                      |
|-------------------------------------|------------|-------------|------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `"type"`                            | Required   | Required    | string           | -                           | `"static"` or `"dynamic"`.                                                                                                      |
| `"rigid bodies"`                    | Required   | Required    | string           | -                           | `"on"` or `"off"`. With `"off"` the bodies are frozen: no contact, and the three body keys at the bottom of this table are ignored. |
| `"load steps"`                      | Required   | Ignored     | integer $\geq 1$ | -                           | Number of load steps.                                                                                                            |
| `"load"`                            | Required   | Ignored     | string           | -                           | `"gravity ramp"`: gravity increases linearly from zero over the stage. `"full"`: full gravity from the first step.              |
| `"dt"`                              | Ignored    | Required    | number (s)       | -                           | Time step.                                                                                                                       |
| `"final time"`                      | Ignored    | Required    | number (s)       | -                           | Duration of the stage.                                                                                                           |
| `"beta"`                            | Ignored    | Required    | number           | -                           | Newmark parameter $\beta$.                                                                                                       |
| `"gamma"`                           | Ignored    | Required    | number           | -                           | Newmark parameter $\gamma$.                                                                                                      |
| `"boundary conditions"`             | Optional   | Optional    | object           | every face `"free"`         | Conditions on the faces of the soil domain ([below](#boundary-conditions)).                                                     |
| `"adaptivity"`                      | Optional   | Optional    | object           | `"type": "none"`            | Mesh refinement for this stage ([below](#adaptivity)).                                                                          |
| `"rigid body surface placement"`    | Optional   | Optional    | string           | `"off"`                     | `"on"` moves every rigid body vertically, by the same amount, at the start of the stage so that the lowest surface point rests on the soil surface. |
| `"rigid body boundary conditions"`  | Optional   | Optional    | array of objects | the points' own conditions  | Replaces point boundary conditions for this stage ([below](#rigid-body-boundary-conditions)).                                   |
| `"boundary track"`                  | Optional   | Optional    | object           | no track                    | Domain boundaries that move with the rigid bodies ([below](#boundary-track)).                                                   |

</div>

A static stage advances a load fraction from 0 to 1 in `"load steps"` equal steps. A dynamic stage advances time from 0 to `"final time"` in steps of `"dt"`, with gravity applied in full throughout. $\gamma = 0.5$, $\beta = 0.25$ gives Newmark's method without numerical damping; $\gamma > 0.5$ adds damping, which can help with stiff contact and rotating bodies.

If a step does not converge within `"max newton iterations"`, it is retried with half the increment. After each successful step the increment doubles again, up to the requested size. There is no smallest increment: a step that can never converge is halved indefinitely, which shows as a fast-rising `cuts` count on the progress line - stop the run and check the input.

### Boundary conditions

Conditions on the six faces of the soil domain box, given as the three `"min"` faces ($x = 0$, $y = 0$, $z = 0$) and the three `"max"` faces, each as `[x, y, z]`.

```json
"boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "free"] }
```

<div class="small-table" markdown>

| Key       | Status                            | Type                | Default | Description                           |
|-----------|-----------------------------------|---------------------|---------|---------------------------------------|
| `"min"`   | Required (when the block is used) | [x, y, z] of string | -       | The faces at $x = 0$, $y = 0$, $z = 0$. |
| `"max"`   | Required (when the block is used) | [x, y, z] of string | -       | The opposite faces.                   |

</div>

<div class="small-table" markdown>

| Entry        | Meaning                                                  |
|--------------|----------------------------------------------------------|
| `"free"`     | No constraint.                                           |
| `"roller"`   | The displacement normal to the face is zero.            |
| `"fixed"`    | All three displacement components are zero.             |

</div>

Any other entry stops the analysis. Where faces meet, the conditions combine. The $x$ and $y$ faces sit at the edges of the (rounded) soil footprint. The max $z$ face sits at **twice** the soil thickness, in the empty space above the soil (see [element sizes](#how-element-sizes-set-the-mesh)), so it does not touch the soil and the soil surface is always free.

### Adaptivity

```json
"adaptivity": { "type": "rigid body surface", "element size": 0.1,
                "region": 0.5, "element size in region": 0.2 }
```

<div class="small-table" markdown>

| Key                           | Status                                                  | Type       | Default   | Description                                                                                                                                                           |
|-------------------------------|---------------------------------------------------------|------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"type"`                      | Required (when the block is used)                       | string     | -         | `"none"`: elements follow the material points at the base size, and empty space is meshed coarsely. `"uniform"`: the whole grid at the base size, with no coarse cells (expensive for large domains). `"rigid body surface"`: refine the elements the rigid-body surfaces pass through, at every step. |
| `"element size"`              | Conditional: `"rigid body surface"` only                | number (m) | -         | Element size at the body surfaces.                                                                                                                                    |
| `"region"`                    | Optional: `"rigid body surface"` only                   | number (m) | no region | Distance around the refined surface elements, in each direction, that is also refined to `"element size in region"`. Give both keys or neither.                    |
| `"element size in region"`    | Optional: `"rigid body surface"` only                   | number (m) | no region | Element size within the region.                                                                                                                                       |

</div>

In a stage with `"rigid bodies": "off"`, `"rigid body surface"` falls back to `"none"`. Material points split by refinement stay split.

### Rigid body boundary conditions

Replaces the six [point boundary conditions](#points) of chosen points for this stage only. Points that are not listed keep the conditions given in `"rigid bodies"`.

```json
"rigid body boundary conditions": [
    { "system": 1, "point": 1,
      "boundary conditions": ["fixed", "fixed", { "prescribed": -0.01 }, "fixed", "fixed", "fixed"] }
]
```

<div class="small-table" markdown>

| Key                      | Status   | Type               | Default | Description                                                                    |
|--------------------------|----------|--------------------|---------|--------------------------------------------------------------------------------|
| `"system"`               | Required | integer            | -       | Rigid-body system, counting from 1 in `"rigid bodies"`.                        |
| `"point"`                | Required | integer            | -       | Point within that system, counting from 1. A point that does not exist stops the analysis. |
| `"boundary conditions"`  | Required | array of 6 entries | -       | The six entries, in the same form as for [points](#points).                    |

</div>

### Boundary track

For bodies that travel a long way through the soil (e.g. a dragged anchor). Instead of solving the whole soil block, only a window around the rigid bodies is active. Soil ahead of the window waits, unsolved, until the window reaches it, and soil the window leaves behind can be deleted.

```json
"boundary track": {
    "min": { "type": ["fixed", "off", "off"], "distance": [1.0, 0.0, 0.0],
             "advance": ["positive", "positive", "positive"], "remove": ["yes", "no", "no"] },
    "max": { "type": ["fixed", "off", "off"], "distance": [13.44, 0.0, 0.0],
             "advance": ["positive", "positive", "positive"], "remove": ["no", "no", "no"] }
}
```

`"min"` sets the planes on the low side of the bodies and `"max"` those on the high side. Both are required when the block is used, and each needs all four keys below, each as `[x, y, z]` - including axes that are `"off"`.

<div class="small-table" markdown>

| Key            | Status   | Type              | Options                                  | Description                                                                                                                                                   |
|----------------|----------|-------------------|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"type"`       | Required | [x, y, z] of string | `"off"`, `"roller"`, `"fixed"`         | Condition on the moving plane. `"off"` leaves that axis untracked, with the stage's `"boundary conditions"`. Otherwise the plane carries this condition, and it replaces the stage's condition on that face. |
| `"distance"`   | Required | [x, y, z] (m)     | -                                        | Distance of the plane from the extent of the rigid bodies, rounded outward to whole base elements.                                                             |
| `"advance"`    | Required | [x, y, z] of string | `"positive"`, `"negative"`, `"both"`   | Directions the plane may move: only towards $+$, only towards $-$, or both ways.                                                                              |
| `"remove"`     | Required | [x, y, z] of string | `"yes"`, `"no"`                        | `"yes"` deletes material points the plane leaves behind; `"no"` keeps them for later. Only takes effect on a trailing plane: `"min"` with `"positive"` advance, or `"max"` with `"negative"`. |

</div>

## Solver

```json
"solver": {
    "tolerance": 1.0e-6,
    "max newton iterations": 20,
    "max linear iterations": 100,
    "poor factor": 0.25,
    "ghost factor": 0.025,
    "ghost factor mass": 0.25
}
```

<div class="small-table" markdown>

| Key                         | Status   | Type    | Default | Description                                                                                                                                    |
|-----------------------------|----------|---------|---------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `"tolerance"`               | Required | number  | -       | Convergence tolerance for the Newton-Raphson iterations in each step. The error is the norm of the out-of-balance force on the free degrees of freedom, relative to the norm of the gravity force on the soil (for free rigid-body degrees of freedom, relative to the bodies' weight).                                                                         |
| `"max newton iterations"`   | Required | integer | -       | Iterations allowed before a step is abandoned and retried with half the increment.                                                            |
| `"max linear iterations"`   | Optional | integer | 100     | Iteration limit of the iterative linear solver within each Newton-Raphson iteration. Raise it only if a problem genuinely needs it.            |
| `"poor factor"`             | Required | number  | -       | Elements filled with material points below this fraction are stabilised. 0 switches this test off.                                            |
| `"ghost factor"`            | Required | number  | -       | Scale of the [ghost stabilisation](../TechnicalReferences/ghostStabilisation.md) added to the stiffness matrix. 0 switches it off.            |
| `"ghost factor mass"`       | Required | number  | -       | Scale of the ghost stabilisation added to the mass matrix in dynamic stages. Required for static-only analyses too.                           |

</div>

## Output

VTK files (for ParaView) and CSV files are switched on independently, each with its own directory, frequency and list of fields. See [Obtaining results](ObtainingResults.md) for using them.

```json
"output": {
    "vtk": "on",
    "vtk directory": "vtk_CPT",
    "vtk percent": 0.5,
    "vtk material point fields": ["displacement", "velocity", "stress", "strain", "volume"],
    "vtk rigid body fields": ["position", "velocity", "reaction force"],

    "csv": "on",
    "csv directory": "csv_CPT",
    "csv percent": 0.25,
    "csv material point fields": ["initial position", "position", "stress"],
    "csv rigid body fields": ["position", "velocity", "reaction force", "reaction moment"]
}
```

<div class="small-table" markdown>

| Key                               | Status                          | Type            | Default     | Description                                                                                                                                                  |
|-----------------------------------|---------------------------------|-----------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"vtk"`                           | Required                        | string          | -           | `"on"` or `"off"`.                                                                                                                                          |
| `"csv"`                           | Required                        | string          | -           | `"on"` or `"off"`.                                                                                                                                          |
| `"vtk directory"`                 | Conditional: `"vtk": "on"`      | string          | -           | Output directory, relative to the folder Julia is started from. Created if needed.                                                                          |
| `"vtk percent"`                   | Conditional: `"vtk": "on"`      | number          | -           | Output frequency, as a percentage of each stage's steps (below). 0 writes every step.                                                                       |
| `"csv directory"`                 | Conditional: `"csv": "on"`      | string          | -           | As `"vtk directory"`, for the CSV files.                                                                                                                     |
| `"csv percent"`                   | Conditional: `"csv": "on"`      | number          | -           | As `"vtk percent"`, for the CSV files.                                                                                                                       |
| `"vtk material point fields"`     | Optional                        | list of strings | every field | Material-point fields to write. **Leaving the key out writes every field**; an empty list `[]` writes none.                                                |
| `"vtk rigid body fields"`         | Optional                        | list of strings | every field | Rigid-body point fields to write, with the same rule.                                                                                                        |
| `"csv material point fields"`     | Optional                        | list of strings | every field | As above, for the CSV files.                                                                                                                                 |
| `"csv rigid body fields"`         | Optional                        | list of strings | every field | As above, for the CSV files.                                                                                                                                 |

</div>

A stage with $N$ steps (`"load steps"`, or `"final time"` / `"dt"`) writes output every $\max\left(1, \text{round}(N \times \text{percent}/100)\right)$ converged steps. For example, `"vtk percent": 0.5` in a 450-step stage writes a VTK frame every 2 steps.

### Field names

<div class="small-table" markdown>

| Material point field       | Components | Contents                                                        |
|----------------------------|------------|-----------------------------------------------------------------|
| `"initial position"`       | 3          | Position at the start of the analysis.                          |
| `"position"`               | 3          | Current position.                                               |
| `"displacement"`           | 3          | Position minus initial position.                                |
| `"velocity"`               | 3          | Velocity.                                                       |
| `"acceleration"`           | 3          | Acceleration.                                                   |
| `"lp"`                     | 3          | Half-widths of the GIMP domain.                                 |
| `"deformation gradient"`   | 9          | Deformation gradient $\mathbf{F}$.                              |
| `"stress"`                 | 6          | Cauchy stress, in the order $xx, yy, zz, xy, yz, xz$.           |
| `"strain"`                 | 6          | Elastic logarithmic strain, in the same order.                  |
| `"volume"`                 | 1          | Current volume.                                                 |
| `"initial volume"`         | 1          | Volume at the start of the analysis.                            |

</div>

<div class="small-table" markdown>

| Rigid body field           | Components | Contents                                                                  |
|----------------------------|------------|---------------------------------------------------------------------------|
| `"position"`               | 3          | Position of the point.                                                    |
| `"velocity"`               | 3          | Velocity.                                                                 |
| `"acceleration"`           | 3          | Acceleration.                                                             |
| `"angular velocity"`       | 3          | Angular velocity.                                                         |
| `"angular acceleration"`   | 3          | Angular acceleration.                                                     |
| `"mass"`                   | 1          | Mass.                                                                     |
| `"reaction force"`         | 3          | Force on the point - for a prescribed point, the force needed to move it. Zero in a stage with the bodies off. |
| `"reaction moment"`        | 3          | Moment on the point, likewise.                                            |

</div>

### Output files

Each output step is numbered `nnnnn` by the step counter shown on the progress line, which starts at 1 and counts converged steps across the whole analysis, so the first files are numbered `00002`:

<div class="small-table" markdown>

| File                        | Directory | Contents                                                                                                              |
|-----------------------------|-----------|-----------------------------------------------------------------------------------------------------------------------|
| `mps_<layer>_nnnnn.vtu`     | VTK       | The material points of each layer (1 = top layer), drawn as their GIMP domains, with the selected fields as cell data. |
| `body_nnnnn.vtu`            | VTK       | One vertex per rigid-body point, with the selected fields.                                                            |
| `surface_nnnnn.vtu`         | VTK       | The rigid-body surfaces, with each triangle's `body`, `velocity` and total `contact force`.                            |
| `tracked_nnnnn.vtu`         | VTK       | The tracked nodes, with their number and the point they follow.                                                       |
| `mps_<layer>_nnnnn.csv`     | CSV       | One row per material point. The first line is `time,<value>`; the column headers are on the second line.              |
| `rigid_body.csv`            | CSV       | One file for the whole run, one row per output step. Overwritten at the start of each run.                             |

</div>

Files for rigid bodies are only written when the analysis has rigid bodies. ParaView opens each numbered series (e.g. `mps_1_..vtu`) as one time-dependent dataset.

CSV column headers add a suffix to each field name: `_x`, `_y`, `_z` for 3-component fields, `_xx`, `_yy`, `_zz`, `_xy`, `_yz`, `_xz` for stress and strain, and `_1` to `_9` for the deformation gradient. `rigid_body.csv` starts with a `time` column, then one group of columns per point named `body<n>_<field>` - e.g. `body1_reaction force_z` - and then `track<n>_x`, `track<n>_y`, `track<n>_z` for each tracked node. In every CSV file, `time` is the load fraction in a static stage and the time since the start of the stage in a dynamic stage.

## Complete examples

Each tutorial has a complete, working input file:

<div class="small-table" markdown>

| Tutorial                                                                  | Input file                                                    | Features used                                                                                                         |
|---------------------------------------------------------------------------|---------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| [1 - Self-weight column](../TutorialProblems/Tutorial_1.md)               | [input file](../TutorialProblems/Tutorial_1_input_data.md)   | Static stage, gravity ramp, `"domain update"`, CSV and VTK output.                                                    |
| [2 - Compaction via a rigid body](../TutorialProblems/Tutorial_2.md)      | [input file](../TutorialProblems/Tutorial_2_input_data.md)   | Rigid body from an STL, prescribed displacement, surface placement.                                        |
| [3 - Vertical penetration (CPT)](../TutorialProblems/Tutorial_3.md)       | [input file](../TutorialProblems/Tutorial_3_input_data.md)   | Two stages, Willam-Warnke sand with `"E overburden"`, stage point boundary conditions, adaptivity, friction.         |
| [5 - Rolling sphere](../TutorialProblems/Tutorial_5.md)                   | [input file](../TutorialProblems/Tutorial_5_input_data.md)   | Dynamic stage, tilted gravity, a free rigid body, boundary track.                                                     |
| [6 - Drag anchor](../TutorialProblems/Tutorial_6.md)                      | [input file](../TutorialProblems/Tutorial_6_input_data.md)   | Three points joined by a hinge, an angle stop and a pull line; three stages; boundary track.                         |

</div>
