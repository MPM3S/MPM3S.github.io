# Quick start tutorial 1

## Introduction
This quick start tutorial walks through the steps of running your first AMPSSIE problem.
The problem is a convergence analysis of a column deforming under self-weight.
It is a simple problem that runs quickly and uses nearly all aspects of the code, apart from contact and rigid body interactions.

The convergence of the implicit Generlised Interpolation Materail Point Method (iGIMPM) was first demonstrated by Charlton \emph{et al.} [@charlton_implicit_2018] on the 1D self-weight column, it is used to validate the material point code with a background mesh with hanging nodes against an analytical solution.

By the end of this tutorial, you will have:

- Set up the input .json file
- Run the analysis for a series of problems
- Visualised the results

## Problem description

You will define the geometry, mesh, boundary conditions, material, and solver in the input file. The values below give you a column that deforms significantly under self-weight. The deformation is large enough that the Generlised Interpolation Material Points (GIMPs) will trasverse several elements and will interact with hanging nodes.

![Compression under self-weight, example of the refinement scheme with hanging nodes.](../../img/example_mesh_ref.svg){ #fig-example-mesh width="90%" }

**Problem Domain:** Set the geometry to a $h \times h \times 0.8$ m column, i.e. $(x,y,z)\in[0,h]\times[0,h]\times[0,0.8]$ m. Start with $h = 0.4$ m. For the convergence study you will halve $h$ at each refinement step (see [](#fig-example-mesh)). The element *size* $h$ is what you will plot later against the stress error:

$$
e_{\sigma} = \frac{1}{\sigma_g\, V_\Omega} \sum_{p \in P} \left| \sigma^z(z^0_p) - \sigma_p^z \right| V_p ,
$$

where:

- $\sigma_g = \rho g L$ is the characteristic stress at the bottom of the domain, with $L = 0.8$ m the column height
- $V_\Omega = L h^2$ is the total domain volume
- $\sigma^z(z_p^0) = \rho g (L - z_p)$ is the analytical vertical stress
- $z_p^0$ is the vertical position of the material point at time $t = 0$
- $V_p$ is the GIMP volume

**Material domain:** The problem and material domain at $t=0$ do not normally conincide, however for this problem the GIMPs will be distributed in the volume $V_\Omega = [0,h]\times[0,h]\times[0,0.8]$ m.

**Boundary conditions:** Apply roller boundaries on the four sides and the base. Leave the top as a free surface. Fix every node in $x$ and $y$ so the problem stays one-dimensional.

**Material:** Use a Hencky elastic model with constant parameters:

<div class="centered-table" markdown>

| Parameter        | Symbol  |     Value     |
|------------------|:-------:|:-------------:|
| Young's modulus  | $E$     | $10^3$ Pa     |
| Poisson's ratio  | $\nu$   | $0.0$         |
| Density          | $\rho$  | $50$ kg/m$^3$ |

</div>

These properties differ slightly from Charlton et al. [@charlton_implicit_2018] on purpose — they produce large enough deformation for GIMPs to span elements of different sizes, which is the point of the test.

**Loading:** Apply gravity as a body force, $g_i = [0,\,0,\,-9.81]$ m/s$^2$.

**Solver:** Use Newton-Raphson and ramp the load on incrementally over 20 load steps.


<!--
The implicit GIMPM (iGIMPM) convergence was first demonstrated by Charlton \emph{et al.} \cite{charlton_implicit_2018} on the 1D self-weight column. In the paper it was shown that the error in the stress solution, normalised with respect to the volume, converges with uniform refinement for a conforming mesh. Here the same general problem and GIMP domain update is considered as in Charlton \emph{et al.} \cite{charlton_implicit_2018}. The initial mesh, and a refinement step, are shown in Figure \ref{fig:example mesh}. 
\begin{figure}[ht!]
    \centering
    \includegraphics[width=0.5\linewidth]{Figures/example_mesh_ref.pdf}
   \caption{Compression under self weight: An example of the refinement scheme with hanging nodes.}
    \label{fig:example mesh}
\end{figure}
The domain has dimensions $(x,y,z)\in[0,W]\times[0,W]\times[0,0.8]$ m, where $W$ is the width of the domain and is equal to the side length of the largest element in the domain. The first mesh has $W=0.4$ m, and is divided by 2 each refinement step, as in Figure \ref{fig:example mesh}. When reporting on the convergence of the problem the \textit{size} of elements in the mesh is reported as $W$. On all sides of the domain roller boundary conditions exist except the top domain where there is a homogeneous Neumann boundary condition, all nodes are at least fixed in $x$ and $y$ to make the problem one-dimensional. The validation uses slightly different material properties to that of Charlton \emph{et al.} \cite{charlton_implicit_2018} so that significant deformation occurs and overlap of GIMPs between elements of different sizes occurs. The material is Hencky elastic, with constant elastic parameters, Young's modulus $E=10^3$ Pa, Poisson's ratio $\nu = 0.0$, and the material density is set to $\rho = 50$ kg/m$^3$, the domain is subject to a body force from gravitation loading $g_i = [0,0,-9.81]$ m/s$^2$.  Last, the problem is solved using a Newton-Raphson scheme, where the load is incrementally increased over 20 load steps. 

To demonstrate convergence, the numerical stress solution is compared to the analytical solution and a stress error is defined which is normalised to the domain volume. The same error measure is similar to that of \cite{charlton_implicit_2018}, but normalised with respect to the stress at the bottom of the column,
\begin{equation}
    e_{\sigma} = \frac{1}{\sigma_g}\sum_{p\in P} |\sigma^z(z^0_p)-\sigma_p^z|V_p
\end{equation}
where $\sigma_g = \rho g~0.8$ is the stress at the bottom of the domain, $\sigma^z(z_p^0) = \rho g(0.8-z_p)$ is the vertical stress solution $z_p^0$ is the vertical position of the point at time $t=0$ and $V_p$ is the GIMP volume. For this problem in the smaller elements the GIMPs are initiated in a $2\times2\times2$ structure, whereas in the larger elements the structure is $4\times4\times4$. This is to ensure no GIMP refinement occurs during the validation, focusing the study on the convegence of the method with an octree background mesh with hanging nodes.

An example of a column, $W=0.4$ m, undergoing deformation over the 20 load steps is shown in Figure \ref{fig:column_stress_solution}. The mesh is the pink wire frame and the GIMPs are shown by the blue-to-red coloured cuboids, with blue being the most negative vertical displacement. The Figures shows that the GIMPs are traversing the element boundaries. Particularly at $z=0.4$ m, where hanging nodes exist.

\begin{figure}[ht!]
    \centering
    \includegraphics[width=0.7\textwidth]{Figures/column_self_weight.png}
    \caption{Self weight: Displacement plot of the GIMPs and mesh for steps 1, 10 and 20, of 20.}
    \label{fig:column_stress_solution}
\end{figure}

Convergence of the solution with mesh refinement is shown in Figure~\ref{fig:column_convergence}, plotted against a reference slope of one. As in Charlton \emph{et al.}~\cite{charlton_implicit_2018}, the observed convergence 
rate of the stress solution is slightly greater than unity, whereas linear finite elements would yield exactly first-order convergence. This is caused by the GIMP basis functions having different orders when the domain of a material point is fully within an element (linear) or overlapping multiple elements (quadratic) \cite{coombs2020on}. 

\begin{figure}[ht!]
    \centering
    \includegraphics[width=0.5\textwidth]{Figures/column_convergence.pdf}
    \caption{Self weight: Convergence of the error with mesh refinement.}
    \label{fig:column_convergence}
\end{figure}
-->