# Equilibrium equations

The implemented Material Point Method (MPM) code is based on a number of published papers that describe fully the underlying continuum mechanics framework, include the weak form of the governing equilibrium equations. In particular, Charlton _et al._’s 2017 Generalised Interpolation Material Point Method paper [@charlton2017igimp] provides the scientific basis of the code. Key aspects of the formulation are described below.

## Strong statement of equilibrium

The strong form equilibrium equation is the condition that must be satisfied at all points within a continuum body, $\Omega$. For solid mechanics problems, the strong form equilibrium equation for the balance of linear momentum in the current configuration of the body, which has been subject to some motion, $\varphi$, can be expressed as

$$
\nabla_x \sigma_{ij} + b_i + \rho \ddot{u}_i =0 \qquad \text{in} \qquad \varphi(\Omega)
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
\nabla_x \sigma_{ij} + b_i = 0 \qquad \text{in} \qquad \varphi(\Omega)
$$



## Weak equilibrium

For general problems, assumptions that are made about the variation of physical quantities such as displacements over the physical domain mean that it is not possible to exactly satisfy the strong form of equilibrium at every point in an analysis, instead the condition is relaxed into a weak form that satisfies equilibrium in a volume average sense over the discretised physical body.  There are various ways to achieve the same resulting weak statement of equilibrium, such as weighted residual and virtual work techniques. Here a weight residual technique is adopted a general approach to transfer between strong and weak statements of equilibrium.

The starting point for a **weighted residual** technique is to relax the strong equilibrium statement to 

$$
\nabla_x \sigma_{ij} + b_i + \rho \ddot{u}_i = R_i 
$$

where $R_i$ is a residual. The introduction of this residual accepts that it is not possible to exactly satisfy the strong statement of equilibrium and instead we will seek the solution that minimises this residual.  

The primary unknown is the displacement solution over the physical domain as from this we can obtain the deformation gradient, the strains and then the stresses at any point. The solution that we want is to find the displacement solution that minimises the residual, which is achieved via three steps:

- weighting each residual by the a *test* function, $\eta_i$;
- integrating over physical domain; and
- setting the resultant equation to zero (minimising the residual).

It is important to distinguish the *test* functions, which we use to weight the solution and are also known as virtual displacements, from the set of physical *trial* functions, $u_i$, that satisfy the boundary conditions imposed on the physical problem and represent the actual solution to the problem.  

### Weighting the residual

Weighting the relaxed strong form by the test function gives

$$
(\nabla_x \sigma_{ij}) \eta_i + (b_i + \rho \ddot{u}_i)\eta_i = R_i \eta_i 
$$

### Integration over the physical domain

Integrating the weighted equilibrium equation over the problem domain and setting the resultant equation to zero gives

$$
\int_{\varphi_t(\Omega)}  (\nabla_x \sigma_{ij}) \eta_i ~\text{d}v + \int_{\varphi_t(\Omega)}  (b_i + \rho \ddot{u}_i)\eta_i~\text{d}v = 0
$$

The $(\nabla_x \sigma_{ij})$ in this equation is problematic as is constrains the form of the solution. In order to remove this issue it is necessary to introduce Green's theorem

$$
 \int (\nabla_x \sigma_{ij}) \eta_i ~\text{d}v = -\int \sigma_{ij} (\nabla_x \eta_{i})  ~\text{d}v + \int (\underbrace{\sigma_{ij} n_j}_{t_i})\eta_i~\text{d}s
$$

which also naturally introduces the traction boundary condition, $t_i$ into the equilibrium condition. This allows the weighted equilibrium equation over the problem domain to be expressed as

$$
-\int_{\varphi_t(\Omega)}  \sigma_{ij} (\nabla_x \eta_{i}) ~\text{d}v + \int_{\varphi_t(\partial \Omega)}  t_i\eta_i~\text{d}s + \int_{\varphi_t(\Omega)}  (b_i + \rho \ddot{u}_i)\eta_i~\text{d}v = 0
$$

Finally, the spatial form of the weak equilibrium equation, that is the equilibrium equation defined at the current, deformed state, states that equilibrium is weakly satisfied if the Cauchy stress field, $\sigma_{ij}$, satisfies  

$$
\int_{\varphi_t(\Omega)} \Bigl(\sigma_{ij} (\nabla_x \eta)_{ij}-b_i \eta_i \Bigr)  \text{d} v
- \int_{\varphi_t(\partial\Omega)} \Bigl(t_i \eta_i \Bigr) \text{d}s -  \int_{\varphi_t(\Omega)}  \Bigl(\rho \ddot{u}_i \eta_i\Bigr) \text{d} v = 0
$$


### Quasi-static analysis

Under quasi-static conditions the spatial weak statement of equilibrium reduces to

$$
\int_{\varphi_t(\Omega)} \Bigl(\sigma_{ij} (\nabla_x \eta)_{ij}-b_i \eta_i \Bigr)  \text{d} v
- \int_{\varphi_t(\partial\Omega)} \Bigl(t_i \eta_i \Bigr) \text{d}s =  0
$$

as it is assumed that accelerations are negligible. 

## Discretised weak form

In order to express the weak statement of equilibrium in a discrete form (as opposed to the continuous form written so far), it is necessary to introduce how the primary variable, namely the displacements are represented across the physical domain. The MPM adopts a finite element-like approximation for the displacement solution, where displacements are solved at discrete nodal locations and interpolation/shape/basis functions are used to describe the displacement variation over the discretised space. This allows the displacement at a given point to be written as

$$
 u_i = \sum_{\forall v} S_{v} ~ u_i^v = [S_v]\{d\}
$$

where $S_{v}$ are the basis functions that link a given location in the problem to the nodes or vertices of the finite element mesh, $v$. $\{d\}$ is a global vector of vertex displacements and $[S_v]$ is a global matrix of basis functions, with the following format

$$
[S_v] = \left[\begin{array}{ccc c ccc} 
    S_1 & 0 & 0 & \ldots & S_{n_v} & 0 & 0 \\
    0 & S_1 & 0 & \ldots & 0 & S_{n_v} & 0 \\
    0 & 0 & S_1 & \ldots & 0 & 0 & S_{n_v} 
\end{array}\right]
$$

where $n_v$ is the total number of vertices in the problem.

The different weighted residual methods are classified based on adopted *test* (or weighing) function, here we select a particular variant of the method known as **Galerkin's method** that uses the same basis functions that are used to describe the displacement variation, $S_{v}$, as the weight function, such that

$$
 \eta_i = \sum_{\forall v} S_{v} ~ \eta_i^v = [S_v]\{d_\eta\}
$$

where $\{d_\eta\}$ is a global vector of vertex test function coefficients. 

Introducing these approximations into the weak equilibrium statement results in

$$
\int_{\varphi_t(\Omega)} \Bigl(\sigma_{ij} (\nabla_x [S_v]\{d_\eta\})_{ij}-b_i [S_v]\{d_\eta\} \Bigr)  \text{d} v
- \int_{\varphi_t(\partial\Omega)} \Bigl(t_i [S_v]\{d_\eta\} \Bigr) \text{d}s -  \int_{\varphi_t(\Omega)}  \Bigl(\rho \ddot{u}_i [S_v]\{d_\eta\}\Bigr) \text{d} v = 0
$$

Note that $\{d_\eta\}$ are values at specific locations within the finite element mesh and therefore are constants for the purpose of integration. They also post-multiply all terms in the equilibrium statement, which allows them to be eliminated. These points, along with introducing vector notation for the Cauchy stress, body forces, tractions and accelerations results in 

$$
\int_{\varphi_t(\Omega)} \Bigl(\{\sigma\}^T [\nabla_x S_v]-\{b\}^T [S_v] \Bigr)  \text{d} v
- \int_{\varphi_t(\partial\Omega)} \Bigl(\{t\}^T [S_v]\Bigr) \text{d}s -  \int_{\varphi_t(\Omega)}  \Bigl(\rho \{\ddot{u}\}^T [S_v]\Bigr) \text{d} v = 0
$$

Note that for the Cauchy stress, Vogt notation is assumed where 

$$
\{\sigma\} = \{\begin{array}{cccccc}
    \sigma_{xx} & \sigma_{yy} & \sigma_{zz} & \sigma_{xy} & \sigma_{yz} & \sigma_{zx}
  \end{array}\}^T
$$

and the spatial gradient operator, when applied to $[S_v]$ results in 

$$ 
[\nabla_x S_v] = \left[\begin{array}{ccc c} 
    \frac{\partial S_1}{\partial x} & 0 & 0 & \ldots \\
    0 & \frac{\partial S_1}{\partial y} & 0 & \ldots \\
    0 & 0 & \frac{\partial S_1}{\partial z} & \ldots \\
    \frac{\partial S_1}{\partial y} & \frac{\partial S_1}{\partial x} & 0 & \ldots\\
    0 & \frac{\partial S_1}{\partial z} & \frac{\partial S_1}{\partial y} & \ldots\\
    \frac{\partial S_1}{\partial z} & 0 & \frac{\partial S_1}{\partial x}& \ldots\\
\end{array}\right]
$$

Using the standard property of matrix transposes the equilibrium statement can be expressed in the standard form

$$\int_{\varphi_t(\Omega)}[\nabla_x S_{v}]^{T}\{\sigma\} \text{d}v - \int_{\varphi_t(\Omega)}[S_{v}]^{T}\{b\} \text{d}v - \int_{\varphi_t(\partial \Omega)}[S_{v}]^{T}\{t\} \text{d}s -  \int_{\varphi_t(\Omega)}  \Bigl(\rho [S_v]^T\{\ddot{u}\}\Bigr) \text{d} v = \{0\}$$

### Quasi-static analysis

Under quasi-static conditions the spatial weak statement of equilibrium reduces to

$$\int_{\varphi_t(\Omega)}[\nabla_x S_{v}]^{T}\{\sigma\} \text{d}v - \int_{\varphi_t(\Omega)}[S_{v}]^{T}\{b\} \text{d}v - \int_{\varphi_t(\partial \Omega)}[S_{v}]^{T}\{t\} \text{d}s  = \{0\}$$

as it is assumed that accelerations are negligible. The first term in the equilibrium equation is the internal force within an element and the combination of the second (body forces) and third (tractions) terms is the external force vector. 

## Material point discretisation


The final step is introducing the numerical approximation for the integral equations. In the MPM, the physical body is split into a number of points that have associated volume, $v_p$, mass, $m_p$, and material properties. The material points act as integration, or quadrature, points and allow the equilibrium statement to be expressed as

$$ \sum_{\forall p}[\nabla_x S_{vp}]^{T}\{\sigma_p\} v_p - \sum_{\forall p}[S_{vp}]^{T}\{b\} v_p - \int_{\varphi_t(\partial \Omega)}[S_{vp}]^{T}\{t\} \text{d}s - \sum_{\forall p}  [S_{vp}]^T\{\ddot{u_p}\}m_p = \{0\}
$$

Note that the subscript $p$ has been introduced into $[S_{vp}]$, $\{\sigma_p\}$, etc. explicitly tie associated quantities to specific material points. The traction term remains as a integral expressed over the boundary of the physical domain[^1].

[^1]: Note that the application of general traction boundary conditions in the material point method is an area of ongoing research. The reason for this is that most material point method implementations do not explicitly track the boundary of the physical domain. The reconstruction of the domain boundary based on material point locations is challenging when large deformations can result in the generation of new external boundaries and the merger of others.  

### Quasi-static analysis

Under quasi-static conditions the equilibrium statement reduces to

$$ \sum_{\forall p}[\nabla_x S_{vp}]^{T}\{\sigma_p\} v_p - \sum_{\forall p}[S_{vp}]^{T}\{b\} v_p - \int_{\varphi_t(\partial \Omega)}[S_{vp}]^{T}\{t\} \text{d}s  = \{0\}
$$

where, as before, the acceleration term is assumed to be zero. 

## Solution approaches

The solution of the equilibrium equations for dynamic and quasi-static are detailed in other parts of this technical documentation, see:

- ?? for dynamic solution methods
- ?? for quasi-static solution methods


---
**Next section:** [Equilibrium equations with rigid body interaction](EquilibriumEquationsContact.md)