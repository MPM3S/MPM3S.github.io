# Self-weight column - input_data_gravity_column.json

The complete `input_data_gravity_column.json` for [Tutorial 1](Tutorial_1.md), also included with MPM3S in `validation_data_and_jsons`. Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat/index.md) page. **Click the numbers** in the file to see what each part does, with links to the tutorial's explanation and to the format reference for those keys.

``` { .json .annotate }
{
    "GPU": "off", // (1)!

    "domain update": "stretch", // (2)!

    "domain": { // (3)!
        "gravity": [0.0, 0.0, -10.0]
    },

    "material points": { // (4)!
        "extra capacity": 1.2,
        "element size": 3.125,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [3.125, 3.125] },
        "layers": [
            {
                "thickness": 50.0,
                "material": { "type": "elastic", "E": 1.0e4, "nu": 0.0, "density": 80.0 }
            }
        ]
    },

    "rigid bodies": [], // (5)!

    "contact": { // (6)!
        "friction coefficient": 0.0
    },

    "analysis": [ // (7)!
        {
            "type": "static",
            "load steps": 40,
            "load": "gravity ramp",
            "rigid bodies": "off",
            "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "free"] }
        }
    ],

    "solver": { // (8)!
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 0.0,
        "ghost factor mass": 0.0
    },

    "output": { // (9)!
        "vtk": "on",
        "vtk directory": "vtk_column",
        "vtk percent": 0,
        "vtk material point fields": ["displacement", "stress", "strain", "volume"],

        "csv": "on",
        "csv directory": "csv_column",
        "csv percent": 0,
        "csv material point fields": ["initial position", "position", "stress"],
        "csv rigid body fields": []
    }
}
```

1.  Runs on the CPU, which is plenty for a problem this small. [Machine →](Tutorial_1.md#machine) · [GPU →](../UsingTheSoftware/InputFormat/gpu.md)
2.  Lets the GIMP domains near the base shrink as the column is compressed. [Machine →](Tutorial_1.md#machine) · [Domain update →](../UsingTheSoftware/InputFormat/material_points.md#domain-update)
3.  Gravity in $-z$; the background mesh is sized automatically to hold the column. [Domain →](Tutorial_1.md#domain) · [Domain →](../UsingTheSoftware/InputFormat/domain.md)
4.  One $50$ m elastic layer on a $3.125 \times 3.125$ m footprint: $3.125$ m elements, each with $2 \times 2 \times 2$ GIMPs. [Material points →](Tutorial_1.md#material-points) · [Material points →](../UsingTheSoftware/InputFormat/material_points.md)
5.  There are no rigid bodies. [Rigid bodies and contact →](Tutorial_1.md#rigid-bodies-and-contact) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
6.  Required even with no bodies; it has no effect here. [Rigid bodies and contact →](Tutorial_1.md#rigid-bodies-and-contact) · [Contact →](../UsingTheSoftware/InputFormat/contact.md)
7.  One static stage: gravity ramped up over 40 load steps, rollers on the sides, a fixed base and a free top. [Analysis →](Tutorial_1.md#analysis) · [Analysis stages →](../UsingTheSoftware/InputFormat/analysis.md)
8.  Tolerance $10^{-6}$ and 20 iterations; ghost stabilisation is off, as the column fills its elements. [Solver →](Tutorial_1.md#solver) · [Solver →](../UsingTheSoftware/InputFormat/solver.md)
9.  VTK and CSV files at every load step. [Output →](Tutorial_1.md#output) · [Output →](../UsingTheSoftware/InputFormat/output.md)
