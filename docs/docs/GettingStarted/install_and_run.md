---
title: Install and run
---

# Install and run

There are four ways to run MPM3S, and a viewer for its output. Each tile below links to the page for one of them, and every page starts with how to open a command/terminal window.

<div class="grid cards equal" markdown>

-   :simple-julia:{ .lg .middle } __Julia (PC)__

    ---

    Install Julia and MPM3S and run from the Julia REPL. The simplest route, on a PC that you have admin rights to.

    [:octicons-arrow-right-24: Julia (PC)](julia.md)

-   :simple-docker:{ .lg .middle } __Docker and containers__

    ---

    An image with Julia and MPM3S already installed, run with Docker, Apptainer or Singularity. The easiest way to set up the simulations on an HPC.

    [:octicons-arrow-right-24: Docker and containers](containers.md)

-   :material-server-network:{ .lg .middle } __HPC (Slurm)__

    ---

    Run MPM3S as Slurm batch jobs, on a GPU or on CPU cores, from the container or installed with Julia.

    [:octicons-arrow-right-24: HPC (Slurm)](hpc.md)

-   :material-cloud-outline:{ .lg .middle } __Cloud computing__

    ---

    Run MPM3S on a cloud service such as Google Colab.

    [:octicons-arrow-right-24: Cloud computing](cloud.md)

-   :material-chart-box-outline:{ .lg .middle } __Output__

    ---

    Install ParaView to view the `.vtu` and `.vtk` files that MPM3S writes.

    [:octicons-arrow-right-24: Viewing the output](viewing_output.md)

</div>

## Requirements

MPM3S is a Julia package and runs anywhere Julia is supported.

**Operating system:** Linux, macOS, and Windows are all supported. Most development and testing has been done on Linux.

**Julia version:** 1.12 or newer. Earlier releases may work but are not actively tested.

**Hardware:** A typical desktop or laptop is sufficient for the tutorial problems. For larger 3D problems with refined meshes it is recommended to use an HPC with at least 10 cores, at least 60 GB of RAM and 10 GB of free disk for outputs. If you are using a GPU it is also recommended that the GPU has 60 GB of GPU memory (data-centre GPUs such as the NVIDIA A100 or H100 have 40-80 GB).

**Software requirements:**

- [Julia](https://julialang.org/downloads/) - at least version 1.12.
- A text editor with JSON support for editing `input_data.json` files - [VS Code](https://code.visualstudio.com/) with the [Julia extension](https://www.julia-vscode.org/) is a sensible default.
- [ParaView](https://www.paraview.org/) or [VisIt](https://visit-dav.github.io/visit-website/) for visualising the VTU/VTK output. Support and tutorial detail are only provided for ParaView.

**Optional:**

- [Git](https://git-scm.com/) for cloning the source repository.
- A container runtime ([Docker](https://www.docker.com/), or [Apptainer](https://apptainer.org/)/[Singularity](https://sylabs.io/singularity/) on HPC) to run Julia and MPM3S without installation - see [Docker and containers](containers.md).
