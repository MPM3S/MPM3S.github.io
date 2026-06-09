# Plough (horizontal penetration) - input_data.json

The complete reference `input_data.json` for [Tutorial 4](Tutorial_4.md), with every section combined into a single file.

```json
{
    "Mesh": {
        "domain size x": 20.0,
        "domain size y": 10.0,
        "domain size z": 7.5,
        "dx refined": 0.075,
        "Refinement type": "rigid body adaptive",
        "buffer multiplier": 2
    },

    "Initial GIMP distribution": {
        "Initial GIMP distribution x": 20.0,
        "Initial GIMP distribution y": 10.0,
        "Initial GIMP distribution z": 7.5
    },

    "Boundary conditions": {
        "neg x-plane": "roller",
        "neg y-plane": "roller",
        "neg z-plane": "roller",
        "pos x-plane": "roller",
        "pos y-plane": "Signorini"
    },

    "Material": {
        "number of layers": 1,
        "layers": [
            {
                "type": "DruckerPrager",
                "emperical data": "Brinkgreve sand",
                "assigned material properties": {
                    "E_50_ref": 19200000.0,
                    "rho": 1630.0,
                    "nu": 0.25,
                    "phi": 32.0,
                    "psi": 2.0,
                    "c": 300.0,
                    "K_0": 0.47,
                    "m_E": 0.60
                }
            }
        ]
    },

    "Rigid body": {
        "geometry": "mesh file",
        "mesh path": "plough.stl",
        "embedment depth": 1.85,
        "fillet segments per quarter": 10,
        "friction coefficient": 0.3,
        "normal penalty factor": 50,
        "tangential penalty factor": 25
    },

    "Loading": {
        "stages": [
            {
                "name": "stage 1 - gravity and embedment",
                "type": "gravity",
                "g": [0.0, 0.0, -9.81],
                "number of increments": 1
            },
            {
                "name": "stage 2 - horizontal drag",
                "type": "rigid body displacement",
                "rigid body": "plough",
                "displacement y": 20.0,
                "step size": 0.025,
                "step size reduction factor": 0.5
            }
        ]
    },

    "Solver": {
        "solve type": "static",
        "method": "Newton-Raphson"
    },

    "Output Data": {
        "vtu data": "yes",
        "vtk data": "yes",
        "text data": "plough"
    }
}
```
