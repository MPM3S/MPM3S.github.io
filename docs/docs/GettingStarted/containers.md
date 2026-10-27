# Docker and containers

A container image bundles Julia, MPM3S and its GPU libraries, so nothing needs installing on the host machine: download
the image once and run your problems with it. Use Docker on a workstation, and Singularity or Apptainer on an HPC.

--8<-- "terminal_window.md"

## 1. Log in to the GitHub container registry

!!! note "Only while MPM3S.jl is private"
    The image is private for now, so downloading it needs a GitHub login. This section disappears when it is made public.

You need a GitHub account with access to [MPM3S.jl](https://github.com/MPM3S/MPM3S.jl), and a token to use as the
password:

1. On GitHub, go to **Settings → Developer settings → Personal access tokens → Tokens (classic)** and click
   **Generate new token (classic)**.
2. Tick only **`read:packages`**, choose an expiry date, and generate the token. Copy it: GitHub shows it once.
3. Log in once on each machine, pasting the token when asked for the password:

=== "Singularity"

    ```bash
    singularity registry login --username <github-username> oras://ghcr.io
    ```

=== "Apptainer"

    ```bash
    apptainer registry login --username <github-username> oras://ghcr.io
    ```

=== "Docker"

    ```bash
    docker login ghcr.io -u <github-username>
    ```

The login is remembered, so you only do this again when the token expires.

## 2. Get the image

=== "Singularity"

    Check that your machine has it with `singularity --version`; on an HPC, ask your administrator if not. Download the
    image as a single file, `MPM3S.sif`:

    ```bash
    singularity pull MPM3S.sif oras://ghcr.io/mpm3s/mpm3s:latest-sif
    ```

=== "Apptainer"

    Check that your machine has it with `apptainer --version`; on an HPC, ask your administrator if not. Download the
    image as a single file, `MPM3S.sif`:

    ```bash
    apptainer pull MPM3S.sif oras://ghcr.io/mpm3s/mpm3s:latest-sif
    ```

=== "Docker"

    Install Docker using the official guide for [Windows](https://docs.docker.com/desktop/setup/install/windows-install/),
    [macOS](https://docs.docker.com/desktop/setup/install/mac-install/) or [Linux](https://docs.docker.com/desktop/setup/install/linux/),
    then download the image (Docker keeps it for you, rather than as a file):

    ```bash
    docker pull ghcr.io/mpm3s/mpm3s:latest
    ```

`latest` is the newest release. For work you need to reproduce later, use a release instead, e.g. `v0.3.0` (Docker)
or `v0.3.0-sif` (Singularity, Apptainer), so the image cannot change underneath you.

## 3. Organise your work

Keep the image in a working folder, and give every problem its own folder inside it:

```text
my_work/
├── MPM3S.sif                         ← Singularity / Apptainer (Docker keeps its image itself)
├── column/
│   ├── input_data_gravity_column.json
│   ├── vtk_column/                   ← created by the run
│   └── csv_column/                   ← created by the run
└── compaction/
    ├── input_data_compress.json
    ├── cube.stl
    ├── cube_mesh.txt
    ├── vtk_cube/                     ← created by the run
    └── csv_cube/                     ← created by the run
```

- **A problem folder holds everything its problem needs:** the input file and, for a rigid body, its `.stl` and its
  mesh cache (the `_mesh.txt` file named by `"mesh cache"`). The image cannot create a mesh cache, so it must be there.
- **Run from inside the problem folder.** The results are written there, into the folders the input file names in
  `"vtk directory"` and `"csv directory"`.
- **Keep the paths in the input file relative and inside the folder.** The container only sees the folder you run in;
  anywhere else has to be added (`--bind` for Singularity and Apptainer, `-v` for Docker).
- **The input file's `"GPU"` setting decides** whether a problem runs on the CPU (`"off"`) or the GPU (`"on"`), and
  the command must match it.

## 4. Run a problem

From inside the problem folder, give the image the input file. On the CPU, MPM3S uses the number of cores minus 2 as
threads (at least 1): set `MPM3S_CORES` to the cores you have, or leave it out to use every core the container sees.

=== "Singularity"

    === "CPU"

        ```bash
        MPM3S_CORES=8 singularity run ../MPM3S.sif input_data_gravity_column.json
        ```

        The input file must have `"GPU": "off"`.

    === "GPU"

        ```bash
        singularity run --nv ../MPM3S.sif input_data_gravity_column_gpu.json
        ```

        `--nv` passes the GPU into the container; the input file must have `"GPU": "on"`.

=== "Apptainer"

    === "CPU"

        ```bash
        MPM3S_CORES=8 apptainer run ../MPM3S.sif input_data_gravity_column.json
        ```

        The input file must have `"GPU": "off"`.

    === "GPU"

        ```bash
        apptainer run --nv ../MPM3S.sif input_data_gravity_column_gpu.json
        ```

        `--nv` passes the GPU into the container; the input file must have `"GPU": "on"`.

=== "Docker"

    Docker sees only what you mount, so `-v … -w /work` mounts the problem folder as the container's working folder.

    === "CPU"

        === "Linux"

            ```bash
            sudo docker run --rm --user "$(id -u):$(id -g)" -e MPM3S_CORES=8 -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column.json
            ```

            `--user` makes the results yours rather than root's.

        === "macOS"

            ```bash
            docker run --rm -e MPM3S_CORES=8 -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column.json
            ```

        === "Windows"

            ```powershell
            docker run --rm -e MPM3S_CORES=8 -v ${PWD}:/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column.json
            ```

        The input file must have `"GPU": "off"`.

    === "GPU"

        === "Linux"

            Requires the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

            ```bash
            sudo docker run --rm --gpus all --user "$(id -u):$(id -g)" -v "$PWD":/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column_gpu.json
            ```

        === "Windows"

            Requires Docker Desktop's WSL 2 engine (the default) and the NVIDIA driver you already have.

            ```powershell
            docker run --rm --gpus all -v ${PWD}:/work -w /work ghcr.io/mpm3s/mpm3s:latest input_data_gravity_column_gpu.json
            ```

        Macs have no NVIDIA GPU, so they run on the CPU only. `--gpus all` passes the GPU into the container; the input
        file must have `"GPU": "on"`.

The first line of the output shows how the run uses the machine, e.g.
`MPM3S 0.3.0 · CPU znver2 · 6 threads`, with the GPU added on a GPU run. On an HPC, put the command in a job script;
for Hamilton see [HPC (Hamilton)](hpc.md).

## 5. Practise on the tutorials

The [tutorials](../TutorialProblems/TutorialProblems.md) make good practice. Their files come with MPM3S: download
[MPM3S.jl](https://github.com/MPM3S/MPM3S.jl) (**Code → Download ZIP**, or `git clone`), and copy each tutorial's files
from its `validation_data_and_jsons` folder into a new problem folder.

For example, the self-weight column ([Tutorial 1](../TutorialProblems/Tutorial_1.md)) with Singularity:

=== "CPU"

    ```bash
    cd my_work
    mkdir column
    cp MPM3S/validation_data_and_jsons/input_data_gravity_column.json column/
    cd column
    MPM3S_CORES=8 singularity run ../MPM3S.sif input_data_gravity_column.json
    ```

    The results appear in `column/vtk_column` and `column/csv_column`.

=== "GPU"

    ```bash
    cd my_work
    mkdir column_gpu
    cp MPM3S/validation_data_and_jsons/input_data_gravity_column_gpu.json column_gpu/
    cd column_gpu
    singularity run --nv ../MPM3S.sif input_data_gravity_column_gpu.json
    ```

    The results appear in `column_gpu/vtk_column_gpu` and `column_gpu/csv_column_gpu`.

Open them as described in [Viewing the output](viewing_output.md). The other tutorials work the same way:

| Tutorial | Copy into its folder | Runs on |
|---|---|---|
| [1 Self-weight column](../TutorialProblems/Tutorial_1.md) | `input_data_gravity_column.json`, or `input_data_gravity_column_gpu.json` | CPU, or GPU |
| [2 Compaction via a rigid body](../TutorialProblems/Tutorial_2.md) | `input_data_compress.json`, `cube.stl`, `cube_mesh.txt` | CPU |
| [3 Vertical penetration](../TutorialProblems/Tutorial_3.md) | `input_data_CPT_dr32.json`, `CPT.stl`, `CPT_mesh.txt` | GPU |
| [5 Rolling sphere](../TutorialProblems/Tutorial_5.md) | `input_data_sphere.json`, `sphere.stl`, `sphere_mesh.txt` | CPU |
| [6 Drag anchor](../TutorialProblems/Tutorial_6.md) | `input_data_AC14_dr32.json`, `AC14_fluke_rot20.stl`, `AC14_fluke_rot20_mesh.txt`, `AC14_shank.stl`, `AC14_shank_mesh.txt` | GPU |

## Troubleshooting

| Message | Fix |
|---|---|
| `unauthorized` or `denied` when downloading | Log in first ([section 1](#1-log-in-to-the-github-container-registry)), with a token that has `read:packages`. |
| `… says "GPU": "on", but no GPU is visible` | Add `--nv` (Singularity, Apptainer) or `--gpus all` (Docker), on a machine with an NVIDIA GPU. |
| `the output folder … is not in a mounted host folder` | Run from inside the problem folder (Docker: with `-v … -w /work`), or keep the output paths in the input file relative. |
| `usage: mpm3s input.json` | Give exactly one input file, and check it is in the folder you run from. |
| An error about meshing or Gmsh | The rigid body's mesh cache (`_mesh.txt`) is missing from the problem folder. |
