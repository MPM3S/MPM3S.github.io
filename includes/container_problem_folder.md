- **A problem folder holds everything its problem needs:** the input file and, for each rigid body, its `.stl` and its
  mesh cache (the `_mesh.txt` file named by `"mesh cache"`). The image cannot create a mesh cache, so it must be there.
- **Run from inside the problem folder.** The container sees that folder, and the results are written into it, to the
  folders the input file names in `"vtk directory"` and `"csv directory"`.
- **Keep the paths in the input file relative and inside the problem folder,** so the container can see them.
