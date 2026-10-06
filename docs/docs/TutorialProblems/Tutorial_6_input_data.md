# Drag anchor - input_data.json

The complete `input_data.json` for [Tutorial 6](Tutorial_6.md). Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat.md) page.

The run folder also needs the anchor geometry - `fluke_round_nose.stl`, `fluke_round_nose_mesh.txt`, `shank_scv2.stl` and `shank_scv2_mesh.txt` - from the top level of the S3-MPM repository.

```json
{
    "GPU": "on",

    "domain": {
        "size": 2.0,
        "gravity": [0.0, 0.0, -9.81]
    },

    "material points": {
        "extra capacity": 1.2,
        "element size": 4.0,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [100, 10] },
        "layers": [
            {
                "thickness": 18.123,
                "material": { "type": "willam warnke",
                              "E": 2.4e6, "nu": 0.25,
                              "friction angle": 28.5, "dilation angle": 0.0, "cohesion": 300.0,
                              "density": 925.4,
                              "E overburden": { "reference stress": 1.913e5, "exponent": 0.6875 } }
            }
        ]
    },

    "rigid bodies": [
        {
            "offset": [1.0, 0.0, 0.0],
            "points": [
                { "position": [0.62, 0.0, 0.0], "mass": 3291.60, "rotational inertia": [275.0, 275.0, 275.0],
                  "boundary conditions": ["free", "fixed", "free", "fixed", "free", "fixed"] },
                { "position": [1.7592, 0.0, 0.0], "mass": 1058.40, "rotational inertia": [337.5, 337.5, 337.5],
                  "boundary conditions": ["free", "fixed", "free", "fixed", "free", "fixed"] },
                { "position": [12.5294, 0.0, 0.0], "mass": 1.0, "rotational inertia": [1.0e-6, 1.0e-6, 1.0e-6],
                  "boundary conditions": ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }
            ],
            "constraints": [
                { "type": "rotation lock", "points": [1, 2],
                  "rotation centre": [0.489, 0.0, 0.0],
                  "direction 1": [0.0, 1.0, 0.0],
                  "direction 2": [0.0, 1.0, 0.0],
                  "stiffness": 1.0e9, "rotational stiffness": 1.0e8 },

                { "type": "distance stop", "points": [1, 2],
                  "rotation centre": [0.489, 0.0, 0.0],
                  "position 1": [0.62, 0.0, 0.0],
                  "position 2": [0.62, 0.0, 0.0],
                  "angle limit": 35, "stiffness": 8.5814e9 },

                { "type": "distance lock", "points": [2, 3],
                  "position 1": [3.0294, 0.0, 0.0],
                  "position 2": [12.5294, 0.0, 0.0],
                  "distance": 9.5, "stiffness": 1.0526e9 }
            ],
            "stl files": [
                { "name": "fluke", "stl": "fluke_round_nose.stl",
                  "mesh cache": "fluke_round_nose_mesh.txt", "point": 1 },
                { "name": "shank", "stl": "shank_scv2.stl",
                  "mesh cache": "shank_scv2_mesh.txt", "point": 2 }
            ]
        }
    ],

    "contact": {
        "friction coefficient": 0.45
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
            "type": "dynamic",
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
            "type": "dynamic",
            "dt": 8.0e-2,
            "final time": 3.0,
            "beta": 0.5,
            "gamma": 1.0,
            "rigid bodies": "on",
            "rigid body surface placement": "off",
            "adaptivity": {
                "type": "rigid body surface",
                "element size": 0.1
            },
            "rigid body boundary conditions": [
                { "system": 1, "point": 3, "boundary conditions": [{ "prescribed": 0.008 }, "fixed", "fixed", "fixed", "fixed", "fixed"] }
            ],
            "boundary conditions": { "min": ["fixed", "roller", "fixed"], "max": ["roller", "roller", "fixed"] },
            "boundary track": {
                "min": { "type": ["fixed", "off", "off"], "distance": [0.5, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["yes", "no", "no"] },
                "max": { "type": ["fixed", "off", "off"], "distance": [5.0, 0.0, 0.0], "advance": ["positive", "positive", "positive"], "remove": ["no", "no", "no"] }
            }
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
        "vtk directory": "vtk_AC14",
        "vtk percent": 0.25,
        "vtk material point fields": ["displacement", "velocity", "stress", "strain", "volume"],
        "vtk rigid body fields": ["position", "velocity", "reaction force"],

        "csv": "on",
        "csv directory": "csv_AC14",
        "csv percent": 0.25,
        "csv material point fields": ["initial position", "position", "stress"],
        "csv rigid body fields": ["position", "velocity", "reaction force", "reaction moment"]
    }
}
```
