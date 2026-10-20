# Tutorial problems

The MPM3S tutorial set walks you through benchmark problems, each one isolating a different capability of the solver - large deformation under self-weight, rigid-body contact, plastic soil, dynamic time integration, articulated rigid bodies, and adaptive mesh refinement following a moving body. Every tutorial uses the same [`input_data.json` format](../UsingTheSoftware/InputFormat/index.md), so once you've completed Tutorial 1 the workflow is the same the whole way through; later tutorials add capabilities one at a time.

The recommended order is top to bottom - each tutorial reuses material settings, contact settings or solver choices established in earlier ones.

Before starting, install Julia and MPM3S as described in [MPM3S installation](../GettingStarted/install_and_run.md#mpm3s-installation).

## Difficulty and run time

Each tutorial is marked with its level, its work through time and its approximate run time:

- <span class="level level-beginner">Beginner</span> - no experience of MPM3S needed; runs in about a minute on a laptop.
- <span class="level level-intermediate">Intermediate</span> - builds on Tutorials 1 and 2; a GPU makes the run much quicker.
- <span class="level level-advanced">Advanced</span> - combines several features; best run on a GPU or an HPC node.

You can run every tutorial on your own hardware: the RAM decides whether a problem fits, and the number of CPU or GPU cores how long it takes. The run times are approximate, to give an idea of the hardware needed.

## Static

Quasi-static problems solved with Newton-Raphson over a sequence of load steps.

<div class="grid cards" markdown>

-   :material-weight:{ .lg .middle } __Tutorial 1 - Self-weight column__

    ---

    <span class="level level-beginner">Beginner</span> ~30 min work through · approx. run &lt; 1 min (CPU)

    An elastic column compressed by its own weight. The simplest problem in the set: no contact, no plasticity and no mesh refinement, but large deformation, checked against an analytical vertical stress. Introduces the input file, running MPM3S and viewing the output.

    [:octicons-arrow-right-24: Open the tutorial](Tutorial_1.md)

-   :material-cube-outline:{ .lg .middle } __Tutorial 2 - Compaction via a rigid body__

    ---

    <span class="level level-beginner">Beginner</span> ~45 min work through · approx. run 1 min (CPU)

    A cube of soil compressed by a rigid cube through 25% of its height. Introduces rigid bodies defined by an STL surface, prescribed displacements and penalty contact.

    [:octicons-arrow-right-24: Open the tutorial](Tutorial_2.md)

-   <span class="twemoji lg middle"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10.7 1 H13.3 V12.6 H10.7 Z"/><path fill="currentColor" d="M10.2 13 H13.8 V17 H10.2 Z"/><path fill="currentColor" d="M10.2 17.4 H13.8 L12 20.5 Z"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M1.2 9 H9.2 M14.8 9 H22.8"/><path fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" d="M3.4 9 L2 11 M6.6 9 L5.2 11 M17.6 9 L16.2 11 M20.8 9 L19.4 11"/><path fill="currentColor" d="M4.7 1.2 H6.3 V3.8 H7.8 L5.5 6.6 L3.2 3.8 H4.7 Z M17.7 1.2 H19.3 V3.8 H20.8 L18.5 6.6 L16.2 3.8 H17.7 Z"/></svg></span> __Tutorial 3 - Vertical penetration (CPT)__

    ---

    <span class="level level-intermediate">Intermediate</span> ~1 to 1.5 h work through · approx. run 15 min (GPU), 1 h (CPU)

    A quarter-symmetric cone penetration test in dry sand. Adds a two-stage analysis, Willam-Warnke sand with depth-dependent stiffness, frictional contact and mesh refinement that follows the cone.

    [:octicons-arrow-right-24: Open the tutorial](Tutorial_3.md)

-   <span class="twemoji lg middle"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M1 13.6 L2.4 12.2 L12.8 6 L12.8 8.4 Z"/><path fill="currentColor" d="M0.8 12.8 H2.5 V17 H0.8 Z"/><path fill="currentColor" d="M0.4 16 L13 11.4 L13.4 13.4 L1.2 17.9 L0.4 17.9 Z"/><path fill="currentColor" d="M8 14 L10.6 13 L9.4 19.6 Z"/><path fill="currentColor" d="M12.6 4.4 H17.6 V9.8 H12.6 Z"/><path fill="currentColor" d="M13.4 9.4 H15 V17.4 H13.4 Z M16 9.4 H17.6 V17.4 H16 Z"/><path fill="currentColor" d="M12 17 H21 L23 15 L24 15.9 L21.8 18.9 H12 Z"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M17.6 6.6 L23.3 4.8"/></svg></span> __Tutorial 4 - Plough (horizontal penetration)__

    ---

    <span class="level level-advanced">Advanced</span> *coming soon*

    A seabed cable plough dragged through dry sand: a non-convex rigid body, a Signorini exit-face condition, and refinement that travels with the plough across 20 m.

    *Coming soon*

</div>

## Dynamic

Implicit dynamic problems using the same Newton-Raphson framework, with inertia and time integration.

<div class="grid cards" markdown>

-   :material-rotate-right:{ .lg .middle } __Tutorial 5 - Rolling sphere__

    ---

    <span class="level level-intermediate">Intermediate</span> ~1 h work through · approx. run 5 min (GPU), 30 min (CPU)

    A rigid sphere rolling down a 45° slope, with a friction-coefficient sweep checked against the analytical slip/stick solution. Introduces dynamic stages, a free rigid body and a boundary track that follows the sphere.

    [:octicons-arrow-right-24: Open the tutorial](Tutorial_5.md)

-   <span class="twemoji lg middle"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M0.8 2.6 H3.6 L4.4 4.2 V19.8 L3.6 21.4 H0.8 Z"/><path fill="currentColor" d="M4.4 3.8 L15.4 8.4 V9.4 L4.4 10.4 Z"/><path fill="currentColor" d="M4.4 20.2 L15.4 15.6 V14.6 L4.4 13.6 Z"/><path fill="currentColor" d="M4.4 11 H20.4 V13 H4.4 Z"/><path fill="currentColor" fill-rule="evenodd" d="M21.4 9.9 A2.1 2.1 0 1 1 21.39 9.9 Z M21.4 11.2 A0.8 0.8 0 1 0 21.41 11.2 Z"/></svg></span> __Tutorial 6 - Drag anchor__

    ---

    <span class="level level-advanced">Advanced</span> ~1.5 to 2 h work through · approx. run 45 min (GPU), 6 h (CPU)

    A half-symmetric AC-14 drag anchor pulled through submerged sand. Combines Tutorial 3's soil model and Tutorial 5's dynamics and moving boundaries with an anchor of two hinged parts, an angle stop and a pull line, over three stages.

    [:octicons-arrow-right-24: Open the tutorial](Tutorial_6.md)

</div>

## Reference input data

Every tutorial's complete `input_data.json`, with a clickable note on each part - copy one as the starting point for your own problem:
[Tutorial 1](Tutorial_1_input_data.md) · [Tutorial 2](Tutorial_2_input_data.md) · [Tutorial 3](Tutorial_3_input_data.md) · [Tutorial 5](Tutorial_5_input_data.md) · [Tutorial 6](Tutorial_6_input_data.md)

Know what you want to model but not which keys do it? See [common tasks](../UsingTheSoftware/common_tasks.md).
