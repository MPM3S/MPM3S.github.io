# The `input_data.json` format

AMPSSIE drives every analysis from a single [JSON](https://en.wikipedia.org/wiki/JSON) file, named `input_data.json`. The file is one JSON object whose top-level keys correspond to the components of the model: the [mesh](#mesh), the [initial material-point distribution](#initial-gimp-distribution), the [boundary conditions](#boundary-conditions), the [constitutive description](#material), the [rigid body](#rigid-body), the [solver settings](#solver) and the [requested outputs](#output-data).

This page describes each of the sections in turn and gives a description of each of the options available for each section. This page is designed to act as a reference for constructing your own simulations, however for worked examples please see the [tutorial page](../TutorialProblems/TutorialProblems.md).



## Overall file format

The `input_data.json` file is split into seven section provided in the table below:

<div class="small-table" markdown>

| Key                           | Type   | Purpose                                                         | Required |
|-------------------------------|--------|-----------------------------------------------------------------|----------|
| `"Mesh"`                      | object | Domain extents and the background-grid element size.            | Yes      |
| `"Initial GIMP distribution"` | object | Extent of the initial material-point fill.                      | Yes      |
| `"Boundary conditions"`       | object | Per-face kinematic conditions and optional per-DOF fixes.       | Yes      |
| `"Material"`                  | object | Constitutive type and properties for each soil layer.           | Yes      |
| `"Rigid body"`                | object | Geometry, kinematics and contact parameters for the rigid body. | Optional |
| `"Solver"`                    | object | Solve type, load type and the number of increments.             | Yes      |
| `"Output Data"`               | object | VTU / VTK switches and a stem string for text output.           | Yes      |

</div>

These appear as headings in the [JSON](https://en.wikipedia.org/wiki/JSON) file:
```json
"Mesh":
{
    ...
},
"Initial GIMP distribution":
{
...
},
"Boundary conditions":
{
...
},
"Material":
{
...
},
"Rigid body":
{
...
},
"Solver":
{
    ...
},
"Output Data":
{
    ...
}
```
where the ```...``` indicating text.
## Mesh

The `Mesh` object sets the size of the background grid and the element size.

Example:
```json
"Mesh": {
    "domain size x": 0.8,
    "domain size y": 0.8,
    "domain size z": 0.8,
    "dx refined": 0.4
}
```

<div class="small-table" markdown>

| Field                                                   | Type       | Description                                         |
|---------------------------------------------------------|------------|-----------------------------------------------------|
| `"domain size x"`, `"domain size y"`, `"domain size z"` | number (m) | Length of the computational domain along each axis. |
| `"dx refined"`                                          | number (m) | Element size, uniform in $x$, $y$ and $z$.          |

</div>

## Initial GIMP distribution

Specifies the volume in which material points are initially placed. Each element contains a $2 \times 2 \times 2$ grid of GIMPs by default.

Example:
```json
"Initial GIMP distribution": {
    "Initial GIMP distribution x": 0.8,
    "Initial GIMP distribution y": 0.8,
    "Initial GIMP distribution z": 0.8
}
```

<div class="small-table" markdown>

| Field                                                                                             | Type       | Description                                                          |
|---------------------------------------------------------------------------------------------------|------------|----------------------------------------------------------------------|
| `"Initial GIMP distribution x"`, `"Initial GIMP distribution y"`, `"Initial GIMP distribution z"` | number (m) | Extent of the GIMP-filled volume along each axis.                    |
| `"number GIMP"`                                                                                   | number     | Optional, defines the number of GIMPs in each direction per element. |

</div>

## Boundary conditions

Mesh face and DOF boundary conditions. If the faces or DOFs are not listed, the default for both is `"free"`.

Example:
```json
"Boundary conditions": {
    "neg x-plane": "roller",
    "neg y-plane": "roller",
    "neg z-plane": "free",
    "pos x-plane": "roller",
    "pos y-plane": "roller",
    "pos z-plane": "fixed",
    "x dof": "fixed",
    "y dof": "fixed",
    "z dof": "free"
}
```

<div class="small-table" markdown>

| Field                                             | Type   | Options                         | Default  | Description                                                                                                                  |
|---------------------------------------------------|--------|---------------------------------|----------|------------------------------------------------------------------------------------------------------------------------------|
| `"neg x-plane"`, `"neg y-plane"`, `"neg z-plane"` | string | `"roller"`, `"free"`, `"fixed"` | `"free"` | Optional condition on each negative mesh face; the face location is set by the `domain size x/y/z` extents in [Mesh](#mesh). |
| `"pos x-plane"`, `"pos y-plane"`, `"pos z-plane"` | string | `"roller"`, `"free"`, `"fixed"` | `"free"` | Optional condition on each positive mesh face. Faces default to `"free"` if omitted from the JSON.                           |
| `"x dof"`, `"y dof"`, `"z dof"`                   | string | `"fixed"`, `"free"`             | `"free"` | Optional global DOF constraint applied to every node. Useful for keeping the problem one-dimensional in compression.         |

</div>

## Material

Specifies how many soil layers the model contains and, for each layer, the constitutive type and properties.

Example:
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

| Field                                | Type             | Description                                                                  |
|--------------------------------------|------------------|------------------------------------------------------------------------------|
| `"number of layers"`                 | integer          | Number of distinct material layers.                                          |
| `"layers"`                           | array of objects | One object per layer; the sub-fields below apply to each entry.              |
| `"type"`                             | string           | Constitutive model.                                                          |
| `"empirical data"`                   | string           | Preset that supplies any empirically-calibrated parameters not listed below. |
| `"assigned material properties.E"`   | number (Pa)      | Young's modulus. (Pa)                                                        |
| `"assigned material properties.nu"`  | number           | Poisson's ratio.                                                             |
| `"assigned material properties.rho"` | number (kg/m³)   | Density (kg/m$^3$).                                                          |

</div>

## Rigid body

Optional. Describes the geometry, position and contact parameters of a rigid body.

Example:
```json
"Rigid body": {
    "geometry": "cube.stl",
    "initial position z": 0.8,
    "prescribed displacement z": -0.2,
    "normal penalty factor": 1000
}
```

<div class="small-table" markdown>

| Field                                                                                       | Type       | Default            | Description                                                                                |
|---------------------------------------------------------------------------------------------|------------|--------------------|--------------------------------------------------------------------------------------------|
| `"geometry"`                                                                                | string     |                    | .stl file name, relative to the top-level AMPPSIE folder.                                  |
| `"initial position min x"`, `"initial position min y"`, `"initial position min z"`          | number (m) | .stl file location | Initial x/y/z-position of the rigid body's lowest point in the $x$, $y$ and $z$ direction. |
| `"prescribed displacement x"`, `"prescribed displacement y"`, `"prescribed displacement z"` | number (m) |                    | Total vertical displacement applied over `Solver.number of increments` steps.              |
| `"normal penalty factor"`                                                                   | number     |                    | Penalty stiffness scaling that enforces non-penetration.                                   |

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

| Field                    | Type    | Options                    | Description                              |
|--------------------------|---------|----------------------------|------------------------------------------|
| `"solve type"`           | string  | `"static"`                 | Turns on and off interia terms           |
| `"load type"`            | string  | `"force"`,`"displacement"` | How the load is applied.                 |
| `"number of increments"` | integer |                            | Number of pseudo-time / load increments. |

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

| Field         | Type   | Options                                  | Description                                                                                                                                                                                           |
|---------------|--------|------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"vtu data"`  | string | `"yes"`, `"no"`                          | Set to `"yes"` to write VTU files.                                                                                                                                                                    |
| `"vtk data"`  | string | `"yes"`, `"no"`                          | Set to `"yes"` to write VTK files.                                                                                                                                                                    |
| `"text data"` | string | `"contact cube"`, `"self-weight column"` | Stem used for tabulated text output. [Tutorial 1](../TutorialProblems/Tutorial_1_input_data.md): `"column validation"`. [Tutorial 2](../TutorialProblems/Tutorial_2_input_data.md): `"contact cube"`. |

</div>
