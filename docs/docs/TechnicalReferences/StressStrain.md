# Stress and Strain measures

## Strain measures

The right and left Cauchy-Green strain tensors are not suitable for use as conventional measures of *strain* in a material as they are equal to an identity tensor when there is zero deformation. Any large deformation strain tensor must remove this non-zero component, which permits the definition of a *Lagrangian* family of strain measures with the form

$$
\varepsilon_{ij}^m = \left\{ \begin{array}{ll}\frac{1}{m}\left(U^m_{ij} - \delta_{ij}\right) & \quad m \neq 0\\
\ln(U_{ij}) & \quad m=0
\end{array} \right.
$$

where $m$ is a real integer. 



## Stress-strain formulation

The code adopts logarithmic strains and Kirchhoff stresses and combine these measures with an exponential map of the plastic flow rule to allow the use of conventional small-strain stress integration algorithms with a finite deformation framework.  This is a powerful combination as it allows existing constitutive formulations to be used directly rather than reformulating them for the particular choice of stress and strain measures used in the large deformation mechanics.   Within this formulation, the elastic logarithmic strain is defined as

  $$\varepsilon^{\text{e}}_{ij} = \frac{1}{2} \ln\bigl( b^{\text{e}}_{ij} \bigr),
  \qquad \text{where} \qquad
  b^{\text{e}}_{ij} = F^{\text{e}}_{ik} F^{\text{e}}_{jk}$$


is the left elastic Cauchy-Green strain and the Kirchhoff stress, $\tau_{ij}$, can be obtained using

  $$\tau_{ij} = D^{\text{e}}_{ijkl}\varepsilon^{\text{e}}_{kl},$$

where $D^{\text{e}}_{ijkl}$ is the linear elastic stiffness matrix.  The Cauchy stress can be obtained from the Kirchhoff stress through

$$  \sigma_{ij} = \frac{1}{J}\tau_{ij},
  \qquad \text{where} \qquad
  J=\text{det}(F_{ij})$$

is the volume ratio between the deformed and reference configurations.   In order to advance the non-linear solution, the finite deformation equations are discretised in pseudo-time by imposing the deformation over a number of load (or pseudo-time) steps.  This allows the current deformation gradient to be defined using


  $$F_{ij} = \Delta F_{ik} (F_n)_{kj},$$
   

where $\Delta F_{ij}$ is the increment in the deformation gradient between the previously converged state, denoted using a subscript $n$, and the current state. In order to obtain the updated Kirchhoff stress state for the current deformation gradient, a constitutive model requires an initial estimate (or trial) of the elastic strain (or stress) state.  In this approach the trial elastic Cauchy-Green strain tensor is given by

$$  (b^{\text{e}}_t)_{ij} = \Delta F_{ik} (b^{\text{e}}_{n})_{kl} \Delta F_{jl},$$

 where the subscript $t$ denotes a quantity defined in the trial state.  The previous elastic Cauchy-Green strain tensor, $(b^{\text{e}}_{n})_{ij}$, can be obtained from the previous elastic strain state through

$$   (b^{\text{e}}_{n})_{ij} = \exp\Bigl( 2(\varepsilon^{\text{e}}_{n})_{ij} \Bigr)$$

 and the trial elastic strain state follows as

$$  (\varepsilon^{\text{e}}_t)_{ij} = \frac{1}{2} \ln\Bigl(( b^{\text{e}}_t)_{ij} \Bigr).$$

The adopted constitutive algorithm can then be used to return the updated elastic strain, $\varepsilon^{\text{e}}_{ij} $, and Kirchhoff stress, $\tau_{ij}$, states.  


---
**Next section:** [Equilibrium equations](EquilibriumEquations.md)
