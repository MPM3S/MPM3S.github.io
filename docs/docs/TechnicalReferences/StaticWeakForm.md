# Equilibrium equations

The implemented Material Point Method (MPM) code is based on a number of published papers that describe fully the underlying continuum mechanics framework, include the weak form of the governing equilibrium equations. In particular, Charlton _et al._’s 2017 Generalised Interpolation Material Point Method paper [@charlton2017igimp] provides the scientific basis of the code. Key aspects of the formulation are described below.

## Strong statement of equilibrium

The strong form equilibrium equation is the condition that must be satisfied at all points within a continuum body, $\Omega$. For solid mechanics problems, the strong form equilibrium equation for the balance of linear momentum in the current configuration of the body, which has been subject to some motion, $\varphi$, can be expressed as

$$
\nabla \sigma_{ij} - f^b_i = \rho \ddot{u} \qquad \text{in} \qquad \varphi(\Omega)
$$

where $\sigma_{ij}$ is the Cauchy stress in the material, $f_i^b$ are the body forces (such as gravitational loads acting on the solid body), $\rho$ is the density of the material and $\ddot{u}$ is acceleration. The equilibrium equation is subject to boundary Neumann (traction) and Dirichlet (displacement) constraints

$$
    t_{i} = \sigma_{ij} n_j \qquad \text{on} \qquad \varphi(\partial\Omega_N)
$$

$$
    u_{i} = \bar{u}_i \qquad \text{on} \qquad \varphi(\partial\Omega_D)
$$

where $n_j$ is the outward normal to the boundary of the physical domain, $\partial\Omega = \partial\Omega_N \cup \partial\Omega_D$, $t_i$ is the imposed traction over $\partial\Omega_N$ and $\bar{u}_i$ is the imposed displacement on $\partial\Omega_D$.

For quasi-static analysis it is assumed that the accelerations of the physical material are negligible and the strong equilibrium condition reduces to 

$$
\nabla \sigma_{ij} - f^b_i = 0 \qquad \text{in} \qquad \varphi(\Omega)
$$

For general problems, assumptions that are made about the variation of physical quantities such as displacements over the physical domain mean that it is not possible to exactly satisfy the strong form of equilibrium at every point in an analysis, instead the condition is relaxed into a weak form that satisfies equilibrium in a volume average sense over the discretised physical body. 

## Weak equilibrium

The code adopts an updated Lagrangian weak statement of equilibrium for quasi-static analysis. The Galerkin form of the weak statement of equilibrium over each background grid element, E, can be expressed as

$$\int_{\varphi_t(E)}[\nabla_x S_{vp}]^{T}\{\sigma\} \text{d}v - \int_{\varphi_t(E)}[S_{vp}]^{T}\{b\} \text{d}v - \int_{\varphi_t(\partial E)}[S_{vp}]^{T}\{t\} \text{d}s = \{0\}$$

where $\varphi_t$ is the motion of the material body which is subjected to tractions, $\{t\}$, on its boundary, $\partial E$ with surface, $s$, and body forces, $\{b\}$, acting over its volume, $v$. These external forces lead to a Cauchy stress field, $\{\sigma\}$, through the body. $[\nabla_x S_{vp}]$ is the tensorial form of the strain-displacement matrix containing derivatives of the basis functions, $[S_{vp}]$, with respect to the updated coordinates, $\{x\}$. The first term in the equilibrium equation is the internal force within an element and the combination of the second (body forces) and third (tractions) terms is the external force vector. The equilibrium equation is non-linear in terms of the unknown nodal displacements and can be efficiently solved using the standard implicit Newton-Raphson procedure.

## Large deformation mechanics


In large deformation analysis the deformation gradient provides the fundamental link between the original and the deformed states of a body. For elasto-plasticity this deformation gradient can be multiplicatively decomposed into elastic and plastic components. In AMPSSIE, this multiplicative decomposition is combined with a linear relationship between elastic logarithmic (or Hencky) strains and Kirchhoff stress. This allows any small strain constitutive model to be included within the code without modification.

## Constitutive model


Constitutive models provide the fundamental link between stress and strain within any stress analysis algorithm. Two constitutive models are included within AMPSSIE:

*   linear elasticity; and
*   linear elastic-perfectly plasticity with an associated flow von Mises yield envelope.

It is straightforward to include other constitutive models.

<!--
* * *

<div class="image-text-row" markdown>
<div class="ir-image">
<img src="../../../img/plate.jpg" alt="AMPLE: A Material Point Learning Environment">
</div>
<div class="ir-text" markdown>

AMPLE: A Material Point Learning Environment
--------------------------------------------

AMPLE was developed to address the severe learning curve for researchers wishing to understand, and start using, the material point method. The software was developed at Durham University between 2014 and 2018 by Dr Will Coombs as a platform to test our new research ideas and understand the impact of adopting different material point variants. AMPLE was first released in January 2019 at the 2nd International Conference on the Material Point Method held at Cambridge University, UK.

*   [Prof. Will Coombs](mailto:w.m.coombs@durham.ac.uk)
*   [Department of Engineering](http://www.dur.ac.uk/engineering)
*   [DU Computational mechanics on X](https://twitter.com/DU_comp_mech)

2020 © AMPLE: A Material Point Learning Environment

</div>
</div>
-->
