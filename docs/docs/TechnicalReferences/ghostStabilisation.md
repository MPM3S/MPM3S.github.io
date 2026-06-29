# Ghost stabilisation

The non-mesh-matching nature of the Material Point Method (MPM) means that small overlaps between material point domains and background mesh elements can generate vanishingly small mass and stiffness contributions at certain nodes . These small-cut interactions degrade the conditioning of the resulting global linear system of equations and often produce spurious stress oscillations near the physical boundary of the body.

For implicit MPM formulations using generalised interpolation basis functions, two stabilisation strategies currently exist: ghost stabilisation  and mesh aggregation. This code adopts ghost stabilisation, which introduces a penalty term into the mass and/or stiffness matrix to control the gradient of the solution across background mesh faces adjacent to the boundary of the physical body. This restores coercivity, improves the conditioning of the linear system, and significantly enhances solution quality in boundary regions.

## Small cut instability


## Boundary identification

A central requirement of ghost stabilisation is determining which element faces lie on or near the physical boundary of the body. Unlike unfitted finite element methods, most Material Point Method simulations do not explicitly track the geometry of the physical domain. As a result, we need a robust way to identify these boundary faces without reconstructing or tracking the boundary itself.

The process consists of two steps:

- Boundary element detection: first boundary elements are identified as the elements that share a face with any unpopulated element.
- Boundary face extraction: yhe relevant faces are then defined as those belonging to boundary elements that border either: another boundary element; or an element populated by material points.

These faces are stabilised. Each of the faces will connect two elements, one of which is labelled as the *positive* element, $K^+$, and the other the *negative* element, $K^-$. The labelling is arbitrary and flipping positive/negative elements has no impact of the stabilisation. 

![MPM boundary element identification](../../img/MPMboundaries.png)

The stabilisation of the faces between between boundary elements and active (populated) elements is important as it enforces gradient continuity between the well-conditioned interior region and the partially filled boundary elements, greatly improving stability. For simulations involving multiple bodies defined by material point, the procedure is applied independently to each body, and the stabilisation faces are taken as the union of all identified faces.

## Ghost stabilsation 

The ghost stabilisation term for linear elements can be expressed as

$$
	j(u_i,w_i) = \frac{h^{3}}{3} \int_{\Gamma} \left( \frac{\partial u^+_i}{\partial x_j}n_j- \frac{\partial u^-_i}{\partial x_j}n_j\right) \left( \frac{\partial w^+_i}{\partial x_j}n_j- \frac{\partial w^-_i}{\partial x_j}n_j\right) d\Gamma,
$$

where $h$ is the background mesh grid size, $u_i$ is the displacement solution, $x_j$ are the Cartesian coordinates, $n_j$ is the outward normal to the face of the positive element and $\Gamma$ are the boundary element faces that require stabilisation.  

![Boundary stabilisation normal and positive/negative elements](../../img/MPMboundariesStab.png)

Introducing the finite element approximation space for the test and trial functions and eliminating the nodal values associated with the test function (full derivation given in Coombs (2023)) results in a matrix comprised of four sub components multiplied by the physical displacements of the positive, $\{d^+\}$, and negative, $\{d^-\}$, elements 

$$
	\{f_G\} = \left[\begin{array}{cc}
		 {[J_G^{++}]}  &  [J_G^{+-}] \\  
		 {[J_G^{-+}]} &  [J_G^{--}]  
	\end{array} \right]\left\{\begin{array}{c}
		\{d^+\}\\ \{d^-\}
	\end{array}\right\} = [J_G]\{d\},
$$

the combined $[J_G]$ matrix can be compactly expressed as

$$
	[J_G] = \frac{h^{3}}{3}  \int_{\Gamma} \Bigl([G]^T[m][G]\Bigr) d\Gamma,
	\qquad \text{where} \qquad
	[G] = \Bigl[ [G^+] \quad -[G^-] \Bigr]
$$

and $[m]=[n][n]^T$.  

For three dimensional analysis are the normal matrix associated with the positive element, $[n]$, and the matrix containing the shape function derivatives, $[G^+]$,  are

$$
    [n]^T = \left[\begin{array}{cccccc}
        n_x & 0 & 0 & n_y & 0 & n_z\\
        0 & n_y & 0 & n_x & n_z & 0\\
        0 & 0 & n_z & 0 & n_y & n_x
    \end{array}\right]
$$

and 

$$
    [G^+] = \left[\begin{array}{ccc c ccc}
        {N_1^+}_{,x}    & 0             & 0 & \ldots & {N_n^+}_{,x}    & 0             & 0\\
        0               & {N_1^+}_{,y}  & 0 & \ldots & 0               & {N_n^+}_{,y}  & 0\\
        0               & 0             & {N_1^+}_{,z} & \ldots & 0               & 0             & {N_n^+}_{,z}\\
        {N_1^+}_{,y}    & {N_1^+}_{,x}  & 0 & \ldots & {N_n^+}_{,y}    & {N_n^+}_{,x}  & 0\\
        0               & {N_1^+}_{,z}  & {N_1^+}_{,y} & \ldots & 0               & {N_n^+}_{,z}  & {N_n^+}_{,y}\\
        {N_1^+}_{,z}    & 0             & {N_1^+}_{,x} & \ldots & {N_n^+}_{,z}    & 0             & {N_n^+}_{,x}\\
    \end{array}\right].
$$

