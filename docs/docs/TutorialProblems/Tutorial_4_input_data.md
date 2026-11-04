# Plough - input_data_plough_dr44.json

The complete `input_data_plough_dr44.json` for [Tutorial 4](Tutorial_4.md), also included with MPM3S in `validation_data_and_jsons`. Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat/index.md) page. **Click the numbers** in the file to see what each part does, with links to the tutorial's explanation and to the format reference for those keys.

It needs the plough geometry - `plough.stl` and `plough_mesh.txt` - in the same folder; both are in `validation_data_and_jsons`.

``` { .json .annotate }
{
    "GPU": "on", // (1)!

    "domain": { // (2)!
        "gravity": [0.0, 0.0, -9.81]
    },

    "material points": { // (3)!
        "extra capacity": 1.2,
        "element size": 5.0,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [100.0, 20.0] },
        "layers": [
            {
                "thickness": 20.0,
                "material": { "type": "willam warnke",
                              "E": 2.64e7, "nu": 0.25,
                              "friction angle": 33.5, "dilation angle": 3.5, "cohesion": 300.0,
                              "density": 1676.0,
                              "E overburden": { "reference stress": 223183.0, "exponent": 0.5625 } }
            }
        ]
    },

    "rigid bodies": [ // (4)!
        {
            "offset": [5.0, 0.0, 20.0], // (5)!
            "points": [ // (6)!
                { "position": [4.549060, 0.0, 1.244252], "mass": 1.0, "rotational inertia": [1.0, 1.0, 1.0],
                  "boundary conditions": ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }
            ],
            "stl files": [ // (7)!
                { "name": "plough", "stl": "plough.stl", "mesh cache": "plough_mesh.txt", "point": 1 }
            ]
        }
    ],

    "contact": { // (8)!
        "friction coefficient": 0.3
    },

    "analysis": [ // (9)!
        { // (10)!
            "type": "static",
            "load steps": 5,
            "load": "gravity ramp",
            "rigid bodies": "off",
            "adaptivity": { "type": "uniform" },
            "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
        },
        { // (11)!
            "type": "dynamic",
            "dt": 0.05,
            "final time": 79.3,
            "beta": 0.5,
            "gamma": 1.0,
            "rigid bodies": "on",
            "rigid body surface placement": "on",
            "adaptivity": { "type": "rigid body surface", "element size": 0.05 },
            "rigid body boundary conditions": [
                { "system": 1, "point": 1,
                  "boundary conditions": [{ "prescribed": 0.01 }, "fixed", { "prescribed": -0.0011664565 }, "fixed", "fixed", "fixed"] }
            ],
            "boundary conditions": { "min": ["fixed", "roller", "fixed"], "max": ["roller", "roller", "fixed"] },
            "boundary track": {
                "min": { "type": ["fixed", "off", "off"], "distance": [5.0, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["yes", "no", "no"] },
                "max": { "type": ["fixed", "off", "off"], "distance": [10.0, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["no", "no", "no"] }
            }
        },
        { // (12)!
            "type": "dynamic",
            "dt": 0.05,
            "final time": 250.0,
            "beta": 0.5,
            "gamma": 1.0,
            "rigid bodies": "on",
            "rigid body surface placement": "off",
            "adaptivity": { "type": "rigid body surface", "element size": 0.05 },
            "rigid body boundary conditions": [
                { "system": 1, "point": 1,
                  "boundary conditions": [{ "prescribed": 0.005 }, "fixed", "fixed", "fixed", "fixed", "fixed"] }
            ],
            "boundary conditions": { "min": ["fixed", "roller", "fixed"], "max": ["roller", "roller", "fixed"] },
            "boundary track": {
                "min": { "type": ["fixed", "off", "off"], "distance": [5.0, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["yes", "no", "no"] },
                "max": { "type": ["fixed", "off", "off"], "distance": [10.0, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["no", "no", "no"] }
            }
        }
    ],

    "solver": { // (13)!
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 0.025,
        "ghost factor mass": 0.25
    },

    "output": { // (14)!
        "vtk": "off",

        "csv": "on",
        "csv directory": "csv_plough_dr44",
        "csv percent": 0.25,
        "csv material point fields": ["initial position", "position", "stress"],
        "csv rigid body fields": ["position", "velocity", "reaction force", "reaction moment"]
    }
}
```

1.  Runs on an NVIDIA GPU. [Machine →](Tutorial_4.md#machine) · [GPU →](../UsingTheSoftware/InputFormat/gpu.md)
2.  Gravity in $-z$; the background mesh is a $102.4$ m cube. [Domain →](Tutorial_4.md#domain) · [Domain →](../UsingTheSoftware/InputFormat/domain.md)
3.  One $20$ m layer of dry Willam-Warnke sand at $D_r = 44\%$, $100 \times 20$ m, with $5$ m base elements (rounded to $3.2$ m). [Material points →](Tutorial_4.md#material-points) · [Material points →](../UsingTheSoftware/InputFormat/material_points.md)
4.  One system: the plough. [Rigid body →](Tutorial_4.md#rigid-body) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
5.  Moves the plough $5$ m in $+x$, leaving $5$ m of soil behind it, and up to about the soil surface. [Rigid body →](Tutorial_4.md#rigid-body) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
6.  One point at the plough's centroid, fixed, with a nominal mass: the stages prescribe its motion. [Rigid body →](Tutorial_4.md#rigid-body) · [Points →](../UsingTheSoftware/InputFormat/rigid_bodies.md#points)
7.  The plough surface, share in $+x$, centred on the plane of symmetry. [Rigid body →](Tutorial_4.md#rigid-body) · [STL files →](../UsingTheSoftware/InputFormat/rigid_bodies.md#stl-files)
8.  Coulomb friction, $\mu = 0.3$. [Contact →](Tutorial_4.md#contact) · [Contact →](../UsingTheSoftware/InputFormat/contact.md)
9.  Three stages, run in order. [Stage 1 →](Tutorial_4.md#stage-1-initial-stresses) · [Analysis stages →](../UsingTheSoftware/InputFormat/analysis.md)
10.  Stage 1, static, plough off: gravity ramped up over 5 load steps on a uniform mesh. [Stage 1: initial stresses →](Tutorial_4.md#stage-1-initial-stresses) · [Adaptivity →](../UsingTheSoftware/InputFormat/analysis.md#adaptivity)
11.  Stage 2, dynamic, $79.3$ s: the plough is placed on the surface, then moves $0.01$ m forward and $0.0011665$ m down every $0.05$ s step, reaching $1.85$ m deep after two plough lengths. [Stage 2: penetration →](Tutorial_4.md#stage-2-penetration) · [Rigid body boundary conditions →](../UsingTheSoftware/InputFormat/analysis.md#rigid-body-boundary-conditions)
12.  Stage 3, dynamic, $250$ s: the plough moves $0.005$ m forward every $0.05$ s step, level, for $25$ m. [Stage 3: horizontal penetration →](Tutorial_4.md#stage-3-horizontal-penetration) · [Boundary track →](../UsingTheSoftware/InputFormat/analysis.md#boundary-track)
13.  Tolerance $10^{-6}$ and 20 iterations, with ghost stabilisation of poorly filled elements. [Solver →](Tutorial_4.md#solver) · [Solver →](../UsingTheSoftware/InputFormat/solver.md)
14.  CSV files only, every $0.25\%$ of each stage's steps. [Output →](Tutorial_4.md#output) · [Output →](../UsingTheSoftware/InputFormat/output.md)
