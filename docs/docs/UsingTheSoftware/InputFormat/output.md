# Output

The `"output"` key decides what is written, where and how often. VTK files (for ParaView) and CSV files are switched on independently, each with its own directory, frequency and list of fields. The status labels are explained on the [format overview](index.md#how-to-read-these-pages); see [Obtaining results](../ObtainingResults.md) for using the files.

```json
"output": {
    "vtk": "on",
    "vtk directory": "vtk_CPT",
    "vtk percent": 0.5,
    "vtk material point fields": ["displacement", "velocity", "stress", "strain", "volume"],
    "vtk rigid body fields": ["position", "velocity", "reaction force"],

    "csv": "on",
    "csv directory": "csv_CPT",
    "csv percent": 0.25,
    "csv material point fields": ["initial position", "position", "stress"],
    "csv rigid body fields": ["position", "velocity", "reaction force", "reaction moment"]
}
```

<div class="small-table" markdown>

| Key                               | Status                          | Type            | Default     | Description                                                                                                                                                  |
|-----------------------------------|---------------------------------|-----------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"vtk"`                           | Required                        | string          | -           | `"on"` or `"off"`.                                                                                                                                          |
| `"csv"`                           | Required                        | string          | -           | `"on"` or `"off"`.                                                                                                                                          |
| `"vtk directory"`                 | Conditional: `"vtk": "on"`      | string          | -           | Output directory, relative to the folder Julia is started from. Created if needed.                                                                          |
| `"vtk percent"`                   | Conditional: `"vtk": "on"`      | number          | -           | Output frequency, as a percentage of each stage's steps (below). 0 writes every step.                                                                       |
| `"csv directory"`                 | Conditional: `"csv": "on"`      | string          | -           | As `"vtk directory"`, for the CSV files.                                                                                                                     |
| `"csv percent"`                   | Conditional: `"csv": "on"`      | number          | -           | As `"vtk percent"`, for the CSV files.                                                                                                                       |
| `"vtk material point fields"`     | Optional                        | list of strings | every field | Material-point fields to write. **Leaving the key out writes every field**; an empty list `[]` writes none.                                                |
| `"vtk rigid body fields"`         | Optional                        | list of strings | every field | Rigid-body point fields to write, with the same rule.                                                                                                        |
| `"csv material point fields"`     | Optional                        | list of strings | every field | As above, for the CSV files.                                                                                                                                 |
| `"csv rigid body fields"`         | Optional                        | list of strings | every field | As above, for the CSV files.                                                                                                                                 |

</div>

A stage with $N$ steps (`"load steps"`, or `"final time"` / `"dt"`) writes output every $\max\left(1, \text{round}(N \times \text{percent}/100)\right)$ converged steps. For example, `"vtk percent": 0.5` in a 450-step stage writes a VTK frame every 2 steps.

## Field names

<div class="small-table" markdown>

| Material point field       | Components | Contents                                                        |
|----------------------------|------------|-----------------------------------------------------------------|
| `"initial position"`       | 3          | Position at the start of the analysis.                          |
| `"position"`               | 3          | Current position.                                               |
| `"displacement"`           | 3          | Position minus initial position.                                |
| `"velocity"`               | 3          | Velocity.                                                       |
| `"acceleration"`           | 3          | Acceleration.                                                   |
| `"lp"`                     | 3          | Half-widths of the GIMP domain.                                 |
| `"deformation gradient"`   | 9          | Deformation gradient $\mathbf{F}$.                              |
| `"stress"`                 | 6          | Cauchy stress, in the order $xx, yy, zz, xy, yz, xz$.           |
| `"strain"`                 | 6          | Elastic logarithmic strain, in the same order.                  |
| `"volume"`                 | 1          | Current volume.                                                 |
| `"initial volume"`         | 1          | Volume at the start of the analysis.                            |

</div>

<div class="small-table" markdown>

| Rigid body field           | Components | Contents                                                                  |
|----------------------------|------------|---------------------------------------------------------------------------|
| `"position"`               | 3          | Position of the point.                                                    |
| `"velocity"`               | 3          | Velocity.                                                                 |
| `"acceleration"`           | 3          | Acceleration.                                                             |
| `"angular velocity"`       | 3          | Angular velocity.                                                         |
| `"angular acceleration"`   | 3          | Angular acceleration.                                                     |
| `"mass"`                   | 1          | Mass.                                                                     |
| `"reaction force"`         | 3          | Force on the point - for a prescribed point, the force needed to move it. Zero in a stage with the bodies off. |
| `"reaction moment"`        | 3          | Moment on the point, likewise.                                            |

</div>

## Output files

Each output step is numbered `nnnnn` by the step counter shown on the progress line, which starts at 1 and counts converged steps across the whole analysis, so the first files are numbered `00002`:

<div class="small-table" markdown>

| File                        | Directory | Contents                                                                                                              |
|-----------------------------|-----------|-----------------------------------------------------------------------------------------------------------------------|
| `mps_<layer>_nnnnn.vtu`     | VTK       | The material points of each layer (1 = top layer), drawn as their GIMP domains, with the selected fields as cell data. |
| `body_nnnnn.vtu`            | VTK       | One vertex per rigid-body point, with the selected fields.                                                            |
| `surface_nnnnn.vtu`         | VTK       | The rigid-body surfaces, with each triangle's `body`, `velocity` and total `contact force`.                            |
| `tracked_nnnnn.vtu`         | VTK       | The tracked nodes, with their number and the point they follow.                                                       |
| `mps_<layer>_nnnnn.csv`     | CSV       | One row per material point. The first line is `time,<value>`; the column headers are on the second line.              |
| `rigid_body.csv`            | CSV       | One file for the whole run, one row per output step. Overwritten at the start of each run.                             |

</div>

Files for rigid bodies are only written when the analysis has rigid bodies. ParaView opens each numbered series (e.g. `mps_1_..vtu`) as one time-dependent dataset.

CSV column headers add a suffix to each field name: `_x`, `_y`, `_z` for 3-component fields, `_xx`, `_yy`, `_zz`, `_xy`, `_yz`, `_xz` for stress and strain, and `_1` to `_9` for the deformation gradient. `rigid_body.csv` starts with a `time` column, then one group of columns per point named `body<n>_<field>` - e.g. `body1_reaction force_z` - and then `track<n>_x`, `track<n>_y`, `track<n>_z` for each tracked node. In every CSV file, `time` is the load fraction in a static stage and the time since the start of the stage in a dynamic stage.
