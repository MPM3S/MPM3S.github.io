
---

# The `input_data.json` format

AMPSSIE drives every analysis from a single [JSON](https://en.wikipedia.org/wiki/JSON) file, conventionally named `input_data.json`. The file is one JSON object whose top-level keys correspond to the conceptual components of the model: the mesh, the initial material point distribution, the boundary conditions, the constitutive description, the rigid body (if any), the loading programme, the solver settings, and the requested outputs.

This page is the reference for that file. Each top-level section is described in its own H2 block below: a one-sentence purpose, a representative JSON snippet drawn from the tutorials, a table of every field observed across the six tutorial inputs, and (where the section supports multiple shapes) H3 sub-sections covering each variant.

!!! tip "How to read this page"
    The tutorial inputs in [Tutorial 1](../TutorialProblems/Tutorial_1_input_data.md) through [Tutorial 6](../TutorialProblems/Tutorial_6_input_data.md) are the authoritative working examples. This page describes the same fields in a section-by-section reference form so you can look up any single key without scrolling through a whole tutorial. Whenever a field is currently exercised by only one tutorial, the relevant tutorial is named in the field's description.

## How the file is interpreted

- The file is a single JSON object. Keys are quoted strings, and order is not significant.
- Keys are case-sensitive and many contain spaces (e.g. `"domain size x"`, `"Initial GIMP distribution"`). Copy them verbatim from this page or from a tutorial example.
- Anything not listed in the file falls back to AMPSSIE's built-in defaults. For example, a face that is not named under `"Boundary conditions"` is treated as a free surface, and a GIMP count that is not specialised defaults to 2x2x2 per element.
- Top-level sections are not all mandatory: pure self-weight or compaction problems omit `"Rigid body"` and/or `"Loading"`; the column convergence study omits `"Rigid body"` and uses a minimal `"Solver"` block instead of a staged `"Loading"`.

## Top-level keys

| Top-level key | Type | Purpose | Required |
|---|---|---|---|
| `Mesh` | object | Domain extents and the background-grid refinement scheme. | Yes |
| `Initial GIMP distribution` | object | Extents of the initial material-point (GIMP) fill, and any non-default per-element GIMP layout. | Yes |
| `Boundary conditions` | object | Per-face kinematic conditions and optional per-DOF fixes. | Yes |
| `Material` | object | Number of soil layers and their constitutive type, properties, and empirical-data preset. | Yes |
| `Rigid body` | object | Geometry, kinematics, mass and contact parameters for the rigid body, if one is present. | Optional |
| `Loading` | object | Ordered list of loading stages (gravity, prescribed rigid-body displacement, pull-point velocity, etc.). | Optional |
| `Solver` | object | Solve type (static / dynamic), nonlinear method, and any time-integration choice. | Yes |
| `Output Data` | object | Switches for VTU / VTK output and a string used as the text-output filename stem. | Yes |

!!! note "Capitalisation of `Output Data`"
    Every other multi-word top-level key in the tutorial inputs uses Sentence case (`Boundary conditions`, `Rigid body`, `Initial GIMP distribution`). The key `Output Data` capitalises both words and is the lone exception. This page uses the same casing as the tutorials so that examples copy through faithfully; if the parser is ever tightened, expect `Output data` to become the preferred form.

## Mesh

The `Mesh` object sets the size of the cuboidal background grid and chooses how it is refined.

```json
"Mesh": {
    "domain size x": 12.8,
    "domain size y": 12.8,
    "domain size z": 24.6,
    "dx refined": 0.1,
    "Refinement type": "rigid body adaptive",
    "buffer multiplier": 2
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `domain size x` | number (m) | required | Length of the computational domain in the x-direction. |
| `domain size y` | number (m) | required | Length of the computational domain in the y-direction. |
| `domain size z` | number (m) | required | Length of the computational domain in the z-direction. |
| `dx refined` | number (m) | required | Smallest element size in the domain. Used on elements intersecting the rigid body surface, or as the minimum element size for the bespoke validation refinement schemes. |
| `Refinement type` | string | required | Refinement scheme. Observed values: `"column validation"`, `"contact cube"`, `"rigid body adaptive"`. Acts as the discriminator for the variants below. |
| `buffer multiplier` | number | (no default) | Element size in the buffer region around the refined zone, expressed as a multiple of `dx refined`. Tutorials 3-6 use `2`. |
| `dx coarse` | number (m) | (no default) | Maximum element size far from the rigid body. Demonstrated in [Tutorial 5](../TutorialProblems/Tutorial_5.md) (`0.5`). |
| `partitioned domain` | object | (no default) | Activates the moving-window scheme so only a portion of the full domain (ahead of and behind the rigid body) is meshed and solved each step. Demonstrated in [Tutorial 6](../TutorialProblems/Tutorial_6.md). |

!!! note "Capitalisation inside `Mesh`"
    All sub-keys of `Mesh` are lowercase except `Refinement type`. This mixed casing is consistent across every tutorial; copy it verbatim.

### Variant: bespoke validation refinement

Used by the two validation tutorials, [Tutorial 1](../TutorialProblems/Tutorial_1.md) (`"column validation"`) and [Tutorial 2](../TutorialProblems/Tutorial_2.md) (`"contact cube"`). Only the three `domain size` keys, `dx refined`, and `Refinement type` are present.

```json
"Mesh": {
    "domain size x": 0.4,
    "domain size y": 0.4,
    "domain size z": 0.8,
    "dx refined": 0.2,
    "Refinement type": "column validation"
}
```

### Variant: rigid-body-driven octree adaptive

Used by Tutorials 3-6. The octree refinement follows the rigid body position and re-refines as the body moves. `buffer multiplier` is required for this variant.

```json
"Mesh": {
    "domain size x": 20.0,
    "domain size y": 10.0,
    "domain size z": 7.5,
    "dx refined": 0.075,
    "Refinement type": "rigid body adaptive",
    "buffer multiplier": 2
}
```

### Variant: rigid-body adaptive with a coarse cap

Adds `dx coarse` to pin the far-field element size. Demonstrated in [Tutorial 5](../TutorialProblems/Tutorial_5.md).

```json
"Mesh": {
    "domain size x": 50.0,
    "domain size y": 1.0,
    "domain size z": 1.0,
    "dx refined": 0.1,
    "dx coarse": 0.5,
    "Refinement type": "rigid body adaptive",
    "buffer multiplier": 2
}
```

### Variant: rigid-body adaptive with a partitioned (moving-window) domain

Adds a nested `partitioned domain` object so that only a window of the full domain is active each step. Demonstrated in [Tutorial 6](../TutorialProblems/Tutorial_6.md).

```json
"Mesh": {
    "domain size x": 100.0,
    "domain size y": 10.0,
    "domain size z": 10.0,
    "dx refined": 0.1,
    "Refinement type": "rigid body adaptive",
    "buffer multiplier": 2,
    "partitioned domain": {
        "ahead multiplier": 1.5,
        "behind multiplier": 0.5
    }
}
```

| Sub-field of `partitioned domain` | Type | Description |
|---|---|---|
| `ahead multiplier` | number | Multiplier on the anchor length L<sub>a</sub> defining the depth of active soil kept ahead of the rigid body. |
| `behind multiplier` | number | Multiplier on the anchor length L<sub>a</sub> defining the depth of active soil kept behind the rigid body. |

## Initial GIMP distribution

The `Initial GIMP distribution` object specifies the volume in which material points are initially placed, and optionally selects a non-default per-element GIMP layout.

```json
"Initial GIMP distribution": {
    "Initial GIMP distribution x": 12.8,
    "Initial GIMP distribution y": 12.8,
    "Initial GIMP distribution z": 24.6
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `Initial GIMP distribution x` | number (m) | required | Extent of the initial GIMP-filled volume in the x-direction. In every tutorial this matches `Mesh.domain size x`, i.e. the GIMPs fill the whole domain. |
| `Initial GIMP distribution y` | number (m) | required | Extent in the y-direction; matches `Mesh.domain size y` in every tutorial. |
| `Initial GIMP distribution z` | number (m) | required | Extent in the z-direction; matches `Mesh.domain size z` in every tutorial. |
| `Specialised distribution` | string | (no default) | Selects a bespoke GIMP layout. Only observed value: `"column validation"`. |

By default, each element contains a 2x2x2 grid of GIMPs.

### Variant: default GIMP distribution

Used by Tutorials 2-6. Only the three extents are given.

```json
"Initial GIMP distribution": {
    "Initial GIMP distribution x": 20.0,
    "Initial GIMP distribution y": 10.0,
    "Initial GIMP distribution z": 7.5
}
```

### Variant: specialised (column-validation) distribution

Used by [Tutorial 1](../TutorialProblems/Tutorial_1.md). Adds `"Specialised distribution": "column validation"`, which produces 4x4x4 GIMPs in the larger elements and 2x2x2 GIMPs in the smaller elements - the layout needed for the self-weight column convergence study.

```json
"Initial GIMP distribution": {
    "Initial GIMP distribution x": 0.4,
    "Initial GIMP distribution y": 0.4,
    "Initial GIMP distribution z": 0.8,
    "Specialised distribution": "column validation"
}
```

## Boundary conditions

The `Boundary conditions` object lists per-face kinematic conditions and, optionally, per-DOF fixes that apply to every node. Faces that are not listed are treated as free surfaces; in particular the top (+z) face is never written and is always free.

```json
"Boundary conditions": {
    "neg x-plane": "roller",
    "neg y-plane": "roller",
    "neg z-plane": "roller",
    "pos x-plane": "roller",
    "pos y-plane": "roller"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `neg x-plane` | string | required | Condition on the -x face. Observed values: `"roller"`. |
| `neg y-plane` | string | required | Condition on the -y face. Observed values: `"roller"`. |
| `neg z-plane` | string | required | Condition on the base (-z face). Observed values: `"roller"`. |
| `pos x-plane` | string | required | Condition on the +x face. Observed values: `"roller"`. |
| `pos y-plane` | string | required | Condition on the +y face. Observed values: `"roller"`, `"Signorini"`. |
| `x dof` | string | (unconstrained) | Optional global x-DOF constraint applied to every node. Observed value: `"fixed"`. |
| `y dof` | string | (unconstrained) | Optional global y-DOF constraint applied to every node. Observed value: `"fixed"`. |

`"roller"` fixes the displacement normal to the face and leaves in-plane motion free.

### Variant: all-roller (no DOF fixes)

Used by Tutorials 3 and 6 (vertical penetration and drag anchor). The lateral and base rollers, together with the free +z surface, provide the necessary kinematic constraint.

```json
"Boundary conditions": {
    "neg x-plane": "roller",
    "neg y-plane": "roller",
    "neg z-plane": "roller",
    "pos x-plane": "roller",
    "pos y-plane": "roller"
}
```

### Variant: rollers plus x/y DOF fixes (one-dimensional / no-translation)

Used by Tutorials 1, 2 and 5 (column, contact cube, rolling sphere). Every node has its x and y DOFs fixed in addition to the face rollers, either to keep the problem strictly one-dimensional in compression or to prevent the deformable region from translating while the rigid body moves over it.

```json
"Boundary conditions": {
    "neg x-plane": "roller",
    "neg y-plane": "roller",
    "neg z-plane": "roller",
    "pos x-plane": "roller",
    "pos y-plane": "roller",
    "x dof": "fixed",
    "y dof": "fixed"
}
```

### Variant: rollers with a Signorini exit face

Used by [Tutorial 4](../TutorialProblems/Tutorial_4.md) (plough). The +y face is a Signorini condition so that material can move away from but not across the exit face. In Tutorial 4 this is enforced pragmatically by a secondary frictionless rigid plate.

```json
"Boundary conditions": {
    "neg x-plane": "roller",
    "neg y-plane": "roller",
    "neg z-plane": "roller",
    "pos x-plane": "roller",
    "pos y-plane": "Signorini"
}
```

## Material

The `Material` object specifies how many soil layers the model contains and gives, for each layer, the constitutive type, an empirical-data preset, and the assigned material properties.

```json
"Material": {
    "number of layers": 1,
    "layers": [
        {
            "type": "DruckerPrager",
            "empirical data": "Brinkgreve sand",
            "assigned material properties": {
                "E_50_ref": 19200000.0,
                "rho": 1630.0,
                "nu": 0.25,
                "phi": 32.0,
                "psi": 2.0,
                "c": 300.0,
                "K_0": 0.47,
                "m_E": 0.60
            }
        }
    ]
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `number of layers` | integer | required | Number of distinct material layers. Every observed tutorial uses `1`. |
| `layers` | array of objects | required | One object per layer. Each layer has the sub-fields listed below. |

Each entry of `layers` contains:

| Layer sub-field | Type | Description |
|---|---|---|
| `type` | string | Constitutive model. Observed values: `"Elastic"`, `"DruckerPrager"`. |
| `empirical data` | string | Name of a preset that supplies any empirically-calibrated parameters not listed under `assigned material properties`. Observed values: `"homogeneous elastic"`, `"Brinkgreve sand"`. |
| `assigned material properties` | object | Per-model property bag. Fields depend on `type` (see the variants below). |

!!! note "Spelling of `empirical data`"
    Earlier versions of the tutorials used the misspelled key `"empirical data"`. This has been corrected to `"empirical data"`; use the corrected spelling in any new inputs.

### Variant: linear elastic

Used by Tutorials 1, 2 and 5. The `assigned material properties` bag contains a Young's modulus, a Poisson's ratio, and (optionally) a density.

```json
{
    "type": "Elastic",
    "empirical data": "homogeneous elastic",
    "assigned material properties": {"E": 1000.0, "nu": 0.0, "rho": 50.0}
}
```

| Property | Type | Units | Description |
|---|---|---|---|
| `E` | number | Pa | Young's modulus. Tutorials: `1000.0`, `1.0e6`, `1.0e9`. |
| `nu` | number | - | Poisson's ratio. Tutorials all use `0.0`. |
| `rho` | number | kg/m^3 | Density. Omitted in Tutorials 2 and 5 (gravity is not applied to the deformable region there). |

### Variant: Drucker-Prager

Used by Tutorials 3, 4 and 6. The bag carries a reference stiffness, density, friction and dilation angles, cohesion, an at-rest lateral earth-pressure coefficient and a stress-dependent stiffness exponent.

```json
{
    "type": "DruckerPrager",
    "empirical data": "Brinkgreve sand",
    "assigned material properties": {
        "E_50_ref": 19200000.0,
        "rho": 1630.0,
        "nu": 0.25,
        "phi": 32.0,
        "psi": 2.0,
        "c": 300.0,
        "K_0": 0.47,
        "m_E": 0.60
    }
}
```

| Property | Type | Units | Description |
|---|---|---|---|
| `E_50_ref` | number | Pa | Secant stiffness at 50% of failure deviatoric stress, at the reference confining pressure. |
| `rho` | number | kg/m^3 | Density. |
| `nu` | number | - | Poisson's ratio. |
| `phi` | number | degrees | Friction angle. |
| `psi` | number | degrees | Dilation angle. |
| `c` | number | Pa | Cohesion. |
| `K_0` | number | - | At-rest lateral earth-pressure coefficient. |
| `m_E` | number | - | Stress-dependency exponent for stiffness scaling. |

## Rigid body

The `Rigid body` object describes the geometry, kinematics, mass and contact parameters of the rigid body interacting with the soil. The object is absent from the column-convergence tutorial ([Tutorial 1](../TutorialProblems/Tutorial_1.md)) because there is no rigid body in that problem.

```json
"Rigid body": {
    "geometry": "cone",
    "radius": 0.4,
    "apex angle": 60.0,
    "initial position z": 24.6,
    "prescribed displacement z": -4.0,
    "friction coefficient": 0.3,
    "normal penalty factor": 50,
    "tangential penalty factor": 25
}
```

The fields available depend on the `geometry` discriminator. Shared contact and inertia fields are listed here; geometry-specific fields are listed under each variant below.

| Shared field | Type | Description |
|---|---|---|
| `geometry` | string | Geometry type. Observed values: `"plate"`, `"cone"`, `"mesh file"`, `"articulated"`. |
| `friction coefficient` | number | Coulomb friction coefficient between rigid body and material points. |
| `normal penalty factor` | number | Penalty stiffness used to enforce the no-penetration constraint. |
| `tangential penalty factor` | number | Penalty stiffness used for tangential contact (omitted in Tutorial 2 because contact there is frictionless). |
| `mass` | number (kg) | Mass of the rigid body, where dynamics matter. |
| `rotational inertia` | number (kg m^2) | Rotational inertia. |
| `initial position` | array `[x, y, z]` | Initial position of the rigid body centre. |
| `initial position z` | number (m) | Shorthand for an initial position constrained to the z-axis only. |
| `prescribed displacement z` | number (m) | Magnitude of an imposed vertical displacement applied in the `Loading` stage. |

### Variant: `"plate"`

Used by [Tutorial 2](../TutorialProblems/Tutorial_2.md). A flat rigid plate pressed downward into a cube of soil; contact is frictionless so only `normal penalty factor` is required.

```json
"Rigid body": {
    "geometry": "plate",
    "initial position z": 0.8,
    "prescribed displacement z": -0.2,
    "normal penalty factor": 1000
}
```

### Variant: `"cone"`

Used by [Tutorial 3](../TutorialProblems/Tutorial_3.md). A cone of the given `radius` and `apex angle` is driven vertically into the soil.

```json
"Rigid body": {
    "geometry": "cone",
    "radius": 0.4,
    "apex angle": 60.0,
    "initial position z": 24.6,
    "prescribed displacement z": -4.0,
    "friction coefficient": 0.3,
    "normal penalty factor": 50,
    "tangential penalty factor": 25
}
```

| Variant field | Type | Description |
|---|---|---|
| `radius` | number (m) | Base radius of the cone. |
| `apex angle` | number (degrees) | Full apex angle. |

### Variant: `"mesh file"`

Used by Tutorials 4 (`plough.stl`) and 5 (`sphere.stl`). A geometry supplied as an STL file. Additional fields vary by application: ploughs declare an `embedment depth` and a `fillet segments per quarter` discretisation parameter; the rolling sphere declares mass, rotational inertia and a starting position.

```json
"Rigid body": {
    "geometry": "mesh file",
    "mesh path": "plough.stl",
    "embedment depth": 1.85,
    "fillet segments per quarter": 10,
    "friction coefficient": 0.3,
    "normal penalty factor": 50,
    "tangential penalty factor": 25
}
```

```json
"Rigid body": {
    "geometry": "mesh file",
    "mesh path": "sphere.stl",
    "diameter": 2.0,
    "mass": 10000.0,
    "rotational inertia": 4000.0,
    "initial position": [1.0, 0.5, 1.5],
    "friction coefficient": 0.2,
    "normal penalty factor": 50,
    "tangential penalty factor": 25
}
```

| Variant field | Type | Description |
|---|---|---|
| `mesh path` | string | Path (relative to the input file) to the STL describing the body. |
| `embedment depth` | number (m) | Plough only: depth at which the STL is initially placed. |
| `fillet segments per quarter` | integer | Plough only: discretisation count used when re-meshing fillets. |
| `diameter` | number (m) | Sphere only: convenience field used by the rolling-sphere kinematics. |

### Variant: `"articulated"`

Used by [Tutorial 6](../TutorialProblems/Tutorial_6.md). A multi-part rigid body made of several STL parts connected by a truss frame; modelled as a drag anchor (fluke + shank).

```json
"Rigid body": {
    "geometry": "articulated",
    "parts": [
        {
            "name": "fluke",
            "mesh path": "fluke.stl",
            "mass": 3291.6,
            "rotational inertia": 550.0,
            "centre of mass offset": 0.131,
            "length": 1.7
        },
        {
            "name": "shank",
            "mesh path": "shank.stl",
            "mass": 1058.35,
            "rotational inertia": 675.0,
            "centre of mass offset": 1.272,
            "length": 3.3
        }
    ],
    "truss frame": {
        "member stiffness": 1.0e9,
        "node mass": 10.0
    },
    "friction coefficient": 0.3,
    "normal penalty factor": 50,
    "tangential penalty factor": 25
}
```

| Variant field | Type | Description |
|---|---|---|
| `parts` | array of objects | One entry per articulated piece. Each part has `name`, `mesh path`, `mass`, `rotational inertia`, `centre of mass offset` and `length`. |
| `truss frame` | object | Lightweight truss connecting the parts. Sub-fields: `member stiffness` (N/m), `node mass` (kg). |

## Loading

The `Loading` object is an ordered list of `stages`. Each stage advances the analysis through a phase of the problem (apply gravity, push a rigid body, settle, drag the rigid body horizontally, ...) and is consumed in the order written.

```json
"Loading": {
    "stages": [
        {
            "name": "stage 1 - gravity",
            "type": "gravity",
            "g": [0.0, 0.0, -9.81],
            "number of increments": 1
        },
        {
            "name": "stage 2 - cone descent",
            "type": "rigid body displacement",
            "rigid body": "cone",
            "displacement z": -4.0,
            "number of increments": 300
        }
    ]
}
```

| Field | Type | Description |
|---|---|---|
| `stages` | array of objects | Ordered list of stages. Each stage has at minimum `name` and `type`. |

The remaining fields of each stage depend on its `type`. The shared sub-fields seen across stage types are:

| Shared stage sub-field | Type | Description |
|---|---|---|
| `name` | string | Human-readable label. |
| `type` | string | Stage discriminator. Observed values: `"gravity"`, `"rigid body displacement"`, `"settle"`, `"pull point velocity"`. |
| `number of increments` | integer | Number of pseudo-time / load increments for a static stage. |
| `time step` | number (s) | Time step for a dynamic stage. |
| `end time` | number (s) | Termination time for a dynamic stage that runs to a fixed time. |
| `mode` | string | Either `"pseudo-static"` or `"dynamic"`; used in Tutorial 6 to mix static and dynamic stages. |
| `termination criterion` | string | Free-form description of when to stop a dynamic stage (e.g. `"vertical velocity below 1e-3 m/s"`). |

### Variant: `"gravity"`

Applies a body-force gravity load.

```json
{
    "name": "stage 1 - gravity",
    "type": "gravity",
    "g": [0.0, 0.0, -9.81],
    "number of increments": 1
}
```

| Field | Type | Description |
|---|---|---|
| `g` | array `[gx, gy, gz]` (m/s^2) | Gravity vector. Tutorial 5 uses a tilted vector `[6.9367, 0.0, -6.9367]` to drive the rolling sphere. |
| `number of increments` | integer | Pseudo-static increments to ramp gravity up. |
| `time step`, `end time` | number | Used when gravity is applied dynamically (Tutorial 5). |

### Variant: `"rigid body displacement"`

Drives the rigid body by a prescribed displacement.

```json
{
    "name": "stage 2 - horizontal drag",
    "type": "rigid body displacement",
    "rigid body": "plough",
    "displacement y": 20.0,
    "step size": 0.025,
    "step size reduction factor": 0.5
}
```

| Field | Type | Description |
|---|---|---|
| `rigid body` | string | Name / label of the rigid body being driven. |
| `displacement x` \| `displacement y` \| `displacement z` | number (m) | Total prescribed displacement on the named axis. |
| `number of increments` | integer | Fixed number of increments (Tutorial 3, cone descent). |
| `step size` | number (m) | Initial displacement increment (Tutorial 4). |
| `step size reduction factor` | number | Factor by which `step size` is cut on convergence difficulty. |

### Variant: `"settle"`

Used in [Tutorial 6](../TutorialProblems/Tutorial_6.md) to let the anchor settle dynamically before drag is applied.

```json
{
    "name": "stage 2 - settle",
    "type": "settle",
    "pull point height": 10.0,
    "mode": "dynamic",
    "time step": 0.01,
    "termination criterion": "vertical velocity below 1e-3 m/s"
}
```

| Field | Type | Description |
|---|---|---|
| `pull point height` | number (m) | Height of the pull point above the seabed. |

### Variant: `"pull point velocity"`

Used in [Tutorial 6](../TutorialProblems/Tutorial_6.md) to drag the anchor through the soil at a prescribed pull-point velocity.

```json
{
    "name": "stage 3 - drag",
    "type": "pull point velocity",
    "velocity": [0.1, 0.0, 0.0],
    "mode": "dynamic",
    "time step": 0.01,
    "termination criterion": "horizontal travel 19 m"
}
```

| Field | Type | Description |
|---|---|---|
| `velocity` | array `[vx, vy, vz]` (m/s) | Pull-point velocity vector. |

## Solver

The `Solver` object selects the solve type, the nonlinear method, and the time integration when applicable. The shape ranges from a one-line declaration (the column convergence study) to a three-line specification (the rolling sphere).

```json
"Solver": {
    "solve type": "static",
    "method": "Newton-Raphson"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `solve type` | string | (no default) | `"static"` or `"dynamic"`. Omitted in Tutorial 6 where it is implied by the per-stage `mode`. |
| `method` | string | (no default) | Nonlinear solver. Observed values: `"Newton-Raphson"`. |
| `time integration` | string | (no default) | Time-integration scheme for dynamic solves. Observed value: `"implicit"` ([Tutorial 5](../TutorialProblems/Tutorial_5.md)). |
| `load type` | string | (no default) | Used in the validation tutorials in place of an explicit `Loading` block. Observed values: `"force"` (Tutorial 1), `"displacement"` (Tutorial 2). |
| `number of increments` | integer | (no default) | Total number of load increments for the validation tutorials that omit `Loading`. |

### Variant: validation-style (no `Loading` block)

[Tutorial 1](../TutorialProblems/Tutorial_1.md) and [Tutorial 2](../TutorialProblems/Tutorial_2.md) skip the `Loading` block and instead declare `load type` and `number of increments` directly on the solver.

```json
"Solver": {
    "solve type": "static",
    "load type": "force",
    "number of increments": 20
}
```

### Variant: staged static (used with `Loading.stages`)

Tutorials 3 and 4. The stages drive the analysis; the solver just declares the global solve type and the nonlinear method.

```json
"Solver": {
    "solve type": "static",
    "method": "Newton-Raphson"
}
```

### Variant: staged dynamic with implicit integration

Used by [Tutorial 5](../TutorialProblems/Tutorial_5.md).

```json
"Solver": {
    "solve type": "dynamic",
    "method": "Newton-Raphson",
    "time integration": "implicit"
}
```

### Variant: mixed static / dynamic (`mode` per stage)

Used by [Tutorial 6](../TutorialProblems/Tutorial_6.md). The global `solve type` is omitted; each loading stage carries its own `mode`.

```json
"Solver": {
    "method": "Newton-Raphson"
}
```

## Output Data

The `Output Data` object switches the supported output streams on or off and supplies a stem string used to name text-output files.

```json
"Output Data": {
    "vtu data": "yes",
    "vtk data": "yes",
    "text data": "cone penetration test"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `vtu data` | string | `"no"` | Set to `"yes"` to write VTU files for visualisation in ParaView / VisIt. |
| `vtk data` | string | `"no"` | Set to `"yes"` to write VTK files. |
| `text data` | string | (none) | Stem used for tabulated text output. Tutorial-specific labels include `"column validation"`, `"contact cube"`, `"cone penetration test"`, `"plough"`, `"rolling sphere"`, `"drag anchor"`. |

!!! note "Heading-vs-key capitalisation"
    The tutorial pages use the heading `### Output data` (lowercase `d`) immediately above a JSON block with the key `"Output Data"` (capital `D`). This page mirrors the key as it appears in the tutorials. If the parser is ever made case-insensitive, the cleaner form is `"Output data"` (Sentence case, matching the other top-level keys).

## Putting it all together

A complete, minimal input file for a quasi-static rigid-body penetration looks like this (this is the [Tutorial 3](../TutorialProblems/Tutorial_3_input_data.md) file, reproduced for reference):

```json
{
    "Mesh": {
        "domain size x": 12.8,
        "domain size y": 12.8,
        "domain size z": 24.6,
        "dx refined": 0.1,
        "Refinement type": "rigid body adaptive",
        "buffer multiplier": 2
    },
    "Initial GIMP distribution": {
        "Initial GIMP distribution x": 12.8,
        "Initial GIMP distribution y": 12.8,
        "Initial GIMP distribution z": 24.6
    },
    "Boundary conditions": {
        "neg x-plane": "roller",
        "neg y-plane": "roller",
        "neg z-plane": "roller",
        "pos x-plane": "roller",
        "pos y-plane": "roller"
    },
    "Material": {
        "number of layers": 1,
        "layers": [
            {
                "type": "DruckerPrager",
                "empirical data": "Brinkgreve sand",
                "assigned material properties": {
                    "E_50_ref": 19200000.0,
                    "rho": 1630.0,
                    "nu": 0.25,
                    "phi": 32.0,
                    "psi": 2.0,
                    "c": 300.0,
                    "K_0": 0.47,
                    "m_E": 0.60
                }
            }
        ]
    },
    "Rigid body": {
        "geometry": "cone",
        "radius": 0.4,
        "apex angle": 60.0,
        "initial position z": 24.6,
        "prescribed displacement z": -4.0,
        "friction coefficient": 0.3,
        "normal penalty factor": 50,
        "tangential penalty factor": 25
    },
    "Loading": {
        "stages": [
            {
                "name": "stage 1 - gravity",
                "type": "gravity",
                "g": [0.0, 0.0, -9.81],
                "number of increments": 1
            },
            {
                "name": "stage 2 - cone descent",
                "type": "rigid body displacement",
                "rigid body": "cone",
                "displacement z": -4.0,
                "number of increments": 300
            }
        ]
    },
    "Solver": {
        "solve type": "static",
        "method": "Newton-Raphson"
    },
    "Output Data": {
        "vtu data": "yes",
        "vtk data": "yes",
        "text data": "cone penetration test"
    }
}
```

Pair this reference with the six worked tutorial inputs to see each section exercised in context:

- [Tutorial 1 - Self-weight column convergence](../TutorialProblems/Tutorial_1_input_data.md)
- [Tutorial 2 - Compaction via a rigid body](../TutorialProblems/Tutorial_2_input_data.md)
- [Tutorial 3 - Vertical penetration (CPT)](../TutorialProblems/Tutorial_3_input_data.md)
- [Tutorial 4 - Plough](../TutorialProblems/Tutorial_4_input_data.md)
- [Tutorial 5 - Rolling sphere](../TutorialProblems/Tutorial_5_input_data.md)
- [Tutorial 6 - Drag anchor](../TutorialProblems/Tutorial_6_input_data.md)

---
