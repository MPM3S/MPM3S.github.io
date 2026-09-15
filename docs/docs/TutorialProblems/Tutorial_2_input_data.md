# Compaction via a rigid body - input_data.json

The complete `input_data.json` for [Tutorial 2](Tutorial_2.md). Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat.md) page.

```json
{
    "GPU": "off",

    "domain update": "stretch",

    "domain": {
        "size": 1.6,
        "gravity": [0.0, 0.0, -9.81]
    },

    "material points": {
        "extra capacity": 1.2,
        "element size": 0.4,
        "number of material points per element 1": 2,
        "material size": { "min": [0.0, 0.0], "max": [0.8, 0.8] },
        "layers": [
            {
                "thickness": 0.8,
                "material": { "type": "elastic", "E": 1.0e6, "nu": 0.0, "density": 1000.0 }
            }
        ]
    },

    "rigid bodies": [
        {
            "points": [
                { "position": [0.4, 0.5, 1.3], "mass": 1.0, "rotational inertia": [0.2, 0.2, 0.24],
                  "boundary conditions": ["fixed", "fixed", { "prescribed": -0.01 }, "fixed", "fixed", "fixed"] }
            ],
            "stl files": [
                { "name": "platen", "stl": "platen.stl", "mesh cache": "platen_mesh.txt", "point": 1 }
            ]
        }
    ],

    "contact": {
        "friction coefficient": 0.0
    },

    "analysis": [
        {
            "type": "static",
            "load steps": 20,
            "load": "full",
            "rigid bodies": "on",
            "rigid body surface placement": "on",
            "boundary conditions": { "min": ["roller", "roller", "roller"], "max": ["roller", "roller", "free"] }
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
        "vtk directory": "vtk_cube",
        "vtk percent": 0,
        "vtk material point fields": ["displacement", "stress", "strain"],
        "vtk rigid body fields": ["position", "reaction force"],

        "csv": "on",
        "csv directory": "csv_cube",
        "csv percent": 0,
        "csv material point fields": ["initial position", "position", "lp", "stress"],
        "csv rigid body fields": ["position", "reaction force"]
    }
}
```

## platen.stl

The rigid platen is a $1.2 \times 1.2 \times 1.0$ m box, drawn in global coordinates with its base on the top of the soil at $z = 0.8$ m. Save the text below as `platen.stl` in the same folder as `input_data.json`. `platen_mesh.txt` is generated from it on the first run.

```text
solid platen
  facet normal 0 0 -1
    outer loop
      vertex -0.2 -0.1 0.8
      vertex -0.2 1.1 0.8
      vertex 1.0 1.1 0.8
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex -0.2 -0.1 0.8
      vertex 1.0 1.1 0.8
      vertex 1.0 -0.1 0.8
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex -0.2 -0.1 1.8
      vertex 1.0 -0.1 1.8
      vertex 1.0 1.1 1.8
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex -0.2 -0.1 1.8
      vertex 1.0 1.1 1.8
      vertex -0.2 1.1 1.8
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex -0.2 -0.1 0.8
      vertex 1.0 -0.1 0.8
      vertex 1.0 -0.1 1.8
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex -0.2 -0.1 0.8
      vertex 1.0 -0.1 1.8
      vertex -0.2 -0.1 1.8
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex -0.2 1.1 0.8
      vertex -0.2 1.1 1.8
      vertex 1.0 1.1 1.8
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex -0.2 1.1 0.8
      vertex 1.0 1.1 1.8
      vertex 1.0 1.1 0.8
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex -0.2 -0.1 0.8
      vertex -0.2 -0.1 1.8
      vertex -0.2 1.1 1.8
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex -0.2 -0.1 0.8
      vertex -0.2 1.1 1.8
      vertex -0.2 1.1 0.8
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 1.0 -0.1 0.8
      vertex 1.0 1.1 0.8
      vertex 1.0 1.1 1.8
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 1.0 -0.1 0.8
      vertex 1.0 1.1 1.8
      vertex 1.0 -0.1 1.8
    endloop
  endfacet
endsolid platen
```
