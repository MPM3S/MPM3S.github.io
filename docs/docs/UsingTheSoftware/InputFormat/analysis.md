# Analysis stages

The `"analysis"` key is a list of **stages**, run in order. The material-point state, the rigid-body state and the output step count all carry from one stage to the next, so a typical analysis first settles the soil under gravity and then loads it with a body. The status labels are explained on the [format overview](index.md#how-to-read-these-pages).

```json
"analysis": [
    {
        "type": "static",
        "load steps": 5,
        "load": "gravity ramp",
        "rigid bodies": "off",
        "adaptivity": { "type": "uniform" },
        "boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
    },
    {
        "type": "dynamic",
        "dt": 5.0e-3,
        "final time": 1.0,
        "beta": 0.5625,
        "gamma": 1.0,
        "rigid bodies": "on",
        "rigid body surface placement": "on",
        "adaptivity": { "type": "rigid body surface", "element size": 0.05 },
        "boundary conditions": { "min": ["fixed", "roller", "fixed"], "max": ["roller", "roller", "fixed"] }
    }
]
```

<div class="small-table wrap-code" markdown>

| Key                                 | `"static"` | `"dynamic"` | Type             | Default                     | Description                                                                                                                      |
|-------------------------------------|------------|-------------|------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `"type"`                            | Required   | Required    | string           | -                           | `"static"` or `"dynamic"`.                                                                                                      |
| `"rigid bodies"`                    | Required   | Required    | string           | -                           | `"on"` or `"off"`. With `"off"` the bodies are frozen: no contact, and the three body keys at the bottom of this table are ignored. |
| `"load steps"`                      | Required   | Ignored     | integer $\geq 1$ | -                           | Number of load steps.                                                                                                            |
| `"load"`                            | Required   | Ignored     | string           | -                           | `"gravity ramp"`: gravity increases linearly from zero over the stage. `"full"`: full gravity from the first step.              |
| `"dt"`                              | Ignored    | Required    | number (s)       | -                           | Time step.                                                                                                                       |
| `"final time"`                      | Ignored    | Required    | number (s)       | -                           | Duration of the stage.                                                                                                           |
| `"beta"`                            | Ignored    | Required    | number           | -                           | Newmark parameter $\beta$.                                                                                                       |
| `"gamma"`                           | Ignored    | Required    | number           | -                           | Newmark parameter $\gamma$.                                                                                                      |
| `"boundary conditions"`             | Optional   | Optional    | object           | every face `"free"`         | Conditions on the faces of the soil domain ([below](#boundary-conditions)).                                                     |
| `"adaptivity"`                      | Optional   | Optional    | object           | `"type": "none"`            | Mesh refinement for this stage ([below](#adaptivity)).                                                                          |
| `"rigid body surface placement"`    | Optional   | Optional    | string           | `"off"`                     | `"on"` moves every rigid body vertically, by the same amount, at the start of the stage so that the lowest surface point rests on the soil surface. |
| `"rigid body boundary conditions"`  | Optional   | Optional    | array of objects | the points' own conditions  | Replaces point boundary conditions for this stage ([below](#rigid-body-boundary-conditions)).                                   |
| `"boundary track"`                  | Optional   | Optional    | object           | no track                    | Domain boundaries that move with the rigid bodies ([below](#boundary-track)).                                                   |

</div>

A static stage advances a load fraction from 0 to 1 in `"load steps"` equal steps. A dynamic stage advances time from 0 to `"final time"` in steps of `"dt"`, with gravity applied in full throughout. $\gamma = 0.5$, $\beta = 0.25$ gives Newmark's method without numerical damping; $\gamma > 0.5$ adds damping, which can help with stiff contact and rotating bodies.

If a step does not converge within [`"max newton iterations"`](solver.md), it is retried with half the increment. After each successful step the increment doubles again, up to the requested size. There is no smallest increment: a step that can never converge is halved indefinitely, which shows as a fast-rising `cuts` count on the progress line - stop the run and check the input.

## Boundary conditions

Conditions on the six faces of the soil domain box, given as the three `"min"` faces ($x = 0$, $y = 0$, $z = 0$) and the three `"max"` faces, each as `[x, y, z]`.

```json
"boundary conditions": { "min": ["roller", "roller", "fixed"], "max": ["roller", "roller", "free"] }
```

<div class="small-table" markdown>

| Key       | Status                            | Type                | Default | Description                           |
|-----------|-----------------------------------|---------------------|---------|---------------------------------------|
| `"min"`   | Required (when the block is used) | [x, y, z] of string | -       | The faces at $x = 0$, $y = 0$, $z = 0$. |
| `"max"`   | Required (when the block is used) | [x, y, z] of string | -       | The opposite faces.                   |

</div>

<div class="small-table" markdown>

| Entry        | Meaning                                                  |
|--------------|----------------------------------------------------------|
| `"free"`     | No constraint.                                           |
| `"roller"`   | The displacement normal to the face is zero.            |
| `"fixed"`    | All three displacement components are zero.             |

</div>

Any other entry stops the analysis. Where faces meet, the conditions combine. The $x$ and $y$ faces sit at the edges of the (rounded) soil footprint. The max $z$ face sits at **twice** the soil thickness, in the empty space above the soil (see [element sizes](material_points.md#how-element-sizes-set-the-mesh)), so it does not touch the soil and the soil surface is always free.

## Adaptivity

```json
"adaptivity": { "type": "rigid body surface", "element size": 0.1,
                "region": 0.5, "element size in region": 0.2 }
```

<div class="small-table wrap-code" markdown>

| Key                           | Status                                                  | Type       | Default   | Description                                                                                                                                                           |
|-------------------------------|---------------------------------------------------------|------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"type"`                      | Required (when the block is used)                       | string     | -         | `"none"`: elements follow the material points at the base size, and empty space is meshed coarsely. `"uniform"`: the whole grid at the base size, with no coarse cells (expensive for large domains). `"rigid body surface"`: refine the elements the rigid-body surfaces pass through, at every step. |
| `"element size"`              | Conditional: `"rigid body surface"` only                | number (m) | -         | Element size at the body surfaces.                                                                                                                                    |
| `"region"`                    | Optional: `"rigid body surface"` only                   | number (m) | no region | Distance around the refined surface elements, in each direction, that is also refined to `"element size in region"`. Give both keys or neither.                    |
| `"element size in region"`    | Optional: `"rigid body surface"` only                   | number (m) | no region | Element size within the region.                                                                                                                                       |

</div>

In a stage with `"rigid bodies": "off"`, `"rigid body surface"` falls back to `"none"`. Material points split by refinement stay split. Every size here takes part in the [element-size rounding](material_points.md#how-element-sizes-set-the-mesh).

## Rigid body boundary conditions

Replaces the six [point boundary conditions](rigid_bodies.md#points) of chosen points for this stage only. Points that are not listed keep the conditions given in `"rigid bodies"`.

```json
"rigid body boundary conditions": [
    { "system": 1, "point": 1,
      "boundary conditions": ["fixed", "fixed", { "prescribed": -0.01 }, "fixed", "fixed", "fixed"] }
]
```

<div class="small-table" markdown>

| Key                      | Status   | Type               | Default | Description                                                                    |
|--------------------------|----------|--------------------|---------|--------------------------------------------------------------------------------|
| `"system"`               | Required | integer            | -       | Rigid-body system, counting from 1 in `"rigid bodies"`.                        |
| `"point"`                | Required | integer            | -       | Point within that system, counting from 1. A point that does not exist stops the analysis. |
| `"boundary conditions"`  | Required | array of 6 entries | -       | The six entries, in the same form as for [points](rigid_bodies.md#points).     |

</div>

## Boundary track

For bodies that travel a long way through the soil (e.g. a dragged anchor). Instead of solving the whole material domain, only a window around the rigid bodies is active. Soil ahead of the window waits, unsolved, until the window reaches it, and soil the window leaves behind can be deleted.

```json
"boundary track": {
    "min": { "type": ["fixed", "off", "off"], "distance": [1.0, 0.0, 0.0],
             "advance": ["positive", "positive", "positive"], "remove": ["yes", "no", "no"] },
    "max": { "type": ["fixed", "off", "off"], "distance": [13.44, 0.0, 0.0],
             "advance": ["positive", "positive", "positive"], "remove": ["no", "no", "no"] }
}
```

`"min"` sets the planes on the low side of the bodies and `"max"` those on the high side. Both are required when the block is used, and each needs all four keys below, each as `[x, y, z]` - including axes that are `"off"`.

<div class="small-table" markdown>

| Key            | Status   | Type              | Options                                  | Description                                                                                                                                                   |
|----------------|----------|-------------------|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"type"`       | Required | [x, y, z] of string | `"off"`, `"roller"`, `"fixed"`         | Condition on the moving plane. `"off"` leaves that axis untracked, with the stage's `"boundary conditions"`. Otherwise the plane carries this condition, and it replaces the stage's condition on that face. |
| `"distance"`   | Required | [x, y, z] (m)     | -                                        | Distance of the plane from the extent of the rigid bodies, rounded outward to whole base elements.                                                             |
| `"advance"`    | Required | [x, y, z] of string | `"positive"`, `"negative"`, `"both"`   | Directions the plane may move: only towards $+$, only towards $-$, or both ways.                                                                              |
| `"remove"`     | Required | [x, y, z] of string | `"yes"`, `"no"`                        | `"yes"` deletes material points the plane leaves behind; `"no"` keeps them for later. Only takes effect on a trailing plane: `"min"` with `"positive"` advance, or `"max"` with `"negative"`. |

</div>

Only active material points are written to the output, so in a tracked analysis the VTK files show the window of soil around the bodies rather than the whole block.
