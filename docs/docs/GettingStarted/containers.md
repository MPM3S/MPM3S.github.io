---
title: Docker and containers
---

# Docker and containers

A container image bundles Julia, MPM3S, its GPU libraries, the tutorial files and the HPC job scripts, ready to run.

Nothing needs installing on the host but the program that runs the image. Download the image once, then run each problem with one command. A run writes nothing outside its own problem folder.

Two programs run the image; choose by the machine:

<div class="grid cards equal" markdown>

-   :material-package-variant-closed:{ .lg .middle } __Singularity / Apptainer__

    ---

    For an HPC, or your own Linux machine. Runs without admin rights, with the image as a single file.

    [:octicons-arrow-right-24: Singularity / Apptainer](singularity.md)

-   :simple-docker:{ .lg .middle } __Docker__

    ---

    For a workstation running Windows, macOS or Linux.

    [:octicons-arrow-right-24: Docker](docker.md)

</div>

| | Singularity / Apptainer | Docker |
|---|---|---|
| Runs on | Linux, including HPCs | Windows, macOS and Linux |
| Admin rights | Not needed to run it | Needed to install it |
| The image | One file, `MPM3S.sif`, in your working folder | Kept by Docker; `docker images` lists it |
| Its name | `docker://ghcr.io/mpm3s/mpm3s:latest` | `ghcr.io/mpm3s/mpm3s:latest` |
| GPU runs | `--nv`, on a machine with an NVIDIA GPU | `--gpus all`, on Windows or Linux with an NVIDIA GPU |

Each page takes the same steps: install or check the program, log in to the GitHub container registry (while MPM3S.jl is private), download the image, run a problem from inside its folder, and practise on the tutorials. To run the image as batch jobs on a Slurm cluster, see [HPC with the container](hpc_container.md).
