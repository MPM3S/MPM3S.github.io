# Viewing the output

MPM3S writes `.vtu`, `.vtk` and `.csv` files. [ParaView](https://www.paraview.org/) opens the VTU and VTK output, and is the viewer the tutorials use.

--8<-- "terminal_window.md"

## ParaView installation

Download the latest release from [paraview.org/download](https://www.paraview.org/download/). The standard build is all that is needed.

=== "Windows"

    Download the `.msi` installer and run it.

=== "macOS"

    Download the `.dmg`, choosing the Apple silicon or Intel build to match your Mac, then drag ParaView into *Applications*. If macOS refuses to open it, right-click the app and choose *Open*.

=== "Linux"

    Install your distribution's package, for example `sudo apt install paraview` on Debian and Ubuntu, or `sudo dnf install paraview` on Fedora. Alternatively download the `.tar.gz`, unpack it and run `bin/paraview`.
