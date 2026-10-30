---
title: HPC with the container
---

# HPC: with the container

The image holds Julia, MPM3S, its GPU libraries, the job scripts and the tutorial files, so nothing else needs
installing. [Singularity / Apptainer](singularity.md) covers the image in general; this is the Slurm version.

Read [Before you start](hpc.md#before-you-start) first.

!!! note "Add your GitHub account to your HPC (while MPM3S.jl is private)"
    --8<-- "github_account.md"

    On your HPC, downloading the image uses the token: [step 1](#1-install-the-container) logs your HPC in with it.

## 1. Install the container

**On your HPC**, log in to the GitHub container registry, make a working folder on the large drive and download the
image into it (see [Singularity / Apptainer](singularity.md) for the full description):

```bash
singularity remote login --username <github-username> docker://ghcr.io
mkdir -p <path to large drive>/my_work
cd <path to large drive>/my_work
singularity cache clean -f
singularity pull -F --disable-cache MPM3S.sif docker://ghcr.io/mpm3s/mpm3s:latest
```

The login asks for the token as the password, and is remembered until the token expires. If `singularity` is not
found, load it first, e.g. `module load apptainer`.

```text
<path to large drive>/my_work/
└── MPM3S.sif                               ← downloaded
```

## 2. Run an example problem

### Make a problem folder

From the working folder, make a folder for the self-weight column ([Tutorial 1](../TutorialProblems/Tutorial_1.md))
and copy its GPU and CPU job scripts and input files out of the image:

```bash
mkdir column
cd column
singularity exec ../MPM3S.sif cp /opt/MPM3S/scripts/{hamilton_container_GPU.sh,hamilton_container_CPU.sh} /opt/MPM3S/validation_data_and_jsons/{input_data_gravity_column.json,input_data_gravity_column_gpu.json} .
```

Both job scripts are already set up for this problem; set their `#SBATCH` lines (partition, and GPU) for your cluster:

- **`hamilton_container_GPU.sh`** runs `input_data_gravity_column_gpu.json` on one GPU for 4 hours.
- **`hamilton_container_CPU.sh`** runs `input_data_gravity_column.json` on 8 cores with 8 GB for 4 hours.

```text
<path to large drive>/my_work/
├── MPM3S.sif
└── column/
    ├── hamilton_container_GPU.sh           ← copied from the image
    ├── hamilton_container_CPU.sh           ← copied from the image
    ├── input_data_gravity_column.json      ← copied from the image
    └── input_data_gravity_column_gpu.json  ← copied from the image
```

The job scripts run the image as `../MPM3S.sif`, one folder up, so keep to this layout or edit the `singularity run` line in your copy (the last line of the job script below).

The job script as it comes out of the image:

=== "GPU run"

    ```bash title="hamilton_container_GPU.sh"
    #!/bin/bash

    # MPM3S on a GPU with the container. Copy this script into your problem folder, beside its input file, with MPM3S.sif
    # one folder up; then, from inside the problem folder:   sbatch hamilton_container_GPU.sh
    # The results appear in the problem folder; the log is mpm3s_gpu_<job id>.out.
    # Set-up and the folder layout: https://mpm3s.github.io/docs/GettingStarted/hpc/
    #
    # What to change:
    #   INPUT    the input file, in this folder — it must say "GPU": "on"
    #   --gres   gpu:h200_nvl_1g.18gb:1   1/8 of an H200 (18 GB) — starts sooner
    #            gpu:h200_nvl:1           a whole H200 (144 GB) — for large problems
    #   --time   the wall-clock limit, days-hours:minutes:seconds
    # ⚠ No -c or --mem: the cuda partition rejects them; the cores and memory come with the GPU.

    #SBATCH -p cuda
    #SBATCH --gres=gpu:h200_nvl_1g.18gb:1
    #SBATCH --time=04:00:00
    #SBATCH -J mpm3s_gpu
    #SBATCH -o mpm3s_gpu_%j.out

    INPUT=input_data_gravity_column_gpu.json

    cd "$SLURM_SUBMIT_DIR"
    singularity run --nv ../MPM3S.sif "$INPUT"
    ```

=== "CPU run"

    ```bash title="hamilton_container_CPU.sh"
    #!/bin/bash

    # MPM3S on CPU cores with the container. Copy this script into your problem folder, beside its input file, with
    # MPM3S.sif one folder up; then, from inside the problem folder:   sbatch hamilton_container_CPU.sh
    # The results appear in the problem folder; the log is mpm3s_cpu_<job id>.out.
    # Set-up and the folder layout: https://mpm3s.github.io/docs/GettingStarted/hpc/
    #
    # What to change:
    #   INPUT    the input file, in this folder — it must say "GPU": "off"
    #   -c       the cores; MPM3S uses 2 fewer as threads · --mem  the memory · --time  the wall-clock limit

    #SBATCH -p shared
    #SBATCH -c 8
    #SBATCH --mem=8G
    #SBATCH --time=04:00:00
    #SBATCH -J mpm3s_cpu
    #SBATCH -o mpm3s_cpu_%j.out

    INPUT=input_data_gravity_column.json

    cd "$SLURM_SUBMIT_DIR"
    singularity run ../MPM3S.sif "$INPUT"
    ```

### Submit

**On your HPC**, from inside the problem folder, as the results are written to the folder you submit from:

```bash
cd <path to large drive>/my_work/column
sbatch hamilton_container_GPU.sh
```

The results appear in the problem folder, with the job's log, `mpm3s_gpu_<job id>.out` (`mpm3s_cpu_<job id>.out` for a
CPU run). Its first line shows how the run used the machine, e.g.
`MPM3S 0.3.0 · CPU znver5 · 1 threads · GPU NVIDIA H200 NVL MIG 1g.18gb`. Then see
[Following a job](#following-a-job) and [Getting the results](#getting-the-results).

--8<-- "hpc_following_a_job.md"

## Getting the results

**On your computer**, go to the folder to put the results in and copy an output folder into it, then open it in
ParaView as described in [Viewing the output](viewing_output.md):

=== "Linux"

    ```bash
    cd <my results folder>
    scp -r <username>@<cluster address>:<path to large drive>/my_work/<problem folder>/<output folder> .
    ```

    `<my results folder>` is the folder on your computer to put the results in, e.g. `~/mpm3s_results`.

=== "macOS"

    ```bash
    cd <my results folder>
    scp -r <username>@<cluster address>:<path to large drive>/my_work/<problem folder>/<output folder> .
    ```

    `<my results folder>` is the folder on your computer to put the results in, e.g. `~/mpm3s_results`.

=== "Windows"

    ```powershell
    cd <my results folder>
    scp -r <username>@<cluster address>:<path to large drive>/my_work/<problem folder>/<output folder> .
    ```

    `<my results folder>` is the folder on your computer to put the results in, e.g.
    `$HOME\Documents\mpm3s_results`; `scp` comes with Windows 10 and 11.

If your cluster offers ParaView through a web portal, you can open the results there without copying them.

## Troubleshooting

| Message | Fix |
|---|---|
| `unauthorized` or `denied` when downloading | Log in first, as in [step 1](#1-install-the-container), with a [token](https://github.com/settings/tokens) that has `repo` and `read:packages` ticked. |
| `cached file hash … does not match` when downloading | Run `singularity cache clean -f`, then download again as in [step 1](#1-install-the-container). |
| `no space left on device` when downloading | Turning the Docker image into `MPM3S.sif` needs temporary space, by default in `/tmp`: run `mkdir -p <path to large drive>/tmp` and `export SINGULARITY_TMPDIR=<path to large drive>/tmp`, then download again. |
| `could not open image …/MPM3S.sif` | The problem folder is not directly beside `MPM3S.sif`: see [Make a problem folder](#make-a-problem-folder). |
| `… says "GPU": "on", but no GPU is visible` | A GPU input file in a CPU job. Use the GPU script, or set `"GPU": "off"`. |
| `Invalid generic resource (gres) specification` when submitting | The `--gres` line names a GPU the cluster does not have: `sinfo -o "%P %G"` lists the ones it has. |
| `CANCELLED … DUE TO TIME LIMIT` | The job ran out of time: raise `--time`. |
| `oom_kill`, or `Out of GPU memory` | The job ran out of memory: raise `--mem` for a CPU job, or ask for a bigger GPU. |
