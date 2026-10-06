
---

## Requirements

S3-MPM is a Julia package and runs anywhere Julia is supported.

**Operating system:** Linux, macOS, and Windows are all supported. Most development and testing has been done on Linux.

**Julia version:** 1.12 or newer. Earlier releases may work but are not actively tested.

**Hardware:** A typical desktop or laptop is sufficient for the tutorial problems. For larger 3D problems with refined meshes it is recommended to use an HPC with at least 10 cores, at least 60 GB of RAM and 10 GB of free disk for outputs. If you are using a GPU it is also recommended that the GPU has 60 GB of GPU memory (data-centre GPUs such as the NVIDIA A100 or H100 have 40-80 GB).

**Software requrements tooling:**

- [Julia](https://julialang.org/downloads/) - at least version 1.12.
- A text editor with JSON support for editing `input_data.json` files - [VS Code](https://code.visualstudio.com/) with the [Julia extension](https://www.julia-vscode.org/) is a sensible default.
- [ParaView](https://www.paraview.org/) or [VisIt](https://visit-dav.github.io/visit-website/) for visualising the VTU/VTK output, note all tutorials will use Paraview.

**Optional:**

- [Git](https://git-scm.com/) for cloning the source repository.
- A container runtime ([Docker](https://www.docker.com/), or [Apptainer](https://apptainer.org/) on HPC) to run Julia and S3-MPM without installion - see [deploying with containers](../UsingTheSoftware/DeployingTheSoftware.md).

## Direct interaction with Julia

The simplest deployment is to install Julia and run S3-MPM from source.

**1. Install Julia.** Use the official installer from [julialang.org/downloads](https://julialang.org/downloads/), or on Linux/macOS use the [`juliaup`](https://github.com/JuliaLang/juliaup) toolchain manager:

```bash
curl -fsSL https://install.julialang.org | sh
```

Verify the install with `julia --version`.

**2. Clone the repository.**

```bash
git clone [insert here]
cd [insert here]
```

**3. Start Julia and install the S3-MPM package.** Open a Julia REPL, change into the `MaterialPoints` directory of the cloned repository and `include` the setup script. This installs the exact dependencies recorded in `Manifest.toml` and starts the parallel workers that S3-MPM uses:

```julia-repl
julia> cd("path/to/S3-MPM/MaterialPoints")

julia> include("setup_workers.jl")
```

If everything succeeds the REPL prints the package versions being resolved, the activated project path and a `starting sim` line; see the [Tutorial 1 terminal output](../TutorialProblems/Tutorial_1.md#setting-up-and-running-the-problem) (or [Tutorial 2](../TutorialProblems/Tutorial_2.md#setting-up-and-running-the-problem)) for the expected console.

**4. Run a problem.** Copy a tutorial `input_data.json` (for example from [Tutorial 1](../TutorialProblems/Tutorial_1_input_data.md) or [Tutorial 2](../TutorialProblems/Tutorial_2_input_data.md)) into the `MaterialPoints` directory and call the S3-MPM entry point from the same Julia REPL:

```julia-repl
julia> S3MPM.non_linear_solve("input_data.json");
```

This steps through the load increments configured in the JSON and writes `.vtu`, `.vtk` and `.csv` output files to `MaterialPoints/src/output`. Open the VTU/VTK files in [ParaView](https://www.paraview.org/) (or [VisIt](https://visit-dav.github.io/visit-website/)) to inspect the deformed mesh and the stress / displacement fields.


