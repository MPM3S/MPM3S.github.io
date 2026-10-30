# Singularity / Apptainer

Singularity and Apptainer run the MPM3S container image without admin rights, so they are the usual choice on an HPC,
where one is usually installed already (if not, consult your HPC administrator). They run on your own Linux machine too:
install [Apptainer](https://apptainer.org/docs/admin/main/installation.html) or
[SingularityCE](https://docs.sylabs.io/guides/latest/admin-guide/installation.html). The image is a single file,
`MPM3S.sif`, holding Julia, MPM3S, its GPU libraries
and the tutorial files, so nothing else needs installing. To run it as batch jobs on a Slurm cluster, see
[HPC with the container](hpc_container.md), which adds the job scripts.

!!! note "Add your GitHub account to your computer or HPC (while MPM3S.jl is private)"
    --8<-- "github_account.md"

    On your computer or HPC, downloading the image uses the token:
    [section 2](#2-log-in-to-the-github-container-registry) logs it in with the token.

--8<-- "terminal_window.md"

## 1. Check it is installed

Check that your machine has Singularity or Apptainer by typing into your command/terminal window:

=== "Apptainer"

    ```bash
    apptainer --version
    ```

    On an HPC it is usually installed already but might need to load it first:

    ```bash
    module load apptainer
    ```

=== "Singularity"

    ```bash
    singularity --version
    ```

    On an HPC it is usually installed already but might need to load it first:

    ```bash
    module load singularity
    ```

## 2. Log in to the GitHub container registry

--8<-- "container_login.md"

```bash
singularity remote login --username <github-username> docker://ghcr.io
```

## 3. Make a working folder

Create a working folder, which we have called `my_work`, on a drive with plenty of space: the image is 2 GB and the
results can run to many GB. On an HPC, that means its large drive, not your home folder
([Before you start](hpc.md#before-you-start)). Put the drive's path in place of `<path to large drive>`. This will be
where the image will live. It is also where the problem folders (containing the json files and result folders) will be.
First we must make the working directory and `cd` into it:

```bash
mkdir <path to large drive>/my_work
cd <path to large drive>/my_work
```

## 4. Download the image

In your working folder (here called `my_work`), download the image. Singularity downloads the Docker image and turns
it into a single 2 GB file, `MPM3S.sif`:

```bash
singularity cache clean -f
singularity pull -F --disable-cache MPM3S.sif docker://ghcr.io/mpm3s/mpm3s:latest
```

```text
<path to large drive>/my_work/
└── MPM3S.sif                               ← downloaded
```

The first line and `--disable-cache` keep the download out of your home folder, which on an HPC is often too small: a
cached download can fill it and fail with `cached file hash … does not match`. `-F` replaces any older `MPM3S.sif`, so
the same commands update the image to a new release.

`latest` is the newest release; its image is published the night after the release. For work you need to reproduce
later, name a release instead, e.g. `docker://ghcr.io/mpm3s/mpm3s:v0.3.0`, so the image cannot change underneath you.

## 5. Run a problem (on your PC)

On an HPC, run it as a batch job instead: see [HPC with the container](hpc_container.md).

### Make a problem folder

From your working folder, make a folder for the problem beside the image, go into it and put the problem's files in it:

```bash
mkdir column
cd column
```

This example uses a premade problem, the self-weight column ([Tutorial 1](../TutorialProblems/Tutorial_1.md)), whose
input files are inside the image. To copy them into the `column` folder, use:

```bash
singularity exec ../MPM3S.sif cp /opt/MPM3S/validation_data_and_jsons/{input_data_gravity_column.json,input_data_gravity_column_gpu.json} .
```

```text
<path to large drive>/my_work/
├── MPM3S.sif
└── column/
    ├── input_data_gravity_column.json      ← copied from the image
    └── input_data_gravity_column_gpu.json  ← copied from the image
```

- **A problem folder holds everything its problem needs:** the input file and the `.stl` of each rigid body.
- **Run from inside the problem folder.** The container sees that folder, and the results are written into it, to the
  folders the input file names in `"vtk directory"` and `"csv directory"`.
- **Keep the paths in the input file relative and inside the problem folder,** so the container can see them.

### Run it

From inside the problem folder (in this example you should be in `column`), give the image the input file and run it:

=== "CPU"

    ```bash
    MPM3S_CORES=8 singularity run ../MPM3S.sif input_data_gravity_column.json
    ```

    MPM3S uses the number of cores minus 2 as threads (at least 1): set `MPM3S_CORES` to the cores to use, or leave it
    out to use every core the container sees. The input file has `"GPU": "off"`.

=== "GPU"

    ```bash
    singularity run --nv ../MPM3S.sif input_data_gravity_column_gpu.json
    ```

    `--nv` passes the GPU into the container, which an input file with `"GPU": "on"` needs.

`../MPM3S.sif` is the image, one folder up. The first line of the output shows how the run uses the machine, e.g.
`MPM3S 0.3.0 · CPU znver2 · 6 threads`, with the GPU added on a GPU run. The results are written into the problem
folder:

```text
<path to large drive>/my_work/
├── MPM3S.sif
└── column/
    ├── input_data_gravity_column.json
    ├── input_data_gravity_column_gpu.json
    ├── vtk_column/                         ← created by the run
    └── csv_column/                         ← created by the run
```

## 6. Practise on the tutorials

The [tutorials'](../TutorialProblems/TutorialProblems.md) files are inside the image, in
`/opt/MPM3S/validation_data_and_jsons`, so a tutorial needs nothing downloaded: copy its files into a problem folder and
run it there. For example, the self-weight column ([Tutorial 1](../TutorialProblems/Tutorial_1.md)), from your working
folder:

```bash
mkdir column
cd column
singularity exec ../MPM3S.sif cp /opt/MPM3S/validation_data_and_jsons/{input_data_gravity_column.json,input_data_gravity_column_gpu.json} .
singularity run ../MPM3S.sif input_data_gravity_column.json
```

The results appear in `column/vtk_column` and `column/csv_column`; open them as described in
[Viewing the output](viewing_output.md). The other tutorials run the same way, with the GPU passed in for those on the
GPU:

| Tutorial | Runs on | Input file | Its rigid bodies' files |
|---|---|---|---|
| [1 Self-weight column](../TutorialProblems/Tutorial_1.md) | CPU, or GPU | [`input_data_gravity_column.json`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/input_data_gravity_column.json), or [`input_data_gravity_column_gpu.json`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/input_data_gravity_column_gpu.json) | none |
| [2 Compaction via a rigid body](../TutorialProblems/Tutorial_2.md) | CPU | [`input_data_compress.json`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/input_data_compress.json) | [`cube.stl`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/cube.stl) |
| [3 Vertical penetration](../TutorialProblems/Tutorial_3.md) | GPU | [`input_data_CPT_dr32.json`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/input_data_CPT_dr32.json) | [`CPT.stl`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/CPT.stl) |
| [5 Rolling sphere](../TutorialProblems/Tutorial_5.md) | CPU | [`input_data_sphere.json`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/input_data_sphere.json) | [`sphere.stl`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/sphere.stl) |
| [6 Drag anchor](../TutorialProblems/Tutorial_6.md) | GPU | [`input_data_AC14_dr32.json`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/input_data_AC14_dr32.json) | [`AC14_fluke_rot20.stl`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/AC14_fluke_rot20.stl), [`AC14_shank.stl`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/AC14_shank.stl) |

A tutorial with a rigid body needs its `.stl` copied too. For Tutorial 2, from inside its problem folder:

```bash
singularity exec ../MPM3S.sif cp /opt/MPM3S/validation_data_and_jsons/{input_data_compress.json,cube.stl} .
```

```text
<path to large drive>/my_work/
├── MPM3S.sif
├── column/
│   ├── input_data_gravity_column.json
│   ├── input_data_gravity_column_gpu.json
│   ├── vtk_column/
│   └── csv_column/
└── compaction/
    ├── input_data_compress.json            ← copied from the image
    └── cube.stl                            ← copied from the image
```

## Troubleshooting

| Message | Fix |
|---|---|
| `singularity: command not found` | Load it first, e.g. `module load apptainer`, or type `apptainer` in place of `singularity` ([section 1](#1-check-it-is-installed)). |
| `unauthorized` or `denied` when downloading | Log in first ([section 2](#2-log-in-to-the-github-container-registry)), with a [token](https://github.com/settings/tokens) that has `repo` and `read:packages` ticked. |
| `cached file hash … does not match` when downloading | The download cache, in your home folder, is full or damaged: download with the commands in [section 4](#4-download-the-image), which clear it first. |
| `no space left on device` when downloading | Turning the Docker image into `MPM3S.sif` needs temporary space, by default in `/tmp`: run `mkdir -p <path to large drive>/tmp` and `export SINGULARITY_TMPDIR=<path to large drive>/tmp`, then download again. |
| `could not open image …/MPM3S.sif` | Run from a problem folder directly beside `MPM3S.sif`, or give the image's path in place of `../MPM3S.sif`. |
| `… says "GPU": "on", but no GPU is visible` | Add `--nv`, on a machine with an NVIDIA GPU. |
| `the output folder … is not in a mounted host folder` | Run from inside the problem folder, and keep the output paths in the input file relative. |
| `usage: mpm3s input.json` | Give exactly one input file, and check it is in the folder you run from. |