# Drag anchor - input_data.json

The complete reference `input_data.json` for [Tutorial 6](Tutorial_6.md), with every section combined into a single file.

```json
{
    "Mesh": {
        "domain size x": 100.0,
        "domain size y": 10.0,
        "domain size z": 10.0,
        "dx refined": 0.1,
        "Refinement type": "rigid body adaptive",
        "buffer multiplier": 2,
        "partitioned domain": {
            "ahead multiplier": 1.5,
            "behind multiplier": 0.5
        }
    },

    "Initial GIMP distribution": {
        "Initial GIMP distribution x": 100.0,
        "Initial GIMP distribution y": 10.0,
        "Initial GIMP distribution z": 10.0
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
                "empirical data": "Brinkgreve sand",
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
        "geometry": "articulated",
        "parts": [
            {
                "name": "fluke",
                "mesh path": "fluke.stl",
                "mass": 3291.6,
                "rotational inertia": 550.0,
                "centre of mass offset": 0.131,
                "length": 1.7
            },
            {
                "name": "shank",
                "mesh path": "shank.stl",
                "mass": 1058.35,
                "rotational inertia": 675.0,
                "centre of mass offset": 1.272,
                "length": 3.3
            }
        ],
        "truss frame": {
            "member stiffness": 1.0e9,
            "node mass": 10.0
        },
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
                "number of increments": 1,
                "mode": "pseudo-static"
            },
            {
                "name": "stage 2 - settle",
                "type": "settle",
                "pull point height": 10.0,
                "mode": "dynamic",
                "time step": 0.01,
                "termination criterion": "vertical velocity below 1e-3 m/s"
            },
            {
                "name": "stage 3 - drag",
                "type": "pull point velocity",
                "velocity": [0.1, 0.0, 0.0],
                "mode": "dynamic",
                "time step": 0.01,
                "termination criterion": "horizontal travel 19 m"
            }
        ]
    },

    "Solver": {
        "method": "Newton-Raphson"
    },

    "Output Data": {
        "vtu data": "yes",
        "vtk data": "yes",
        "text data": "drag anchor"
    }
}
```
