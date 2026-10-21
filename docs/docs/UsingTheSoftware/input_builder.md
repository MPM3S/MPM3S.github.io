---
hide:
  - toc
---

# Interactive builder

Build an `input_data.json` file in your browser. Start from a tutorial's file or a blank one, or upload your own (select its STL files with it to see the bodies in the interactive view), then change it in the form: keys that do not apply are hidden, optional keys are switched on with their tick box, and the file on the right updates as you type. You can also click any value in the file and type over it: Enter keeps it, Esc cancels. When the status bar is green, download the file and run it as in [install and run](../GettingStarted/install_and_run.md).

Each key's box is coloured by its status, as on the [reference pages](InputFormat/index.md#how-to-read-these-pages): <span class="ib-legend ib-st-R">required</span> <span class="ib-legend ib-st-C">required in this situation</span> <span class="ib-legend ib-st-O">optional</span>. Click an issue to jump to its key.

[Interactive view](#interactive-view) - click here to see a 3D representation of the simulation.

<link rel="stylesheet" href="../../../stylesheets/input_builder.css">
<link rel="stylesheet" href="../../../stylesheets/run_viewer.css">

<div id="input-builder"></div>

<script src="../../../javascripts/input_builder_templates.js"></script>
<script src="../../../javascripts/input_builder_notes.js"></script>
<script src="../../../javascripts/input_builder.js"></script>
<script type="importmap">{"imports": {"three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
<script type="module" src="../../../javascripts/run_viewer/run_viewer.js"></script>
