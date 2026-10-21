# Material point method technical reference

This technical reference outlines the background theory and numerical implementation that underpin the material point method soil-structure interaction software. Topics without a link are still being written.

<div class="grid cards equal" markdown>

-   :material-dots-grid:{ .lg .middle } __Material point method basics__

    ---

    - [Material Point Method overview](MPMoverview.md)

-   :material-function-variant:{ .lg .middle } __Large deformation formulation__

    ---

    - [Kinematics](Kinematics.md)
    - [Stress and strain measures](StressStrain.md)
    - [Equilibrium equations for solid analysis](EquilibriumEquations.md)
    - [Coupled equilibrium equations with rigid-body contact](EquilibriumEquationsContact.md)

-   :material-grid:{ .lg .middle } __Meshing__

    ---

    - Discretisation of the weak form on the background mesh *(coming soon)*
    - Octree meshes *(coming soon)*
    - Search algorithms *(coming soon)*

-   :material-chart-bell-curve:{ .lg .middle } __Basis functions__

    ---

    - Standard linear finite element basis functions *(coming soon)*
    - Generalised interpolation basis functions *(coming soon)*
    - Octree modifications *(coming soon)*

-   :material-layers:{ .lg .middle } __Material models__

    ---

    - [Overview](ConstitutiveModels.md)
    - [Isotropic linear elasticity](LinearElasticity.md)
    - [Isotropic elasto-plasticity](ElastoPlasticity.md)

-   :material-arrow-down:{ .lg .middle } __Body forces__

    ---

    - Gravitational loads *(coming soon)*
    - Discretisation on material points *(coming soon)*

-   :material-border-outside:{ .lg .middle } __Boundary conditions__

    ---

    - Neumann boundary conditions: free surfaces and tractions *(coming soon)*
    - Dirichlet boundary conditions: displacement constraints *(coming soon)*

-   :material-content-cut:{ .lg .middle } __Small cut instability__

    ---

    - [Ghost stabilisation](ghostStabilisation.md)

-   :material-anchor:{ .lg .middle } __Rigid body representation and kinematics__

    ---

    - Faceted rigid body representation *(coming soon)*
    - Rigid body kinematics *(coming soon)*
    - Rigid body constraints *(coming soon)*

-   :material-handshake:{ .lg .middle } __Coupled soil-structure interaction__

    ---

    - Contact detection *(coming soon)*
    - Penalty contact formulation *(coming soon)*
    - Coupled weak form equations *(coming soon)*

-   :material-matrix:{ .lg .middle } __Linear solution__

    ---

    - Direct solvers (included within MPM3S) *(coming soon)*
    - Iterative solvers (included within MPM3S) *(coming soon)*

-   :material-update:{ .lg .middle } __Updating__

    ---

    - Material point updating *(coming soon)*
    - Rigid body update *(coming soon)*
    - Background mesh update/reset *(coming soon)*

</div>
