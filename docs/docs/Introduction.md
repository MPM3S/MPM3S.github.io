---
hide:
  - toc
---

--- 

<div class="two-col" markdown>

<div class="two-col-main" markdown>

## What is MPM3S?

MPM3S is software for the analysis of soil-structure interactions problems using the Material Point Method which was developed at Durham University between 2025 and 2027 as part of the project [Leveraging The Material Point Method For Large Deformation Soil-Structure Interaction To Realise Net Zero](https://ampssie.github.io/). 

The code has its origins in AMPLE ([A Material Point Learning Environment](https://wmcoombs.github.io/AMPLE/)).

To start using the software go to the [Install and Run](GettingStarted/install_and_run.md) page.

## What is the Material Point Method?

The Material Point Method (MPM) is a computational technique for modelling solid mechanics problems (not just soil-structure interaction) with close links to the Finite Element Method. The advantage of the MPM over many other methods is its ability to return solutions for problems involving very large deformations. 

A detailed explanation of the MPM is provided [here](https://ampssie.github.io/docs/TechnicalReferences/TechnicalReference/).

## What are the main features of the software?

- single phase deformable solid material considering large deformation mechanics and elasto-plastic material behaviour
- coupled deformable solid material-rigid body interactions
- implicit solvers for quasi-static and dynamic problems
- automatic mesh generation and evolution with minimal required user intervention
- written in native [Julia](https://julialang.org/) with [Docker](https://www.docker.com/) containers for easy deployment
- unit and validation tests to check correctness and provide user confidence
- JSON ([JavaScript Object Notation](https://www.json.org/json-en.html)) and STL (unstructured triangulated surface rigid body representation) input file formats
- flexible CSV (Comma-Separated Values), VTK (Visualization Toolkit) and VTU (VTK-like, XML-based file supporting compression and parallel processing) output file formats

## What is the software not for?

- problems that could easily be solved with conventional finite element methods
- small strain solid mechanics problems
- analysis of the stresses/deformations *within* a structure interacting with the deformable material

</div>

<div class="two-col-side" markdown>

## Where to go next

<div class="grid cards" markdown>

-   :material-download:{ .lg .middle } __Install and run__

    ---

    Install Julia and MPM3S, and run your first analysis.

    [:octicons-arrow-right-24: Install and run](GettingStarted/install_and_run.md)

-   :material-school:{ .lg .middle } __Tutorial problems__

    ---

    Hands-on walkthroughs of benchmark problems, from simple to complex.

    [:octicons-arrow-right-24: Tutorial problems](TutorialProblems/TutorialProblems.md)

-   :material-file-document-edit:{ .lg .middle } __Using the software__

    ---

    The `input_data.json` format: every key, and how to write a file.

    [:octicons-arrow-right-24: Input format](UsingTheSoftware/InputFormat/index.md)

-   :material-hammer-wrench:{ .lg .middle } __Interactive builder__

    ---

    Build an `input_data.json` file in your browser, starting from a tutorial's file, and check it as you go.

    [:octicons-arrow-right-24: Interactive builder](UsingTheSoftware/input_builder.md)

-   :material-book-open-variant:{ .lg .middle } __Technical reference__

    ---

    The theory and numerical methods behind MPM3S.

    [:octicons-arrow-right-24: Technical reference](TechnicalReferences/TechnicalReference.md)

</div>

</div>

</div>
