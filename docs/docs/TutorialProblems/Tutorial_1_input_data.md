# Self-weight column convergence - input_data.json

The complete reference `input_data.json` for [Tutorial 1](Tutorial_1.md), with every section combined into a single file.

```json
{
    "Mesh": {
        "domain size x": 0.4,
        "domain size y": 0.4,
        "domain size z": 0.8,
        "dx refined": 0.2,
        "Refinement type": "column validation"
    },

    "Initial GIMP distribution": {
        "Initial GIMP distribution x": 0.4,
        "Initial GIMP distribution y": 0.4,
        "Initial GIMP distribution z": 0.8,
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
                "assigned material properties": {"E": 1000.0, "nu": 0.0, "rho": 50.0}
            }
        ]
    },

    "Solver": {
        "solve type": "static",
        "load type": "force",
        "number of increments": 20
    },

    "Output Data": {
        "vtu data": "yes",
        "vtk data": "yes",
        "text data": "column validation"
    }
}
```
