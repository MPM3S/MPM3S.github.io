# Tutorial 1: Self-weight column

<div class="tutorial-facts level-beginner-strip">
<span class="level level-beginner">Beginner</span>
<span><strong>Time to work through:</strong> about 30 min</span>
<span><strong>Run time:</strong> under a minute on a CPU</span>
<span class="facts-note">You can run every tutorial on your own hardware: the RAM decides whether a problem fits, and the number of CPU or GPU cores how long it takes. The run times are approximate, to give an idea of the hardware needed.</span>
</div>

## Introduction
This quick start tutorial walks through the steps of running your first MPM3S problem.

This tutorial analyses a column deforming under its own weight and solves the static [equilibrium equations](../TechnicalReferences/EquilibriumEquations.md). It is simple but introduces you to all components of the code: setting up the input file, running the analysis and viewing the output data.

This tutorial has three main sections after the introduction:

- [Input setup](#input-setup)
- [Deploying and running the problem](#deploying-and-running-the-problem)
- [Viewing the results](#viewing-the-results)

### Background: the GIMPM

This problem introduces you to the MPM3S code, and how it is different to methods such as finite element analysis. The GIMPM can be classed as a fictitious domain method: the mesh and boundary conditions do not necessarily align with the material domain, the body that is being modelled by the material points. This enables the GIMPM to avoid the distorted mesh issues normally associated with finite elements.

The GIMPM broadly works in three steps:
![The three steps to a GIMPM solution step.](../../img/Tutorial_1/GIMP_example2.png){ #fig-example-GIMPM width="70%" }

- (a) initial state which loads the material point data on the background mesh
- (b) deforming the mesh and the material points together
- (c) resetting the mesh but not the material points, distorting the body relative to the mesh

Under this framework you define two things: the background mesh on which the equations are solved, through its element size, and the material points - the modelled body, which carries all the material and kinematic data at the Generalised Interpolation Material Points (GIMPs). In MPM3S both are set in the `"material points"` section of the input file. Boundary conditions (roller or fixed faces) are applied to the nodes of the background mesh, whereas body forces such as gravity are applied to the material points directly.

## Input setup

### Problem summary

The aim is to recover the vertical stress field that develops in a column compressed by its own weight, and to compare it against the analytical solution

$$
\sigma_{zz} = -\rho\, g\, (L - z_p),
$$

where $\rho$ is the density, $g = 9.81$ m/s$^2$ is the acceleration due to gravity, $L = 0.8$ m is the initial height of the column and $z_p$ is the initial height of the material point. Stress is tension positive, so the column is in compression. Because Poisson's ratio is zero and the sides of the column are on rollers, the cross-section does not change and this Cauchy stress calculation is true for any magnitude of deformation.

The column is $0.05 \times 0.05 \times 0.8$ m, made of a homogeneous Hencky elastic material with Poisson's ratio $\nu = 0$ and density $\rho = 50$ kg/m$^3$. The Young's modulus, $E = 283$ Pa, is chosen so the column will be significantly compressed from $0.8$ m to about $0.54$ m.

The column is divided into 16 elements of $0.05$ m, each filled with a $2 \times 2 \times 2$ grid of GIMPs - 128 in total. Gravity is applied gradually over 50 load steps, each solved by a Newton-Raphson scheme.

![The bottom two elements and the top element of the column; the dots stand for the 13 elements in between. (a) The background mesh, with element size $h = 0.05$ m, and (b) the $2 \times 2 \times 2$ grid of GIMP domains in each element.](../../img/Tutorial_1/column_setup.png){ #fig-column-setup width="50%" }

The simulation is configured through a single JSON object - a human-readable, editable text file. The complete file for this problem can be found [here](Tutorial_1_input_data.md), and every key is described on the [`input_data.json` file format](../UsingTheSoftware/InputFormat/index.md) page.

<div class="json-side-header">
<div>Description</div>
<div><code>input_data_gravity_column.json</code></div>
</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Machine

- `"GPU": "off"` runs the analysis on the CPU, which is plenty for a problem this small ([GPU](../UsingTheSoftware/InputFormat/gpu.md)).
- `"domain update": "stretch"` lets each GIMP's domain stretch with the material, so the GIMPs near the base shrink to half their height as the column is compressed ([domain update](../UsingTheSoftware/InputFormat/material_points.md#domain-update)).
- It is optional; without it the domains keep their initial size.

</div>

<div class="js-code" markdown>

```json
"GPU": "off",

"domain update": "stretch"
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Domain

- The background mesh is a cube, sized automatically to hold the column plus the same height of empty space above it: here a cube of side $1.6$ m ([domain](../UsingTheSoftware/InputFormat/domain.md)).
- Gravity acts in $-z$.

</div>

<div class="js-code" markdown>

```json
"domain": {
    "gravity": [0.0, 0.0, -9.81]
}
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Material points

- One layer, $0.8$ m thick, on a $0.05 \times 0.05$ m footprint ([material points](../UsingTheSoftware/InputFormat/material_points.md)).
- `"element size"` sets the background elements to $0.05$ m.
- `"number of material points per element 1": 2` places a $2 \times 2 \times 2$ grid of GIMPs in each element.
- The material is the Hencky elastic model, with the parameters from the [Problem summary](#problem-summary).
- `"extra capacity"` reserves spare storage for material points created by mesh refinement; there is no refinement here, but the key is still required.

</div>

<div class="js-code" markdown>

```json
"material points": {
    "extra capacity": 1.2,
    "element size": 0.05,
    "number of material points per element 1": 2,
    "material size": { "min": [0.0, 0.0], "max": [0.05, 0.05] },
    "layers": [
        {
            "thickness": 0.8,
            "material": { "type": "elastic", "E": 283.0, "nu": 0.0, "density": 50.0 }
        }
    ]
}
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Rigid bodies and contact

- There are no rigid bodies, so `"rigid bodies"` is an empty list ([rigid bodies](../UsingTheSoftware/InputFormat/rigid_bodies.md)).
- The `"contact"` section is still required; its friction coefficient has no effect ([contact properties](../UsingTheSoftware/InputFormat/contact.md)).

</div>

<div class="js-code" markdown>

```json
"rigid bodies": [],

"contact": {
    "friction coefficient": 0.0
}
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Analysis

- A single static stage ([analysis stages](../UsingTheSoftware/InputFormat/analysis.md)).
- `"load": "gravity ramp"` increases gravity from zero to its full value over the 50 load steps.
- `"rigid bodies": "off"`, as there are none.
- Rollers on the four sides ($x$ and $y$ `"min"` and `"max"`) and a fixed base ([boundary conditions](../UsingTheSoftware/InputFormat/analysis.md#boundary-conditions)).
- The top is left free; the `"max"` $z$ face lies at twice the column height, in the empty space above the column, so it never touches the material.

</div>

<div class="js-code" markdown>

```json
"analysis": [
    {
        "type": "static",
        "load steps": 50,
        "load": "gravity ramp",
        "rigid bodies": "off",
        "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "free"] }
    }
]
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Solver

- Newton-Raphson iterations to a tolerance of $10^{-6}$ in each load step ([solver](../UsingTheSoftware/InputFormat/solver.md)).
- A step that has not converged after 20 iterations is retried with half the load increment.
- The column fills its elements completely, so the [ghost stabilisation](../TechnicalReferences/ghostStabilisation.md) is switched off, with both ghost factors set to zero.

</div>

<div class="js-code" markdown>

```json
"solver": {
    "tolerance": 1.0e-6,
    "max newton iterations": 20,
    "poor factor": 0.25,
    "ghost factor": 0.0,
    "ghost factor mass": 0.0
}
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Output

- VTK output, for visualisation in [ParaView](https://www.paraview.org/) (or [VisIt](https://visit-dav.github.io/visit-website/)), is written to `vtk_column` at every load step (`"vtk percent": 0`), with the displacement, stress, strain and volume of each GIMP ([output](../UsingTheSoftware/InputFormat/output.md)).
- CSV output is written to `csv_column`, also at every load step, with each GIMP's initial position, current position and stress - everything needed to compare against the analytical solution.
- There are no rigid bodies, so no rigid-body fields are needed.

</div>

<div class="js-code" markdown>

```json
"output": {
    "vtk": "on",
    "vtk directory": "vtk_column",
    "vtk percent": 0,
    "vtk material point fields": ["displacement", "stress", "strain", "volume"],

    "csv": "on",
    "csv directory": "csv_column",
    "csv percent": 0,
    "csv material point fields": ["initial position", "position", "stress"],
    "csv rigid body fields": []
}
```

</div>

</div>

## Deploying and running the problem

MPM3S is written in the [Julia](https://julialang.org/) programming language, and there are multiple ways to run the code, all explored on the [deployment page](../UsingTheSoftware/DeployingTheSoftware.md). As this is a small problem that runs quickly, this tutorial uses Julia directly; see the [installation guide](../GettingStarted/install_and_run.md) for installing Julia and MPM3S.

!!! note "Working in the MPM3S folder"
    Julia runs in the `MPM3S` folder - the folder you downloaded - throughout this tutorial, and every path in the commands and scripts is relative to it. The input file is read from `validation_data_and_jsons/input_data_gravity_column.json`, and the output folders `vtk_column` and `csv_column` are written to, and read back from, the `MPM3S` folder.

<div class="json-side-header">
<div>Deployment instructions</div>
<div><code>terminal</code></div>
</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Setting up and running the problem

The input file for this tutorial comes with MPM3S, as `validation_data_and_jsons/input_data_gravity_column.json`; it is the same file as the one provided [here](Tutorial_1_input_data.md).

Open a terminal and start Julia; `-t auto` makes every CPU core available:

```
julia -t auto
```

Then, in Julia, move into the folder where you downloaded MPM3S, activate it, install its dependencies and load MPM3S:

```
cd("path/to/MPM3S")
using Pkg; Pkg.activate(".")
Pkg.instantiate()
using MPM3S
```

The output folders `vtk_column` and `csv_column` are created in the `MPM3S` folder. The commands work the same on Windows, macOS and Linux. The first time, `Pkg.instantiate()` downloads and installs MPM3S's dependencies, which can take several minutes; after that it returns straight away (see [MPM3S installation](../GettingStarted/install_and_run.md#mpm3s-installation)). If you are unsure how to open a command/terminal window on your operating system, see [Command/terminal window](../GettingStarted/install_and_run.md#terminal-window).

</div>

<div class="js-code" markdown>

<div class="terminal terminal-full" markdown>

```console
$ julia -t auto
               _
   _       _ _(_)_     |  Documentation: https://docs.julialang.org
  (_)     | (_) (_)    |
   _ _   _| |_  __ _   |  Type "?" for help, "]?" for Pkg help.
  | | | | | | |/ _` |  |
  | | |_| | | | (_| |  |  Version 1.12.4 (2026-01-06)
 _/ |\__'_|_|_|\__'_|  |  Official https://julialang.org release
|__/                   |

julia> cd("path/to/MPM3S")
julia> using Pkg; Pkg.activate(".")
  Activating project at `path/to/MPM3S`

julia> Pkg.instantiate()

julia> using MPM3S
```

</div>

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Running the problem

Julia is now running in the `MPM3S` folder and MPM3S loaded. The JSON file for this problem is loaded with MPM3S and is stored in the folder `validation_data_and_jsons`, the simulations are started with:

```
MPM3S.non_linear_solve("validation_data_and_jsons/input_data_gravity_column.json");
```
This reads the input file, steps through the 50 load steps and writes the VTK and CSV output as it goes.

#### Reading the output

MPM3S prints a single progress line, redrawn in place after every step; in a log file a new line is kept for every whole percent. When the analysis finishes, the line reads:

- `stage 1/1` - the current stage and the number of stages.
- the bar and `100.0%` - progress through the stage.
- `t 1.0/1.0` - the load fraction reached in a static stage (or the time in a dynamic stage), out of its final value.
- `step 51` - the step counter. It starts at 1 and counts every converged step of the analysis; it is also the number in the output file names.
- `Δt 0.02` - the current increment, here $1/50$ of the load.
- `NR 3` - the Newton-Raphson iterations used by the last step.
- `cuts 0` - steps that did not converge and were retried with half the increment.
- `del 0` - material points deleted because they became too distorted or isolated.
- `N 257` - the number of nodes in the background mesh.

In dynamic analyses a `P2G-fail` count is added if a velocity projection fails to converge.

</div>

<div class="js-code" markdown>

<div class="terminal" markdown>

```console
julia> MPM3S.non_linear_solve("validation_data_and_jsons/input_data_gravity_column.json");
stage 1/1 ████████████ 100.0% t 1.0/1.0 step 51 Δt 0.02 NR 3 cuts 0 del 0 N 257
```

</div>

</div>

</div>

## Viewing the results

The results are written as the simulation runs, so you do not need to wait until it has finished to view them. The VTK files are in `vtk_column` and the CSV files in `csv_column`, one file per load step, numbered from `00002` to `00051`. The `1` in `mps_1_...` is the layer number.

### Visualising the output in ParaView

The output files can be opened in [ParaView](https://www.paraview.org/) to inspect the deformed column and the data carried by the GIMPs. Each GIMP is drawn as a box the size of its domain. The walkthrough below opens the GIMP data, colours it by displacement and stress, and shows how the GIMP domains have deformed.

<div class="walkthrough" markdown>
<div markdown>
**1. Open ParaView.** Launch ParaView from your applications menu or terminal; you should see an empty render view.
</div>
<div markdown>
![ParaView on launch, with an empty render view.](../../img/Tutorial_1/Column_1.png){ #fig-paraview-1 }
</div>
</div>

<div class="walkthrough" markdown>
<div markdown>
**2. Open the output files.** *File → Open* and navigate to `vtk_column`. ParaView groups the numbered files into one series, `mps_1_..vtu`; select it and click *OK*.
</div>
<div markdown>
![The Open File dialog with the mps_1_..vtu series selected.](../../img/Tutorial_1/Column_2.png){ #fig-paraview-2 }
</div>
</div>

<div class="walkthrough" markdown>
<div markdown>
**3. Apply the reader.** Click *Apply* in the Properties panel. The column of GIMPs appears at the first load step.
</div>
<div markdown>
![The series in the Pipeline Browser, with Apply highlighted in the Properties panel.](../../img/Tutorial_1/Column_3.png){ #fig-paraview-3 }
</div>
</div>

!!! tip "Navigating the 3D view"
    Once a dataset is rendered you can move the camera with the mouse inside the *RenderView*:

    - **Left-click and drag** to rotate the view about the focal point.
    - **Middle-click and drag** (or `Shift`+left-drag) to pan.
    - **Scroll wheel** (or right-click and drag) to zoom in and out.
    - Press `R` or use *View → Reset Camera* to reframe the scene if you get lost.

<div class="walkthrough" markdown>
<div markdown>
**4. Colour the GIMPs by vertical displacement.** Change *Coloring* to `displacement` → `Z`. At the first load step the displacements are still small.
</div>
<div markdown>
![The column of GIMPs at the first load step, with displacement chosen in the Coloring menu.](../../img/Tutorial_1/Column_4.png){ #fig-paraview-4 }
</div>
</div>

<div class="walkthrough" markdown>
<div markdown>
**5. Advance to the final step.** Click the *Go to Last* button (`▶|`) in the time toolbar, then *Rescale to Data Range* in the colour-bar toolbar so the colour scale matches the deformed column. The column has shortened from $0.8$ m to about $0.54$ m, so the top has moved down by about $0.26$ m.
</div>
<div markdown>
![The deformed column at the final load step, coloured by displacement.](../../img/Tutorial_1/Column_5.png){ #fig-paraview-5 }
</div>
</div>

<div class="walkthrough" markdown>
<div markdown>
**6. Colour by vertical stress.** Change *Coloring* to `stress` → `ZZ` and rescale. The compressive stress increases steadily from zero at the top to its largest value at the base.
</div>
<div markdown>
![Choosing the ZZ component of stress in the Coloring menu.](../../img/Tutorial_1/Column_6.png){ #fig-paraview-6 }
</div>
</div>

<div class="walkthrough" markdown>
<div markdown>
**7. Look at the GIMP domains.** Change the *Representation* to *Surface With Edges* and zoom in on the base and the top of the column. With `"domain update": "stretch"` the GIMPs near the base are squashed to about half their original height, while those near the top are barely deformed.
</div>
<div markdown>
![Choosing Surface With Edges in the Representation menu, with the column coloured by vertical stress.](../../img/Tutorial_1/Column_7.png){ #fig-paraview-7 }
</div>
</div>

## Analysing the stress variation with height

`csv_column` holds one CSV file per load step. The first line of each file is the load fraction, `time`, and the second line holds the column headers; after that there is one row per GIMP. The final step, `mps_1_00051.csv`, starts:

```text
time,1.0000000000000004
initial position_x,initial position_y,initial position_z,position_x,position_y,position_z,stress_xx,stress_yy,stress_zz,stress_xy,stress_yz,stress_xz
0.0125,0.0125,0.0125,0.0125,0.0125,0.00634021565216069,0.0,0.0,-378.742813055138,0.0,0.0,0.0
0.0125,0.0125,0.037500000000000006,0.0125,0.0125,0.019020646956482066,0.0,0.0,-378.742813055138,0.0,0.0,0.0
0.0125,0.0125,0.0625,0.0125,0.0125,0.031765464864891575,6.107727604173849e-14,6.107727604173849e-14,-365.68430455127134,0.0,0.0,0.0
--- many more rows of data ---
```

`initial position_z` is $z_p$ in the analytical solution, `position_z` is the GIMP's current height, and `stress_zz` is the vertical Cauchy stress in Pa.

!!! note "Floating-point spellings in the raw CSV"
    Values such as `1.0000000000000004` and `0.037500000000000006` are the exact binary representations Julia stores for `1.0` and `0.0375`, and the trailing digits of the stresses are floating-point noise.

The short Julia script below plots the stresses from the final step against the analytical solution from the [Problem summary](#problem-summary). You can run it in the same Julia session straight after the analysis, either by copying it into the REPL or by saving it as `plot_stress.jl` in the `MPM3S` folder and running `include("plot_stress.jl")`. It needs [Plots](https://docs.juliaplots.org/); `DelimitedFiles` comes with Julia.

To install Plots, once, start Julia and, before activating MPM3S (so that Plots is not added to MPM3S itself), use:

```julia
using Pkg
Pkg.add("Plots")
```
The commands to run the plot are:

```julia
using DelimitedFiles, Plots

# the final output step of the column; skip the "time" line, then read the header
data, header = readdlm("csv_column/mps_1_00051.csv", ',', Float64; skipstart=1, header=true)
column(name) = data[:, findfirst(==(name), vec(header))]
z0  = column("initial position_z")
szz = column("stress_zz")

# analytical vertical stress
ρ, g, L = 50.0, 9.81, 0.8
σ(z) = -ρ * g * (L - z)
z = range(0.0, L, length=100)

scatter(-szz, z0, label="MPM3S", xlabel="vertical compressive stress (Pa)", ylabel="initial height (m)")
plot!(-σ.(z), z, label="analytical")
```

![Vertical compressive stress at the GIMPs after the final load step, plotted against their initial height, compared with the analytical solution.](../../img/Tutorial_1/column_analytical_stress.png){ #fig-column-stress width="40%" }

The numerical stresses agree with the analytical solution to within 2% of the stress at the base ($392.4$ Pa), with the largest differences in the elements at the base and at the free surface. 

To see how the accuracy depends on the mesh, halve `"element size"` in [Material points](#material-points) to `0.025` and run the problem again.
