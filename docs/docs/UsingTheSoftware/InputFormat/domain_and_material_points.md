# Domain and material points

Where the analysis runs, how big the world is, and the soil that fills it: `"GPU"`, `"domain update"`, `"domain"` and `"material points"`. The status labels are explained on the [format overview](index.md#how-to-read-these-pages).

## GPU

```json
"GPU": "on"
```

<div class="small-table" markdown>

| Key     | Status   | Options          | Default | Description                                                                                                                 |
|---------|----------|------------------|---------|-----------------------------------------------------------------------------------------------------------------------------|
| `"GPU"` | Required | `"on"`, `"off"`  | -       | `"on"` runs on an NVIDIA GPU through CUDA. `"off"` runs on the CPU, using as many threads as Julia was started with (`julia -t 4` uses four). |

</div>

## Domain update

```json
"domain update": "stretch"
```

<div class="small-table" markdown>

| Key               | Status   | Options                | Default  | Description                                                                                                                                                                                                     |
|-------------------|----------|------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"domain update"` | Optional | `"none"`, `"stretch"`  | `"none"` | `"none"`: every material point's GIMP domain keeps its initial size. `"stretch"`: each half-width is scaled by the stretch $F_{ii}$ along its own axis, up to 1.99 times its initial size. Do not use `"stretch"` with one material point per element per axis. |

</div>

Without `"stretch"`, the domains of material points next to a fixed face cannot move closer to it, because the domain would cross the boundary. Compression problems therefore normally use `"stretch"`.

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
| `"gravity"` | Required | [x, y, z] (m/s$^2$)      | -       | Gravitational acceleration, applied to the soil and to the rigid-body points. It must not be zero: convergence is measured relative to the weight of the soil (see [`"tolerance"`](solver.md)), so an analysis without gravity cannot converge. |

</div>

Gravity does not have to point straight down. [Tutorial 5](../../TutorialProblems/Tutorial_5.md) tilts it by $45^\circ$ to model a slope while keeping the grid axis-aligned.

## Material points

The soil block: the background element size, how many material points are placed in each element, the plan footprint and the layers from the surface downwards.

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

See [Isotropic linear elasticity](../../TechnicalReferences/LinearElasticity.md) and [Isotropic elasto-plasticity](../../TechnicalReferences/ElastoPlasticity.md) for the theory behind each model.

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

[Tutorial 3](../../TutorialProblems/Tutorial_3.md#problem-description) shows how a published correlation, written in terms of horizontal stress, is converted into this form.

### How element sizes set the mesh

The background grid is an octree, so all element sizes must be power-of-two multiples of one another:

- The **smallest** element size requested anywhere in the file - the base `"element size"` or any stage's `"element size"` or `"element size in region"` - is used exactly.
- Every other size is rounded **down** to the nearest $h_\text{min} \cdot 2^n$. For example, a base size of 4.0 m with a refinement size of 0.1 m gives a base element of $0.1 \times 2^5 = 3.2$ m.
- The footprint `"max"` is rounded **up** to whole base elements, and the top of the block is rounded up to a whole row of material points.

The grid is a cube large enough to hold the footprint in $x$ and $y$ and **twice the total layer thickness in $z$** (also rounded up to whole base elements). The soil fills the bottom half; the top half is empty space for the surface to move into and for rigid bodies to start in. [`"domain"` `"size"`](#domain) can only make the cube larger.
