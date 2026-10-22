# Docker and containers

A container image bundles Julia, MPM3S and its dependencies, so nothing needs installing on the host machine. This is the usual route on HPC.

--8<-- "terminal_window.md"

## The MPM3S image

Images are built by a GitHub Actions workflow in the MPM3S repository and published to the GitHub container registry. The latest build of the default branch is:

```text
ghcr.io/mpm3s/mpm3s:latest
```

For work you need to reproduce later, pull a fixed version tag such as `ghcr.io/mpm3s/mpm3s:v1.0.0` rather than `latest`, so that the image cannot change underneath you.

!!! note "Placeholder"
    This image is not published yet, so the address above will not resolve. Until it is, install MPM3S through the [Julia](julia.md) route.

Install whichever runtime suits your machine, then pull the image.

## Docker

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
    docker run --rm -it --gpus all -v ${PWD}:/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; 4 threads is sufficient when the analysis is on a GPU, and if it is not given it defaults to 4.
    - `--gpus all` only makes the GPU visible to the container; the input file must also have `"GPU": "on"`.

=== "Linux (CPU)"

    ```bash
    sudo docker pull ghcr.io/mpm3s/mpm3s:latest
    sudo docker run --rm -it -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance on a CPU use the number of physical cores minus 2.
    - The input file must have `"GPU": "off"`.

=== "Linux (GPU)"

    Requirements: the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

    ```bash
    sudo docker pull ghcr.io/mpm3s/mpm3s:latest
    sudo docker run --rm -it --gpus all -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; 4 threads is sufficient when the analysis is on a GPU, and if it is not given it defaults to 4.
    - `--gpus all` only makes the GPU visible to the container; the input file must also have `"GPU": "on"`.

=== "macOS (CPU)"

    Note: Macs have no NVIDIA GPU, so MPM3S runs on the CPU.

    ```bash
    docker pull ghcr.io/mpm3s/mpm3s:latest
    docker run --rm -it -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance use the number of physical cores minus 2.
    - The input file must have `"GPU": "off"`.

Docker runs in the folder you call it from, so keep `input_data.json` there and the `.vtu` and `.csv` results appear beside it.

## Apptainer (Linux only)

Apptainer is the usual choice on HPC as it runs without administrator rights. Check whether your cluster already provides it with `apptainer --version`; if not, ask your administrator.

To install locally on your Linux machine follow the [installation guide](https://apptainer.org/docs/admin/main/installation.html). The `--nv` flag passes NVIDIA GPUs into the container, as described in the [GPU support guide](https://apptainer.org/docs/user/main/gpu.html).

To obtain the image, pull it into a local `.sif` file in your current directory:

```bash
apptainer pull mpm3s.sif docker://ghcr.io/mpm3s/mpm3s:latest
```
To run the file, call it in the terminal or include it in your job script:

=== "CPU"

    ```bash
    apptainer run mpm3s.sif input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance on a CPU use the number of physical cores minus 2.
    - The input file must have `"GPU": "off"`.

=== "GPU"

    ```bash
    apptainer run --nv mpm3s.sif input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; 4 threads is sufficient when the analysis is on a GPU, and if it is not given it defaults to 4.
    - `--nv` only makes the GPU visible to the container; the input file must also have `"GPU": "on"`.

Apptainer runs in the directory you call it from, so keep `input_data.json` beside `mpm3s.sif` and the `.vtu` and `.csv` results appear there too.

## Singularity (Linux only)

SingularityCE is a common choice on HPC as it runs without administrator rights. Check whether your cluster already provides it with `singularity --version`; if not, ask your administrator.

To install locally on your Linux machine follow the [installation guide](https://docs.sylabs.io/guides/latest/admin-guide/installation.html). The `--nv` flag passes NVIDIA GPUs into the container, as described in the [GPU support guide](https://docs.sylabs.io/guides/latest/user-guide/gpu.html).

To obtain the image, pull it into a local `.sif` file in your current directory:

```bash
singularity pull mpm3s.sif docker://ghcr.io/mpm3s/mpm3s:latest
```

To run the file, call it in the terminal or include it in your job script:

=== "CPU"

    ```bash
    singularity run mpm3s.sif input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; if it is not given it defaults to 4. For the fastest performance on a CPU use the number of physical cores minus 2.
    - The input file must have `"GPU": "off"`.

=== "GPU"

    ```bash
    singularity run --nv mpm3s.sif input_data.json -t 4
    ```

    - `input_data.json` contains the simulation data; if it is not given it defaults to `input_data.json`.
    - `-t 4` is the number of CPU threads; 4 threads is sufficient when the analysis is on a GPU, and if it is not given it defaults to 4.
    - `--nv` only makes the GPU visible to the container; the input file must also have `"GPU": "on"`.

Singularity runs in the directory you call it from, so keep `input_data.json` beside `mpm3s.sif` and the `.vtu` and `.csv` results appear there too.
