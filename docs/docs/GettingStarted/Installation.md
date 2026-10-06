
---

## Requirements

S3-MPM is a Julia package and runs anywhere Julia is supported.

**Operating system:** Linux, macOS, and Windows are all supported. Most development and testing has been done on Linux.

**Julia version:** 1.12 or newer. Earlier releases may work but are not actively tested.

**Hardware:** A typical desktop or laptop is sufficient for the tutorial problems. For larger 3D problems with refined meshes it is recommended to use an HPC with at least 10 cores, at least 60 GB of RAM and 10 GB of free disk for outputs. If you are using a GPU it is also recommended that the GPU has 60 GB of GPU memory (data-centre GPUs such as the NVIDIA A100 or H100 have 40-80 GB).

**Software requrements tooling:**

- [Julia](https://julialang.org/downloads/) - at least version 1.12.
- A text editor with JSON support for editing `input_data.json` files - [VS Code](https://code.visualstudio.com/) with the [Julia extension](https://www.julia-vscode.org/) is a sensible default.
- [ParaView](https://www.paraview.org/) or [VisIt](https://visit-dav.github.io/visit-website/) for visualising the VTU/VTK output, support and tutorial detail is only provided for Paraview.

**Optional:**

- [Git](https://git-scm.com/) for cloning the source repository.
- A container runtime ([Docker](https://www.docker.com/), or [Apptainer](https://apptainer.org/)/[Singularity](https://sylabs.io/singularity/) on HPC) to run Julia and S3-MPM without installation - see [deploying with containers](../UsingTheSoftware/DeployingTheSoftware.md).

## Julia runtime
The simplest deployment is to install Julia and run S3-MPM from source:

??? plain "Julia installation"

    Use the official installer from [julialang.org/downloads](https://julialang.org/downloads/), or on Linux/macOS use the [`juliaup`](https://github.com/JuliaLang/juliaup) toolchain manager:

    ```bash
    curl -fsSL https://install.julialang.org | sh
    ```

    Verify the install with `julia --version`.

??? plain "Downloading S3-MPM from GitHub"

    The source lives at [github.com/AMPSSIE/S3-MPM](https://github.com/AMPSSIE/S3-MPM).

    With git, clone it - updating later is then a single `git pull`:

    ```bash
    git clone https://github.com/AMPSSIE/S3-MPM.git
    cd S3-MPM
    ```

    Without git, use the green *Code* button on the GitHub page, choose *Download ZIP* and unzip it wherever you want to keep it.

    Either way you end up with a folder containing `Project.toml` and `Manifest.toml`. That folder is what you point Julia at with `--project`.

??? plain "S3-MPM installation"

    **1. Download the code** from GitHub, as described above.

    **2. Start Julia and install the S3-MPM package.** Open a Julia REPL, change into the `MaterialPoints` directory of the cloned repository and `include` the setup script. This installs the exact dependencies recorded in `Manifest.toml` and starts the parallel workers that S3-MPM uses:

    ```julia-repl
    julia> cd("path/to/S3-MPM/MaterialPoints")

    julia> include("setup_workers.jl")
    ```

    If everything succeeds the REPL prints the package versions being resolved, the activated project path and a `starting sim` line; see the [Tutorial 1 terminal output](../TutorialProblems/Tutorial_1.md#setting-up-and-running-the-problem) (or [Tutorial 2](../TutorialProblems/Tutorial_2.md#setting-up-and-running-the-problem)) for the expected console.

    **3. Run a problem.** Copy a tutorial `input_data.json` (for example from [Tutorial 1](../TutorialProblems/Tutorial_1_input_data.md) or [Tutorial 2](../TutorialProblems/Tutorial_2_input_data.md)) into the `MaterialPoints` directory and call the S3-MPM entry point from the same Julia REPL:

    ```julia-repl
    julia> S3MPM.non_linear_solve("input_data.json");
    ```

    This steps through the load increments configured in the JSON and writes `.vtu`, `.vtk` and `.csv` output files to `MaterialPoints/src/output`. Open the VTU/VTK files in [ParaView](https://www.paraview.org/) (or [VisIt](https://visit-dav.github.io/visit-website/)) to inspect the deformed mesh and the stress / displacement fields.

## Container Runtime
A container image bundles Julia, S3-MPM and its dependencies, so nothing needs installing on the host machine. This is the usual route on HPC.

Images are built by a GitHub Actions workflow in the S3-MPM repository and published to the GitHub container registry. The latest build of the default branch is:

```text
ghcr.io/ampssie/s3-mpm:latest
```

For work you need to reproduce later, pull a fixed version tag such as `ghcr.io/ampssie/s3-mpm:v1.0.0` rather than `latest`, so that the image cannot change underneath you.

!!! note "Placeholder"
    This image is not published yet, so the address above will not resolve. Until it is, install S3-MPM through the [Julia runtime](#julia-runtime) route above.

Install whichever runtime suits your machine, then pull the image:


??? plain "Docker"

    **1. Install Docker** using the official guide for your system: [Windows](https://docs.docker.com/desktop/setup/install/windows-install/), [macOS](https://docs.docker.com/desktop/setup/install/mac-install/) or [Linux](https://docs.docker.com/desktop/setup/install/linux/).

    **2. Pull the image and start a container** from the folder holding your `input_data.json`:

    === "Windows (CPU)"

        ```powershell
        docker pull ghcr.io/ampssie/s3-mpm:latest
        docker run --rm -it -v ${PWD}:/work -w /work ghcr.io/ampssie/s3-mpm:latest
        ```

    === "Windows (GPU)"

        Requirements: Docker Desktop's WSL 2 engine, which is the default. The NVIDIA driver you already have on Windows is all that is needed.

        ```powershell
        docker pull ghcr.io/ampssie/s3-mpm:latest
        docker run --rm -it --gpus all -v ${PWD}:/work -w /work ghcr.io/ampssie/s3-mpm:latest
        ```

    === "Linux (CPU)"

        ```bash
        sudo docker pull ghcr.io/ampssie/s3-mpm:latest
        sudo docker run --rm -it -v "$PWD":/work -w /work ghcr.io/ampssie/s3-mpm:latest
        ```

    === "Linux (GPU)"

        Requirements: Needs the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

        ```bash
        sudo docker pull ghcr.io/ampssie/s3-mpm:latest
        sudo docker run --rm -it --gpus all -v "$PWD":/work -w /work ghcr.io/ampssie/s3-mpm:latest
        ```       

    === "macOS (CPU)"

        Requirements: Macs have no NVIDIA GPU, so S3-MPM runs on the CPU.

        ```bash
        docker pull ghcr.io/ampssie/s3-mpm:latest
        docker run --rm -it -v "$PWD":/work -w /work ghcr.io/ampssie/s3-mpm:latest
        ```

    Docker runs in the folder you call it from, so keep `input_data.json` there and the `.vtu` and `.csv` results appear beside it.

??? plain "Apptainer (Linux only)"

    Apptainer is the usual choice on HPC as it runs without administrator rights. Check whether your cluster already provides it, if not ask your administrator.    
    
    To install locally on your Linux machine follow the [installation guide](https://apptainer.org/docs/admin/main/installation.html) with details for the [GPU support](https://apptainer.org/docs/user/main/gpu.html) - the `--nv` flag passes NVIDIA GPUs into the container.

    To obtain the image pull the image into a local `.sif` file in your current directory:

    ```bash
    apptainer pull s3-mpm.sif docker://ghcr.io/ampssie/s3-mpm:latest
    ```
    To run the file call in the terminal, or include in your deploy script: 

    === "CPU"

        ```bash
        apptainer run s3-mpm.sif
        ```

    === "GPU"

        ```bash
        apptainer run --nv s3-mpm.sif
        ```

    Apptainer runs in the directory you call it from, so keep `input_data.json` beside `s3-mpm.sif` and the `.vtu` and `.csv` results appear there too.

??? plain "Singularity (Linux only)"

    SingularityCE is a common choice on HPC as it runs without administrator rights. Check whether your cluster already provides it with `singularity --version`; if not, ask your administrator.

    To install locally on your Linux machine follow the [installation guide](https://docs.sylabs.io/guides/latest/admin-guide/installation.html), with details for the [GPU support](https://docs.sylabs.io/guides/latest/user-guide/gpu.html) - the `--nv` flag passes NVIDIA GPUs into the container.

    To obtain the image pull it into a local `.sif` file in your current directory:

    ```bash
    singularity pull s3-mpm.sif docker://ghcr.io/ampssie/s3-mpm:latest
    ```

    To run the file call in the terminal, or include in your job script:

    === "CPU"

        ```bash
        singularity run s3-mpm.sif
        ```

    === "GPU"

        ```bash
        singularity run --nv s3-mpm.sif
        ```

    Singularity runs in the directory you call it from, so keep `input_data.json` beside `s3-mpm.sif` and the `.vtu` and `.csv` results appear there too.

## Visualisation installation
S3-MPM writes `.vtu`, `.vtk` and `.csv` files. [ParaView](https://www.paraview.org/) opens the VTU and VTK output, and is the viewer the tutorials use:

??? plain "ParaView installation"

    Download the latest release from [paraview.org/download](https://www.paraview.org/download/). The standard build is all that is needed.

    === "Windows"

        Download the `.msi` installer and run it.

    === "macOS"

        Download the `.dmg`, choosing the Apple silicon or Intel build to match your Mac, then drag ParaView into *Applications*. If macOS refuses to open it, right-click the app and choose *Open*.

    === "Linux"

        Install your distribution's package, for example `sudo apt install paraview` on Debian and Ubuntu, or `sudo dnf install paraview` on Fedora. Alternatively download the `.tar.gz`, unpack it and run `bin/paraview`.


