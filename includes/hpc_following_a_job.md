## Following a job

`sbatch` prints the job's id when you submit it. Then, **on your HPC**:

| Command | What it does |
|---|---|
| `squeue --me` | Lists your jobs, waiting (`PD`) or running (`R`) |
| `tail -f <log>` | Follows a job's log as it runs; `Ctrl` + `C` stops following |
| `scancel <job id>` | Cancels a job |
| `sacct -j <job id> --format=JobID,State,Elapsed,MaxRSS` | After a job: how it ended, how long it took and the memory it used |
