# Docker

Docker runs the MPM3S container image on a workstation running Windows, macOS or Linux. The image holds Julia, MPM3S,
its GPU libraries and the tutorial files, so nothing else needs installing. On an HPC, where Docker is rarely
available, use [Singularity / Apptainer](singularity.md).

!!! note "Add your GitHub account to your computer or HPC (while MPM3S.jl is private)"
    --8<-- "github_account.md"

    On your computer or HPC, downloading the image uses the token:
    [section 2](#2-log-in-to-the-github-container-registry) logs it in with the token.

--8<-- "terminal_window.md"

## 1. Install Docker

Install Docker Desktop on [Windows](https://docs.docker.com/desktop/setup/install/windows-install/) or
[macOS](https://docs.docker.com/desktop/setup/install/mac-install/), or Docker Engine on
[Linux](https://docs.docker.com/engine/install/). Check it is installed by typing into your command/terminal window:

```bash
docker --version
```

- **On Linux,** add yourself to the `docker` group (Docker's
  [post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/)), or put `sudo` in front of every
  `docker` command on this page.
- **For GPU runs** you need an NVIDIA GPU and its driver, and on Linux the
  [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html);
  on Windows, Docker Desktop's WSL 2 engine (the default) is enough. Macs have no NVIDIA GPU, so they run on the CPU
  only.
- **The image is built for Intel and AMD (x86-64) processors.** On an Apple-silicon Mac, Docker runs it through
  emulation, which is slower.

## 2. Log in to the GitHub container registry

--8<-- "container_login.md"

```bash
docker login ghcr.io -u <github-username>
```

## 3. Make a working folder

Create a working folder, which we have called `my_work`, on a drive with plenty of space, as the results can run to
many GB. Put the drive's path in place of `<path to large drive>`. This is where the problem folders (containing the
json files and result folders) will be. First we must make the working directory and `cd` into it:

```bash
mkdir <path to large drive>/my_work
cd <path to large drive>/my_work
```

```text
<path to large drive>/my_work/
```

## 4. Download the image

```bash
docker pull ghcr.io/mpm3s/mpm3s:latest
```

Docker keeps the image itself rather than as a file, so the working folder stays empty; `docker images` lists it. Run
the same command again to update it to a new release.

`latest` is the newest release; its images are published the night after the release. For work you need to reproduce
later, name a release instead, e.g. `ghcr.io/mpm3s/mpm3s:v0.3.0`, here and in the commands below, so the image cannot
change underneath you.

## 5. Run a problem

### Make a problem folder

From your working folder, make a folder for the problem, go into it and put the problem's files in it:

```bash
mkdir column
cd column
```

This example uses a premade problem, the self-weight column ([Tutorial 1](../TutorialProblems/Tutorial_1.md)), whose
input files are inside the image. To copy them into the `column` folder, use:

=== "Linux"

    ```bash
    docker run --rm --user "$(id -u):$(id -g)" -v "$PWD":/work -w /work --entrypoint cp ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/{input_data_gravity_column.json,input_data_gravity_column_gpu.json} .
    ```

    `--user` makes the files yours rather than root's.

=== "macOS"

    ```bash
    docker run --rm -v "$PWD":/work -w /work --entrypoint cp ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/{input_data_gravity_column.json,input_data_gravity_column_gpu.json} .
    ```

=== "Windows"

    ```powershell
    docker run --rm -v ${PWD}:/work -w /work --entrypoint cp ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/input_data_gravity_column.json /opt/MPM3S/validation_data_and_jsons/input_data_gravity_column_gpu.json .
    ```

`$PWD` (`${PWD}` in PowerShell) is the folder you are in, and `-v "$PWD":/work -w /work` makes it the container's
working folder, so the files are copied into your current directory, here `column`. `--entrypoint cp` runs `cp` in the
image in place of MPM3S.

```text
<path to large drive>/my_work/
└── column/
    ├── input_data_gravity_column.json      ← copied from the image
    └── input_data_gravity_column_gpu.json  ← copied from the image
```

--8<-- "container_problem_folder.md"

### Run it

From inside the problem folder (in this example you should be in `column`), give the image the input file and run it.
As in the copy, `$PWD` (`${PWD}` in PowerShell) is the folder you are in, so the results are written into your current
directory. On the CPU, MPM3S uses the number of cores minus 2 as threads (at least 1): set `MPM3S_CORES` to the cores to use, or
leave it out to use every core the container sees. An input file with `"GPU": "on"` needs the GPU passed in with
`--gpus all`.

=== "Linux"

    ```bash title="CPU"
    docker run --rm --user "$(id -u):$(id -g)" -e MPM3S_CORES=8 -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column.json
    ```

    ```bash title="GPU"
    docker run --rm --gpus all --user "$(id -u):$(id -g)" -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column_gpu.json
    ```

    `--user` makes the results yours rather than root's.

=== "macOS"

    ```bash title="CPU"
    docker run --rm -e MPM3S_CORES=8 -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column.json
    ```

=== "Windows"

    ```powershell title="CPU"
    docker run --rm -e MPM3S_CORES=8 -v ${PWD}:/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column.json
    ```

    ```powershell title="GPU"
    docker run --rm --gpus all -v ${PWD}:/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column_gpu.json
    ```

The first line of the output shows how the run uses the machine, e.g. `MPM3S 0.3.0 · CPU znver2 · 6 threads`, with the
GPU added on a GPU run. The results are written into the problem folder:

```text
<path to large drive>/my_work/
└── column/
    ├── input_data_gravity_column.json
    ├── input_data_gravity_column_gpu.json
    ├── vtk_column/                         ← created by the run
    └── csv_column/                         ← created by the run
```

## 6. Practise on the tutorials

The [tutorials'](../TutorialProblems/TutorialProblems.md) files are inside the image, in
`/opt/MPM3S/validation_data_and_jsons`, so a tutorial runs from an empty problem folder with nothing to download: give
the image the input file's path there. For example, the self-weight column
([Tutorial 1](../TutorialProblems/Tutorial_1.md)), from your working folder:

=== "Linux"

    ```bash
    mkdir column
    cd column
    docker run --rm --user "$(id -u):$(id -g)" -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/input_data_gravity_column.json
    ```

=== "macOS"

    ```bash
    mkdir column
    cd column
    docker run --rm -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/input_data_gravity_column.json
    ```

=== "Windows"

    ```powershell
    mkdir column
    cd column
    docker run --rm -v ${PWD}:/work -w /work ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/input_data_gravity_column.json
    ```

--8<-- "container_tutorials.md"

To change a tutorial, or start a problem of your own from one, copy its files out of the image into a problem folder
and run it as in [section 5](#5-run-a-problem). For Tutorial 2, from inside its problem folder:

=== "Linux"

    ```bash
    docker run --rm --user "$(id -u):$(id -g)" -v "$PWD":/work -w /work --entrypoint cp ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/{input_data_compress.json,cube.stl,cube_mesh.txt} .
    ```

=== "macOS"

    ```bash
    docker run --rm -v "$PWD":/work -w /work --entrypoint cp ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/{input_data_compress.json,cube.stl,cube_mesh.txt} .
    ```

=== "Windows"

    ```powershell
    docker run --rm -v ${PWD}:/work -w /work --entrypoint cp ghcr.io/mpm3s/mpm3s:latest /opt/MPM3S/validation_data_and_jsons/input_data_compress.json /opt/MPM3S/validation_data_and_jsons/cube.stl /opt/MPM3S/validation_data_and_jsons/cube_mesh.txt .
    ```

```text
<path to large drive>/my_work/
├── column/
│   ├── input_data_gravity_column.json
│   ├── input_data_gravity_column_gpu.json
│   ├── vtk_column/
│   └── csv_column/
└── compaction/
    ├── input_data_compress.json            ← copied from the image
    ├── cube.stl                            ← copied from the image
    └── cube_mesh.txt                       ← copied from the image
```

## Troubleshooting

| Message | Fix |
|---|---|
| `permission denied` on `/var/run/docker.sock` | On Linux, add yourself to the `docker` group, or put `sudo` in front of `docker` ([section 1](#1-install-docker)). |
| `unauthorized` or `denied` when downloading | Log in first ([section 2](#2-log-in-to-the-github-container-registry)), with a [token](https://github.com/settings/tokens) that has `repo` and `read:packages` ticked. |
| `could not select device driver "" with capabilities: [[gpu]]` | On Linux, install the NVIDIA Container Toolkit ([section 1](#1-install-docker)) and restart Docker. |
| `… says "GPU": "on", but no GPU is visible` | Add `--gpus all`, on a machine with an NVIDIA GPU. |
| `the output folder … is not in a mounted host folder` | Run from inside the problem folder with `-v … -w /work`, and keep the output paths in the input file relative. |
| `usage: mpm3s input.json` | Give exactly one input file, and check it is in the folder you run from. |
| An error about meshing or Gmsh | A rigid body's mesh cache (`_mesh.txt`) is missing from the problem folder. |
