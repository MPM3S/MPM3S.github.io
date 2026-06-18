---

This page extends the [Static weak form](StaticWeakForm.md) used in AMPSSIE to include the normal-contact forces being imposed on the material points, following the approach of Bird _et al._ [@bird_dynamic_2025].

Weak statement of equilibrium with normal contact
---

The Galerkin weak statement of equilibrium given on the [Static weak form](StaticWeakForm.md) is extended with a normal contact term which imposes a load on the material points. The weak form which includes contact is defined:

$$\int_{\varphi_t(E)}[\nabla_x S_{vp}]^{T}\{\sigma\} \text{d}v - \int_{\varphi_t(E)}[S_{vp}]^{T}\{b\} \text{d}v - \int_{\varphi_t(\partial E)}[S_{vp}]^{T}\{t\} \text{d}s- \int_{\varphi_t(\partial\Omega)}\{F_{N,v}^{\partial\Omega}\}\,\text{d}s  = \{0\}$$


where $\{F_{N,v}^{\partial\Omega}\}$ is the normal contact traction applied on the part of the material boundary, $\partial\Omega$, that is in contact with the rigid body. The first two terms remain the internal force from the Cauchy stress field $\{\sigma\}$ and the body force $\{b\}$; the third is the new contact contribution. Tangential (frictional) contact is omitted here; see Bird _et al._ [@bird_dynamic_2025] for the full normal-and-tangential formulation.

Gap function
---

The geometric measure of overlap between the deformable material and the rigid body is the _normal gap function_, $g_N$, defined as the signed projection of a material-point position, $\mathbf{x}$, onto its closest point, $\mathbf{x}'$, on the rigid-body surface along the outward surface normal, $\mathbf{n}$:

$$g_N = (\mathbf{x} - \mathbf{x}') \cdot \mathbf{n}.$$

The closest point, $\mathbf{x}'$, is obtained by Closest Point Projection (CPP) of $\mathbf{x}$ onto the discretised rigid-body surface. With this sign convention $g_N > 0$ corresponds to separation, $g_N = 0$ to a closed contact and $g_N < 0$ to penetration.

Non-penetration and complementarity between the gap and the normal contact pressure, $p_N$, are expressed through the Signorini-Hertz-Moreau conditions

$$g_N \geq 0, \quad p_N \leq 0, \quad g_N\, p_N = 0,$$

i.e. the gap can only open ($g_N > 0$) when there is no compressive contact pressure ($p_N = 0$), and a compressive contact pressure ($p_N < 0$) can only arise when the gap is closed ($g_N = 0$).

Penalty regularisation
---

The hard inequality $g_N \geq 0$ is regularised by a penalty method: when a material point penetrates the rigid body, the normal contact pressure is taken to be linear in the (negative) gap,

$$p_N = \epsilon_N\, g_N,$$

with $\epsilon_N$ the _normal penalty stiffness_. In AMPSSIE the penalty stiffness for each GIMP in contact is built from the GIMP's own material and geometry,

$$\epsilon_N = p_f\, E_p\, A_p^0,$$

where $E_p$ is the GIMP's Young's modulus, $A_p^0 = (V_p^0)^{2/3}$ is a representative undeformed contact area constructed from the initial GIMP volume, $V_p^0$, and $p_f$ is a user-controlled penalty factor that trades off interpenetration against conditioning of the global stiffness matrix. This penalty pressure is the contact force per unit area that enters the weak form above through $\{F_{N,v}^{\partial\Omega}\}$. A worked study of $p_f$ on a stiff penalty problem is presented in [Tutorial 2](../TutorialProblems/Tutorial_2.md).
