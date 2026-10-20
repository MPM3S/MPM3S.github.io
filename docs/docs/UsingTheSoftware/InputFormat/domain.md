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

- The **domain box** is where the boundary conditions act. It spans the soil's footprint in $x$ and $y$ (`"material size"` `"max"`) and **twice the total layer thickness in $z$**, each rounded up to whole base elements.
- The soil fills the bottom half of the box. Its surface is the total layer thickness rounded up to a whole row of material points (base element $\div$ `"number of material points per element 1"`), and the bottom layer takes the extra. The top half is empty space for the surface to move into and for rigid bodies to start in.
- The mesh itself is an octree **cube** of side base element $\times\, 2^n$: the smallest that holds the box's longest side. Any part of the cube outside the box holds no soil.
- For example, [Tutorial 1](../../TutorialProblems/Tutorial_1.md) has a $0.05 \times 0.05$ m footprint, a 0.8 m layer and 0.05 m elements. Its box is $0.05 \times 0.05 \times 1.6$ m, and the cube is 1.6 m ($32 = 2^5$ elements) on a side. A 1.0 m layer would give a 2.0 m box (40 elements), rounded up to a 3.2 m cube (64 elements).
- The element sizes, and the rounding of the soil block to fit them, are set out in [how element sizes set the mesh](material_points.md#how-element-sizes-set-the-mesh).

To give a rigid body room to travel, widen the soil's footprint, `"material size"` `"max"`, which moves the side boundaries with it.
