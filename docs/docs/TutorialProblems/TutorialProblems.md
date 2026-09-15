# Tutorial problems

The AMPSSIE tutorial set walks you through benchmark problems, each one isolating a different capability of the solver - large deformation under self-weight, rigid-body contact, plastic soil, dynamic time integration, articulated rigid bodies, and adaptive mesh refinement following a moving body. Every tutorial uses the same [`input_data.json` format](../UsingTheSoftware/InputFormat.md), so once you've completed Tutorial 1 the workflow is the same the whole way through; later tutorials add capabilities one at a time.

The recommended order is top to bottom - each tutorial reuses material settings, contact settings or solver choices established in earlier ones, and the descriptions explicitly point back when they do.

## Static

Quasi-static problems solved with Newton-Raphson over a sequence of load steps.

- **[Tutorial 1 - Self-weight column](Tutorial_1.md)** - A tall, soft elastic column compressed by its own weight. The simplest problem in the set: no contact, no plasticity and no mesh refinement, but large deformation, with an analytical stress solution to validate the numerical result against. Introduces the input file, running AMPSSIE and viewing the output.
- **[Tutorial 2 - Compaction via a rigid body](Tutorial_2.md)** - A cube compressed by a rigid platen through 25% of its height. Introduces rigid bodies defined by an STL surface, prescribed displacements and penalty contact, with elasticity holding everything else simple.
- **[Tutorial 3 - Vertical penetration (CPT)](Tutorial_3.md)** - A quarter-symmetric cone penetration test in dry sand. Adds a two-stage analysis, Willam-Warnke sand with depth-dependent stiffness, frictional contact and mesh refinement that follows the cone.
- **Tutorial 4 - Plough (horizontal penetration)** *(coming soon)* - A seabed cable plough dragged through dry sand. The most geometrically complex problem: a non-convex rigid body, a Signorini exit-face condition, and adaptive refinement that travels with the plough across 20 m of horizontal travel.

## Dynamic

Implicit dynamic problems using the same Newton-Raphson framework but with inertia and time integration active.

- **[Tutorial 5 - Rolling sphere](Tutorial_5.md)** - A rigid sphere rolling down a 45° slope, with a friction-coefficient sweep validated against the analytical slip/stick solution. Introduces dynamic stages, a free rigid body and a boundary track that follows the sphere.
- **[Tutorial 6 - Drag anchor](Tutorial_6.md)** - A half-symmetric AC-14 drag anchor pulled through very loose, submerged sand. Combines Tutorial 3's soil model and Tutorial 5's dynamics and moving boundaries with an anchor made of two hinged parts, an angle stop and a pull line, over three analysis stages.

## Reference

Every tutorial has its complete `input_data.json` listed verbatim in the [Reference input data](Tutorial_1_input_data.md) sub-section, so you can copy any of them as a starting template before adapting it to your own problem.
