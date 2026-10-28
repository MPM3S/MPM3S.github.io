# HPC: with the container

The image holds Julia, MPM3S, its GPU libraries, the job scripts and the tutorial files, so there is nothing to
install. [Singularity / Apptainer](singularity.md) covers the image in general; this is the Slurm version.

Read [Before you start](hpc.md#before-you-start) first.

--8<-- "github_account.md"

Here, downloading the image uses the token:
[section 2 of Singularity / Apptainer](singularity.md#2-log-in-to-the-github-container-registry) logs the cluster in
with it.

## 1. Add a job script

Following on from the [Singularity / Apptainer](singularity.md) page, up to
[Make a problem folder](singularity.md#make-a-problem-folder) in section 5 (with the working folder on the large drive,
`<path to large drive>/my_work`), add a job script in place of *Run it*. The job scripts are inside the image too. From
inside the problem folder (`column` in the example), copy out the GPU and CPU job scripts:

```bash
singularity exec ../MPM3S.sif cp /opt/MPM3S/scripts/{hamilton_container_GPU.sh,hamilton_container_CPU.sh} .
```

Both are already set up for this problem; set their `#SBATCH` lines (partition, and GPU) for your cluster:

- **`hamilton_container_GPU.sh`** runs `input_data_gravity_column_gpu.json` on one GPU for 4 hours.
- **`hamilton_container_CPU.sh`** runs `input_data_gravity_column.json` on 8 cores with 8 GB for 4 hours.

```text
<path to large drive>/my_work/
├── MPM3S.sif
└── column/
    ├── input_data_gravity_column.json
    ├── input_data_gravity_column_gpu.json
    ├── hamilton_container_GPU.sh           ← copied from the image
    └── hamilton_container_CPU.sh           ← copied from the image
```

The job scripts run the image as `../MPM3S.sif`, one folder up, so keep to this layout or edit the `singularity run`
line in your copy.

For a problem of your own, copy its files into its problem folder **on your computer**:

```bash
scp input_data.json part.stl <username>@<cluster address>:<path to large drive>/my_work/my_problem/
```

In the job script, set `INPUT` to the input file's name and the `#SBATCH` lines for your problem.

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

## 2. Submit

**On the cluster**, from inside the problem folder, as the results are written to the folder you submit from:

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
| `cached file hash … does not match` when downloading | Download the image with the commands in [Download the image](singularity.md#4-download-the-image), which clear the cache first. |
| `could not open image …/MPM3S.sif` | The problem folder is not directly beside `MPM3S.sif`: see [1. Add a job script](#1-add-a-job-script). |
| `… says "GPU": "on", but no GPU is visible` | A GPU input file in a CPU job. Use the GPU script, or set `"GPU": "off"`. |
| `Invalid generic resource (gres) specification` when submitting | The `--gres` line names a GPU the cluster does not have: `sinfo -o "%P %G"` lists the ones it has. |
| `CANCELLED … DUE TO TIME LIMIT` | The job ran out of time: raise `--time`. |
| `oom_kill`, or `Out of GPU memory` | The job ran out of memory: raise `--mem` for a CPU job, or ask for a bigger GPU. |
