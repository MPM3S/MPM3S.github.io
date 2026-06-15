# Compaction via a rigid body - input_data.json

The complete reference `input_data.json` for [Tutorial 2](Tutorial_2.md), with every section combined into a single file.

```json
{
    "Mesh": {
        "domain size x": 0.8,
        "domain size y": 0.8,
        "domain size z": 0.8,
        "dx refined": 0.1,
        "Refinement type": "contact cube"
    },

    "Initial GIMP distribution": {
        "Initial GIMP distribution x": 0.8,
        "Initial GIMP distribution y": 0.8,
        "Initial GIMP distribution z": 0.8
    },

    "Boundary conditions": {
        "neg x-plane": "roller",
        "neg y-plane": "roller",
        "neg z-plane": "roller",
        "pos x-plane": "roller",
        "pos y-plane": "roller",
        "x dof": "fixed",
        "y dof": "fixed"
    },

    "Material": {
        "number of layers": 1,
        "layers": [
            {
                "type": "Elastic",
                "empirical data": "homogeneous elastic",
                "assigned material properties": {"E": 1000000.0, "nu": 0.0}
            }
        ]
    },

    "Rigid body": {
        "geometry": "plate",
        "initial position z": 0.8,
        "prescribed displacement z": -0.2,
        "normal penalty factor": 1000
    },

    "Solver": {
        "solve type": "static",
        "load type": "displacement",
        "number of increments": 20
    },

    "Output Data": {
        "vtu data": "yes",
        "vtk data": "yes",
        "text data": "contact cube"
    }
}
```
