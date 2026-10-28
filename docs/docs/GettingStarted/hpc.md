# HPC (Slurm)

MPM3S runs on a Slurm cluster as batch jobs, on a GPU or on CPU cores. There are two ways to run it, each on its own
page:

<div class="grid cards equal" markdown>

-   :material-package-variant-closed:{ .lg .middle } __With the container__

    ---

    Nothing to install: download the MPM3S image once, then submit a job script from each problem's folder. The
    easiest way.

    [:octicons-arrow-right-24: With the container](hpc_container.md)

-   :simple-julia:{ .lg .middle } __Installed with Julia__

    ---

    Install Julia and MPM3S once, then submit an example job script.

    [:octicons-arrow-right-24: Installed with Julia](hpc_julia.md)

</div>

--8<-- "terminal_window.md"

## Before you start

- **Log in** to the cluster's login node with `ssh <username>@<cluster address>`, with your username in place of
  `<username>` and the cluster's address in place of `<cluster address>` throughout these pages. Each step says whether
  it runs **on your HPC**, in the bash shell on the login node (whether you connect from Windows, Linux or macOS), or
  **on your computer**.
- **Work on a drive with plenty of space, not in your home folder.** The image is 2 GB and the results can run to many
  GB, but a home folder's quota is usually small. Clusters have a large drive for this, often called scratch
  or work; these pages write its path as `<path to large drive>`, so put your cluster's in its place (ask your HPC
  administrator if you are unsure which it is).
- **Jobs cannot download anything,** so everything is downloaded and installed on the login node before the first job.
- **The job scripts' `#SBATCH` lines must suit your cluster.** They ask for the job's resources, and partition and GPU
  names differ between clusters. The comments in each job script say which lines to change; your cluster's
  documentation lists all of them and their limits.
