# Rigid bodies

The `"rigid bodies"` key defines the structures that interact with the soil. Their friction is set separately, in [contact properties](contact.md). The status labels are explained on the [format overview](index.md#how-to-read-these-pages).

A list of rigid-body **systems**. Use `"rigid bodies": []` for an analysis without bodies.

Each system is built from **points**: 6-degree-of-freedom frames (3 displacements, 3 rotations) that carry mass and inertia. STL surfaces are welded to a point, several points can be joined by **constraints**, and a point without any geometry acts as a handle - for example the end of a towing line.

```json
"rigid bodies": [
    {
        "offset": [7.0, 0.0, 0.0],
        "points": [
            { "position": [-3.899, 0.0, -2.9891], "mass": 8886.6, "rotational inertia": [31288.2, 31288.2, 31288.2],
              "boundary conditions": ["free", "fixed", "free", "fixed", "free", "fixed"] },
            { "position": [25.8895, 0.0, -4.3353], "mass": 1.0, "rotational inertia": [1.0e-6, 1.0e-6, 1.0e-6],
              "boundary conditions": ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }
        ],
        "constraints": [
            { "type": "distance lock", "points": [1, 2],
              "position 1": [0.0, 0.0, 0.0], "position 2": [25.8895, 0.0, -4.3353],
              "distance": 26.25, "stiffness": 3.8e8 }
        ],
        "stl files": [
            { "name": "anchor", "stl": "bruce_razor.stl", "mesh cache": "bruce_razor_mesh.txt", "point": 1 }
        ],
        "tracked nodes": [
            { "position": [-1.778, 0.785, -3.704], "point": 1 }
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

## Points

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

These are the conditions for every stage, unless a stage replaces them with its own [`"rigid body boundary conditions"`](analysis.md#rigid-body-boundary-conditions) - for example to hold a body still while the soil settles and then pull it.

A point with no STL surface, such as a pull point, has nothing to resist its motion except its own mass and inertia, so either prescribe or fix its degrees of freedom, or give it mass.

## Constraints

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

A weld is a rotation lock plus a second rotation lock about a non-parallel axis. [Tutorial 6](../../TutorialProblems/Tutorial_6.md#problem-description) uses a hinge, an angle stop and a pull line together.

## STL files

<div class="small-table" markdown>

| Key             | Status   | Type    | Default | Description                                                                                                                                                  |
|-----------------|----------|---------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"stl"`         | Required | string  | -       | STL file, relative to the folder containing the input file. It must be a closed surface. Its coordinates are global and are never scaled or recentred.      |
| `"mesh cache"`  | Required | string  | -       | File holding the tetrahedral mesh generated from the STL, relative to the input file. Written if it does not exist and reused if it does - **delete it whenever the STL changes**. |
| `"point"`       | Required | integer | -       | The point the surface is welded to. A point may carry several surfaces.                                                                                     |
| `"name"`        | Ignored  | string  | -       | A label for your own reference.                                                                                                                               |

</div>

## Tracked nodes

<div class="small-table" markdown>

| Key           | Status   | Type          | Default | Description                                                  |
|---------------|----------|---------------|---------|--------------------------------------------------------------|
| `"position"`  | Required | [x, y, z] (m) | -       | Global position of the marker at the start of the analysis.  |
| `"point"`     | Required | integer       | -       | The point it moves with.                                     |

</div>

Tracked nodes have no mass and no effect on the analysis. They are numbered in the output as `track1`, `track2`, ... and written to [`rigid_body.csv`](output.md#output-files) and `tracked_*.vtu`.
