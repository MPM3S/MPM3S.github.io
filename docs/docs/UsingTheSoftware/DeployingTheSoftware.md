
---

# Local system requirements (including advice, with some examples)

AMPSSIE is a Julia package and runs anywhere Julia is supported.

**Operating system:** Linux, macOS, and Windows are all supported. Most development and testing has been done on [insert here].

**Julia version:** [insert here] or newer. Earlier releases may work but are not actively tested.

**Hardware:** A typical desktop or laptop is sufficient for the tutorial problems. For larger 3D problems with refined meshes, allow at least [insert here] GB of RAM and [insert here] GB of free disk for outputs.

**Required tooling:**

- [Julia](https://julialang.org/downloads/) - the language runtime itself.
- A text editor with JSON support for editing `input_data.json` files - [VS Code](https://code.visualstudio.com/) with the [Julia extension](https://www.julia-vscode.org/) is a sensible default.
- [ParaView](https://www.paraview.org/) or [VisIt](https://visit-dav.github.io/visit-website/) for visualising the VTU/VTK output.

**Optional:**

- [Git](https://git-scm.com/) for cloning the source repository.

# Direct interaction with Julia

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

**4. Run a problem.** Point AMPSSIE at your [`input_data.json`](InputFormat.md):

```bash
julia --project=. [insert here] path/to/input_data.json
```

Output is written to [insert here]; open the resulting VTU files in [ParaView](https://www.paraview.org/) (or [VisIt](https://visit-dav.github.io/visit-website/)) to inspect the deformed mesh and stress fields.

