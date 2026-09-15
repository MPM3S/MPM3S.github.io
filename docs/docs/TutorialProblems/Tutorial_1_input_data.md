# Self-weight column - input_data.json

The complete `input_data.json` for [Tutorial 1](Tutorial_1.md). Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat.md) page.

```json
{
    "GPU": "off",

    "domain update": "stretch",

    "domain": {
        "size": 0.1,
        "gravity": [0.0, 0.0, -9.81]
    },

    "material points": {
        "extra capacity": 1.2,
        "element size": 0.05,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [0.05, 0.05] },
        "layers": [
            {
                "thickness": 0.8,
                "material": { "type": "elastic", "E": 283.0, "nu": 0.0, "density": 50.0 }
            }
        ]
    },

    "rigid bodies": [],

    "contact": {
        "friction coefficient": 0.0
    },

    "analysis": [
        {
            "type": "static",
            "load steps": 50,
            "load": "gravity ramp",
            "rigid bodies": "off",
            "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "free"] }
        }
    ],

    "solver": {
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 0.0,
        "ghost factor mass": 0.0
    },

    "output": {
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
