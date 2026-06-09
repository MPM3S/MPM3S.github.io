# Rolling sphere - input_data.json

The complete reference `input_data.json` for [Tutorial 5](Tutorial_5.md), with every section combined into a single file.

```json
{
    "Mesh": {
        "domain size x": 50.0,
        "domain size y": 1.0,
        "domain size z": 1.0,
        "dx refined": 0.1,
        "dx coarse": 0.5,
        "Refinement type": "rigid body adaptive",
        "buffer multiplier": 2
    },

    "Initial GIMP distribution": {
        "Initial GIMP distribution x": 50.0,
        "Initial GIMP distribution y": 1.0,
        "Initial GIMP distribution z": 1.0
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
                "emperical data": "homogeneous elastic",
                "assigned material properties": {"E": 1000000000.0, "nu": 0.0}
            }
        ]
    },

    "Rigid body": {
        "geometry": "mesh file",
        "mesh path": "sphere.stl",
        "diameter": 2.0,
        "mass": 10000.0,
        "rotational inertia": 4000.0,
        "initial position": [1.0, 0.5, 1.5],
        "friction coefficient": 0.2,
        "normal penalty factor": 50,
        "tangential penalty factor": 25
    },

    "Loading": {
        "stages": [
            {
                "name": "rolling under tilted gravity",
                "type": "gravity",
                "g": [6.9367, 0.0, -6.9367],
                "time step": 0.01,
                "end time": 3.0
            }
        ]
    },

    "Solver": {
        "solve type": "dynamic",
        "method": "Newton-Raphson",
        "time integration": "implicit"
    },

    "Output Data": {
        "vtu data": "yes",
        "vtk data": "yes",
        "text data": "rolling sphere"
    }
}
```
