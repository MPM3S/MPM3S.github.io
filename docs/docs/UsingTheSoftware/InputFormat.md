
---

## `.json` files

AMPSSIE uses `.json` (files)[https://en.wikipedia.org/wiki/JSON] which contain the details of the analysis in a form readable and editable to you and interpretable by the software. 

It is possible to create your own `.json` file from scratch following the syntax used in the code which is detailed elsewhere however an easier way for selected soil-structure interaction problems is to use AMPSSIE's user interface.

There are six components to the AMPSSIE `.json` file format, each component has their own default settings and mimum requirements.


#### Kinematics: static or dynamic?

The choice here is between an analysis where inertia terms are ignored or accounted for. The latter case is key in problems where velocities are tracked.

#### Computational background mesh

The choice here is ...

#### Physical material: Material point domains



#### Material models

A number of different  material models are available in AMPSSIE

#### Boundary conditions

It is necessary to define sufficient boundary conditions in your model for the problem to be tractable, however if you are using the AMPSSIE user interface problems, the geometries there are set up to include the requisite essential (i.e. displacement) boundary conditions. 

#### Gravity

#### Rigid body information (inc. STL)

#### Deformable-rigid body interactions

#### Time/load step specification

#### Default parameters

#### Output data
