# Isotropic elasto-plasticity 

The elasto-plastic constitutive formulation assumes an isotropic Hencky material with a linear relationship between elastic logarithmic strains, $\{\varepsilon^{\text{e}}\}$, and Kirchhoff stress, $\{\tau\}$, combined with a perfect plasticity (fixed) yield surface.

## Linear isotropic elasticity

The elastic behaviour of the material is the same as that detailed [here](LinearElasticity.md).

## Pressure insensitive yield surfaces

The allowable stress states are bounded by a perfectly-plastic von Mises yield surface defined by

$$f= \varrho - \varrho_y = 0$$

where $\varrho=\sqrt{2J_2}$, $J_2=\frac{1}{2}\text{tr}([s][s])$, $[s]=[\tau]-\frac{\xi}{\sqrt{3}}[I]$ and $\varrho_y$ is the deviatoric shear strength of the material. 

### Plastic flow direction

Associated plastic flow is assumed for pressure insensitive, where the plastic potential surface, $g=0$, is equal to the yield surface and the plastic strains evolve according to

$$ \{\dot{\varepsilon}^{\text{p}}\} = \dot{\gamma} \left\{\frac{\partial g}{\partial \tau} \right\} = \dot{\gamma} \left\{\frac{\partial f}{\partial \tau} \right\}$$

where $\dot{\gamma}$ is the plastic consistency parameter. 

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



The first step is to determine the trial elastic strain state by assuming that the increment in the logarithmic strain associated with the current time step $\{\Delta \varepsilon\}$, results in elastic behaviour

$$\{\varepsilon^\text{e}_{tr}\}= \{\varepsilon^\text{e}_{n}\} + \{\Delta \varepsilon\}$$

where $\{\varepsilon^\text{e}_{n}\}$ is the initial logarithmic elastic strain or the converged logarithmic elastic strain from the previous time step.  This elastic trial strain state can be used to determine an estimate of the stress state by assuming linear isotropic material behaviour 

$$\{\tau_{tr}\} = [D^{\text{e}}]\{\varepsilon^\text{e}_{tr}\}$$

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

The next step is to check $\{\tau_{tr}\}$ against the selected yield criteria. 

- **If $f(\{\tau_{tr}\})\leq 0$**: the material is undergoing elastic behaviour and the updated stress and elastic strain states at equal to the trial values. The material stiffness is the elastic stiffness matrix, $[D^{\text{e}}]$
- **Else $f(\{\tau_{tr}\})> 0$**: the trial state is outside of the yield surface, which is not admissible. This means that the material will be undergoing elasto-plastic behaviour and the trial stress state needs to be returned to an admissible state of stress on the yield surface, $f=0. 

### Backward Euler elasto-plastic stress update

When undergoing elasto-plastic behaviour, the total strain increment associated the the current time step needs to be split into an elastic, $\{\Delta \varepsilon^{\text{e}}\}$, and a plastic, $\{\Delta \varepsilon^{\text{p}}\}$, component

$$\{\Delta \varepsilon\} = \{\Delta \varepsilon^{\text{e}}\} + \{\Delta \varepsilon^{\text{p}}\}$$

The increment in the elastic strains is unknown, whereas the increment in the plastic strains can be expressed in terms of the plastic flow direction and an increment in the plastic consistency parameter

$$ \{\Delta {\varepsilon}^{\text{p}}\} = \Delta{\gamma} \left\{\frac{\partial g}{\partial \tau} \right\}$$

The flow direction, $\left\{\frac{\partial g}{\partial \sigma} \right\}$, depends on the position on the plastic potential surface and therefore the updated stress (or elastic strain) state. The increment in the plastic consistency parameter, $\Delta \gamma \geq 0$, is taken to be an independent scalar unknown that controls the magnitude of the plastic strain increment. 

**Unknowns**: The primary unknowns, $\{x\}$, for the stress update procedure are taken to be the updated elastic logarithmic strains, $\{\varepsilon^{\text{e}}_{n+1}\}$, and the increment in the plastic consistency parameter, $\Delta \gamma$. 

**Residuals**: The residual equations, $\{R\}$ associated with the unknowns are: 

- **Strain balance**: balance between elastic and plastic strains at the updated strain state

$$\{\varepsilon^{\text{e}}_{n+1}\}-\{\varepsilon^{\text{e}}_{tr}\}+\Delta \gamma \left\{\frac{\partial g}{\partial \tau}\right\} = \{0\}$$

- **Yield function**: the updated stress state must be in an admissible state with 

$$f = 0$$

**Solution procedure**: The unknowns are obtained from the residual equations through a fully implicit backward Euler stress update procedure that applies Newton's method (aka Newton-Raphson) to obtain the updated elastic strain state and the increment in the plastic consistency parameter given an initial estimate.  The solution is updated using

$$ \{x\}_{k+1} = \{x\}_{k} - \left[ \frac{\partial R}{\partial x} \right]_k^{-1}\{R\}_k $$

where $k$ is the iteration counter, until the L2 norm of the residual equations, $\{R\}$, drop below a given tolerance[^1]. 

In the case of perfect plasticity the residual equation is

$$ \{R\} = \left\{\begin{array}{c} 
\{\varepsilon^{\text{e}}_{n+1}\}-\{\varepsilon^{\text{e}}_{tr}\}+\Delta \gamma \left\{\frac{\partial g}{\partial \tau}\right\}\\
f
\end{array} \right\} $$

and the vector of unknowns is

$$\{x\} = \left\{\begin{array}{c} 
\{\varepsilon^{\text{e}}_{n+1}\}\\
\Delta\gamma 
\end{array} \right\}$$

The derivative of the residual vector with respect to the unknown vector is therefore

$$\left[ \frac{\partial R}{\partial x} \right] = \left[\begin{array}{cc}
  [I]-\Delta \gamma \left[\frac{\partial ^2 g}{\partial \tau}\right][D^{\text{e}}] & \left\{\frac{\partial g}{\partial \tau}\right\} \\
  \left\{\frac{\partial f}{\partial \tau}\right\}^T[D^{\text{e}}] & 0
\end{array}\right]$$

where the derivatives of the yield function and the plastic potential surface will depend on the specific constitutive model. 

**Initial estimate**: The initial estimate assumes fully elastic behaviour such that

$$\{\varepsilon^{\text{e}}_{n+1}\} = \{\varepsilon^{\text{e}}_{tr}\} \qquad \text{and} \qquad \Delta\gamma=0$$

this gives an initial residual of 

$$ \{R\}_0 = \left\{\begin{array}{c} 
\{0\}\\
f(\{\tau_{tr}\})
\end{array} \right\} $$

**Updated state**: Once the Newton-Raphson process has converged the stress and elastic strain states are updated and returned by the constitutive algorithm.

**Stiffness return**: When undergoing elasto-plastic behaviour, the constitutive algorithm returns the algorithmic consistent tangent associated with the stress update procedure. The adoption of this tangent facilitates optimum convergence of the global linear system of equations as it provides an linearisation of the constitutive algorithm at the updated stress/strain state. The tangent is obtained from the top left six-by-six block of the matrix

$$\left[\begin{array}{cc}
  [C^{\text{e}}]-\Delta \gamma \left[\frac{\partial ^2 g}{\partial \tau}\right] & \left\{\frac{\partial g}{\partial \tau}\right\} \\
  \left\{\frac{\partial f}{\partial \tau}\right\}^T & 0
\end{array}\right]^{-1}$$

where $[C^{\text{e}}]=[D^{\text{e}}]^{-1}$ is the elastic compliance matrix. Note that when the yield function and the plastic potential surface are not equal, $f\neq g$, the algorithmic consistent tangent will be non-symmetric. 

[^1]: Note that the tolerance on the L2 norm of the residual equations, $\{R\}$, will depend on the form of the yield function, $f$, and it may be necessary to evaluate separately the L2 norm of the strain balance and the yield function depending on unit compatibility. 