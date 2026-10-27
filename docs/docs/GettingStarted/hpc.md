# HPC (Hamilton)

MPM3S runs on Durham's Hamilton cluster as batch jobs, on a GPU or on CPU cores, in one of two ways:

- **Installed with Julia** (sections 1–3 below): set it up once on a login node, then copy one of the two example scripts in `scripts/`, set its input file and submit it.
- **From the container image**, which needs no installation: see [With the container](#with-the-container).

--8<-- "terminal_window.md"

!!! note "Hamilton uses bash"
    Once you are logged in, every command marked **On Hamilton** runs in Hamilton's bash (Linux) shell, whether you connect from Windows, Linux or macOS.

## The scripts

The scripts in `scripts/` come in two kinds:

- **Example scripts**, which you copy and edit for your problem: they name the input file and ask Hamilton for the GPU or CPU cores, memory and time.
- **Run scripts**, which you never touch: each example hands over to one, which checks the setup, starts Julia and runs the problem.

| Script | Use |
|---|---|
| `hamilton_GPU_example.sh` | Copy, edit and submit for a GPU run |
| `hamilton_CPU_example.sh` | Copy, edit and submit for a CPU run |
| `hamilton_gpu_run.sh`, `hamilton_cpu_run.sh` | Run the problem for the examples; never edit or submit these |
| `hamilton_container_GPU.sh`, `hamilton_container_CPU.sh` | For the container: copy into a problem folder, edit and submit ([With the container](#with-the-container)) |

!!! danger "Never submit the `_run.sh` scripts"
    Submit an example, or your copy of one. Submitted directly, `hamilton_gpu_run.sh` and `hamilton_cpu_run.sh` stop with an error.

## 1. One-time setup

Each step says where it runs: **on your computer**, or **on Hamilton**, on the login node you reach with `ssh <username>@hamilton8.dur.ac.uk`. Put your Hamilton username in place of `<username>` throughout this page.

**On Hamilton**, install Julia 1.12.4 (log out and back in after the first line, so that the new path to `juliaup` takes effect):

```bash
curl -fsSL https://install.julialang.org | sh
juliaup add 1.12.4
juliaup default 1.12.4
```

Put MPM3S in `/nobackup` and go into it:

=== "ZIP"

    **On your computer**, download the ZIP from [MPM3S.jl](https://github.com/MPM3S/MPM3S.jl) (the green **Code** button, then **Download ZIP**) and copy it to Hamilton, replacing `/path/to/zip/location` with the folder on your computer where you saved it:

    ```bash
    scp /path/to/zip/location/MPM3S.jl-master.zip <username>@hamilton8.dur.ac.uk:/nobackup/<username>/
    ```

    Then **on Hamilton**, unzip it and go into it:

    ```bash
    cd /nobackup/<username>
    unzip MPM3S.jl-master.zip
    mv MPM3S.jl-master MPM3S
    cd MPM3S
    ```

=== "git clone"

    **On Hamilton**:

    ```bash
    git clone https://github.com/MPM3S/MPM3S.jl.git /nobackup/<username>/MPM3S
    cd /nobackup/<username>/MPM3S
    ```

**On Hamilton**, install MPM3S and its packages:

```bash
cd /nobackup/<username>/MPM3S
export JULIA_DEPOT_PATH=/nobackup/<username>/julia_depot
julia -e 'using Pkg; Pkg.activate("."); Pkg.instantiate()'

# the CUDA runtime, for GPU runs
julia -e 'using Pkg; Pkg.activate("."); using CUDA; CUDA.precompile_runtime()'
```

!!! warning "Install everything before the first job"
    Jobs cannot download anything, so run these **on Hamilton's login node** before you submit anything. Keep the packages in `julia_depot` beside the `MPM3S` folder, as above: that is where the scripts look for them.

## 2. Copy and edit an example

The options in the example scripts are Hamilton's own job options; all of them, and the limits on each, are set out in Hamilton's [guide to running jobs](https://www.durham.ac.uk/research/institutes-and-centres/advanced-research-computing/hamilton-supercomputer/usage/jobs/).

=== "GPU run"

    **On Hamilton**, from the `MPM3S` folder:

    ```bash
    cp scripts/hamilton_GPU_example.sh scripts/my_gpu_run.sh
    ```

    In the copy, set `INPUT` to your input file and choose the GPU with the `--gres` line. The example asks for 1/8 of an H200, which starts sooner; a whole H200 is for large problems.

    | Slurm option | GPU | CPU cores and memory |
    |---|---|---|
    | `--gres=gpu:1` (the default) | 1/8 of an H200, 18 GB | 2 cores, 39 GB |
    | `--gres=gpu:h200_nvl_1g.18gb:1` | 1/8 of an H200, 18 GB | 2 cores, 39 GB |
    | `--gres=gpu:h200_nvl` | a whole H200, 144 GB | 16 cores, 273 GB |

    !!! warning "GPU runs"
        - The input file must say `"GPU": "on"`, or the job stops with an error.
        - The CPU cores, memory and disk space come with the GPU and never need to be edited: do not add `-c`, `--mem` or `--tmp` lines.

=== "CPU run"

    **On Hamilton**, from the `MPM3S` folder:

    ```bash
    cp scripts/hamilton_CPU_example.sh scripts/my_cpu_run.sh
    ```

    In the copy, set `INPUT` to your input file, and the cores (`-c`), memory (`--mem`) and time (`--time`).

    !!! warning "CPU runs"
        - The input file must say `"GPU": "off"`, or the job stops with an error.
        - Large 3D problems are much slower on the CPU: use CPU runs for small problems and checks.

!!! warning "`INPUT` is relative to the `MPM3S` folder"
    The `INPUT` line in your copy gives the input file as a path from the `MPM3S` folder, not from `scripts/` or your home directory. Change only the path after `:-`. For example, the CPU example's

    ```bash
    export INPUT=${INPUT:-validation_data_and_jsons/input_data_gravity_column.json}
    ```

    runs `/nobackup/<username>/MPM3S/validation_data_and_jsons/input_data_gravity_column.json`. If the file is not there, the job stops with `ERROR: no <INPUT> in <MPM3S folder>`.

## 3. Submit

**On Hamilton**, from the `MPM3S` folder:

```bash
sbatch scripts/my_gpu_run.sh
```

The STL files and mesh caches named in the input file are found from the input file's own folder, not the `MPM3S` folder: keep them beside the input file, or give their paths from there. The results are written to the output folders named in the input file, inside the `MPM3S` folder.

**On your computer**, copy an output folder back, with its name in place of `<output folder>`, then open it in ParaView as described in [Viewing the output](viewing_output.md):

```bash
scp -r <username>@hamilton8.dur.ac.uk:/nobackup/<username>/MPM3S/<output folder> .
```

Or open the results in ParaView **on Hamilton**, without copying them, through the [Hamilton 8 portal](https://www.durham.ac.uk/research/institutes-and-centres/advanced-research-computing/hamilton-supercomputer/usage/portal/).

## With the container

The container image holds Julia, MPM3S and its GPU libraries, so there is nothing to install: no `juliaup`, no `julia_depot`. Hamilton runs it with Singularity (`singularity --version`). [Docker and containers](containers.md) explains the image in general; this section is the Hamilton version.

### 1. One-time setup

**On Hamilton**, make a working folder, log in to the registry while MPM3S.jl is private ([how to make the token](containers.md#1-log-in-to-the-github-container-registry)), and download the image into it:

```bash
mkdir -p /nobackup/<username>/simulations
cd /nobackup/<username>/simulations
singularity registry login --username <github-username> oras://ghcr.io
singularity cache clean -f
singularity pull -F --disable-cache MPM3S.sif oras://ghcr.io/mpm3s/mpm3s:latest-sif
```

Your home folder's quota is small, so the 2 GB download is kept out of it: `singularity cache clean -f` empties Singularity's cache there, removing any half-finished earlier download, and `--disable-cache` stops this download being cached there too. Otherwise a pull can fill your home folder and fail with a checksum error (`cached file hash … does not match`). Use the same commands to update the image to a new release later: `-F` replaces the old `MPM3S.sif`.

### 2. Make a problem folder

Every problem gets its own folder beside `MPM3S.sif`, holding its input file, the `.stl` and mesh cache (`_mesh.txt`) of any rigid body, and a copy of a container script:

```text
/nobackup/<username>/simulations/
├── MPM3S.sif
└── column_gpu/
    ├── hamilton_container_GPU.sh
    ├── input_data_gravity_column_gpu.json
    ├── vtk_column_gpu/         ← created by the run
    └── csv_column_gpu/         ← created by the run
```

!!! warning "The rest of this example assumes exactly this layout"
    `MPM3S.sif` in `/nobackup/<username>/simulations`, and each problem folder directly inside it, beside the image. The container scripts run the image as `../MPM3S.sif`, one folder up from the problem folder, so with any other layout (or another name for the image) they will not find it unless you edit them.

The container scripts are in the [`scripts`](https://github.com/MPM3S/MPM3S.jl/tree/master/scripts) folder of [MPM3S.jl](https://github.com/MPM3S/MPM3S.jl) on GitHub, and the tutorial files in its [`validation_data_and_jsons`](https://github.com/MPM3S/MPM3S.jl/tree/master/validation_data_and_jsons) folder. For example, the self-weight column ([Tutorial 1](../TutorialProblems/Tutorial_1.md)):

=== "GPU run"

    **On Hamilton**, make the problem folder:

    ```bash
    mkdir /nobackup/<username>/simulations/column_gpu
    ```

    **On your computer**, download [`scripts/hamilton_container_GPU.sh`](https://github.com/MPM3S/MPM3S.jl/blob/master/scripts/hamilton_container_GPU.sh) and [`validation_data_and_jsons/input_data_gravity_column_gpu.json`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/input_data_gravity_column_gpu.json) (open each on GitHub, then **Download raw file**), and copy them into it:

    ```bash
    scp hamilton_container_GPU.sh input_data_gravity_column_gpu.json <username>@hamilton8.dur.ac.uk:/nobackup/<username>/simulations/column_gpu/
    ```

    The script is already set up for this example: `INPUT` is `input_data_gravity_column_gpu.json`, and it asks for 1/8 of an H200 for 4 hours, so nothing needs editing. For your own problems, set `INPUT` to your input file, and choose the GPU with the `--gres` line, as in the table under [2. Copy and edit an example](#2-copy-and-edit-an-example). There is no core count to set for a GPU run.

    !!! warning "GPU runs"
        - The input file must say `"GPU": "on"`, or the job stops with an error.
        - Do not add `-c`, `--mem` or `--tmp` lines: the CPU cores and memory come with the GPU.

=== "CPU run"

    **On Hamilton**, make the problem folder:

    ```bash
    mkdir /nobackup/<username>/simulations/column
    ```

    **On your computer**, download [`scripts/hamilton_container_CPU.sh`](https://github.com/MPM3S/MPM3S.jl/blob/master/scripts/hamilton_container_CPU.sh) and [`validation_data_and_jsons/input_data_gravity_column.json`](https://github.com/MPM3S/MPM3S.jl/blob/master/validation_data_and_jsons/input_data_gravity_column.json) (open each on GitHub, then **Download raw file**), and copy them into it:

    ```bash
    scp hamilton_container_CPU.sh input_data_gravity_column.json <username>@hamilton8.dur.ac.uk:/nobackup/<username>/simulations/column/
    ```

    The script is already set up for this example: `INPUT` is `input_data_gravity_column.json`, and it asks for 8 cores, 8 GB and 4 hours, so nothing needs editing. For your own problems, set `INPUT` to your input file, and the cores (`-c`), memory (`--mem`) and time (`--time`). MPM3S uses the cores minus 2 as threads.

    !!! warning "CPU runs"
        - The input file must say `"GPU": "off"`, or the job stops with an error.
        - Large 3D problems are much slower on the CPU: use CPU runs for small problems and checks.

The other tutorials work the same way; [Docker and containers](containers.md#5-practise-on-the-tutorials) lists the files each one needs.

### 3. Submit

**On Hamilton**, from **inside the problem folder**, since the results are written to the folder you submit from:

```bash
cd /nobackup/<username>/simulations/column_gpu
sbatch hamilton_container_GPU.sh
```

The results appear in the problem folder, with the log `mpm3s_gpu_<job id>.out` (`mpm3s_cpu_<job id>.out` for a CPU run). Its first line shows how the run used the machine, e.g. `MPM3S 0.3.0 · CPU znver5 · 1 threads · GPU NVIDIA H200 NVL MIG 1g.18gb`. Copy the results back as in [3. Submit](#3-submit), from `/nobackup/<username>/simulations/<problem folder>/<output folder>`.
