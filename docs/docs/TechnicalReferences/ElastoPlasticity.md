# Isotropic elasto-plasticity 

The elasto-plastic constitutive formulation in AMPSSIE assumes an isotropic Hencky material with a linear relationship between elastic logarithmic strains, $\{\varepsilon\}$, and Kirchhoff stress, $\{\tau\}$.

The elastic behaviour of the material is detailed [here](LinearElasticity.md).

## Pressure insensitive yield surfaces

## Pressure sensitive yield surfaces

The allowable stress states are bounded by a perfectly-plastic yield surface defined by

$$f = \varrho - \alpha\bar{\varrho}\bigl( \xi - \xi_c \bigr) = 0$$

where $\varrho=\sqrt{2J_2}$, $J_2=\frac{1}{2}\text{tr}([s][s])$, $[s]=[\tau]-\frac{\xi}{\sqrt{3}}[I]$, $\xi=\frac{1}{\sqrt{3}}\text{tr}([\tau])$, $\xi_c=c\sqrt{3}\cot(\phi)$, $\alpha=-\tan(\phi)$, $\bar{\varrho}$ is a Lode angle-dependent function definition the deviatoric section of the yield surface, $\phi$ is the friction angle of the material and $c$ is the cohesion. The Lode angle is defined as

$$\theta = \frac{-3\sqrt{3}J_3}{2J_2^{3/2}} \quad \in ~ [-\pi/6,\pi/6]$$

where $J_3=\frac{1}{3}\text{tr}([s][s][s])$.


### Circular deviatoric section

A **Drucker-Prager** yield surface with a circular deviatoric section is obtained by setting $\bar{\varrho}=1$. 

### Lode angle dependent deviatoric section

A frictional yield surface with a Willam-Warnke deviatoric section is obtained with


$$\bar{\varrho} = \frac{a_1C + (2a_1 C^2 + a_2)^{1/2}}{2a_1C^2+1},$$

where $C=\cos\left(\theta+\frac{\pi}{6}\right)$, $a_1=2(1-\bar{\varrho}_e^2)/(2\bar{\varrho}_e-1)^2$ and $a_2=(5\bar{\varrho}_e^2-4\bar{\varrho}_e)/(2\bar{\varrho}_e-1)^2$. $\bar{\varrho}_e$ is the ratio of the yield radius under triaxial extension relative to that under triaxial compression. 

It is possible to specify $\bar{\varrho}_e$ by making the assumption that the  Willam-Warnke section coincides with a **Mohr-Columb** deviatoric section at the compression and extension meridians. This allows  $\bar{\varrho}_e$ to be defined in terms of the friction angle as

$$\bar{\varrho}_e = \frac{3-\sin(\phi)}{3+\sin(\phi)}$$

and does not introduce an additional constitutive parameter. 


### Plastic flow direction

Non-associated flow is included by the specification of an independent plastic potential surface

$$g = \varrho - \beta \bigl( \xi - \xi_\beta \bigr) = 0$$

where $\xi_\beta=c\sqrt{3}\cot(\psi)$, $\beta=-\tan(\psi)$ and $\psi\in[0,\phi]$ is the dilation angle of the material. This plastic potential surface has a circular deviatoric section and therefore results in non-associated plastic flow for a yield surface with a non-circular deviatoric section even if $\psi=\phi$. 


## Stress update algorithm

The stress update algorithm used in the software is based on the approached detailed in Coombs (2011). 

The primary unknowns for the stress update procedure are the updated elastic logarithmic strains, $\{\varepsilon^{\text{e}}_{n+1}\}$, and the increment in the plastic consistency parameter, $\Delta \gamma$. 

The residual equations for this implicit stress update procedure are

**Strain balance**\
$$\{\varepsilon^{\text{e}}_{n+1}\}-\{\varepsilon^{\text{e}}_{tr}\}+\Delta \gamma \left\{\frac{\partial g}{\partial \tau}\right\} = \{0\}$$

**Yield function**\
$$f = 0$$