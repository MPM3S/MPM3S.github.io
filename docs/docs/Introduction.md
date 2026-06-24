
--- 

## What is AMPSSIE?

AMPSSIE stands for A Material Point Soil Structure Interaction Environment. It is software for the analysis of soil-structure interactions problems using the Material Point Method which was developed at Durham University between 2025 and 2027 as part of the project [Leveraging The Material Point Method For Large Deformation Soil-Structure Interaction To Realise Net Zero](https://ampssie.github.io/). 

AMPSSIE has its origins in AMPLE ([A Material Point Learning Environment](https://wmcoombs.github.io/AMPLE/)).

## What is the Material Point Method?

The Material Point Method (MPM) is a computational technique for modelling solid mechanics problems (not just soil-structure interaction) with close links to the Finite Element Method. The advantage of the MPM over many other methods is its ability to return solutions for problems involving very large deformations. 

## What are the main features of the software?

- single phase deformable solid material considering large deformation mechanics and elasto-plastic material behaviour
- coupled deformable solid material-rigid body interactions
- implicit solvers for quasi-static and dynamic problems
- automatic mesh generation and evolution with minimal required user intervention
- written in native [Julia](https://julialang.org/) with [Docker](https://www.docker.com/) containers for easy deployment
- unit and validation tests to check correctness and provide user confidence
- JSON (JavaScript Object Notation) and STL input file formats
- flexible CSV (Comma-Separated Values), VTK (Visualization Toolkit) and VTU (XML-based files supporting compression and parallel processing) output file formats
