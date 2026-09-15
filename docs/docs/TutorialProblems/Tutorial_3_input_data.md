# Vertical penetration (Cone Penetration Test) - input_data.json

The complete `input_data.json` for [Tutorial 3](Tutorial_3.md). Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat.md) page.

The run folder also needs the cone geometry `CPT.stl` and its mesh cache `CPT_mesh.txt`, from the top level of the AMPSSIE repository.

```json
{
    "GPU" : "on",

    "domain": {
        "size": 10.0,
        "gravity": [0.0, 0.0, -9.81]
    },

    "material points": {
        "extra capacity": 1.2,
        "element size": 2.0,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [10.0, 10.0] },
        "layers": [
            {
                "thickness": 20.0,
                "material": { "type": "willam warnke",
                              "E": 2.28e7, "nu": 0.25,
                              "friction angle": 32.75, "dilation angle": 2.75, "cohesion": 300.0,
                              "density": 1652.0,
                              "E overburden": { "reference stress": 2.1785e5, "exponent": 0.58125 } }
            }
        ]
    },

    "rigid bodies": [
        {
            "offset": [-0.01, -0.01, 0.0],
            "points": [
                { "position": [0.0, 0.0, 0.0], "mass": 39989.6, "rotational inertia": [1626001.9, 1626001.9, 3199.2],
                  "boundary conditions": ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }
            ],
            "stl files": [
                { "name": "cpt", "stl": "CPT.stl",
                  "mesh cache": "CPT_mesh.txt", "point": 1 }
            ]
        }
    ],

    "contact": {
        "friction coefficient": 0.33
    },

    "analysis": [
        {
            "type": "static",
            "load steps": 5,
            "load": "gravity ramp",
            "rigid bodies": "off",
            "adaptivity": { "type": "uniform" },
            "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
        },
        {
            "type": "static",
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

    "solver": {
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 0.025,
        "ghost factor mass": 0.25
    },

    "output": {
        "vtk": "on",
        "vtk directory": "vtk_CPT_dr38",
        "vtk percent": 0.5,
        "vtk material point fields": ["displacement", "velocity", "stress", "strain", "volume"],
        "vtk rigid body fields": ["position", "velocity", "reaction force"],

        "csv": "on",
        "csv directory": "csv_CPT_dr38",
        "csv percent": 0.25,
        "csv material point fields": ["initial position", "position", "stress"],
        "csv rigid body fields": ["position", "velocity", "reaction force", "reaction moment"]
    }
}
```
