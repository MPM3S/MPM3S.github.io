# Vertical penetration (Cone Penetration Test) - input_data_CPT_dr32.json

The complete `input_data_CPT_dr32.json` for [Tutorial 3](Tutorial_3.md), also included with MPM3S in `validation_data_and_jsons`. Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat/index.md) page. **Click the numbers** in the file to see what each part does, with links to the tutorial's explanation and to the format reference for those keys.

It needs the cone geometry `CPT.stl` and its mesh cache `CPT_mesh.txt` in the same folder; both are in `validation_data_and_jsons`.

``` { .json .annotate }
{
    "GPU" : "on", // (1)!

    "domain": { // (2)!
        "gravity": [0.0, 0.0, -9.81]
    },

    "material points": { // (3)!
        "extra capacity": 1.2,
        "element size": 2.0,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [10.0, 10.0] },
        "layers": [
            {
                "thickness": 20.0,
                "material": { "type": "willam warnke",
                              "E": 1.92e7, "nu": 0.25,
                              "friction angle": 32.0, "dilation angle": 2.0, "cohesion": 300.0,
                              "density": 1628.0,
                              "E overburden": { "reference stress": 2.12729e5, "exponent": 0.6 } }
            }
        ]
    },

    "rigid bodies": [ // (4)!
        {
            "offset": [-0.01, -0.01, 0.0], // (5)!
            "points": [ // (6)!
                { "position": [0.0, 0.0, 0.0], "mass": 39989.6, "rotational inertia": [1626001.9, 1626001.9, 3199.2],
                  "boundary conditions": ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }
            ],
            "stl files": [ // (7)!
                { "name": "cpt", "stl": "CPT.stl",
                  "mesh cache": "CPT_mesh.txt", "point": 1 }
            ]
        }
    ],

    "contact": { // (8)!
        "friction coefficient": 0.33
    },

    "analysis": [ // (9)!
        {
            "type": "static", // (10)!
            "load steps": 5,
            "load": "gravity ramp",
            "rigid bodies": "off",
            "adaptivity": { "type": "none" },
            "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
        },
        {
            "type": "static", // (11)!
            "load steps": 450,
            "load": "full",
            "rigid bodies": "on",
            "rigid body surface placement": "on",
            "adaptivity": {
                "type": "rigid body surface",
                "element size": 0.025
            },
            "rigid body boundary conditions": [
                { "system": 1, "point": 1, "boundary conditions": ["fixed", "fixed", { "prescribed": -0.01 }, "fixed", "fixed", "fixed"] }
            ],
            "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
        }
    ],

    "solver": { // (12)!
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 0.025,
        "ghost factor mass": 0.25
    },

    "output": { // (13)!
        "vtk": "on",
        "vtk directory": "vtk_CPT_dr32",
        "vtk percent": 0.5,
        "vtk material point fields": ["displacement", "velocity", "stress", "strain", "volume"],
        "vtk rigid body fields": ["position", "velocity", "reaction force"],

        "csv": "on",
        "csv directory": "csv_CPT_dr32",
        "csv percent": 0.25,
        "csv material point fields": ["initial position", "position", "stress"],
        "csv rigid body fields": ["position", "velocity", "reaction force", "reaction moment"]
    }
}
```

1.  Runs on an NVIDIA GPU: the $0.025$ m refinement around the cone creates many material points. [Machine →](Tutorial_3.md#machine) · [GPU →](../UsingTheSoftware/InputFormat/gpu.md)
2.  Gravity in $-z$; the background mesh is a $51.2$ m cube. [Domain →](Tutorial_3.md#domain) · [Domain →](../UsingTheSoftware/InputFormat/domain.md)
3.  One $20$ m layer of Willam-Warnke sand at $D_r = 32\%$, whose stiffness grows with depth. [Material points →](Tutorial_3.md#material-points) · [Stress-dependent stiffness →](../UsingTheSoftware/InputFormat/material_points.md#stress-dependent-stiffness)
4.  One system: the cone. [Rigid body →](Tutorial_3.md#rigid-body) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
5.  Shifts the cone $10$ mm in $-x$ and $-y$, so its axis sits just outside the corner of the soil. [Rigid body →](Tutorial_3.md#rigid-body) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
6.  One point at the cone tip, fully fixed; stage 2 replaces its vertical condition to push the cone. [Rigid body →](Tutorial_3.md#rigid-body) · [Points →](../UsingTheSoftware/InputFormat/rigid_bodies.md#points)
7.  `CPT.stl` and its mesh cache. [Rigid body →](Tutorial_3.md#rigid-body) · [STL files →](../UsingTheSoftware/InputFormat/rigid_bodies.md#stl-files)
8.  Coulomb friction, $\mu = 0.33$. [Contact →](Tutorial_3.md#contact) · [Contact →](../UsingTheSoftware/InputFormat/contact.md)
9.  Two stages, run in order. [Stage 1 →](Tutorial_3.md#stage-1-initial-stresses) · [Analysis stages →](../UsingTheSoftware/InputFormat/analysis.md)
10.  Stage 1, static, cone off: gravity ramped up over 5 load steps on the base mesh. [Stage 1: initial stresses →](Tutorial_3.md#stage-1-initial-stresses) · [Adaptivity →](../UsingTheSoftware/InputFormat/analysis.md#adaptivity)
11.  Stage 2, static, cone on: placed on the surface and pushed $0.01$ m per load step for 450 steps, with the mesh refined to $0.025$ m around it. [Stage 2: cone penetration →](Tutorial_3.md#stage-2-cone-penetration) · [Rigid body boundary conditions →](../UsingTheSoftware/InputFormat/analysis.md#rigid-body-boundary-conditions)
12.  Tolerance $10^{-6}$ and 20 iterations, with ghost stabilisation of poorly filled elements. [Solver →](Tutorial_3.md#solver) · [Solver →](../UsingTheSoftware/InputFormat/solver.md)
13.  VTK files every $0.5\%$ and CSV files every $0.25\%$ of each stage's steps. [Output →](Tutorial_3.md#output) · [Output →](../UsingTheSoftware/InputFormat/output.md)
