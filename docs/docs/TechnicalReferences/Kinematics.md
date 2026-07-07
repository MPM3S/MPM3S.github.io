# Kinematics

## Motion and displacement 

In large deformation analysis it is important to distinguish between the original, $X_i$, and current, $x_i$, coordinates of a given point within a continuum body. The current (or updated) coordinates are defined as

$$
x_i = \varphi(X_i,t)
$$

where $\varphi$ is the motion of the body at a given time, $t$. The single subscript denotes $x_i$ as a first order tensor, where $i\in[1,2,3]$ denote the three cartesian components $x_i$. In vector form, $x_i$ can be expressed as $\{x\}=\{x_1 \quad x_2 \quad x_3\}^T$.   

The displacement of a point is then defined as

$$
u_i(X_i,t) = \varphi(X_i,t) - X_i = x_i - X_i
$$ 

or alternatively, in spatial form 

$$
 u_i(x_i,t) = x_i - \varphi^{-1}(x_i,t)
$$

where $\varphi^{-1}$ is the *reference map* that reverses the motion of a material point back into the reference, or original, frame. 





## Deformation gradient

In large deformation analysis, the second order tensor deformation gradient, $F_{ij}$, provides the fundamental link between the original and deformed configurations

$$
  F_{ij} = \frac{\partial x_i}{\partial X_j} = 
  \left[\begin{array}{ccc}
    \frac{\partial x_1}{\partial X_1} & \frac{\partial x_1}{\partial X_2} & \frac{\partial x_1}{\partial X_3}\\
    \frac{\partial x_2}{\partial X_1} & \frac{\partial x_2}{\partial X_2} & \frac{\partial x_2}{\partial X_3}\\
    \frac{\partial x_3}{\partial X_1} & \frac{\partial x_3}{\partial X_2} & \frac{\partial x_3}{\partial X_3}
  \end{array} \right]
$$

or alternatively

$$
  F_{ij} = \delta_{ij} + \frac{\partial u_i}{\partial X_j} = 
  \left[\begin{array}{ccc}
    1+\frac{\partial u_1}{\partial X_1} & \frac{\partial u_1}{\partial X_2} & \frac{\partial u_1}{\partial X_3}\\
    \frac{\partial u_2}{\partial X_1} & 1+ \frac{\partial u_2}{\partial X_2} & \frac{\partial u_2}{\partial X_3}\\
    \frac{\partial u_3}{\partial X_1} & \frac{\partial u_3}{\partial X_2} & 1+\frac{\partial u_3}{\partial X_3}
  \end{array} \right]
$$

where $\delta_{ij}$ is the Kronecker delta second order tensor with 

$$\delta_{ij}=1 \quad \text{if} \quad i=j \qquad \text{and} \qquad
  \delta_{ij}=0 \quad \text{if} \quad i\neq j$$

which is the equivalent of an identity matrix in tensor index notation. 

In the material point method it is often more convenient to calculate the deformation gradient based on the spatial frame

$$
  F_{ij} = \left(\frac{\partial \varphi^{-1}(x_i,t)}{\partial x_j} \right)^{-1} = \left( \delta_{ij} - \frac{\partial u_i}{\partial x_j} \right)^{-1}
$$

this is because information on the reference frame is not available on the background mesh after the initial time step.  


## Volume ratio

In finite deformation mechanics the volume ratio

$$ J = \frac{d v}{dV} = \det(F_{ij})$$

defines the change in volume between the current volume, $v$, and original (or reference) volume, $V$.  For physically meaningful deformations the volume ratio must be strictly positive, $J>0$, as a zero or negative volume ration would imply that a material with an initially finite volume had collapsed to something occupying zero volume or inverted into a negative volume, respectively.    


## Stretch and rotation

The deformation gradient can be polar decomposed into 

$$ F_{ij} = R_{ik} U_{kj} = V_{ik} R_{kj}$$

where $R_{ij}$ is an orthogonal rotation tensor and $U_{ij}$ and $V_{ij}$ are the symmetric right and left stretch tensors, which are linked through

$$ V_{ij} = R_{ik} U_{kl} R_{jl} $$

and individually defined as

$$U_{ij} = \sqrt{C_{ij}} = \sqrt{F_{ki}F_{kj}} \qquad \text{and} \qquad 
V_{ij} = \sqrt{b_{ij}} = \sqrt{F_{ik}F_{jk}} $$

where $C_{ij}$ and $b_{ij}$ are the right and left Cauchy-Green strain tensors. Note that the terms *right* and *left* are linked to the location of the non transpose deformation gradient in the above expressions. In tensor notation a transpose is denoted by swapping the order of the indices on the second order tensor, for example from $F_{kj}$ to $F_{jk}$. 

When considering the stress-strain behaviour of materials it is important to only consider the stretch component of the deformation gradient in order to obtain a continuum formulation that is *frame invariant*. A non frame invariant formulation, such as classical small strain elasticity, will predict different results when using different reference frames and spurious results when considering motions/deformations that include a large rotation component. 


## Elasto-plasticity

In order to account for elasto-plastic behaviour, it is assumed that the deformation gradient can be multiplicatively decomposed (Lee decomposition) into elastic and plastic components 

$$F_{ij} = F^{\text{e}}_{ik}F^{\text{p}}_{kj},$$

where the superscripts $\text{e}$ and $\text{p}$ denote the elastic and plastic components. This split allows the definition of right and left elastic Cauchy-Green strain tensors that follow the same format as before, but with $F_{ij}$ replaced by $F^{\text{e}}_{ij}$, that is    

$$
C^{\text{e}}_{ij} = F^{\text{e}}_{ki}F^{\text{e}}_{kj} \qquad \text{and} \qquad 
b^{\text{e}}_{ij} = F^{\text{e}}_{ik}F^{\text{e}}_{jk} 
$$


---
**Next section:** [Stress and strain measures](StressStrain.md) 