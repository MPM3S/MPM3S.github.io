# Vertical penetration (Cone Penetration Test) - input_data.json

The complete reference `input_data.json` for [Tutorial 3](Tutorial_3.md), with every section combined into a single file.

```json
{
    "Mesh": {
        "domain size x": 12.8,
        "domain size y": 12.8,
        "domain size z": 24.6,
        "dx refined": 0.1,
        "Refinement type": "rigid body adaptive",
        "buffer multiplier": 2
    },

    "Initial GIMP distribution": {
        "Initial GIMP distribution x": 12.8,
        "Initial GIMP distribution y": 12.8,
        "Initial GIMP distribution z": 24.6
    },

    "Boundary conditions": {
        "neg x-plane": "roller",
        "neg y-plane": "roller",
        "neg z-plane": "roller",
        "pos x-plane": "roller",
        "pos y-plane": "roller"
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
        "geometry": "cone",
        "radius": 0.4,
        "apex angle": 60.0,
        "initial position z": 24.6,
        "prescribed displacement z": -4.0,
        "friction coefficient": 0.3,
        "normal penalty factor": 50,
        "tangential penalty factor": 25
    },

    "Loading": {
        "stages": [
            {
                "name": "stage 1 - gravity",
                "type": "gravity",
                "g": [0.0, 0.0, -9.81],
                "number of increments": 1
            },
            {
                "name": "stage 2 - cone descent",
                "type": "rigid body displacement",
                "rigid body": "cone",
                "displacement z": -4.0,
                "number of increments": 300
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
        "text data": "cone penetration test"
    }
}
```
