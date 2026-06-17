---
hide:
  - toc
---

# Tutorial 1: Self-weight column

## Introduction
This quick start tutorial walks through the steps of running your first AMPSSIE problem.

This tutorial analyses a column deforming under self-weight and solves the static weak-form [equations](../TechnicalReferences/StaticWeakForm.md). It is simple but introduces you to all components of the code: setting up, running and viewing the output data.

This tutorial has three sections:

- [Input setup](#input-setup)
- [Deploying and running the problem](#deploying-and-running-the-problem)
- [Viewing the results](#viewing-the-results)

This tool introduces you to the Generalised Interpolation Material Point Method (GIMPM), and how it is different to methods such as finite element analysis. the GIMPM can be classed as a fictitious domain method, this means that the mesh and boundary conditions do not necessarily align with the material domain, the body that is being modelled by the material points. This enables the GIMPM to avoid distorted mesh issues normally associated with finite elements. 

The GIMPM broadly works in three steps:
![The three steps to a GIMPM solution step.](../../img/GIMP_example.png){ #fig-example-GIMPM width="100%" }

- (a) initial state which loads the material point data on the background mesh
- (b) deforming the mesh and the material points together
- (c) resetting the mesh but not the material points, distorting the body relative to the mesh

This framework means that you have to define the `Mesh`, the discretisation on which the equations are solved, and the `Initial GIMP distribution`, the modelled body that carries all the material and kinematic data. This means that the `Boundary conditions`, such as fixed or rolling nodes are applied to the vertices of the `Mesh`, whereas force loads such as gravity are applied to the material points directly. 

## Input setup

**Problem summary:** The aim is to recover the vertical stress field that develops through a column that deforms vertically and compare the stress solution against the analytical one

$$
\sigma_g = \rho g (L - z_p),
$$

where $g = 9.81$ m/s$^2$ is the acceleration due to gravity, $L = 0.8$ m is the initial height of the domain and $z_p$ is the initial vertical position of the material point (m). The column is $0.4 \times 0.4 \times 0.8$ m (see [](#fig-example-mesh)), made of a homogeneous Hencky elastic material with Young's modulus $E = 10^3$ Pa, Poisson's ratio $\nu = 0$ and density $\rho = 50$ kg/m$^3$. The material domain is filled with a $2\times2\times2$ grid of GIMPs in each element (see [](#fig-example-mesh-gimp)). This is a load-controlled problem so the gravitational load is divided into 20 increments, with each increment applied and then solved with a Newton-Raphson scheme.


To get this information into the code requires the creation of a single JSON object - a human-readable, editable text file. The complete file for this problem can be found [`here`](Tutorial_1_input_data.md) and for all input settings see the [`input_data.json` file format](../UsingTheSoftware/InputFormat.md).

<div class="grid" markdown>

![Compression under self-weight, example of the refinement scheme with hanging nodes.](../../img/example_mesh_ref.png){ #fig-example-mesh width="100%" }

![Compression under self-weight, example of GIMP distribution in the mesh when h = 0.4 m.](../../img/example_mesh_ref_GIMP.png){ #fig-example-mesh-gimp width="100%" }
</div>


<div class="json-side-header">
<div>Description</div>
<div><code>input_data.json</code></div>
</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Mesh data

The mesh matches the $0.4 \times 0.4 \times 0.8$ m column. The element size is defined with `dx refined` which gives the dimensions of the smallest elements.

</div>

<div class="js-code" markdown>

```json
 "Mesh": {
    "domain size x": 0.4,
    "domain size y": 0.4,
    "domain size z": 0.8,
    "dx refined": 0.4,
}
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Initial GIMP distribution

The `Initial GIMP distribution` is set to fill the whole domain and so is given the same parameters as the `Mesh data`. The default initial GIMP distribution is a grid of 8 GIMPs, $2\times2\times2$ within each element, this is set with `number GIMP`.

</div>

<div class="js-code" markdown>

```json
"Initial GIMP distribution": {
    "Initial GIMP distribution x": 0.4,
    "Initial GIMP distribution y": 0.4,
    "Initial GIMP distribution z": 0.8,
    "number GIMP": 2
    }
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Boundary conditions

Rollers are applied on the four side faces and the base ($\pm x$, $\pm y$, $-z$). The top ($+z$) face is left as a free surface. Edges of the domain are by default free so `pos z-plane` does not appear in the file. Every node also has its $x$ and $y$ degrees of freedom fixed to keep the problem one-dimensional, the default is for the degree of freedom to be `free` so $z$ is not set.

</div>

<div class="js-code" markdown>

```json
"Boundary conditions": {
    "neg x-plane": "roller",
    "neg y-plane": "roller",
    "neg z-plane": "roller",
    "pos x-plane": "roller",
    "pos y-plane": "roller",
    "x dof": "fixed",
    "y dof": "fixed"
}
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Material

The column is homogeneous, so a single layer is specified with the Hencky elastic model and the parameters from the Problem description ($E = 10^3$ Pa, $\nu = 0$, $\rho = 50$ kg/m$^3$).

</div>

<div class="js-code" markdown>

```json
"Material": {
    "number of layers": 1,
    "layers": [
        {
            "type": "Elastic",
            "empirical data": "homogeneous elastic",
            "assigned material properties": {"E": 1000.0, "nu": 0.0, "rho": 50.0}
        }
    ]
}
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Solver

The self-weight load is ramped quasi-statically over 20 increments using a Newton-Raphson scheme.

</div>

<div class="js-code" markdown>

```json
"Solver": {
    "solve type": "static",
    "load type": "body force",
    "number of increments": 20
}
```

</div>

</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Output data

VTU and VTK output is enabled for visualisation in [ParaView](https://www.paraview.org/) (or [VisIt](https://visit-dav.github.io/visit-website/)). The `text data` field outputs the vertical stress GIMP data with the deformed and initial height.

</div>

<div class="js-code" markdown>

```json
"Output Data": {
    "vtu data": "yes",
    "vtk data": "yes",
    "text data": "self-weight column"
}
```

</div>

</div>

## Deploying and running the problem

AMPSSIE is written in the [Julia](https://julialang.org/) programming language, and there are two ways to run the code, both explored on the [deployment page](../UsingTheSoftware/DeployingTheSoftware.md). As this is a small problem that runs quickly, this tutorial will use Julia directly; see the [installation guide](../GettingStarted/Installation.md) for instructions on installing Julia and the AMPSSIE library.


<div class="json-side-header">
<div>Deployment instructions</div>
<div><code>terminal</code></div>
</div>

<div class="json-side" markdown>

<div class="js-text" markdown>

### Setting up and running the problem
Once Julia is installed you need download the AMPPSIE package from github, please see the [deployment page](../UsingTheSoftware/DeployingTheSoftware.md) for how to do this. If Julia is installed correctly the following commands will be the same for all OS archectures that Julia is designed for (Windows, Mac OS, Linux).

Julia runs in a terminal window (command line or powershell for windows), therefore first open a terminal window and start Julia with the command `julia`.

Next change directory into the top folder of AMPSSIE


 you must open a terminal window to run Julia and change directory to the . 

Once installed, point Julia at the project directory and run the entry point against the `input_data.json` you set up above.

</div>

<div class="js-code" markdown>

<div class="terminal" markdown>

```console
$ julia
julia> using AMPSSIE
julia> AMPSSIE.run("input_data.json")
✓ loaded input
✓ mesh: 1 element, 8 GIMPs
✓ solving 20 increments
  [1/20]  ‖R‖ = 1.2e-4
  [20/20] ‖R‖ = 8.3e-9
done. output written to results/
```

</div>

</div>

</div>



## Viewing the results

The deformed column under self-weight is shown in [](#fig-gravity-displacement) at load steps 1, 10 and 20 of 20. The vertical displacement reaches its maximum at the top, as expected for a column compressed under its own weight; the stress field through the column can be compared against the analytical solution introduced above to validate the simulation.

![Compression under self-weight: displacement plot of the GIMPs and mesh for steps 1, 10 and 20 of 20.](../../img/gravity_result.png){ #fig-gravity-displacement width="70%" }

*Figure reproduced from [@bird2026implicitoctreebasedadaptivematerial].*