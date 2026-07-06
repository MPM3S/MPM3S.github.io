# Equilibrium equations with rigid body interaction

This page extends the [Equilibrium equations](EquilibriumEquations.md) to include the interaction between material points and discrete rigid bodies following the approach of Bird _et al._ [@bird_dynamic_2025].


## Weak statement of equilibrium with rigid body interaction


In order to include rigid body interactions, the Galerkin weak statement of equilibrium given on the [Equilibrium equations](EquilibriumEquations.md) is extended to include contact force terms that impose loads on the material points, giving

$$\int_{\varphi_t(E)}[\nabla_x S_{vp}]^{T}\{\sigma\} \text{d}v - \int_{\varphi_t(E)}[S_{vp}]^{T}\{b\} \text{d}v - \int_{\varphi_t(\partial E)}[S_{vp}]^{T}\{t\} \text{d}s -  \int_{\varphi_t(\Omega)}  \Bigl(\rho [S_v]^T\{\ddot{u}\}\Bigr) \text{d} v - \int_{\varphi_t(\partial\Omega)}\{F_{N,v}^{\partial\Omega}\}+\{F_{T,v}^{\partial\Omega}\}\,\text{d}s  = \{0\}$$


where $\{F_{N,v}^{\partial\Omega}\}$ and $\{F_{T,v}^{\partial\Omega}\}$ are the normal and tangential contact tractions applied on the part of the material boundary, $\partial\Omega$, that is in contact with the rigid body. The first four are terms are repeated from the equation given on the [Equilibrium equations](EquilibriumEquations.md) page. 

## Material point discretisation

In the MPM, the physical body is split into a number of points that have associated volume, $v_p$, mass, $m_p$, and material properties. The material points act as integration, or quadrature, points and allow the equilibrium statement to be expressed as

$$ \sum_{\forall p}[\nabla_x S_{vp}]^{T}\{\sigma_p\} v_p - \sum_{\forall p}[S_{vp}]^{T}\{b\} v_p - \int_{\varphi_t(\partial \Omega)}[S_{vp}]^{T}\{t\} \text{d}s - \sum_{\forall p}  [S_{vp}]^T\{\ddot{u_p}\}m_p - \sum_{p\in P_c} \left( \{F_{N,vp}^{\partial\Omega}\}+\{F_{T,vp}^{\partial\Omega}\} \right) = \{0\}
$$

where $P_c$ is the set of all material points that are in contact with the rigid body. Note that the subscripts on the terms $\{F_{N,vp}^{\partial\Omega}\}$ and $\{F_{T,vp}^{\partial\Omega}\}$ have been modified to explicit include the interaction with specific material points, $p\in P_c$. 


## Gap function


The _gap function_ is used to both detect contact and measure the overlap between contact surfaces. Here a point-to-surface formulation is used, see Wriggers [@wriggers2006computational] and the work of Curnier and coworkers [@pietrzak1999large; @curnier1995continuum] for exceptional pieces of literature.


The geometric measure of overlap between the deformable material and the rigid body is the _normal gap function_, $g_N$, defined as the signed projection of a material-point position, $\mathbf{x}$, onto its closest point, $\mathbf{x}'$, on the rigid-body surface along the outward surface normal, $\mathbf{n}$:

$$g_N = (\mathbf{x} - \mathbf{x}') \cdot \mathbf{n}.$$

The closest point, $\mathbf{x}'$, is obtained by Closest Point Projection (CPP) of $\mathbf{x}$ onto the discretised rigid-body surface. With this sign convention $g_N > 0$ corresponds to separation, $g_N = 0$ to a closed contact and $g_N < 0$ to penetration.

The gap function and the normal contact pressure values are governed by the Signorini-Hertz-Moreau conditions

$$g_N \geq 0, \quad p_N \leq 0, \quad g_N\, p_N = 0,$$

i.e. the gap can only open ($g_N > 0$) when there is no compressive contact pressure ($p_N = 0$), and a compressive contact pressure ($p_N < 0$) can only arise when the gap is closed ($g_N = 0$).

Penalty regularisation
---

The penalty regulation softens the Signorini-Hertz-Moreau conditions as a small amount of penetration is needed to generate a contact force to resist contact. The penalty force is calculated like this,

$$p_N = \epsilon_N\, g_N,$$

with $\epsilon_N$ the _normal penalty stiffness_. In AMPSSIE the penalty stiffness for each GIMP in contact is built from the GIMP's own material and geometry,

$$\epsilon_N = p_f\, E_p\, A_p^0,$$

where $E_p$ is the GIMP's Young's modulus, $A_p^0 = (V_p^0)^{2/3}$ is a representative undeformed contact area constructed from the initial GIMP volume, $V_p^0$, and $p_f$ is a user-controlled penalty factor that trades off interpenetration against conditioning of the global stiffness matrix. This penalty pressure is the contact force per unit area that enters the weak form above through $\{F_{N,v}^{\partial\Omega}\}$. A worked study of $p_f$ on a stiff penalty problem is presented in [Tutorial 2](../TutorialProblems/Tutorial_2.md).

## Computational proceedure

(_coming soon_)