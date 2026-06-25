# Constitutive models

Constitutive models provide the fundamental link between stress and strain within any stress analysis algorithm. The following forms constitutive models are included within AMPSSIE:

- [linear elasticity](LinearElasticity.md)
- [linear elasticity-perfect plasticity](ElastoPlasticity.md)

All of the constitutive models adopt a Hencky material assumption, where the stress-strain relationship is formulated in terms of logarithmic (or Hencky) strain and Kirchhoff stress. This choice of stress and strain measures, along with an exponential map of the plastic flow, allows small strain constitutive model implementations to be used in large deformation analysis without modifying the core stress update algorithm. 
