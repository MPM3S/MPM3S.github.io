# HPC: installed with Julia

Julia and MPM3S are installed once on the cluster, and every job runs MPM3S from that install.
Read [Before you start](hpc.md#before-you-start) first. Note this install is different to the [Julia](julia.md) page for PCs.

--8<-- "github_account.md"

Here, `git clone` in step 1 uses the token: when it asks for your GitHub username and password, give the token as the
password. Run `git config --global credential.helper store` once before cloning to have git remember it, in
`~/.git-credentials`.

## 1. Install Julia and MPM3S

Install Julia, then log out and back in, so that the new path to `juliaup` takes effect:

```bash
curl -fsSL https://install.julialang.org | sh
```

Then set the version, download MPM3S and install its packages:

```bash
juliaup add 1.12.4
juliaup default 1.12.4
cd <path to large drive>
mkdir -p <path to large drive>/julia_depot
git clone https://github.com/MPM3S/MPM3S.jl.git MPM3S
cd MPM3S
export JULIA_DEPOT_PATH=<path to large drive>/julia_depot
julia -e 'using Pkg; Pkg.activate("."); Pkg.instantiate()'
julia -e 'using Pkg; Pkg.activate("."); using CUDA; CUDA.precompile_runtime()'
```

The last line installs the CUDA runtime, for GPU runs. Without git, download the ZIP as on the
[Julia](julia.md#downloading-mpm3s-from-github) page, copy it to `<path to large drive>` with `scp`, unzip it there and
rename the folder to `MPM3S`.

```text
<path to large drive>/
├── MPM3S/                                  ← downloaded from GitHub
└── julia_depot/                            ← MPM3S's packages
```

## 2. The example job scripts

`MPM3S/scripts` holds two example job scripts, each set up to run a tutorial:

- **`hamilton_GPU_example.sh`** runs [Tutorial 3](../TutorialProblems/Tutorial_3.md) on one GPU for 4 hours.
- **`hamilton_CPU_example.sh`** runs [Tutorial 1](../TutorialProblems/Tutorial_1.md) on 4 cores with 8 GB for 30
  minutes.

Before running one, set its `#SBATCH` lines (partition, and GPU) for your cluster.

Each hands over to a run script, `hamilton_gpu_run.sh` or `hamilton_cpu_run.sh`, which checks the setup, starts Julia
and runs the problem: never edit or submit the run scripts.

```text
<path to large drive>/
├── MPM3S/
│   ├── scripts/
│   │   ├── hamilton_GPU_example.sh
│   │   ├── hamilton_CPU_example.sh
│   │   ├── hamilton_gpu_run.sh
│   │   └── hamilton_cpu_run.sh
│   └── validation_data_and_jsons/          ← the tutorials' files
└── julia_depot/
```

The example job scripts:

=== "GPU run"

    ```bash title="hamilton_GPU_example.sh"
    #!/bin/bash

    # What to change — edit the #SBATCH lines below, or override one submit: sbatch --time=08:00:00 scripts/hamilton_GPU_example.sh
    #   --gres   the GPU unit — the only resource the cuda partition takes; cores and memory come with it (Hamilton docs):
    #              gpu:h200_nvl_1g.18gb:1   1/8 of an H200: 2 cores, 39 GB memory, 18 GB GPU memory, 49 GB TMPDIR — starts sooner
    #              gpu:h200_nvl:1           a whole H200: 16 cores, 273 GB memory, 144 GB GPU memory, 349 GB TMPDIR — can queue longer
    #            gpu:1 is the same 1/8 unit, and the default if none is given · what is free right now:  sfree
    #   --time   the wall-clock limit, days-hours:minutes:seconds · -J / -o  the job name and its log file (%j = the job id)
    #   INPUT    the JSON to run, relative to the repo root — it must say "GPU": "on" — or per submit:
    #              sbatch --export=ALL,INPUT=other.json scripts/hamilton_GPU_example.sh
    # ⚠ No -c or --mem: the cuda partition rejects them. The CPU version of this file is scripts/hamilton_CPU_example.sh.

    #SBATCH -p cuda
    #SBATCH --gres=gpu:h200_nvl_1g.18gb:1
    #SBATCH --time=04:00:00          # days-hours:minutes:seconds
    #SBATCH -J mpm3s_gpu_example
    #SBATCH -o mpm3s_gpu_example_%j.out

    export INPUT=${INPUT:-validation_data_and_jsons/input_data_CPT_dr32.json}

    # ⚠ via SLURM_SUBMIT_DIR, not ${BASH_SOURCE[0]}: SLURM copies the batch script to a node-local spool dir.
    _S="${SLURM_SUBMIT_DIR:-$PWD}"
    [ -f "$_S/hamilton_gpu_run.sh" ] || _S="$_S/scripts"
    [ -f "$_S/hamilton_gpu_run.sh" ] || { echo "ERROR: no hamilton_gpu_run.sh under ${SLURM_SUBMIT_DIR:-$PWD}"; exit 1; }
    source "$_S/hamilton_gpu_run.sh"
    ```

=== "CPU run"

    ```bash title="hamilton_CPU_example.sh"
    #!/bin/bash

    # What to change — edit the #SBATCH lines below, or override one submit: sbatch --mem=16G -c 8 scripts/hamilton_CPU_example.sh
    #   -p       the partition: `shared` (part of a node) or `multi` (whole nodes) — list them with  sinfo -o '%P %l %c %m'
    #   -c       cores, which is also julia's thread count · --mem  the job's memory (what it used: sacct -j <id> --format=MaxRSS)
    #   --time   the wall-clock limit, days-hours:minutes:seconds · -J / -o  the job name and its log file (%j = the job id)
    #   INPUT    the JSON to run, relative to the repo root — or per submit:  sbatch --export=ALL,INPUT=other.json …
    # The input must say "GPU": "off" — hamilton_cpu_run.sh stops a GPU input with an error in the log.
    # The GPU version of this file is scripts/hamilton_GPU_example.sh.

    #SBATCH -p shared
    #SBATCH -c 4                     # 4 cores -> julia -t 4
    #SBATCH --mem=8G
    #SBATCH --time=00:30:00          # days-hours:minutes:seconds
    #SBATCH -J mpm3s_cpu_example
    #SBATCH -o mpm3s_cpu_example_%j.out

    export INPUT=${INPUT:-validation_data_and_jsons/input_data_gravity_column.json}

    # ⚠ via SLURM_SUBMIT_DIR, not ${BASH_SOURCE[0]}: SLURM copies the batch script to a node-local spool dir.
    _S="${SLURM_SUBMIT_DIR:-$PWD}"
    [ -f "$_S/hamilton_cpu_run.sh" ] || _S="$_S/scripts"
    [ -f "$_S/hamilton_cpu_run.sh" ] || { echo "ERROR: no hamilton_cpu_run.sh under ${SLURM_SUBMIT_DIR:-$PWD}"; exit 1; }
    source "$_S/hamilton_cpu_run.sh"
    ```

## 3. Submit

**On the cluster**, from the `MPM3S` folder:

=== "GPU run"

    ```bash
    cd <path to large drive>/MPM3S
    sbatch scripts/hamilton_GPU_example.sh
    ```

=== "CPU run"

    ```bash
    cd <path to large drive>/MPM3S
    sbatch scripts/hamilton_CPU_example.sh
    ```

The results are written to the output folders named in the input file, inside the `MPM3S` folder, and the log beside
them, `mpm3s_gpu_example_<job id>.out` (`mpm3s_cpu_example_<job id>.out` for the CPU example). Its first lines
show the machine the job ran on and its Julia version. Then see [Following a job](#following-a-job) and
[Getting the results](#getting-the-results).

--8<-- "hpc_following_a_job.md"

## Getting the results

**On your computer**, go to the folder to put the results in and copy an output folder into it, then open it in
ParaView as described in [Viewing the output](viewing_output.md):

=== "Linux"

    ```bash
    cd <my results folder>
    scp -r <username>@<cluster address>:<path to large drive>/MPM3S/<output folder> .
    ```

    `<my results folder>` is the folder on your computer to put the results in, e.g. `~/mpm3s_results`.

=== "macOS"

    ```bash
    cd <my results folder>
    scp -r <username>@<cluster address>:<path to large drive>/MPM3S/<output folder> .
    ```

    `<my results folder>` is the folder on your computer to put the results in, e.g. `~/mpm3s_results`.

=== "Windows"

    ```powershell
    cd <my results folder>
    scp -r <username>@<cluster address>:<path to large drive>/MPM3S/<output folder> .
    ```

    `<my results folder>` is the folder on your computer to put the results in, e.g.
    `$HOME\Documents\mpm3s_results`; `scp` comes with Windows 10 and 11.

If your cluster offers ParaView through a web portal, you can open the results there without copying them.

## Troubleshooting

| Message | Fix |
|---|---|
| `Authentication failed` or `Repository not found` when cloning | Give your GitHub token, with `repo` ticked, as the password: see the note at the top of this page. |
| `ERROR: … says "GPU": "on" but this is a CPU job`, or `… does not say "GPU": "on" but this is a GPU job` | The input file and the script do not match. |
| `ERROR: no <INPUT> in <MPM3S folder>` | `INPUT` must be the path from the `MPM3S` folder to the input file. |
| `ERROR: no julia`, or `ERROR: julia … but the Manifest needs 1.12.4` | Install Julia on the login node: see [1. Install Julia and MPM3S](#1-install-julia-and-mpm3s). |
| `ERROR: source this from a wrapper …` | A run script was submitted: submit an example script instead. |
| `Invalid generic resource (gres) specification` when submitting | The `--gres` line names a GPU the cluster does not have: `sinfo -o "%P %G"` lists the ones it has. |
| `CANCELLED … DUE TO TIME LIMIT` | The job ran out of time: raise `--time`. |
| `oom_kill`, or `Out of GPU memory` | The job ran out of memory: raise `--mem` for a CPU job, or ask for a bigger GPU. |
