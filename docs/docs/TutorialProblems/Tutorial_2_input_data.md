# Compaction via a rigid body - input_data_compress.json

The complete `input_data_compress.json` for [Tutorial 2](Tutorial_2.md), also included with MPM3S in `validation_data_and_jsons`. Every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat/index.md) page. **Click the numbers** in the file to see what each part does, with links to the tutorial's explanation and to the format reference for those keys.

``` { .json .annotate }
{
    "GPU": "off", // (1)!

    "domain update": "stretch", // (2)!

    "domain": { // (3)!
        "gravity": [0.0, 0.0, 0.0]
    },

    "material points": { // (4)!
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

    "rigid bodies": [ // (5)!
        {
            "points": [ // (6)!
                { "position": [0.4, 0.4, 1.3], "mass": 1.0, "rotational inertia": [0.2, 0.2, 0.24],
                  "boundary conditions": ["fixed", "fixed", { "prescribed": -0.01 }, "fixed", "fixed", "fixed"] }
            ],
            "stl files": [ // (7)!
                { "name": "cube", "stl": "cube.stl", "mesh cache": "cube_mesh.txt", "point": 1 }
            ]
        }
    ],

    "contact": { // (8)!
        "friction coefficient": 0.0
    },

    "analysis": [ // (9)!
        {
            "type": "static",
            "load steps": 20,
            "load": "full",
            "rigid bodies": "on",
            "rigid body surface placement": "on",
            "boundary conditions": { "min": ["roller", "roller", "roller"], "max": ["roller", "roller", "free"] },
            "adaptivity": { "type": "uniform" }
        }
    ],

    "solver": { // (10)!
        "tolerance": 1.0e-6,
        "max newton iterations": 20,
        "poor factor": 0.25,
        "ghost factor": 0.0,
        "ghost factor mass": 0.0
    },

    "output": { // (11)!
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

1.  Runs on the CPU. [Machine →](Tutorial_2.md#machine) · [GPU →](../UsingTheSoftware/InputFormat/gpu.md)
2.  Lets the GIMP domains compress with the soil. [Machine →](Tutorial_2.md#machine) · [Domain update →](../UsingTheSoftware/InputFormat/material_points.md#domain-update)
3.  Gravity is zero: all of the load comes from the rigid cube. [Domain →](Tutorial_2.md#domain) · [Domain →](../UsingTheSoftware/InputFormat/domain.md)
4.  One $0.8$ m elastic layer on a $0.8 \times 0.8$ m footprint, with $0.4$ m elements. [Material points →](Tutorial_2.md#material-points) · [Material points →](../UsingTheSoftware/InputFormat/material_points.md)
5.  One system: the rigid cube. [Rigid body →](Tutorial_2.md#rigid-body) · [Rigid bodies →](../UsingTheSoftware/InputFormat/rigid_bodies.md)
6.  A single point at the cube's centre: its vertical displacement is prescribed as $-0.01$ m per load step, and the rest are fixed. [Rigid body →](Tutorial_2.md#rigid-body) · [Points →](../UsingTheSoftware/InputFormat/rigid_bodies.md#points)
7.  `cube.stl`, welded to point 1; its tetrahedral mesh is cached in `cube_mesh.txt`. [Rigid body →](Tutorial_2.md#rigid-body) · [STL files →](../UsingTheSoftware/InputFormat/rigid_bodies.md#stl-files)
8.  Frictionless contact. [Contact →](Tutorial_2.md#contact) · [Contact →](../UsingTheSoftware/InputFormat/contact.md)
9.  One static stage of 20 load steps with the body on, placed on the soil surface, on a uniform mesh. [Analysis →](Tutorial_2.md#analysis) · [Analysis stages →](../UsingTheSoftware/InputFormat/analysis.md)
10.  Tolerance $10^{-6}$ and 20 iterations; no ghost stabilisation is needed. [Solver →](Tutorial_2.md#solver) · [Solver →](../UsingTheSoftware/InputFormat/solver.md)
11.  VTK and CSV files at every load step, including the cube's reaction force. [Output →](Tutorial_2.md#output) · [Output →](../UsingTheSoftware/InputFormat/output.md)

## cube.stl

The rigid cube is a $1.2 \times 1.2 \times 1.0$ m box, drawn in global coordinates with its base on the top of the soil at $z = 0.8$ m. Save the text below as `cube.stl` in the same folder as `input_data_compress.json`. `cube_mesh.txt` is generated from it on the first run.

```text
solid cube
  facet normal 0 0 -1
    outer loop
      vertex -0.2 -0.2 0.8
      vertex -0.2 1.0 0.8
      vertex 1.0 1.0 0.8
    endloop
  endfacet
  facet normal 0 0 -1
    outer loop
      vertex -0.2 -0.2 0.8
      vertex 1.0 1.0 0.8
      vertex 1.0 -0.2 0.8
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex -0.2 -0.2 1.8
      vertex 1.0 -0.2 1.8
      vertex 1.0 1.0 1.8
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex -0.2 -0.2 1.8
      vertex 1.0 1.0 1.8
      vertex -0.2 1.0 1.8
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex -0.2 -0.2 0.8
      vertex 1.0 -0.2 0.8
      vertex 1.0 -0.2 1.8
    endloop
  endfacet
  facet normal 0 -1 0
    outer loop
      vertex -0.2 -0.2 0.8
      vertex 1.0 -0.2 1.8
      vertex -0.2 -0.2 1.8
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex -0.2 1.0 0.8
      vertex -0.2 1.0 1.8
      vertex 1.0 1.0 1.8
    endloop
  endfacet
  facet normal 0 1 0
    outer loop
      vertex -0.2 1.0 0.8
      vertex 1.0 1.0 1.8
      vertex 1.0 1.0 0.8
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex -0.2 -0.2 0.8
      vertex -0.2 -0.2 1.8
      vertex -0.2 1.0 1.8
    endloop
  endfacet
  facet normal -1 0 0
    outer loop
      vertex -0.2 -0.2 0.8
      vertex -0.2 1.0 1.8
      vertex -0.2 1.0 0.8
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 1.0 -0.2 0.8
      vertex 1.0 1.0 0.8
      vertex 1.0 1.0 1.8
    endloop
  endfacet
  facet normal 1 0 0
    outer loop
      vertex 1.0 -0.2 0.8
      vertex 1.0 1.0 1.8
      vertex 1.0 -0.2 1.8
    endloop
  endfacet
endsolid cube
```
