# Rolling sphere - input_data_sphere.json

The complete `input_data_sphere.json` for [Tutorial 5](Tutorial_5.md), also included with MPM3S in `validation_data_and_jsons`. Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat/index.md) page. **Click the numbers** in the file to see what each part does, with links to the tutorial's explanation and to the format reference for those keys.

It needs the sphere geometry `sphere.stl` and its mesh cache `sphere_mesh.txt` in the same folder; both are in `validation_data_and_jsons`.

``` { .json .annotate }
{
    "GPU": "off", // (1)!

    "domain": { // (2)!
        "gravity": [6.93672, 0.0, -6.93672]
    },

    "material points": { // (3)!
        "extra capacity": 1.2,
        "element size": 0.8,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [12.8, 1.6] },
        "layers": [
            {
                "thickness": 0.8,
                "material": { "type": "elastic", "E": 1.0e9, "nu": 0.0, "density": 1000.0 }
            }
        ]
    },

    "rigid bodies": [ // (4)!
        {
            "offset": [1.5, 0.8, 1.8], // (5)!
            "points": [ // (6)!
                { "position": [0.0, 0.0, 0.0], "mass": 5000.0, "rotational inertia": [2000.0, 2000.0, 2000.0],
                  "boundary conditions": ["free", "fixed", "free", "fixed", "free", "fixed"] }
            ],
            "stl files": [ // (7)!
                { "name": "sphere", "stl": "sphere.stl", "mesh cache": "sphere_mesh.txt", "point": 1 }
            ]
        }
    ],

    "contact": { // (8)!
        "friction coefficient": 0.2
    },

    "analysis": [ // (9)!
        {
            "type": "dynamic",
            "dt": 0.005,
            "final time": 1.0,
            "beta": 0.5,
            "gamma": 1.0,
            "rigid bodies": "on",
            "rigid body surface placement": "on",
            "adaptivity": {
                "type": "rigid body surface",
                "element size": 0.025
            },
            "boundary conditions": { "min": ["fixed", "roller", "fixed"], "max": ["fixed", "roller", "free"] },
            "boundary track": {
                "min": { "type": ["fixed", "off", "off"], "distance": [0.0, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["yes", "no", "no"] },
                "max": { "type": ["fixed", "off", "off"], "distance": [1.0, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["no", "no", "no"] }
            }
        }
    ],

    "solver": { // (10)!
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 10.0,
        "ghost factor mass": 0.25
    },

    "output": { // (11)!
        "vtk": "on",
        "vtk directory": "vtk_sphere_mu0.2",
        "vtk percent": 0,

        "csv": "on",
        "csv directory": "csv_sphere_mu0.2",
        "csv percent": 0,
        "csv material point fields": [],
        "csv rigid body fields": ["position", "velocity", "acceleration", "angular velocity"]
    }
}
```

1.  Runs on the CPU. [Machine →](Tutorial_5.md#machine) · [GPU →](../UsingTheSoftware/InputFormat/gpu.md)
2.  Gravity tilted $45^\circ$ towards $+x$, modelling the slope on a level grid. [Domain →](Tutorial_5.md#domain) · [Domain →](../UsingTheSoftware/InputFormat/domain.md)
3.  One $0.8$ m stiff elastic layer, $12.8 \times 1.6$ m. [Material points →](Tutorial_5.md#material-points) · [Material points →](../UsingTheSoftware/InputFormat/material_points.md)
4.  One system: the sphere. [Rigid body →](Tutorial_5.md#rigid-body) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
5.  Places the sphere's centre at $(1.5, 0.8, 1.8)$ m, resting on the material domain. [Rigid body →](Tutorial_5.md#rigid-body) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
6.  One point at the sphere's centre, free to move in $x$ and $z$ and to rotate about $y$. [Rigid body →](Tutorial_5.md#rigid-body) · [Points →](../UsingTheSoftware/InputFormat/rigid_bodies.md#points)
7.  `sphere.stl`, drawn centred on the origin. [Rigid body →](Tutorial_5.md#rigid-body) · [STL files →](../UsingTheSoftware/InputFormat/rigid_bodies.md#stl-files)
8.  $\mu = 0.2$: the sphere slips as it rolls. [Contact →](Tutorial_5.md#contact) · [Contact →](../UsingTheSoftware/InputFormat/contact.md)
9.  One dynamic stage, $1$ s in steps of $0.005$ s, with the mesh refined around the sphere and a boundary track following it. [Analysis →](Tutorial_5.md#analysis) · [Boundary track →](../UsingTheSoftware/InputFormat/analysis.md#boundary-track)
10.  Tolerance $10^{-6}$ and 20 iterations; ghost factors $10.0$ and $0.25$. [Solver →](Tutorial_5.md#solver) · [Solver →](../UsingTheSoftware/InputFormat/solver.md)
11.  A VTK frame at every step; the sphere's motion in `rigid_body.csv`. [Output →](Tutorial_5.md#output) · [Output →](../UsingTheSoftware/InputFormat/output.md)
