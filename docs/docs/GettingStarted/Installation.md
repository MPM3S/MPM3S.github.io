
---

## Requirements

AMPSSIE is a Julia package and runs anywhere Julia is supported.

**Operating system:** Linux, macOS, and Windows are all supported. Most development and testing has been done on Linux.

**Julia version:** 1.12 or newer. Earlier releases may work but are not actively tested.

**Hardware:** A typical desktop or laptop is sufficient for the tutorial problems. For larger 3D problems with refined meshes it is recommend to use a HPc with at least 10 cores, allow at least 60Gb GB of RAM and 10 GB of free disk for outputs.

**Required tooling:**

- [Julia](https://julialang.org/downloads/) - the language runtime itself.
- A text editor with JSON support for editing `input_data.json` files - [VS Code](https://code.visualstudio.com/) with the [Julia extension](https://www.julia-vscode.org/) is a sensible default.
- [ParaView](https://www.paraview.org/) or [VisIt](https://visit-dav.github.io/visit-website/) for visualising the VTU/VTK output.

**Optional:**

- [Git](https://git-scm.com/) for cloning the source repository.
- [Docker] *(coming soon)* if you'd rather not install Julia directly - see [Deploying via Docker](#deploying-via-docker).

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

**3. Instantiate the project environment.** This installs the exact dependencies recorded in `Manifest.toml` into a local environment:

```bash
julia --project=. -e 'using Pkg; Pkg.instantiate()'
```

**4. Run a problem.** The cloned repository includes its own example input file, so you can run a problem straight away:

```bash
julia --project=. [insert here]
```

Output is written to the same directory as the input file. Open the resulting VTU files in [ParaView](https://www.paraview.org/) (or [VisIt](https://visit-dav.github.io/visit-website/)) to inspect the deformed mesh and stress fields.


