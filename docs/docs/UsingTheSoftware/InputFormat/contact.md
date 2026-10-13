# Contact properties

The `"contact"` key sets the friction between the soil and every rigid-body surface. The status labels are explained on the [format overview](index.md#how-to-read-these-pages).

```json
"contact": {
    "friction coefficient": 0.33
}
```

<div class="small-table" markdown>

| Key                       | Status   | Type            | Default | Description                                                                               |
|---------------------------|----------|-----------------|---------|-------------------------------------------------------------------------------------------|
| `"friction coefficient"`  | Required | number $\geq 0$ | -       | Coulomb friction coefficient $\mu$, used for every contact. 0 gives frictionless contact. Required even when there are no rigid bodies. |

</div>

Contact is enforced with penalty springs at the corners of each material point's GIMP domain. The normal and tangential stiffnesses are calculated automatically from the Young's modulus and volume of the material points in contact, and cannot be set in the input file. [Tutorial 2](../../TutorialProblems/Tutorial_2.md#background-rigid-body-contact) describes how they are formed and why a small overlap between the bodies remains.

Only [rigid-body surfaces](rigid_bodies.md#stl-files) take part in contact, so a system built from points alone never touches the soil.
