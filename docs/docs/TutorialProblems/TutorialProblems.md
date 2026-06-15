# Tutorial problems

The AMPSSIE tutorial set walks you through six benchmark problems, each one isolating a different capability of the solver - convergence under self-weight, rigid-body contact, plastic soil, dynamic time integration, articulated rigid bodies, and adaptive mesh refinement following a moving body. Every tutorial uses the same [`input_data.json` format](../UsingTheSoftware/InputFormat.md), so once you've completed Tutorial 1 the workflow is the same the whole way through; later tutorials add capabilities one at a time.

The recommended order is top to bottom - each tutorial reuses material settings, contact penalties or solver choices established in earlier ones, and the descriptions explicitly point back when they do.

## Static

Quasi-static problems solved with Newton-Raphson over a small number of load increments.

- **[Tutorial 1 - Self-weight column convergence](Tutorial_1.md)** - A homogeneous elastic column compressed by gravity. The simplest problem in the set: no contact, no plasticity, no adaptive refinement following a body. Exercises the static weak form, the GIMP discretisation and the convergence behaviour with mesh refinement.
- **[Tutorial 2 - Compaction via a rigid body](Tutorial_2.md)** - A cube compressed by a rigid plate through 25% of its height. Introduces normal-contact penalty enforcement and the hanging-node formulation around the contact face, with elasticity holding everything else constant.
- **[Tutorial 3 - Vertical penetration (CPT)](Tutorial_3.md)** - A quarter-symmetric cone penetration test in dry sand. Adds adaptive octree refinement that follows the cone, frictional contact and a Hencky hyperelastic-perfectly plastic constitutive model calibrated to centrifuge data.
- **[Tutorial 4 - Plough (horizontal penetration)](Tutorial_4.md)** - A seabed cable plough dragged through dry sand. The most geometrically complex problem: a non-convex rigid body, a Signorini exit-face condition, and adaptive refinement that travels with the plough across 20 m of horizontal travel.

## Dynamic

Implicit dynamic problems using the same Newton-Raphson framework but with inertia and time integration active.

- **[Tutorial 5 - Rolling sphere](Tutorial_5.md)** - A rigid sphere rolling down a 45° slope, with a friction-coefficient sweep validated against the analytical slip/stick solution. The transition point between Tutorial 2's contact mechanics and full dynamic time integration.
- **[Tutorial 6 - Drag anchor](Tutorial_6.md)** - A 3D dynamic simulation of an AC-14 drag anchor pulled through dry sand. Combines Tutorial 3's soil model, Tutorial 5's dynamics and a two-part articulated rigid body, with a partitioned moving domain that follows the anchor across the full 19 m drag.

## Reference

Every tutorial has its complete `input_data.json` listed verbatim in the [Reference input data](Tutorial_1_input_data.md) sub-section, so you can copy any of them as a starting template before adapting to your own problem.
