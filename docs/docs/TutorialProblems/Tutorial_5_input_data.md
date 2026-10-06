# Rolling sphere - input_data.json

The complete `input_data.json` for [Tutorial 5](Tutorial_5.md). Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat.md) page.

The run folder also needs the sphere geometry `sphere.stl` and its mesh cache `sphere_mesh.txt`, from the top level of the S3-MPM repository.

```json
{
    "GPU": "off",

    "domain": {
        "size": 12.8,
        "gravity": [6.93672, 0.0, -6.93672]
    },

    "material points": {
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

    "rigid bodies": [
        {
            "offset": [1.5, 0.8, 1.8],
            "points": [
                { "position": [0.0, 0.0, 0.0], "mass": 5000.0, "rotational inertia": [2000.0, 2000.0, 2000.0],
                  "boundary conditions": ["free", "fixed", "free", "fixed", "free", "fixed"] }
            ],
            "stl files": [
                { "name": "sphere", "stl": "sphere.stl", "mesh cache": "sphere_mesh.txt", "point": 1 }
            ]
        }
    ],

    "contact": {
        "friction coefficient": 0.0
    },

    "analysis": [
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

    "solver": {
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 10.0,
        "ghost factor mass": 0.25
    },

    "output": {
        "vtk": "on",
        "vtk directory": "vtk_sphere_mu0.0",
        "vtk percent": 0,

        "csv": "on",
        "csv directory": "csv_sphere_mu0.0",
        "csv percent": 0,
        "csv material point fields": [],
        "csv rigid body fields": ["position", "velocity", "acceleration", "angular velocity"]
    }
}
```
