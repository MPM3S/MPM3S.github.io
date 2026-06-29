
---

# Material point method in detail

## Overview

  - [Material Point Method ingredients and steps](MPMoverview.md)

## Large deformation formulation

  - Kinematics
  - Stress and strain measures
  - [Quasi-static strong and weak forms](StaticWeakForm.md)
  - [Quasi-static form with contact](StaticWeakFormNormalContact.md)
  - Dynamic strong and weak forms

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
