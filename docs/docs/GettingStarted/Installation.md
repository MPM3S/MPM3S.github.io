
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
- [Docker](https://docs.docker.com/get-docker/) if you'd rather not install Julia directly - see [Deploying via Docker](#deploying-via-docker).

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

## Deploying via Docker

If you don't want to install Julia or manage package environments yourself, a Docker image bundles AMPSSIE and all its dependencies.

**1. Install Docker.** Follow the official instructions for your platform at [docs.docker.com/get-docker](https://docs.docker.com/get-docker/).

**2. Pull the image.**

```bash
docker pull [insert here]
```

**3. Run a problem.** Place your input file in any directory and mount that directory into the container - the output is written alongside the input file in the same directory:

```bash
docker run --rm \
  -v "$(pwd):/work" \
  [insert here] \
  /work/[insert input file]
```

Once the container exits, open the resulting VTU files in ParaView (or VisIt).

**Building the image yourself.** If you've cloned the repository and want a local build, a `Dockerfile` lives at the project root:

```bash
docker build -t ampssie:local .
docker run --rm -v "$(pwd):/work" ampssie:local /work/input_data.json
```

---
