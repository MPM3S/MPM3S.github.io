# GPU

Where the analysis runs. The status labels are explained on the [format overview](index.md#how-to-read-these-pages).

```json
"GPU": "on"
```

<div class="small-table" markdown>

| Key     | Status   | Options          | Default | Description                                                                                                                 |
|---------|----------|------------------|---------|-----------------------------------------------------------------------------------------------------------------------------|
| `"GPU"` | Required | `"on"`, `"off"`  | -       | `"on"` runs on an NVIDIA GPU through CUDA. `"off"` runs on the CPU, using as many threads as Julia was started with (`julia -t 4` uses four). |

</div>
