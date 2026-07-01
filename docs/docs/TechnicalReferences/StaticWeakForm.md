# Equilibrium equations

The implemented Material Point Method (MPM) code is based on a number of published papers that describe fully the underlying continuum mechanics framework, include the weak form of the governing equilibrium equations. In particular, Charlton _et al._’s 2017 Generalised Interpolation Material Point Method paper [@charlton2017igimp] provides the scientific basis of the code. Key aspects of the formulation are described below.

## Strong statement of equilibrium

The strong form equilibrium equation is the condition that must be satisfied at all points within a continuum body, $\Omega$. For solid mechanics problems, the strong form equilibrium equation for the balance of linear momentum in the current configuration of the body, which has been subject to some motion, $\varphi$, can be expressed as

$$
\nabla \sigma_{ij} - b_i = \rho \ddot{u} \qquad \text{in} \qquad \varphi(\Omega)
$$

where $\sigma_{ij}$ is the Cauchy stress in the material, $b_i$ are the body forces (such as gravitational loads acting on the solid body), $\rho$ is the density of the material and $\ddot{u}$ is acceleration. The equilibrium equation is subject to boundary Neumann (traction) and Dirichlet (displacement) constraints

$$
    t_{i} = \sigma_{ij} n_j \qquad \text{on} \qquad \varphi(\partial\Omega_N)
$$

$$
    u_{i} = \bar{u}_i \qquad \text{on} \qquad \varphi(\partial\Omega_D)
$$

where $n_j$ is the outward normal to the boundary of the physical domain, $\partial\Omega = \partial\Omega_N \cup \partial\Omega_D$, $t_i$ is the imposed traction over $\partial\Omega_N$ and $\bar{u}_i$ is the imposed displacement on $\partial\Omega_D$.

### Quasi-static analysis

For quasi-static analysis it is assumed that the accelerations of the physical material are negligible and the strong equilibrium condition reduces to 

$$
\nabla \sigma_{ij} - b_i = 0 \qquad \text{in} \qquad \varphi(\Omega)
$$



## Weak equilibrium

For general problems, assumptions that are made about the variation of physical quantities such as displacements over the physical domain mean that it is not possible to exactly satisfy the strong form of equilibrium at every point in an analysis, instead the condition is relaxed into a weak form that satisfies equilibrium in a volume average sense over the discretised physical body. 

The spatial form of the weak equilibrium equation, that is the equilibrium equation defined at the current, deformed state, states that equilibrium is weakly satisfied if the Cauchy stress field, $\sigma_{ij}$, satisfies  

$$
\int_{\varphi_t(\Omega)} \Bigl(\sigma_{ij} (\nabla_x \eta)_{ij}-b_i \eta_i \Bigr)  \text{d} v
- \int_{\varphi_t(\partial\Omega)} \Bigl(t_i \eta_i \Bigr) \text{d}s =  \int_{\varphi_t(\Omega)}  \Bigl(\rho \ddot{u}_i \eta_i\Bigr) \text{d} v
$$

where $\eta_i$ are a field of admissible virtual displacements


### Quasi-static analysis

Under quasi-static conditions the spatial weak statement of equilibrium reduces to

$$
\int_{\varphi_t(\Omega)} \Bigl(\sigma_{ij} (\nabla_x \eta)_{ij}-b_i \eta_i \Bigr)  \text{d} v
- \int_{\varphi_t(\partial\Omega)} \Bigl(t_i \eta_i \Bigr) \text{d}s =  0
$$

as it is assumed that accelerations are negligible. 

## Discretised weak form

### Quasi-static analysis

The code adopts an updated Lagrangian weak statement of equilibrium for quasi-static analysis. The Galerkin form of the weak statement of equilibrium over each background grid element, E, can be expressed as

$$\int_{\varphi_t(E)}[\nabla_x S_{vp}]^{T}\{\sigma\} \text{d}v - \int_{\varphi_t(E)}[S_{vp}]^{T}\{b\} \text{d}v - \int_{\varphi_t(\partial E)}[S_{vp}]^{T}\{t\} \text{d}s = \{0\}$$

where $\varphi_t$ is the motion of the material body which is subjected to tractions, $\{t\}$, on its boundary, $\partial E$ with surface, $s$, and body forces, $\{b\}$, acting over its volume, $v$. These external forces lead to a Cauchy stress field, $\{\sigma\}$, through the body. $[\nabla_x S_{vp}]$ is the tensorial form of the strain-displacement matrix containing derivatives of the basis functions, $[S_{vp}]$, with respect to the updated coordinates, $\{x\}$. The first term in the equilibrium equation is the internal force within an element and the combination of the second (body forces) and third (tractions) terms is the external force vector. The equilibrium equation is non-linear in terms of the unknown nodal displacements and can be efficiently solved using the standard implicit Newton-Raphson procedure.

