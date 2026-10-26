# HPC (Hamilton)

MPM3S runs on Durham's Hamilton cluster as batch jobs, on a GPU or on CPU cores. Set it up once on a login node, then copy one of the two example scripts in `scripts/`, set its input file and submit it.

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

    **On your computer**, download the ZIP from [MPM3S-releases](https://github.com/MPM3S/MPM3S-releases) (the green **Code** button, then **Download ZIP**) and copy it to Hamilton, replacing `/path/to/zip/location` with the folder on your computer where you saved it:

    ```bash
    scp /path/to/zip/location/MPM3S-releases-master.zip <username>@hamilton8.dur.ac.uk:/nobackup/<username>/
    ```

    Then **on Hamilton**, unzip it and go into it:

    ```bash
    cd /nobackup/<username>
    unzip MPM3S-releases-master.zip
    mv MPM3S-releases-master MPM3S
    cd MPM3S
    ```

=== "git clone"

    **On Hamilton**:

    ```bash
    git clone https://github.com/MPM3S/MPM3S-releases.git /nobackup/<username>/MPM3S
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
