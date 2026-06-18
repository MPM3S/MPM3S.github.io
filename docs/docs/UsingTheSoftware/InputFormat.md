# The `input_data.json` format

AMPSSIE drives every analysis from a single [JSON](https://en.wikipedia.org/wiki/JSON) file, named `input_data.json`. The file is one JSON object whose top-level keys correspond to the components of the model: the [mesh](#mesh), the [initial material-point distribution](#initial-gimp-distribution), the [boundary conditions](#boundary-conditions), the [constitutive description](#material), the [rigid body](#rigid-body), the [solver settings](#solver) and the [requested outputs](#output-data).

This page describes each section in turn. The authoritative working examples are the two tutorial inputs:

- [Tutorial 1 - Self-weight column](../TutorialProblems/Tutorial_1_input_data.md)
- [Tutorial 2 - Compaction via a rigid body](../TutorialProblems/Tutorial_2_input_data.md)

## How the file is interpreted

- The file is a single JSON object. Keys are quoted strings and order is not significant.
- Keys are case-sensitive and many contain spaces (e.g. `"domain size x"`, `"Initial GIMP distribution"`). Copy them verbatim from this page or from a tutorial example.
- Anything not listed in the file falls back to AMPSSIE's built-in defaults. For example, a face that is not named under `"Boundary conditions"` is treated as a free surface, and an unspecified per-element GIMP layout defaults to $2 \times 2 \times 2$.
- `"Rigid body"` is optional - it is present in [Tutorial 2](../TutorialProblems/Tutorial_2_input_data.md) but absent from [Tutorial 1](../TutorialProblems/Tutorial_1_input_data.md).

## Top-level keys

<div class="small-table" markdown>

| Key | Type | Purpose | Required |
|---|---|---|---|
| `Mesh` | object | Domain extents and the background-grid element size. | Yes |
| `Initial GIMP distribution` | object | Extent of the initial material-point fill. | Yes |
| `Boundary conditions` | object | Per-face kinematic conditions and optional per-DOF fixes. | Yes |
| `Material` | object | Constitutive type and properties for each soil layer. | Yes |
| `Rigid body` | object | Geometry, kinematics and contact parameters for the rigid body. | Optional |
| `Solver` | object | Solve type, load type and the number of increments. | Yes |
| `Output Data` | object | VTU / VTK switches and a stem string for text output. | Yes |

</div>

## Mesh

The `Mesh` object sets the size of the cuboidal background grid and the element size.

```json
"Mesh": {
    "domain size x": 0.8,
    "domain size y": 0.8,
    "domain size z": 0.8,
    "dx refined": 0.4
}
```

<div class="small-table" markdown>

| Field | Type | Description |
|---|---|---|
| `domain size x`, `y`, `z` | number (m) | Length of the computational domain along each axis. |
| `dx refined` | number (m) | Element size. Used uniformly unless `Refinement type` is set. |
| `Refinement type` | string | Optional bespoke refinement scheme. Tutorial 1 uses `"column validation"` for the self-weight column convergence study; Tutorial 2 omits the key and runs on a uniform mesh. |

</div>

## Initial GIMP distribution

Specifies the volume in which material points are initially placed. Each element contains a $2 \times 2 \times 2$ grid of GIMPs by default.

```json
"Initial GIMP distribution": {
    "Initial GIMP distribution x": 0.8,
    "Initial GIMP distribution y": 0.8,
    "Initial GIMP distribution z": 0.8
}
```

<div class="small-table" markdown>

| Field | Type | Description |
|---|---|---|
| `Initial GIMP distribution x`, `y`, `z` | number (m) | Extent of the GIMP-filled volume along each axis. In both tutorials this matches `Mesh.domain size *`, i.e. the GIMPs fill the whole domain. |

</div>

## Boundary conditions

Per-face kinematic conditions and optional per-DOF fixes. Faces that are not listed are treated as free surfaces - in particular the top (+z) face is never written and is always free.

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

<div class="small-table" markdown>

| Field | Type | Description |
|---|---|---|
| `neg x-plane`, `pos x-plane`, `neg y-plane`, `pos y-plane` | string | Condition on each lateral face. Both tutorials use `"roller"`, which fixes the displacement normal to the face and leaves in-plane motion free. |
| `neg z-plane` | string | Condition on the base. Both tutorials use `"roller"`. |
| `x dof`, `y dof` | string | Optional global DOF constraint applied to every node. Both tutorials set these to `"fixed"` to keep the problem one-dimensional in compression. |

</div>

## Material

Specifies how many soil layers the model contains and, for each layer, the constitutive type and properties.

```json
"Material": {
    "number of layers": 1,
    "layers": [
        {
            "type": "Elastic",
            "empirical data": "homogeneous elastic",
            "assigned material properties": {"E": 1000.0, "nu": 0.0, "rho": 50.0}
        }
    ]
}
```

<div class="small-table" markdown>

| Field | Type | Description |
|---|---|---|
| `number of layers` | integer | Number of distinct material layers. Both tutorials use `1`. |
| `layers` | array of objects | One object per layer; the sub-fields below apply to each entry. |
| `type` | string | Constitutive model. Both tutorials use `"Elastic"`. |
| `empirical data` | string | Preset that supplies any empirically-calibrated parameters not listed below. Both tutorials use `"homogeneous elastic"`. |
| `assigned material properties.E` | number (Pa) | Young's modulus. Tutorial 1: `1000.0`. Tutorial 2: `1.0e6`. |
| `assigned material properties.nu` | number | Poisson's ratio. Both tutorials use `0.0`. |
| `assigned material properties.rho` | number (kg/m³) | Density. Tutorial 1: `50.0` (gravity-driven). Omitted in Tutorial 2 (no gravity). |

</div>

## Rigid body

Optional. Describes the geometry, position and contact parameters of a rigid body in contact with the deformable material. Used by [Tutorial 2](../TutorialProblems/Tutorial_2_input_data.md) only.

```json
"Rigid body": {
    "geometry": "cube.stl",
    "initial position z": 0.8,
    "prescribed displacement z": -0.2,
    "normal penalty factor": 1000
}
```

<div class="small-table" markdown>

| Field | Type | Description |
|---|---|---|
| `geometry` | string | Path to the STL describing the body, relative to the input file. Tutorial 2 uses `"cube.stl"`. |
| `initial position z` | number (m) | Initial z-position of the rigid body's lower face. |
| `prescribed displacement z` | number (m) | Total vertical displacement applied over `Solver.number of increments` steps. |
| `normal penalty factor` | number | Penalty stiffness scaling that enforces non-penetration. Definition and tuning discussed in [Tutorial 2's Background](../TutorialProblems/Tutorial_2.md#background-rigid-body-contact) and the [normal-contact weak form](../TechnicalReferences/StaticWeakFormNormalContact.md). |

</div>

## Solver

Selects the solve type, how the loading is applied and the number of load increments.

```json
"Solver": {
    "solve type": "static",
    "load type": "rigid body displacement",
    "number of increments": 20
}
```

<div class="small-table" markdown>

| Field | Type | Description |
|---|---|---|
| `solve type` | string | Both tutorials use `"static"`. |
| `load type` | string | How the load is applied. Tutorial 1: `"force"` (gravity body force). Tutorial 2: `"rigid body displacement"`. |
| `number of increments` | integer | Number of pseudo-time / load increments. Both tutorials use `20`. |

</div>

## Output Data

Switches the supported output streams on or off and supplies a stem string used to name text-output files.

```json
"Output Data": {
    "vtu data": "yes",
    "vtk data": "yes",
    "text data": "contact cube"
}
```

<div class="small-table" markdown>

| Field | Type | Description |
|---|---|---|
| `vtu data` | string | Set to `"yes"` to write VTU files for visualisation in ParaView / VisIt. |
| `vtk data` | string | Set to `"yes"` to write VTK files. |
| `text data` | string | Stem used for tabulated text output. Tutorial 1: `"column validation"`. Tutorial 2: `"contact cube"`. |

</div>