# Solver

The `"solver"` key controls the Newton-Raphson iterations and the stabilisation. The status labels are explained on the [format overview](index.md#how-to-read-these-pages).

```json
"solver": {
    "tolerance": 1.0e-6,
    "max newton iterations": 20,
    "max linear iterations": 100,
    "poor factor": 0.25,
    "ghost factor": 0.025,
    "ghost factor mass": 0.25
}
```

<div class="small-table" markdown>

| Key                         | Status   | Type    | Default | Description                                                                                                                                    |
|-----------------------------|----------|---------|---------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `"tolerance"`               | Required | number  | -       | Convergence tolerance for the Newton-Raphson iterations in each step. The error is the norm of the out-of-balance force on the free degrees of freedom, relative to the norm of the gravity force on the soil (for free rigid-body degrees of freedom, relative to the bodies' weight). Where that load is below 1 N - for example with zero gravity - the error is measured in newtons instead. |
| `"max newton iterations"`   | Required | integer | -       | Iterations allowed before a step is abandoned and retried with half the increment.                                                            |
| `"max linear iterations"`   | Optional | integer | 100     | Iteration limit of the iterative linear solver within each Newton-Raphson iteration. Raise it only if a problem genuinely needs it.            |
| `"poor factor"`             | Required | number  | -       | Elements filled with material points below this fraction are stabilised. 0 switches this test off.                                            |
| `"ghost factor"`            | Required | number  | -       | Scale of the [ghost stabilisation](../../TechnicalReferences/ghostStabilisation.md) added to the stiffness matrix. 0 switches it off.         |
| `"ghost factor mass"`       | Required | number  | -       | Scale of the ghost stabilisation added to the mass matrix in dynamic stages. Required for static-only analyses too.                           |

</div>

Two consequences of measuring the error against the weight of the soil:

- [`"gravity"`](domain.md) must not be zero, or no step can converge.
- A step that cannot converge is retried with the increment halved, indefinitely - there is no smallest increment. A fast-rising `cuts` count on the progress line means the analysis will never finish; stop it and check the input.
