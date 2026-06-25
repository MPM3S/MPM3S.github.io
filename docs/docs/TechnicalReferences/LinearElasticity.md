# Isotropic linear elasticity

The linear elastic constitutive formulation in AMPSSIE assumes an isotropic Hencky material with a linear relationship between elastic logarithmic strains, $\{\varepsilon^\text{e}\}$, and Kirchhoff stress, $\{\tau\}$.

The stresses and strains are defined in Vogt notation with, using $\{\tau\}$ as an example, the following ordering of the components

$$\{\tau\} = \{\begin{array}{cccccc}
    \tau_{xx} & \tau_{yy} & \tau_{zz} & \tau_{xy} & \tau_{yz} & \tau_{zx}
  \end{array}\}^T$$

## Stress update algorithm

Given an initial elastic logarithmic strain, $\{\varepsilon^\text{e}_{n}\}$, or the converged logarithmic elastic strain from the previous time step, and an increment in the logarithmic strain, $\{\Delta \varepsilon\}$, the new logarithmic elastic strain is defined as

$$\{\varepsilon^\text{e}_{n+1}\}= \{\varepsilon^\text{e}_{n}\} + \{\Delta \varepsilon\}$$

and the updated Kirchhoff stress calculated using

$$\{\tau_{n+1}\} = [D^{\text{e}}]\{\varepsilon^\text{e}_{n+1}\}$$

where $[D^{\text{e}}]$ is the isotropic elastic stiffness matrix of the material. This stiffness matrix can be expressed as

$$ [D^{\text{e}}] =  \frac{E}{(1+\nu)(1-2\nu)}\left[\begin{array}{cccccc}
    (1-\nu) & \nu & \nu & 0 & 0 & 0\\
    \nu & (1-\nu) & \nu & 0 & 0 & 0\\
    \nu & \nu & (1-\nu) & 0 & 0 & 0\\
    0& 0& 0& \frac{\displaystyle (1-2\nu)}{\displaystyle 2} & 0 & 0\\
    0& 0& 0& 0& \frac{\displaystyle (1-2\nu)}{\displaystyle 2} & 0\\
    0& 0& 0& 0& 0& \frac{\displaystyle (1-2\nu)}{\displaystyle 2}
  \end{array}\right]$$

where $E$ is Young's modulus and $\nu$ is Poisson's ratio. 
