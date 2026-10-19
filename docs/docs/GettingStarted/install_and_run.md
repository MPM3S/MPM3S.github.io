
---

## Requirements

MPM3S is a Julia package and runs anywhere Julia is supported.

**Operating system:** Linux, macOS, and Windows are all supported. Most development and testing has been done on Linux.

**Julia version:** 1.12 or newer. Earlier releases may work but are not actively tested.

**Hardware:** A typical desktop or laptop is sufficient for the tutorial problems. For larger 3D problems with refined meshes it is recommended to use an HPC with at least 10 cores, at least 60 GB of RAM and 10 GB of free disk for outputs. If you are using a GPU it is also recommended that the GPU has 60 GB of GPU memory (data-centre GPUs such as the NVIDIA A100 or H100 have 40-80 GB).

**Running the software:** there are three ways to run the software:

1. [Julia runtime](#julia-runtime) - on a PC that you have admin rights to.
2. [Container runtime](#container-runtime) - the easiest way to set up the simulations on an HPC.
3. [Cloud computing](#cloud-computing) - such as Google Colab.

Please go to the relevant section for your installation (see the table of contents on the right).

**Software requirements:**

- [Julia](https://julialang.org/downloads/) - at least version 1.12.
- A text editor with JSON support for editing `input_data.json` files - [VS Code](https://code.visualstudio.com/) with the [Julia extension](https://www.julia-vscode.org/) is a sensible default.
- [ParaView](https://www.paraview.org/) or [VisIt](https://visit-dav.github.io/visit-website/) for visualising the VTU/VTK output. Support and tutorial detail are only provided for ParaView.

**Optional:**

- [Git](https://git-scm.com/) for cloning the source repository.
- A container runtime ([Docker](https://www.docker.com/), or [Apptainer](https://apptainer.org/)/[Singularity](https://sylabs.io/singularity/) on HPC) to run Julia and MPM3S without installation - see [deploying with containers](../UsingTheSoftware/DeployingTheSoftware.md).

## Command/terminal window { #terminal-window }
Julia, MPM3S and the containers are all operated through the terminal (macOS/Linux) or command (Windows) window. To open one:

=== "Windows"

    Press the *Windows* key, type `PowerShell` and select *Windows PowerShell*.

    - To open it in a particular folder, open the folder in File Explorer, right-click an empty space and choose *Open in Terminal* (Windows 11), or hold `Shift` while right-clicking and choose *Open PowerShell window here* (Windows 10).

=== "Linux"

    Press `Ctrl` + `Alt` + `T`, or search for *Terminal* in your applications menu.

    - To open it in a particular folder, right-click an empty space in the folder in your file manager and choose *Open in Terminal*.

=== "macOS"

    Press `Cmd` + `Space`, type `Terminal` and press `Return`. Terminal is also in *Applications → Utilities*.

    - To open it in a particular folder, right-click the folder in Finder and choose *Services → New Terminal at Folder*.

Code snippets are provided throughout the documentation, these can be copied and pasted into the Terminal/Command window.

## Julia runtime
The simplest deployment is to install Julia and run MPM3S from source. Julia and MPM3S are both operated through the [command/terminal window](#terminal-window).

### Julia installation

Install Julia with the [`juliaup`](https://github.com/JuliaLang/juliaup) toolchain manager, as recommended at [julialang.org/downloads](https://julialang.org/downloads/), by running the command for your system in the [command/terminal window](#terminal-window):

=== "Windows"

    ```powershell
    winget install --name Julia --id 9NJNWW8PVKMN -e -s msstore
    ```

    - Alternatively, install *Julia* from the Microsoft Store, or use the `.exe` installer from [julialang.org/downloads](https://julialang.org/downloads/).

=== "Linux"

    ```bash
    curl -fsSL https://install.julialang.org | sh
    ```

=== "macOS"

    ```bash
    curl -fsSL https://install.julialang.org | sh
    ```

Close and reopen the window, then verify the install with `julia --version`.

### Downloading MPM3S from GitHub

The source lives at [github.com/MPM3S/MPM3S](https://github.com/MPM3S/MPM3S).

Use `git clone` to pull the code from GitHub into your current directory; updating later is then a single `git pull` from inside the folder:

```bash
git clone https://github.com/MPM3S/MPM3S.git
cd MPM3S
```

If you prefer to download the ZIP containing the code, go to [github.com/MPM3S/MPM3S](https://github.com/MPM3S/MPM3S).


![The green Code button on the MPM3S GitHub page, with Download ZIP at the bottom of the menu.](../../img/install_and_run/git_download.png){ #fig-github-zip width="90%" }

Then use the green *Code* button, choose *Download ZIP* and unzip it wherever you want to keep it.

Both methods produce an `MPM3S` folder containing the Julia code.

### MPM3S installation

**1. Download the code** from GitHub, as described above.

**2. Start Julia and install the MPM3S package.** Open a PowerShell (Windows) or terminal (Linux/macOS) window and start Julia with:

```bash
julia -t 4
```
`-t 4` sets the number of CPU threads. Four threads is sufficient when the analysis is on a GPU; for a CPU run, set the number of threads to the number of physical cores minus 2. Julia runs on one thread if `-t` is omitted.

In the Julia REPL, change directory to `MPM3S` and install the MPM3S package. This installs the exact dependencies recorded in `Manifest.toml`:

```julia-repl
julia> cd("path/to/MPM3S")
julia> using Pkg;
julia> Pkg.activate(".")
julia> Pkg.instantiate()
julia> using MPM3S
```

If everything succeeds the REPL prints the package versions being resolved.

**3. Run a problem.** Copy a tutorial `input_data.json` (for example from [Tutorial 1](../TutorialProblems/Tutorial_1_input_data.md)) into the folder you want to work in, and run it from that folder:

=== "CPU"

    ```julia-repl
    julia> cd("path/to/run_folder")
    julia> MPM3S.non_linear_solve("input_data.json");
    ```

    - `cd` moves the REPL to the folder holding your input file, since step 2 left it in `MPM3S`.
    - `input_data.json` contains the simulation data; `MPM3S.non_linear_solve()` with no argument reads `input_data.json`.
    - The semicolon stops the REPL printing the material-point data that is returned.
    - The input file must have `"GPU": "off"`.

=== "GPU"

    ```julia-repl
    julia> cd("path/to/run_folder")
    julia> MPM3S.non_linear_solve("intut_data.json");
    ```

    - `cd` moves the REPL to the folder holding your input file, since step 2 left it in `MPM3S`.
    - `intut_data.json` contains the simulation data; `MPM3S.non_linear_solve()` with no argument reads `input_data.json`.
    - The semicolon stops the REPL printing the material-point data that is returned.
    - The input file must have `"GPU": "on"`, and the machine needs an NVIDIA GPU with CUDA.

This steps through the load increments set in the input file and writes the `.vtu`, `.vtk` and `.csv` output files to the folder you ran it from.

!!! warning "Important"
    The paths to any `.stl` files in `input_data.json` are relative to the input file, not to the folder Julia is running in. The simplest set-up is to keep the `.stl` files in the same folder as `input_data.json`.

Open the VTU/VTK files in [ParaView](https://www.paraview.org/) (or [VisIt](https://visit-dav.github.io/visit-website/)) to inspect the deformed mesh and the stress / displacement fields.

## Container runtime
A container image bundles Julia, MPM3S and its dependencies, so nothing needs installing on the host machine. This is the usual route on HPC.

Images are built by a GitHub Actions workflow in the MPM3S repository and published to the GitHub container registry. The latest build of the default branch is:

```text
ghcr.io/mpm3s/mpm3s:latest
```

For work you need to reproduce later, pull a fixed version tag such as `ghcr.io/mpm3s/mpm3s:v1.0.0` rather than `latest`, so that the image cannot change underneath you.

!!! note "Placeholder"
    This image is not published yet, so the address above will not resolve. Until it is, install MPM3S through the [Julia runtime](#julia-runtime) route above.

Install whichever runtime suits your machine, then pull the image.


### Docker

**1. Install Docker** using the official guide for your system: [Windows](https://docs.docker.com/desktop/setup/install/windows-install/), [macOS](https://docs.docker.com/desktop/setup/install/mac-install/) or [Linux](https://docs.docker.com/desktop/setup/install/linux/).

**2. Pull the image and start a container** from the folder holding your `input_data.json`:

=== "Windows (CPU)"

    ```powershell
    docker pull ghcr.io/mpm3s/mpm3s:latest
    docker run --rm -it -v ${PWD}:/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance on a CPU use the number of physical cores minus 2; if the analysis is on a GPU, 4 threads is sufficient.
    - The input file must have `"GPU": "off"`.

=== "Windows (GPU)"

    Requirements: Docker Desktop's WSL 2 engine, which is the default. The NVIDIA driver you already have on Windows is all that is needed.

    ```powershell
    docker pull ghcr.io/mpm3s/mpm3s:latest
    docker run --rm -it --gpus all -v ${PWD}:/work -w /work ghcr.io/mpm3s/mpm3s:latest intut_data.json -t 4
    ```

    - `intut_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; 4 threads is sufficient when the analysis is on a GPU, and if it is not given it defaults to 4.
    - `--gpus all` only makes the GPU visible to the container; the input file must also have `"GPU": "on"`.

=== "Linux (CPU)"

    ```bash
    sudo docker pull ghcr.io/mpm3s/mpm3s:latest
    sudo docker run --rm -it -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest intut_data.json -t 4
    ```

    - `intut_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance on a CPU use the number of physical cores minus 2.
    - The input file must have `"GPU": "off"`.

=== "Linux (GPU)"

    Requirements: the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

    ```bash
    sudo docker pull ghcr.io/mpm3s/mpm3s:latest
    sudo docker run --rm -it --gpus all -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest intut_data.json -t 4
    ```

    - `intut_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; 4 threads is sufficient when the analysis is on a GPU, and if it is not given it defaults to 4.
    - `--gpus all` only makes the GPU visible to the container; the input file must also have `"GPU": "on"`.

=== "macOS (CPU)"

    Note: Macs have no NVIDIA GPU, so MPM3S runs on the CPU.

    ```bash
    docker pull ghcr.io/mpm3s/mpm3s:latest
    docker run --rm -it -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest intut_data.json -t 4
    ```

    - `intut_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance use the number of physical cores minus 2.
    - The input file must have `"GPU": "off"`.

Docker runs in the folder you call it from, so keep `input_data.json` there and the `.vtu` and `.csv` results appear beside it.

### Apptainer (Linux only)

Apptainer is the usual choice on HPC as it runs without administrator rights. Check whether your cluster already provides it with `apptainer --version`; if not, ask your administrator.

To install locally on your Linux machine follow the [installation guide](https://apptainer.org/docs/admin/main/installation.html). The `--nv` flag passes NVIDIA GPUs into the container, as described in the [GPU support guide](https://apptainer.org/docs/user/main/gpu.html).

To obtain the image, pull it into a local `.sif` file in your current directory:

```bash
apptainer pull mpm3s.sif docker://ghcr.io/mpm3s/mpm3s:latest
```
To run the file, call it in the terminal or include it in your job script:

=== "CPU"

    ```bash
    apptainer run mpm3s.sif intut_data.json -t 4
    ```

    - `intut_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance on a CPU use the number of physical cores minus 2.
    - The input file must have `"GPU": "off"`.

=== "GPU"

    ```bash
    apptainer run --nv mpm3s.sif intut_data.json -t 4
    ```

    - `intut_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; 4 threads is sufficient when the analysis is on a GPU, and if it is not given it defaults to 4.
    - `--nv` only makes the GPU visible to the container; the input file must also have `"GPU": "on"`.

Apptainer runs in the directory you call it from, so keep `input_data.json` beside `mpm3s.sif` and the `.vtu` and `.csv` results appear there too.

### Singularity (Linux only)

SingularityCE is a common choice on HPC as it runs without administrator rights. Check whether your cluster already provides it with `singularity --version`; if not, ask your administrator.

To install locally on your Linux machine follow the [installation guide](https://docs.sylabs.io/guides/latest/admin-guide/installation.html). The `--nv` flag passes NVIDIA GPUs into the container, as described in the [GPU support guide](https://docs.sylabs.io/guides/latest/user-guide/gpu.html).

To obtain the image, pull it into a local `.sif` file in your current directory:

```bash
singularity pull mpm3s.sif docker://ghcr.io/mpm3s/mpm3s:latest
```

To run the file, call it in the terminal or include it in your job script:

=== "CPU"

    ```bash
    singularity run mpm3s.sif intut_data.json -t 4
    ```

    - `intut_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance on a CPU use the number of physical cores minus 2.
    - The input file must have `"GPU": "off"`.

=== "GPU"

    ```bash
    singularity run --nv mpm3s.sif intut_data.json -t 4
    ```

    - `intut_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; 4 threads is sufficient when the analysis is on a GPU, and if it is not given it defaults to 4.
    - `--nv` only makes the GPU visible to the container; the input file must also have `"GPU": "on"`.

Singularity runs in the directory you call it from, so keep `input_data.json` beside `mpm3s.sif` and the `.vtu` and `.csv` results appear there too.

## Cloud computing
To do:

## Visualisation installation
MPM3S writes `.vtu`, `.vtk` and `.csv` files. [ParaView](https://www.paraview.org/) opens the VTU and VTK output, and is the viewer the tutorials use.

### ParaView installation

Download the latest release from [paraview.org/download](https://www.paraview.org/download/). The standard build is all that is needed.

=== "Windows"

    Download the `.msi` installer and run it.

=== "macOS"

    Download the `.dmg`, choosing the Apple silicon or Intel build to match your Mac, then drag ParaView into *Applications*. If macOS refuses to open it, right-click the app and choose *Open*.

=== "Linux"

    Install your distribution's package, for example `sudo apt install paraview` on Debian and Ubuntu, or `sudo dnf install paraview` on Fedora. Alternatively download the `.tar.gz`, unpack it and run `bin/paraview`.


