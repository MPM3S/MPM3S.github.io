# Common tasks

Every MPM3S analysis is set up by one [`input_data.json` file](InputFormat/index.md) with nine top-level sections: `"GPU"`, `"domain update"`, `"domain"`, `"material points"`, `"rigid bodies"`, `"contact"`, `"analysis"`, `"solver"` and `"output"`. Find what you want to do below; each row names the keys, links to their reference and to a tutorial that does it.

## The soil

<div class="small-table" markdown>

| I want to... | Keys | Reference | Example |
|--------------|------|-----------|---------|
| Set the soil block's size and mesh | `"element size"`, `"material size"`, `"number of material points per element 1"` | [Material points](InputFormat/material_points.md) | [Tutorial 1](../TutorialProblems/Tutorial_1.md) |
| Use more than one soil layer | `"layers"`, one entry per layer, top to bottom | [Material points](InputFormat/material_points.md) | - |
| Choose a material model | `"material"` → `"type"` | [Material models](InputFormat/material_points.md#material-models) | [Tutorial 3](../TutorialProblems/Tutorial_3.md) |
| Make the stiffness grow with depth | `"E overburden"` | [Stress-dependent stiffness](InputFormat/material_points.md#stress-dependent-stiffness) | [Tutorial 3](../TutorialProblems/Tutorial_3.md), [6](../TutorialProblems/Tutorial_6.md) |
| Let material points shrink as the soil compresses | `"domain update": "stretch"` | [Domain update](InputFormat/material_points.md#domain-update) | [Tutorial 1](../TutorialProblems/Tutorial_1.md), [2](../TutorialProblems/Tutorial_2.md) |
| Set up the initial stresses | a static stage with `"load": "gravity ramp"` | [Analysis stages](InputFormat/analysis.md) | [Tutorial 1](../TutorialProblems/Tutorial_1.md), [3](../TutorialProblems/Tutorial_3.md), [6](../TutorialProblems/Tutorial_6.md) |
| Model a slope on a level grid | tilt `"gravity"` | [Domain](InputFormat/domain.md) | [Tutorial 5](../TutorialProblems/Tutorial_5.md) |
| Hold the sides and base | `"boundary conditions"` in each stage | [Boundary conditions](InputFormat/analysis.md#boundary-conditions) | every tutorial |

</div>

## Rigid bodies

<div class="small-table" markdown>

| I want to... | Keys | Reference | Example |
|--------------|------|-----------|---------|
| Add a structure from an STL file | a point, and `"stl files"` welded to it | [STL files](InputFormat/rigid_bodies.md#stl-files) | [Tutorial 2](../TutorialProblems/Tutorial_2.md) |
| Push a body a set distance each step | the point's `"boundary conditions"`: `{"prescribed": q}` | [Points](InputFormat/rigid_bodies.md#points) | [Tutorial 2](../TutorialProblems/Tutorial_2.md) |
| Hold a body still, then move it in a later stage | `"rigid body boundary conditions"` in that stage | [Rigid body boundary conditions](InputFormat/analysis.md#rigid-body-boundary-conditions) | [Tutorial 3](../TutorialProblems/Tutorial_3.md), [6](../TutorialProblems/Tutorial_6.md) |
| Start a body exactly on the soil surface | `"rigid body surface placement": "on"` | [Analysis stages](InputFormat/analysis.md) | [Tutorial 2](../TutorialProblems/Tutorial_2.md), [3](../TutorialProblems/Tutorial_3.md), [5](../TutorialProblems/Tutorial_5.md), [6](../TutorialProblems/Tutorial_6.md) |
| Let a body move freely under gravity | `"free"` point boundary conditions, a dynamic stage | [Points](InputFormat/rigid_bodies.md#points) | [Tutorial 5](../TutorialProblems/Tutorial_5.md) |
| Join bodies with a hinge, a rod or an angle stop | `"constraints"` | [How the constraints work](InputFormat/rigid_bodies.md#how-the-constraints-work) | [Tutorial 6](../TutorialProblems/Tutorial_6.md) |
| Add friction between soil and bodies | `"contact"` → `"friction coefficient"` | [Contact](InputFormat/contact.md) | [Tutorial 3](../TutorialProblems/Tutorial_3.md), [5](../TutorialProblems/Tutorial_5.md), [6](../TutorialProblems/Tutorial_6.md) |
| Follow a point on a body, such as a fluke tip | `"tracked nodes"` | [Tracked nodes](InputFormat/rigid_bodies.md#tracked-nodes) | [Tutorial 6](../TutorialProblems/Tutorial_6.md) |

</div>

## The mesh and the stages

<div class="small-table" markdown>

| I want to... | Keys | Reference | Example |
|--------------|------|-----------|---------|
| Refine the mesh around a body as it moves | `"adaptivity": {"type": "rigid body surface"}` | [Adaptivity](InputFormat/analysis.md#adaptivity) | [Tutorial 3](../TutorialProblems/Tutorial_3.md), [5](../TutorialProblems/Tutorial_5.md), [6](../TutorialProblems/Tutorial_6.md) |
| Mesh the whole domain at the base size | `"adaptivity": {"type": "uniform"}` | [Adaptivity](InputFormat/analysis.md#adaptivity) | [Tutorial 2](../TutorialProblems/Tutorial_2.md) |
| Model a long drag without meshing all the soil | `"boundary track"` | [Boundary track](InputFormat/analysis.md#boundary-track) | [Tutorial 5](../TutorialProblems/Tutorial_5.md), [6](../TutorialProblems/Tutorial_6.md) |
| Include inertia | a `"dynamic"` stage: `"dt"`, `"final time"`, `"beta"`, `"gamma"` | [Analysis stages](InputFormat/analysis.md) | [Tutorial 5](../TutorialProblems/Tutorial_5.md), [6](../TutorialProblems/Tutorial_6.md) |
| Run on a GPU | `"GPU": "on"` | [GPU](InputFormat/gpu.md) | [Tutorial 3](../TutorialProblems/Tutorial_3.md), [6](../TutorialProblems/Tutorial_6.md) |

</div>

## Results

<div class="small-table" markdown>

| I want to... | Keys | Reference | Example |
|--------------|------|-----------|---------|
| See the soil and bodies in ParaView | `"vtk": "on"` and its fields | [Output](InputFormat/output.md) | every tutorial |
| Get the stresses at the material points | `"csv material point fields"` | [Field names](InputFormat/output.md#field-names) | [Tutorial 1](../TutorialProblems/Tutorial_1.md) |
| Get the force on a body | `"csv rigid body fields"`: `"reaction force"` | [Output files](InputFormat/output.md#output-files) | [Tutorial 2](../TutorialProblems/Tutorial_2.md), [3](../TutorialProblems/Tutorial_3.md), [6](../TutorialProblems/Tutorial_6.md) |

</div>

Run the file with `MPM3S.non_linear_solve("input_data.json")` - see [install and run](../GettingStarted/install_and_run.md).

??? note "Conventions and key statuses"

    SI units; angles in degrees; tension positive; vectors `[x, y, z]` with $z$ vertical; all positions in one global frame; switches `"on"` / `"off"` (the boundary track's `"remove"` takes `"yes"` / `"no"`); systems and points numbered from 1.

    On the reference pages, **required** keys must be present (a missing one stops the analysis and names the key), **optional** keys fall back to their default, **conditional** keys are required only as stated, and **ignored** keys are never read.
