# Domain

The world the analysis runs in: gravity, and the background mesh that holds the soil. The status labels are explained on the [format overview](index.md#how-to-read-these-pages).

```json
"domain": {
    "gravity": [0.0, 0.0, -9.81]
}
```

<div class="small-table" markdown>

| Key         | Status   | Type                     | Default | Description |
|-------------|----------|--------------------------|---------|-------------|
| `"gravity"` | Required | [x, y, z] (m/s$^2$)      | -       | Gravitational acceleration, applied to the soil and to the rigid-body points. It may be zero, as in [Tutorial 2](../../TutorialProblems/Tutorial_2.md): convergence is then measured in absolute terms (see [`"tolerance"`](solver.md)). |

</div>

Gravity does not have to point straight down. [Tutorial 5](../../TutorialProblems/Tutorial_5.md) tilts it by $45^\circ$ to model a slope while keeping the grid axis-aligned.

## The background mesh

The background mesh is sized automatically from the [material points](material_points.md); there is no key for it.

- It is a cube, large enough to hold the soil's footprint in $x$ and $y$ and **twice the total layer thickness in $z$**, rounded up to whole base elements.
- The soil fills the bottom half. The top half is empty space for the surface to move into and for rigid bodies to start in.
- The element sizes, and the rounding of the soil block to fit them, are set out in [how element sizes set the mesh](material_points.md#how-element-sizes-set-the-mesh).

To give a rigid body room to travel, widen the soil's footprint, `"material size"` `"max"`, which moves the side boundaries with it.
