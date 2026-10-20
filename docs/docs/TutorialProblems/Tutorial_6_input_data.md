# Drag anchor - input_data_AC14_dr32.json

The complete `input_data_AC14_dr32.json` for [Tutorial 6](Tutorial_6.md), also included with MPM3S in `validation_data_and_jsons`. Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat/index.md) page. **Click the numbers** in the file to see what each part does, with links to the tutorial's explanation and to the format reference for those keys.

It needs the anchor geometry - `AC14_fluke_rot20.stl`, `AC14_fluke_rot20_mesh.txt`, `AC14_shank.stl` and `AC14_shank_mesh.txt` - in the same folder; all four are in `validation_data_and_jsons`.

``` { .json .annotate }
{
    "GPU": "on", // (1)!

    "domain": { // (2)!
        "gravity": [0.0, 0.0, -9.81]
    },

    "material points": { // (3)!
        "extra capacity": 1.2,
        "element size": 2.0,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [120.0, 10.0] },
        "layers": [
            {
                "thickness": 18.123,
                "material": { "type": "willam warnke",
                              "E": 1.92e7, "nu": 0.25,
                              "friction angle": 32.0, "dilation angle": 2.0, "cohesion": 300.0,
                              "density": 970.2,
                              "E overburden": { "reference stress": 212729.0, "exponent": 0.6 } }
            }
        ]
    },

    "rigid bodies": [ // (4)!
        {
            "offset": [1.0, 0.0, 0.0], // (5)!
            "points": [ // (6)!
                { "position": [0.6121, 0.0, -0.044805], "mass": 3291.6, "rotational inertia": [275.0, 275.0, 275.0],
                  "boundary conditions": ["free", "fixed", "free", "fixed", "free", "fixed"] },
                { "position": [1.7592, 0.0, 0.0], "mass": 1058.4, "rotational inertia": [337.5, 337.5, 337.5],
                  "boundary conditions": ["free", "fixed", "free", "fixed", "free", "fixed"] },
                { "position": [12.51226633, 0.0, -0.5703035], "mass": 1.0, "rotational inertia": [1.0e-6, 1.0e-6, 1.0e-6],
                  "boundary conditions": ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }
            ],
            "constraints": [ // (7)!
                { "type": "rotation lock", "points": [1, 2],
                  "rotation centre": [0.489, 0.0, 0.0],
                  "direction 1": [0.0, 1.0, 0.0],
                  "direction 2": [0.0, 1.0, 0.0],
                  "stiffness": 1.0e9, "rotational stiffness": 1.0e8 },

                { "type": "distance stop", "points": [1, 2],
                  "rotation centre": [0.489, 0.0, 0.0],
                  "position 1": [0.6121, 0.0, -0.044805],
                  "position 2": [0.62, 0.0, 0.0],
                  "angle limit": 35.0, "stiffness": 8.5814e9 },

                { "type": "distance lock", "points": [2, 3],
                  "position 1": [3.0294, 0.0, 0.0],
                  "position 2": [12.51226633, 0.0, -0.5703035],
                  "distance": 9.5, "stiffness": 1.0526e9 }
            ],
            "stl files": [ // (8)!
                { "name": "fluke", "stl": "AC14_fluke_rot20.stl",
                  "mesh cache": "AC14_fluke_rot20_mesh.txt", "point": 1 },
                { "name": "shank", "stl": "AC14_shank.stl",
                  "mesh cache": "AC14_shank_mesh.txt", "point": 2 }
            ],
            "tracked nodes": [ // (9)!
                { "position": [1.994, 0.6489, -0.5478], "point": 1 }
            ]
        }
    ],

    "contact": { // (10)!
        "friction coefficient": 0.45
    },

    "analysis": [ // (11)!
        {
            "type": "static", // (12)!
            "load steps": 5,
            "load": "gravity ramp",
            "rigid bodies": "off",
            "adaptivity": { "type": "uniform" },
            "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
        },
        {
            "type": "dynamic", // (13)!
            "dt": 5.0e-3,
            "final time": 1.0,
            "beta": 0.5,
            "gamma": 1.0,
            "rigid bodies": "on",
            "rigid body surface placement": "on",
            "adaptivity": {
                "type": "rigid body surface",
                "element size": 0.1
            },
            "boundary conditions": { "min": ["fixed", "roller", "fixed"], "max": ["roller", "roller", "fixed"] },
            "boundary track": {
                "min": { "type": ["fixed", "off", "off"], "distance": [0.5, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["yes", "no", "no"] },
                "max": { "type": ["fixed", "off", "off"], "distance": [2.5, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["no", "no", "no"] }
            }
        },
        {
            "type": "dynamic", // (14)!
            "dt": 0.04,
            "final time": 800.0,
            "beta": 0.5,
            "gamma": 1.0,
            "rigid bodies": "on",
            "rigid body surface placement": "off",
            "adaptivity": {
                "type": "rigid body surface",
                "element size": 0.1,
                "region": 0.06,
                "element size in region": 0.1
            },
            "rigid body boundary conditions": [
                { "system": 1, "point": 3, "boundary conditions": [{ "prescribed": 0.004 }, "fixed", "fixed", "fixed", "fixed", "fixed"] }
            ],
            "boundary conditions": { "min": ["fixed", "roller", "fixed"], "max": ["roller", "roller", "fixed"] },
            "boundary track": {
                "min": { "type": ["fixed", "off", "off"], "distance": [0.5, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["yes", "no", "no"] },
                "max": { "type": ["fixed", "off", "off"], "distance": [5.0, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["no", "no", "no"] }
            }
        }
    ],

    "solver": { // (15)!
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 0.025,
        "ghost factor mass": 0.25
    },

    "output": { // (16)!
        "vtk": "on",
        "vtk directory": "vtk_AC14_dr32",
        "vtk percent": 1.0,
        "vtk material point fields": ["displacement", "velocity", "stress", "strain", "volume"],
        "vtk rigid body fields": ["position", "velocity", "reaction force"],

        "csv": "on",
        "csv directory": "csv_AC14_dr32",
        "csv percent": 0.25,
        "csv material point fields": ["initial position", "position", "stress"],
        "csv rigid body fields": ["position", "velocity", "reaction force", "reaction moment"]
    }
}
```

1.  Runs on an NVIDIA GPU, as the reference simulations were run. [Machine →](Tutorial_6.md#machine) · [GPU →](../UsingTheSoftware/InputFormat/gpu.md)
2.  Gravity in $-z$; the background mesh is a $204.8$ m cube. [Domain →](Tutorial_6.md#domain) · [Domain →](../UsingTheSoftware/InputFormat/domain.md)
3.  One $18.123$ m layer of Willam-Warnke sand at $D_r = 32\%$, $120 \times 10$ m, with $2.0$ m base elements. [Material points →](Tutorial_6.md#material-points) · [Material points →](../UsingTheSoftware/InputFormat/material_points.md)
4.  One system: the anchor. [Rigid body: points →](Tutorial_6.md#rigid-body-points) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
5.  Moves the anchor $1$ m in $+x$, so it does not overhang the soil. [Rigid body: points →](Tutorial_6.md#rigid-body-points) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
6.  Point 1 is the fluke, point 2 the shank and point 3 the pull point. [Rigid body: points →](Tutorial_6.md#rigid-body-points) · [Points →](../UsingTheSoftware/InputFormat/rigid_bodies.md#points)
7.  The hinge, the opening-angle stop and the pull line. [Rigid body: constraints →](Tutorial_6.md#rigid-body-constraints) · [How the constraints work →](../UsingTheSoftware/InputFormat/rigid_bodies.md#how-the-constraints-work)
8.  The fluke, turned $20^\circ$ tip-down, and the shank. [Rigid body: geometry →](Tutorial_6.md#rigid-body-geometry) · [STL files →](../UsingTheSoftware/InputFormat/rigid_bodies.md#stl-files)
9.  A marker at the fluke tip, written to `rigid_body.csv`. [Rigid body: geometry →](Tutorial_6.md#rigid-body-geometry) · [Tracked nodes →](../UsingTheSoftware/InputFormat/rigid_bodies.md#tracked-nodes)
10.  Coulomb friction, $\mu = 0.45$. [Contact →](Tutorial_6.md#contact) · [Contact →](../UsingTheSoftware/InputFormat/contact.md)
11.  Three stages, run in order. [Stage 1 →](Tutorial_6.md#stage-1-initial-stresses) · [Analysis stages →](../UsingTheSoftware/InputFormat/analysis.md)
12.  Stage 1, static, anchor off: gravity ramped up over 5 load steps on a uniform mesh. [Stage 1: initial stresses →](Tutorial_6.md#stage-1-initial-stresses) · [Adaptivity →](../UsingTheSoftware/InputFormat/analysis.md#adaptivity)
13.  Stage 2, dynamic, $1$ s: the anchor is placed on the surface and settles, and the boundary track starts. [Stage 2: settling →](Tutorial_6.md#stage-2-settling) · [Boundary track →](../UsingTheSoftware/InputFormat/analysis.md#boundary-track)
14.  Stage 3, dynamic, $800$ s: the pull point moves $0.004$ m every $0.04$ s step, dragging the anchor $80$ m. [Stage 3: drag →](Tutorial_6.md#stage-3-drag) · [Rigid body boundary conditions →](../UsingTheSoftware/InputFormat/analysis.md#rigid-body-boundary-conditions)
15.  Tolerance $10^{-6}$ and 20 iterations, with ghost stabilisation of poorly filled elements. [Solver →](Tutorial_6.md#solver) · [Solver →](../UsingTheSoftware/InputFormat/solver.md)
16.  VTK files every $1\%$ and CSV files every $0.25\%$ of each stage's steps. [Output →](Tutorial_6.md#output) · [Output →](../UsingTheSoftware/InputFormat/output.md)
