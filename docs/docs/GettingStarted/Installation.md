
---

## Requirements

AMPSSIE is a Julia package and runs anywhere Julia is supported.

**Operating system:** Linux, macOS, and Windows are all supported. Most development and testing has been done on Linux.

**Julia version:** 1.12 or newer. Earlier releases may work but are not actively tested.

**Hardware:** A typical desktop or laptop is sufficient for the tutorial problems. For larger 3D problems with refined meshes it is recommended to use an HPC with at least 10 cores, at least 60 GB of RAM and 10 GB of free disk for outputs.

**Required tooling:**

- [Julia](https://julialang.org/downloads/) - the language runtime itself.
- A text editor with JSON support for editing `input_data.json` files - [VS Code](https://code.visualstudio.com/) with the [Julia extension](https://www.julia-vscode.org/) is a sensible default.
- [ParaView](https://www.paraview.org/) or [VisIt](https://visit-dav.github.io/visit-website/) for visualising the VTU/VTK output.

**Optional:**

- [Git](https://git-scm.com/) for cloning the source repository.
- [Docker](https://www.docker.com/) *(coming soon)* if you'd rather not install Julia directly - see [Deploying via Docker](#deploying-via-docker).

## Direct interaction with Julia

The simplest deployment is to install Julia and run AMPSSIE from source.

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

**3. Start Julia and install the AMPSSIE package.** Open a Julia REPL, change into the `MaterialPoints` directory of the cloned repository and `include` the setup script. This installs the exact dependencies recorded in `Manifest.toml` and starts the parallel workers that AMPSSIE uses:

```julia-repl
julia> cd("path/to/AMPSSIE/MaterialPoints")

julia> include("setup_workers.jl")
```

If everything succeeds the REPL prints the package versions being resolved, the activated project path and a `starting sim` line; see the [Tutorial 1 terminal output](../TutorialProblems/Tutorial_1.md#setting-up-and-running-the-problem) (or [Tutorial 2](../TutorialProblems/Tutorial_2.md#setting-up-and-running-the-problem)) for the expected console.

**4. Run a problem.** Copy a tutorial `input_data.json` (for example from [Tutorial 1](../TutorialProblems/Tutorial_1_input_data.md) or [Tutorial 2](../TutorialProblems/Tutorial_2_input_data.md)) into the `MaterialPoints` directory and call the AMPSSIE entry point from the same Julia REPL:

```julia-repl
julia> AMPSSIE.run("input_data.json");
```

This steps through the load increments configured in the JSON and writes `.vtu`, `.vtk` and `.csv` output files to `MaterialPoints/src/output`. Open the VTU/VTK files in [ParaView](https://www.paraview.org/) (or [VisIt](https://visit-dav.github.io/visit-website/)) to inspect the deformed mesh and the stress / displacement fields.


