"""Copy what the run viewer (run_viewer/run_viewer.js) needs from the other two repos:
  - MPM3SGui's model, derived, joints and playback modules into run_viewer/s3mpm_gui/. The viewer runs
    them unchanged in the browser (Pyodide), so it plays a run exactly as the desktop GUI does;
  - the tutorials' STL meshes into run_viewer/meshes/, so the builder's starting points show their bodies.
Run again whenever either changes:
  python3 make_run_viewer_files.py path/to/MPM3SGui path/to/MPM3S/validation_data_and_jsons
"""
import json, pathlib, re, shutil, sys

MODULES = ["__init__.py", "model.py", "derived.py", "joints.py", "playback.py"]
gui, data = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
here = pathlib.Path(__file__).with_name("run_viewer")

for m in MODULES:
    text = (gui / "s3mpm_gui" / m).read_text()
    (here / "s3mpm_gui" / m).write_text(f"# copied from MPM3SGui/s3mpm_gui/{m} by make_run_viewer_files.py - do not edit\n" + text)

templates = pathlib.Path(__file__).with_name("input_builder_templates.js").read_text()
data_js = json.loads(re.search(r"=\s*(\[.*\]);", templates, re.S).group(1))
stls = sorted({f["stl"] for t in data_js for rb in t["json"].get("rigid bodies", []) for f in rb.get("stl files", [])})
for name in stls:
    shutil.copyfile(data / name, here / "meshes" / name)
print("copied", len(MODULES), "modules and", len(stls), "meshes:", ", ".join(stls))
