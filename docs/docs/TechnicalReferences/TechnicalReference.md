# Material point method technical reference

This technical reference documentation outlines key background theory and numerical implementation details that underpin the material point method soil-structure interaction software. 

## Material point method basics

  - [Material Point Method overview](MPMoverview.md)

## Large deformation formulation

  - Kinematics
  - Stress and strain measures
  - [Equilibrium equations for solid analysis](EquilibriumEquations.md)
  - [Coupled equilibrium equations with rigid-body contact](StaticWeakFormNormalContact.md)

## Meshing

  - Discretisation of the weak form on the background mesh
  - Octree meshes
  - Search algorithms

## Basis functions

  - Standard linear finite element basis functions
  - Generalised interpolation basis functions
  - Octree modifications

## Material models

  - [Overview](ConstitutiveModels.md) 
  - [Isotropic linear elasticity](LinearElasticity.md)
  - [Isotropic elasto-plasticity](ElastoPlasticity.md)

## Body forces

  - Gravitational loads
  - Discretisation on material points

## Boundary conditions

  - Neumann boundary conditions: free surfaces and tractions
  - Dirichlet boundary conditions: displacement constraints

## Small cut instability

  - [Ghost stabilisation](ghostStabilisation.md)

## Rigid body representation and kinematics

  - Faceted rigid body representation
  - Rigid body kinematics
  - Rigid body constraints

## Coupled soil-structure interaction

  - Contact detection
  - Penalty contact formulation
  - Coupled weak form equations

## Linear solution

  - Direct solvers (included within AMPSSIE)
  - Iterative solvers (included within AMPSSIE)

## Updating

  - Material point updating
  - Rigid body update
  - Background mesh update/reset
