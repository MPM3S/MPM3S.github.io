/* The run viewer on the builder page (docs/UsingTheSoftware/input_builder.md): the desktop GUI's 3D view
 * and play bar (MPM3SGui's Plater tab) for the file being built, opened by the "Interactive view" button.
 *
 * What is drawn and how the run plays are not worked out here. MPM3SGui's model, derived and playback
 * modules run unchanged in the browser (Pyodide), and run_view.py - a port of the GUI's scene_view.py -
 * turns the scene into simple primitives (boxes, lines, quads, markers, the base cells), which this file
 * draws with three.js. The camera is the GUI's viewport.py: turntable orbit about z, pan, zoom toward the
 * cursor, box zoom, fit and the standard views, with the same keys.
 *
 * Nothing loads until the button is pressed: Python and numpy are about 15 MB the first time (cached after).
 * The page's import map gives "three"; make_run_viewer_files.py copies the Python modules and the
 * tutorials' meshes in beside this file.
 */
const HERE = new URL(".", import.meta.url);
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/";
const PY_FILES = ["s3mpm_gui/__init__.py", "s3mpm_gui/model.py", "s3mpm_gui/derived.py", "s3mpm_gui/joints.py",
  "s3mpm_gui/playback.py", "run_view.py"];
const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];
const VIEWS = { iso: [1, -1.6, 1.1], top: [0, -1e-4, 1], bottom: [0, 1e-4, -1], front: [0, -1, 0], rear: [0, 1, 0],
  left: [-1, 0, 0], right: [1, 0, 0] };
const KEY_VIEWS = { 0: "iso", 1: "top", 2: "bottom", 3: "front", 4: "rear", 5: "left", 6: "right" };
const HINT = "Left: rotate · Right: pan · Wheel or +/−: zoom · B: box zoom · F: fit all · 0–6: views · Space: play";
const TOGGLES = [   // the Plater's display toggles: [label, option, tip, value when on, value when off]
  ["X-ray soil", "soil_opacity", "See bodies through the soil", 0.55, 1.0],
  ["Grid", "grid", "Base-cell grid on the soil top"],
  ["BC faces", "bc_faces", "Tint the material-box faces by the viewed stage's BCs"],
  ["Octree", "octree", "The octree cube [0, L]³"],
  ["Track", "track", "The viewed stage's boundary-track window"],
];

let THREE, LineSegments2, LineSegmentsGeometry, LineMaterial;

const el = (tag, attrs, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  }
  e.append(...kids.flat().filter((x) => x != null));
  return e;
};
// colours are lit as they are given, in display RGB, as VTK lights them (start() turns colour management off)
const rgb = (c) => new THREE.Color(c[0], c[1], c[2]);
// the STL files the visitor uploaded, by the mesh name the input gives: with the JSON in the builder (matched
// by file name), or picked for a name in "Add STL" here (any file)
const uploads = () => (window.MPM3S_MESHES = window.MPM3S_MESHES || new Map());
const f32 = (b) => new Float32Array(b.slice().buffer);      // bytes from Python (copied, so aligned)

// ── STL meshes ────────────────────────────────────────────────────────────────────────────────────────
function parseSTL(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  if (u8.length >= 84 && 84 + 50 * dv.getUint32(80, true) === u8.length) {
    const n = dv.getUint32(80, true), pos = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) for (let j = 0; j < 9; j++) pos[i * 9 + j] = dv.getFloat32(84 + i * 50 + 12 + 4 * j, true);
    return pos;
  }
  const v = [], re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g, text = new TextDecoder().decode(u8);
  for (let m; (m = re.exec(text));) v.push(+m[1], +m[2], +m[3]);
  return new Float32Array(v);
}

/* Smooth normals that stay sharp across edges steeper than `deg` (VTK's vtkPolyDataNormals, feature angle 35,
   as the GUI draws an STL). */
function creasedNormals(pos, deg) {
  const nt = pos.length / 9, fn = new Float32Array(nt * 3), out = new Float32Array(pos.length);
  let size = 0;
  for (let i = 0; i < pos.length; i++) size = Math.max(size, Math.abs(pos[i]));
  for (let t = 0; t < nt; t++) {
    const o = t * 9, ax = pos[o + 3] - pos[o], ay = pos[o + 4] - pos[o + 1], az = pos[o + 5] - pos[o + 2];
    const bx = pos[o + 6] - pos[o], by = pos[o + 7] - pos[o + 1], bz = pos[o + 8] - pos[o + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, L = Math.hypot(nx, ny, nz) || 1;
    fn[t * 3] = nx / L; fn[t * 3 + 1] = ny / L; fn[t * 3 + 2] = nz / L;
  }
  const q = (size || 1) * 1e-6, at = new Map();
  for (let c = 0; c < nt * 3; c++) {
    const k = Math.round(pos[c * 3] / q) + "," + Math.round(pos[c * 3 + 1] / q) + "," + Math.round(pos[c * 3 + 2] / q);
    (at.get(k) || at.set(k, []).get(k)).push(c);
  }
  const cos = Math.cos((deg * Math.PI) / 180);
  for (const corners of at.values()) {
    for (const c of corners) {
      const f = Math.floor(c / 3);
      let x = 0, y = 0, z = 0;
      for (const d of corners) {
        const g = Math.floor(d / 3);
        if (fn[f * 3] * fn[g * 3] + fn[f * 3 + 1] * fn[g * 3 + 1] + fn[f * 3 + 2] * fn[g * 3 + 2] >= cos) {
          x += fn[g * 3]; y += fn[g * 3 + 1]; z += fn[g * 3 + 2];
        }
      }
      const L = Math.hypot(x, y, z) || 1;
      out[c * 3] = x / L; out[c * 3 + 1] = y / L; out[c * 3 + 2] = z / L;
    }
  }
  return out;
}

/* A see-through surface in two passes, its far side before everything else see-through and its near side
   after, as the GUI's depth peeling composites them. three.js only sorts whole objects, so the soil's far
   faces would otherwise blend over its near ones and a BC plane behind the soil could land on top of it.
   Every surface is wound outward (run_view.py's quads and cells, boxes, STLs), so its back is its far side. */
function seeThrough(mesh) {
  if (!mesh.material.transparent) return mesh;
  const back = new THREE.Mesh(mesh.geometry, mesh.material.clone()), g = new THREE.Group();
  back.material.onBeforeCompile = mesh.material.onBeforeCompile;          // clone() leaves these behind
  back.material.customProgramCacheKey = mesh.material.customProgramCacheKey;
  back.material.side = THREE.BackSide;
  back.renderOrder = -1;
  mesh.material.side = THREE.FrontSide;
  mesh.renderOrder = 1;                            // the see-through lines (0) go between: under the near side
  return g.add(back, mesh);
}

/* VTK's ambient term: `k` × the surface's own colour (the GUI gives the soil 0.25). An ambient light would
   reach the bodies too, which VTK does not light that way, so the material adds it to its own shader. */
function withAmbient(mat, k) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += ${k.toFixed(3)} * diffuseColor.rgb;`);
  };
  mat.customProgramCacheKey = () => "ambient" + k;
  return mat;
}

// ── the viewer ────────────────────────────────────────────────────────────────────────────────────────
class RunViewer {
  constructor(panel) {
    this.panel = panel;
    this.py = null;                  // Pyodide
    this.view = null;                // run_view.RunView
    this.info = null;                // what the last load said about the scene
    this.stl = new Map();            // mesh name → { geom, pos, src } of every mesh loaded
    this.tried = new Set();          // names already looked for on the site
    this.used = new WeakSet();       // uploaded files already read
    this.frame = null;               // the run's frame shown, null in the editing view
    this.stage = 0;
    this.playing = false;
    this.opts = { soil_opacity: 0.55, grid: true, bc_faces: true, octree: true, track: true };
    this.seq = 0;                    // drops a reload overtaken by a newer one
    this.bounds = [0, 1, 0, 1, 0, 1];
    this.size = 1;
    this.lineMats = new Set();
    this.buildDom();
  }

  // ── the page ──
  buildDom() {
    const tb = (label, tip, fn, cls) => el("button", { class: "rv-btn" + (cls ? " " + cls : ""), type: "button", title: tip, onclick: fn }, label);
    this.stageSel = el("select", { class: "rv-select", title: "The stage whose boundary conditions, track window and body on/off the view shows",
      onchange: () => this.pickStage(+this.stageSel.value) });
    this.boxBtn = tb("Box zoom", "Drag a rectangle in the view to zoom to it (B; Esc cancels)", () => this.setBoxZoom(!this.boxZoom));
    const toggles = TOGGLES.map(([label, key, tip, on, off]) => {
      const b = tb(label, tip, () => {
        this.opts[key] = on === undefined ? !this.opts[key] : (this.opts[key] === on ? off : on);
        b.classList.toggle("rv-on", on === undefined ? this.opts[key] : this.opts[key] === on);
        this.redraw();
      }, "rv-on");
      return b;
    });
    const toolbar = el("div", { class: "rv-toolbar" },
      el("label", { class: "rv-stagepick" }, "View stage ", this.stageSel),
      el("span", { class: "rv-sep" }),
      ["Iso", "Top", "Front", "Right"].map((n, i) => tb(n, `${n} view (${[0, 1, 3, 6][i]})`, () => this.setView(n.toLowerCase()))),
      tb("Fit", "Fit the whole scene (F)", () => this.fit()),
      tb("+", "Zoom in (+)", () => this.zoomStep(1.25)),
      tb("−", "Zoom out (−)", () => this.zoomStep(0.8)),
      this.boxBtn,
      el("span", { class: "rv-sep" }),
      toggles,
      el("span", { class: "rv-sep" }),
      (this.stlBtn = tb("Add STL", "The STL files the input names: pick one to upload a file for it",
        () => this.meshMenu(!this.menuOpen))),
      el("button", { class: "rv-btn rv-close", type: "button", title: "Close the interactive view", onclick: () => this.close() }, "Close"));
    this.menu = el("div", { class: "rv-meshmenu", hidden: true, role: "dialog", "aria-label": "STL files" });
    document.addEventListener("pointerdown", (e) => {
      if (this.menuOpen && !this.menu.contains(e.target) && !this.stlBtn.contains(e.target)) this.meshMenu(false);
    });
    document.addEventListener("keydown", (e) => {     // the page: the builder takes focus off a clicked button
      if (e.key === "Escape" && this.menuOpen) { this.meshMenu(false); this.stlBtn.focus(); }
    });

    this.canvasHost = el("div", { class: "rv-canvas", tabindex: "0" });
    this.overlay = el("div", { class: "rv-overlay" });
    this.legend = el("div", { class: "rv-legend" });
    this.hint = el("div", { class: "rv-hint" }, HINT);
    this.boxEl = el("div", { class: "rv-box" });
    this.loading = el("div", { class: "rv-loading" });
    this.missing = el("div", { class: "rv-missing" });
    this.meshIn = el("input", { type: "file", accept: ".stl", class: "rv-file" });
    this.meshIn.addEventListener("change", () => {
      const f = this.meshIn.files[0];
      this.meshIn.value = "";
      if (!f || !this.meshFor) return;
      uploads().set(this.meshFor, f);              // under the input's name for it, whatever the file is called
      document.dispatchEvent(new CustomEvent("mpm3s-meshes"));
    });
    this.stageEl = el("div", { class: "rv-stage" }, this.canvasHost, this.overlay, this.legend, this.hint, this.boxEl,
      this.missing, this.loading, this.meshIn);

    const pb = (label, tip, fn) => el("button", { class: "rv-btn", type: "button", title: tip, onclick: fn }, label);
    this.playBtn = pb("▶ Play", "Play the run: every stage in order, step by step (Space)", () => this.toggle());
    this.stopBtn = pb("■", "Stop and go back to the editing view", () => this.stop());
    this.slider = el("input", { type: "range", class: "rv-slider", min: 0, max: 0, value: 0,
      title: "Every step of every stage, in the order the solver runs them" });
    this.slider.addEventListener("input", () => { this.pause(); this.seek(+this.slider.value); });
    this.label = el("span", { class: "rv-label" }, "editing view");
    this.speed = el("select", { class: "rv-select", title: "Playback speed (1× plays the whole run in about 20 s)" },
      SPEEDS.map((x) => el("option", { value: x, selected: x === 1 }, `${x}×`)));
    this.loop = el("input", { type: "checkbox", checked: true });
    const bar = el("div", { class: "rv-playbar" }, this.playBtn, this.stopBtn,
      pb("◀", "One step back", () => this.step(-1)), pb("▶", "One step forward", () => this.step(1)),
      this.slider, this.label, this.speed,
      el("label", { class: "rv-loop", title: "Start again from the first stage when the last step is reached" }, this.loop, "Loop"));
    this.infoEl = el("div", { class: "rv-info" });
    this.panel.append(toolbar, this.menu, this.stageEl, bar, this.infoEl);
  }

  setLoading(msg) {
    this.loading.textContent = msg || "";
    this.loading.style.display = msg ? "" : "none";
  }

  // ── start-up: three.js and Python, side by side ──
  async start() {
    this.setLoading("Loading the viewer: three.js, Python and numpy (about 15 MB the first time, cached after)…");
    const three = (async () => {
      [THREE, { LineSegments2 }, { LineSegmentsGeometry }, { LineMaterial }] = await Promise.all([
        import("three"), import("three/addons/lines/LineSegments2.js"),
        import("three/addons/lines/LineSegmentsGeometry.js"), import("three/addons/lines/LineMaterial.js")]);
      THREE.ColorManagement.enabled = false;
      this.initScene();
    })();
    const python = (async () => {
      const { loadPyodide } = await import(PYODIDE + "pyodide.mjs");
      const py = await loadPyodide({ indexURL: PYODIDE });
      await py.loadPackage("numpy");
      py.FS.mkdirTree("/home/pyodide/s3mpm_gui");
      const texts = await Promise.all(PY_FILES.map((f) => fetch(new URL(f, HERE)).then((r) => {
        if (!r.ok) throw new Error(`${f}: ${r.status}`);
        return r.text();
      })));
      PY_FILES.forEach((f, i) => py.FS.writeFile("/home/pyodide/" + f, texts[i]));
      py.runPython("import sys\nif '/home/pyodide' not in sys.path: sys.path.insert(0, '/home/pyodide')\n"
        + "from run_view import RunView\nview = RunView()");
      this.py = py;
      this.view = py.globals.get("view");
    })();
    try {
      await Promise.all([three, python]);
    } catch (e) {
      this.setLoading("The viewer could not load: " + (e && e.message ? e.message : e));
      throw e;
    }
    this.setLoading("");
    this.ready = true;
  }

  call(fn, ...args) {
    const r = this.view[fn](...args);
    if (!r || typeof r.toJs !== "function") return r;
    try { return r.toJs({ dict_converter: Object.fromEntries }); } finally { r.destroy(); }
  }

  // ── three.js ──
  initScene() {
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.LinearSRGBColorSpace;             // no conversion: the colours are display RGB
    r.setClearColor(0x000000, 0);
    r.autoClear = false;
    this.canvasHost.append(r.domElement);
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(30, 1, 0.01, 1000);    // VTK's default 30° view angle
    this.focal = new THREE.Vector3();
    this.cam.up.set(0, 0, 1);
    this.cam.position.set(1, -1.6, 1.1);
    // VTK's headlight, a light at the camera and no other: intensity π, as three.js's diffuse term is colour / π
    this.headlight = new THREE.DirectionalLight(0xffffff, Math.PI);
    this.scene.add(this.cam);
    this.cam.add(this.headlight);
    this.headlight.position.set(0, 0, 0);
    this.headlight.target.position.set(0, 0, -1);
    this.cam.add(this.headlight.target);
    this.groups = {};
    for (const g of ["frame", "soil", "conditions", "markers", "meshes"]) this.scene.add((this.groups[g] = new THREE.Group()));
    this.initAxes();
    this.bindInput();
    new ResizeObserver(() => this.resize()).observe(this.canvasHost);
    this.resize();
  }

  /* The orientation axes in the lower-left corner: a second scene drawn over the first. */
  initAxes() {
    this.axScene = new THREE.Scene();
    this.axCam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    const mk = (dir, color, label) => {
      const m = new THREE.MeshBasicMaterial({ color });
      const g = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12), m);
      shaft.position.y = 0.4;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.25, 16), m);
      tip.position.y = 0.92;
      g.add(shaft, tip);
      g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir));
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const x = c.getContext("2d");
      x.font = "bold 44px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#262626";
      x.fillText(label, 32, 34);
      const tex = new THREE.CanvasTexture(c);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
      s.scale.set(0.42, 0.42, 1);
      s.position.set(...dir.map((v) => v * 1.28));
      this.axScene.add(g, s);
    };
    mk([1, 0, 0], 0xd62728, "X");
    mk([0, 1, 0], 0x2ca02c, "Y");
    mk([0, 0, 1], 0x1f77b4, "Z");
  }

  resize() {
    const w = Math.max(1, this.canvasHost.clientWidth), h = Math.max(1, this.canvasHost.clientHeight);
    this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    for (const m of this.lineMats) m.resolution.set(w, h);
    this.hint.style.display = w < 620 ? "none" : "";
    this.render();
  }

  render() {
    if (this.frameReq) return;
    this.frameReq = requestAnimationFrame(() => {
      this.frameReq = 0;
      const r = this.renderer, W = this.canvasHost.clientWidth, H = this.canvasHost.clientHeight;
      this.look();
      this.clip();
      r.setScissorTest(false);
      r.setViewport(0, 0, W, H);
      r.clear();
      r.render(this.scene, this.cam);
      // the axes: the main camera's direction, from far enough that the labels (1.5 out) stay in the corner
      const d = this.focal.clone().sub(this.cam.position).normalize();
      this.axCam.position.copy(d.multiplyScalar(-6));
      this.axCam.up.copy(this.cam.up);
      this.axCam.lookAt(0, 0, 0);
      const aw = Math.round(0.2 * W), ah = Math.round(0.28 * H), s = Math.min(aw, ah);
      r.setScissorTest(true);
      r.setScissor(0, 0, s, s);
      r.setViewport(0, 0, s, s);
      r.clearDepth();
      r.render(this.axScene, this.axCam);
      r.setScissorTest(false);
    });
  }

  // ── the camera: viewport.py, on a three.js camera with a focal point ──
  look() {
    this.cam.lookAt(this.focal);
    this.cam.updateMatrixWorld();
  }
  dist() { return this.cam.position.distanceTo(this.focal); }
  dop() { return this.focal.clone().sub(this.cam.position).normalize(); }   // direction of projection
  dolly(f) { this.cam.position.copy(this.focal.clone().sub(this.dop().multiplyScalar(this.dist() / f))); }

  /* Near and far planes around everything drawn (VTK's ResetCameraClippingRange): the octree cube too, which
     is often far bigger than the scene fit() frames. */
  clip() {
    const box = this.drawn && !this.drawn.isEmpty() ? this.drawn : null;
    const b = box ? [box.min.x, box.max.x, box.min.y, box.max.y, box.min.z, box.max.z] : this.bounds;
    const pad = 0.1 * this.size, d = this.dop();
    let lo = Infinity, hi = -Infinity;
    for (const x of [b[0] - pad, b[1] + pad]) for (const y of [b[2] - pad, b[3] + pad]) for (const z of [b[4] - pad, b[5] + pad]) {
      const t = new THREE.Vector3(x, y, z).sub(this.cam.position).dot(d);
      lo = Math.min(lo, t); hi = Math.max(hi, t);
    }
    hi = Math.max(hi, 1e-6);
    this.cam.near = Math.max(lo * 0.98, hi * 1e-3);
    this.cam.far = hi * 1.02;
    this.cam.updateProjectionMatrix();
  }

  /* Frame the box: the bounding sphere, then dolly until the 8 corners fill `margin` of the tighter axis. */
  fit(bounds, margin = 0.88) {
    const b = bounds || this.bounds;
    const c = new THREE.Vector3((b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2);
    const rad = 0.5 * Math.hypot(b[1] - b[0], b[3] - b[2], b[5] - b[4]) || 1;
    let angle = (this.cam.fov * Math.PI) / 180;
    if (this.cam.aspect < 1) angle = 2 * Math.atan(Math.tan(angle / 2) * this.cam.aspect);
    const d = this.dop();
    this.focal.copy(c);
    this.cam.position.copy(c.clone().sub(d.multiplyScalar(rad / Math.sin(angle / 2))));
    const corners = [];
    for (const x of b.slice(0, 2)) for (const y of b.slice(2, 4)) for (const z of b.slice(4, 6)) corners.push(new THREE.Vector3(x, y, z));
    for (let i = 0; i < 3; i++) {
      this.look();
      this.clip();
      let ext = 0;
      for (const p of corners) {
        const q = p.clone().project(this.cam);
        ext = Math.max(ext, Math.abs(q.x), Math.abs(q.y));
      }
      if (!(ext > 0)) break;
      this.dolly(margin / ext);
    }
    this.render();
  }

  setView(name) {
    const d = new THREE.Vector3(...VIEWS[name]).normalize();
    this.cam.position.copy(this.focal.clone().add(d.multiplyScalar(this.dist())));
    this.cam.up.set(...(name === "top" || name === "bottom" ? [0, 1, 0] : [0, 0, 1]));
    this.fit();
  }

  orbit(dx, dy) {
    const p = this.cam.position.clone().sub(this.focal), r = p.length();
    const az = Math.atan2(p.y, p.x) - (dx * 0.4 * Math.PI) / 180;
    let el = Math.asin(Math.max(-1, Math.min(1, p.z / r))) + (dy * 0.4 * Math.PI) / 180;
    el = Math.max((-89.5 * Math.PI) / 180, Math.min((89.5 * Math.PI) / 180, el));
    p.set(r * Math.cos(el) * Math.cos(az), r * Math.cos(el) * Math.sin(az), r * Math.sin(el));
    this.cam.position.copy(this.focal.clone().add(p));
    this.cam.up.set(0, 0, 1);
  }

  pan(dx, dy) {
    const h = Math.max(1, this.canvasHost.clientHeight);
    const s = (2 * this.dist() * Math.tan((this.cam.fov * Math.PI) / 360)) / h;
    const fwd = this.dop(), right = fwd.clone().cross(this.cam.up).normalize(), up = right.clone().cross(fwd);
    const d = right.multiplyScalar(-dx * s).add(up.multiplyScalar(dy * s));
    this.focal.add(d);
    this.cam.position.add(d);
  }

  ray(px, py) {
    const rc = new THREE.Raycaster();
    this.look();
    rc.setFromCamera(new THREE.Vector2((px / this.canvasHost.clientWidth) * 2 - 1, -(py / this.canvasHost.clientHeight) * 2 + 1), this.cam);
    return rc;
  }

  rayPlane(px, py, point, normal) {
    const hit = new THREE.Vector3();
    return this.ray(px, py).ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point), hit) ? hit : null;
  }

  /* Zoom by `f`, toward the point under (px, py) when given. */
  zoom(f, px, py) {
    if (px !== undefined) {
      const hit = this.rayPlane(px, py, this.focal, this.dop());
      if (hit) {
        const shift = hit.sub(this.focal).multiplyScalar(1 - 1 / f);
        this.focal.add(shift);
        this.cam.position.add(shift);
      }
    }
    this.dolly(f);
  }

  zoomStep(f) { this.zoom(f); this.render(); }

  setBoxZoom(on) {
    this.boxZoom = on;
    this.boxBtn.classList.toggle("rv-on", on);
    this.canvasHost.style.cursor = on ? "crosshair" : "";
  }

  /* Close in until the rectangle fills the view, its centre at the depth of whatever is drawn there. */
  zoomBox(x0, y0, x1, y1) {
    const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (w < 4 || h < 4) return;
    const pick = this.ray(cx, cy).intersectObjects([this.groups.soil, this.groups.meshes], true)
      .find((x) => x.object.isMesh);
    const hit = pick ? pick.point : this.rayPlane(cx, cy, this.focal, this.dop());
    if (!hit) return;
    const fwd = this.dop(), depth = hit.clone().sub(this.cam.position).dot(fwd);
    if (depth <= 0) return;
    const k = Math.min(this.canvasHost.clientWidth / w, this.canvasHost.clientHeight / h);
    this.focal.copy(hit);
    this.cam.position.copy(hit.clone().sub(fwd.multiplyScalar(depth / k)));
    this.render();
  }

  bindInput() {
    const c = this.canvasHost, ptrs = new Map();
    let mode = null, last = null, press = null, pinch = null;
    const at = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    c.addEventListener("contextmenu", (e) => e.preventDefault());
    c.addEventListener("pointerdown", (e) => {
      c.focus({ preventScroll: true });
      c.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, at(e));
      if (ptrs.size === 2) {                          // two fingers: pinch to zoom, move to pan
        const [a, b] = [...ptrs.values()];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
        mode = "pinch";
        return;
      }
      last = press = at(e);
      mode = e.button === 0 ? (this.boxZoom ? "box" : "orbit") : "pan";
    });
    c.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, at(e));
      if (mode === "pinch" && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        this.pan(m[0] - pinch.m[0], m[1] - pinch.m[1]);
        if (pinch.d > 0 && d > 0) this.zoom(d / pinch.d, m[0], m[1]);
        pinch = { d, m };
        this.render();
        return;
      }
      const p = at(e), dx = p[0] - last[0], dy = p[1] - last[1];
      last = p;
      if (mode === "box") {
        Object.assign(this.boxEl.style, { display: "block", left: Math.min(p[0], press[0]) + "px", top: Math.min(p[1], press[1]) + "px",
          width: Math.abs(p[0] - press[0]) + "px", height: Math.abs(p[1] - press[1]) + "px" });
        return;
      }
      if (mode === "orbit") this.orbit(dx, dy); else if (mode === "pan") this.pan(dx, dy);
      this.render();
    });
    const up = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (mode === "box") {
        const p = at(e);
        this.boxEl.style.display = "none";
        this.setBoxZoom(false);                       // one shot
        this.zoomBox(press[0], press[1], p[0], p[1]);
      }
      if (mode === "pinch" && ptrs.size === 1) { last = [...ptrs.values()][0]; mode = "orbit"; return; }
      if (!ptrs.size) mode = null;
    };
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      const steps = -e.deltaY / (e.deltaMode === 1 ? 3 : e.deltaMode === 2 ? 0.3 : 100);
      const [x, y] = at(e);
      this.zoom(Math.pow(1.15, Math.max(-4, Math.min(4, steps))), x, y);
      this.render();
    }, { passive: false });
    c.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k in KEY_VIEWS) this.setView(KEY_VIEWS[k]);
      else if (k === "f" || k === "F") this.fit();
      else if (k === "+" || k === "=") this.zoomStep(1.25);
      else if (k === "-") this.zoomStep(0.8);
      else if (k === "b" || k === "B") this.setBoxZoom(!this.boxZoom);
      else if (k === "Escape" && this.boxZoom) this.setBoxZoom(false);
      else if (k === " ") this.toggle();
      else return;
      e.preventDefault();
    });
  }

  // ── primitives → three.js objects ──
  lineMaterial(p) {
    if (p.lw >= 1.5) {
      const m = new LineMaterial({ color: rgb(p.color), linewidth: p.lw, transparent: p.opacity < 1, opacity: p.opacity });
      m.resolution.set(this.canvasHost.clientWidth, this.canvasHost.clientHeight);
      this.lineMats.add(m);
      return m;
    }
    return new THREE.LineBasicMaterial({ color: rgb(p.color), transparent: p.opacity < 1, opacity: p.opacity });
  }

  lines(pts, p) {
    if (p.lw >= 1.5) {
      const g = new LineSegmentsGeometry().setPositions(pts);
      return new LineSegments2(g, this.lineMaterial(p));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(g, this.lineMaterial(p));
  }

  /* Surfaces sit a hair behind the lines on them (VTK's coincident-topology offset), so an edge on a face
     is not blended under it. */
  surface(color, opacity, opts) {
    const t = opacity < 1;
    return new THREE.MeshLambertMaterial(Object.assign({ color: rgb(color), transparent: t, opacity, depthWrite: !t,
      side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }, opts || {}));
  }

  make(p) {
    switch (p.t) {
      case "box": {
        const s = [p.hi[0] - p.lo[0], p.hi[1] - p.lo[1], p.hi[2] - p.lo[2]];
        const m = seeThrough(new THREE.Mesh(new THREE.BoxGeometry(...s), withAmbient(this.surface(p.color, p.opacity), 0.25)));
        m.position.set((p.lo[0] + p.hi[0]) / 2, (p.lo[1] + p.hi[1]) / 2, (p.lo[2] + p.hi[2]) / 2);
        return m;
      }
      case "outline": {
        const [a, b] = [p.lo, p.hi], pts = [];
        const c = (i) => [i & 1 ? b[0] : a[0], i & 2 ? b[1] : a[1], i & 4 ? b[2] : a[2]];
        for (const [i, j] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) pts.push(...c(i), ...c(j));
        return this.lines(pts, p);
      }
      case "lines":
        return p.pts.length ? this.lines(p.pts, p) : null;
      case "quad": {
        const g = new THREE.BufferGeometry(), q = p.pts;
        g.setAttribute("position", new THREE.Float32BufferAttribute([...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]], 3));
        return seeThrough(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: rgb(p.color), transparent: true,
          opacity: p.opacity, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1,
          polygonOffsetUnits: 1 })));
      }
      case "sphere": {
        const m = new THREE.Mesh(new THREE.SphereGeometry(p.r, 20, 14), new THREE.MeshLambertMaterial({ color: rgb(p.color) }));
        m.position.set(...p.c);
        return m;
      }
      case "cube": {
        const m = new THREE.Mesh(new THREE.BoxGeometry(2 * p.r, 2 * p.r, 2 * p.r), new THREE.MeshLambertMaterial({ color: rgb(p.color) }));
        m.position.set(...p.c);
        return m;
      }
      case "arrow": {                              // vtkArrowSource: shaft 0.03, tip 0.09 wide and 0.25 long
        const L = Math.hypot(...p.vec), mat = new THREE.MeshLambertMaterial({ color: rgb(p.color) }), g = new THREE.Group();
        if (!L) return null;
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * L, 0.03 * L, 0.75 * L, 16), mat);
        shaft.position.y = 0.375 * L;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09 * L, 0.25 * L, 24), mat);
        tip.position.y = 0.875 * L;
        g.add(shaft, tip);
        g.position.set(...p.start);
        g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...p.vec).normalize());
        return g;
      }
      case "cells": {                              // the base cells of one status, coloured by layer
        const g = new THREE.Group(), geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(f32(p.pos), 3));
        geo.setAttribute("color", new THREE.BufferAttribute(f32(p.col), 3));
        geo.computeVertexNormals();
        const t = p.opacity < 1;
        g.add(seeThrough(new THREE.Mesh(geo, withAmbient(new THREE.MeshLambertMaterial({ vertexColors: true, transparent: t,
          opacity: p.opacity, depthWrite: !t, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1,
          polygonOffsetUnits: 1 }), 0.25))));
        if (p.edges) {
          const eg = new THREE.BufferGeometry();
          eg.setAttribute("position", new THREE.BufferAttribute(f32(p.edges), 3));
          g.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: rgb([0.25, 0.2, 0.15]), transparent: true,
            opacity: Math.min(1, p.opacity + 0.15) })));
        }
        return g;
      }
    }
    return null;
  }

  setGroup(name, prims) {
    const g = this.groups[name];
    for (const o of [...g.children]) {
      g.remove(o);
      o.traverse((x) => {
        if (x.geometry && !x.geometry.userData.keep) x.geometry.dispose();
        if (x.material) { x.material.dispose(); this.lineMats.delete(x.material); }
      });
    }
    for (const p of prims || []) {
      const o = this.make(p);
      if (o) g.add(o);
    }
  }

  /* The bodies: each mesh drawn from the STL it names, placed by its row-major matrix. */
  setMeshes(meshes) {
    this.setGroup("meshes", []);
    for (const m of meshes) {
      const s = this.stl.get(m.name);
      if (!s) continue;
      const t = m.opacity < 1;
      // VTK's specular 0.25, power 30 about the reflected ray is about Blinn-Phong's half vector to the power 120,
      // and three.js scales that peak by 0.25 (120 / 2 + 1)
      const o = seeThrough(new THREE.Mesh(s.geom, new THREE.MeshPhongMaterial({ color: rgb(m.color),
        specular: new THREE.Color(0.0164, 0.0164, 0.0164), shininess: 120, transparent: t, opacity: m.opacity,
        depthWrite: !t, side: THREE.DoubleSide })));
      o.matrixAutoUpdate = false;
      o.matrix.set(...m.m);
      this.groups.meshes.add(o);
    }
  }

  // ── drawing what Python says ──
  apply(out) {
    if (out.full) {
      for (const g of ["frame", "soil", "conditions", "markers"]) this.setGroup(g, out.groups[g]);
      this.setMeshes(out.meshes || []);
      this.bounds = out.bounds;
      this.size = out.size || 1;
      this.legend.replaceChildren(...(out.legend || []).map(([label, c, a]) => el("div", {},
        el("span", { class: "rv-swatch", style: `background: rgba(${c.map((x) => Math.round(255 * x)).join(",")},${a})` }), label)));
      if (out.stage !== undefined && out.stage !== this.stage) {
        this.stage = out.stage;
        this.stageSel.value = String(out.stage);
      }
    } else {
      for (const [g, prims] of Object.entries(out.groups || {})) this.setGroup(g, prims);
      if (out.poses) this.groups.meshes.children.forEach((o, i) => { o.matrix.set(...out.poses[i]); o.matrixWorldNeedsUpdate = true; });
    }
    this.drawn = new THREE.Box3();                   // what clip() keeps between the near and far planes
    for (const g of Object.values(this.groups)) {
      g.updateMatrixWorld(true);
      this.drawn.expandByObject(g);
    }
    this.overlay.replaceChildren(...(out.overlay || []).map(([t, grey]) => el("div", { class: grey ? "rv-note" : "" }, t)));
    if (out.error) this.overlay.append(el("div", { class: "rv-err" }, "Cannot draw this file: " + out.error));
    this.render();
  }

  // ── the scene being built ──
  async load(text, fresh) {
    if (!this.ready) return;
    const seq = ++this.seq;
    let info;
    try { info = this.call("load", text); } catch (e) { info = { ok: false, error: String(e.message || e), stages: [], frames: 0, meshes: [], info: "" }; }
    const bad = await this.takeUploads();
    await this.fetchMeshes(info.meshes);
    if (seq !== this.seq) return;
    this.info = info;
    const want = info.meshes.filter((n) => !this.stl.has(n));
    this.missing.replaceChildren();
    if (want.length) {
      this.missing.append(`Mesh file${want.length > 1 ? "s" : ""} not found: ${want.join(", ")}. `,
        el("button", { class: "rv-btn", type: "button", onclick: () => this.meshMenu(true) }, "Add STL files"));
    }
    this.missing.style.display = want.length ? "" : "none";
    this.stageSel.replaceChildren(...info.stages.map((s, i) => el("option", { value: i }, s)));
    this.stage = Math.min(this.stage, Math.max(0, info.stages.length - 1));
    this.stageSel.value = String(this.stage);
    this.infoEl.textContent = info.ok ? info.info : "";
    this.pause();
    this.frame = null;
    this.idleBar();
    this.redraw();
    if (fresh || !this.fitted) { this.fitted = true; this.setView("iso"); }
    if (bad.length) this.flash(`Not a readable STL: ${bad.join(", ")}`);
    if (this.menuOpen) this.meshMenu(true);
  }

  /* "Add STL": each mesh the input names and what it is drawn from; clicking one uploads a file for it. */
  meshMenu(open) {
    this.menuOpen = open;
    this.stlBtn.classList.toggle("rv-on", open);
    this.menu.hidden = !open;
    if (!open) return;
    const names = this.info ? this.info.meshes : [];
    this.menu.replaceChildren(el("div", { class: "rv-meshhead" }, names.length
      ? "The STL files the input names. Click one to upload a file for it - its own name does not matter."
      : "The input names no STL files: give a rigid body its \"stl files\" in the form first."),
    ...names.map((n) => {
      const s = this.stl.get(n);
      return el("button", { class: "rv-btn rv-meshrow", type: "button", title: `Choose the STL file to use for ${n}`,
        onclick: () => { this.meshFor = n; this.meshIn.click(); } },
      el("span", { class: "rv-meshname" }, n),
      el("span", { class: "rv-meshsrc" + (s ? "" : " rv-miss") }, s ? s.src : "missing"));
    }));
    // under the button, inside the panel
    const b = this.stlBtn;
    this.menu.style.top = b.offsetTop + b.offsetHeight + 4 + "px";
    this.menu.style.left = Math.max(8, Math.min(b.offsetLeft, this.panel.clientWidth - this.menu.offsetWidth - 8)) + "px";
  }

  /* Read each STL the visitor uploaded since the last load; it wins over the tutorials' mesh of that name. */
  async takeUploads() {
    const bad = [];
    for (const [name, file] of uploads()) {
      if (this.used.has(file)) continue;
      this.used.add(file);
      const buf = await file.arrayBuffer().catch(() => null);      // gone or moved since it was picked
      if (!buf || !this.addMesh(name, buf, "uploaded: " + file.name)) {
        bad.push(file.name);
        uploads().delete(name);                    // what was drawn for that name stays
      }
    }
    return bad;
  }

  /* Look for each mesh the file names that was not uploaded on the site (the tutorials' are there). */
  async fetchMeshes(names) {
    await Promise.all(names.filter((n) => !this.stl.has(n) && !this.tried.has(n)).map(async (n) => {
      this.tried.add(n);
      try {
        const r = await fetch(new URL("meshes/" + encodeURIComponent(n), HERE));
        if (r.ok) this.addMesh(n, await r.arrayBuffer(), "tutorial mesh");
      } catch (e) { /* not on the site: the visitor can add it */ }
    }));
  }

  addMesh(name, buf, src) {
    const pos = parseSTL(buf);
    if (!pos.length) return false;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setAttribute("normal", new THREE.BufferAttribute(creasedNormals(pos, 35), 3));
    geom.userData.keep = true;
    const old = this.stl.get(name);
    if (old) old.geom.dispose();
    this.stl.set(name, { geom, pos, src });
    this.view.set_mesh(name, pos);
    return true;
  }

  flash(msg) {
    this.infoEl.textContent = msg;
    this.infoEl.classList.add("rv-flash");
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.infoEl.classList.remove("rv-flash");
      this.infoEl.textContent = this.info && this.info.ok ? this.info.info : "";
    }, 4000);
  }

  redraw() {
    if (!this.ready || !this.info) return;
    const o = this.view.opts;
    for (const [k, v] of Object.entries(this.opts)) o.set(k, v);
    o.destroy();
    try {
      this.apply(this.frame === null ? this.call("draw", this.stage) : this.call("frame", this.frame, true));
    } catch (e) {
      this.apply({ full: true, groups: {}, meshes: [], error: String(e.message || e), bounds: this.bounds });
    }
  }

  pickStage(i) {
    if (this.frame !== null && this.info && this.info.ok) {
      this.pause();
      this.seek(this.call("stage_first", i));
      return;
    }
    this.stage = i;
    this.redraw();
  }

  // ── the play bar (plater.py's PlayBar and play_* methods) ──
  idleBar() {
    this.stopBtn.disabled = true;
    this.slider.max = Math.max(0, (this.info ? this.info.frames : 0) - 1);
    this.slider.value = 0;
    this.label.textContent = "editing view";
  }

  seek(k) {
    if (!this.info || !this.info.ok || !this.info.frames) {
      this.flash("Nothing to play: " + ((this.info && this.info.error) || "the analysis has no stages"));
      return;
    }
    k = Math.max(0, Math.min(k, this.info.frames - 1));
    let out;
    try { out = this.call("frame", k); } catch (e) { this.pause(); this.flash(String(e.message || e)); return; }
    if (out.empty) { this.flash("Nothing to play: " + out.error); return; }
    this.frame = k;
    this.apply(out);
    this.stopBtn.disabled = false;
    this.slider.max = this.info.frames - 1;
    this.slider.value = k;
    this.label.textContent = out.label;
  }

  step(n) {
    this.pause();
    this.seek(this.frame === null ? 0 : this.frame + n);
  }

  toggle() {
    if (this.playing) { this.pause(); return; }
    if (!this.info || this.info.frames < 2) {
      this.flash("Nothing to play: " + ((this.info && this.info.error) || "the analysis has no steps"));
      return;
    }
    if (this.frame === null || this.frame >= this.info.frames - 1) this.seek(0);
    this.playing = true;
    this.playBtn.textContent = "❚❚ Pause";
    this.ahead = 0;
    this.clock = performance.now();
    const tick = (now) => {
      if (!this.playing) return;
      // 1× plays the whole run in about 20 s, but never slower than 15 frames a second
      const n = this.info.frames, rate = Math.max(15, n / 20) * +this.speed.value;
      this.ahead += (rate * Math.min(now - this.clock, 250)) / 1000;
      this.clock = now;
      const k = Math.floor(this.ahead);
      if (k >= 1 && this.frame !== null) {
        this.ahead -= k;
        if (this.frame < n - 1) this.seek(Math.min(this.frame + k, n - 1));     // never skip the last step
        else if (this.loop.checked) this.seek(0);
        else { this.pause(); return; }
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.playBtn.textContent = "▶ Play";
  }

  stop() {
    this.pause();
    if (this.frame !== null) {
      this.frame = null;
      this.redraw();
    }
    this.idleBar();
  }

  close() {
    this.pause();
    this.meshMenu(false);
    this.panel.hidden = true;
  }
}

// ── the button on the builder ─────────────────────────────────────────────────────────────────────────
function init() {
  const root = document.getElementById("input-builder"), toolbar = root && root.querySelector(".ib-toolbar");
  if (!toolbar) return false;
  let viewer = null, starting = null, fresh = false, timer = 0;
  const panel = el("section", { class: "rv-panel", id: "interactive-view", hidden: true, "aria-label": "Interactive view" });
  root.prepend(panel);
  const open = el("button", { class: "ib-btn rv-open", type: "button",
    title: "See the scene in 3D and play the run step by step, as the desktop GUI shows it" }, "Interactive view");
  toolbar.insertBefore(open, toolbar.querySelector(".ib-pastebox"));
  // the builder says when its file changes; `fresh` = a new file was loaded there, so the view is framed again
  const reload = () => {
    const f = fresh;
    fresh = false;
    viewer.load(window.MPM3S_INPUT(), f);
  };
  // new STL files: draw them, framed again as the bodies they add change the scene's extent
  document.addEventListener("mpm3s-meshes", () => {
    fresh = true;
    if (viewer && viewer.ready && !panel.hidden) reload();
  });
  document.addEventListener("mpm3s-input", (e) => {
    fresh = fresh || e.detail.fresh;
    if (!viewer || !viewer.ready || panel.hidden) return;
    clearTimeout(timer);
    timer = setTimeout(reload, e.detail.fresh ? 0 : 250);
  });
  open.addEventListener("click", async () => {
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!viewer) {
      panel.replaceChildren();
      viewer = new RunViewer(panel);
      starting = viewer.start();
    }
    try { await starting; } catch (e) { viewer = null; return; }   // the message stays in the panel; the button tries again
    reload();
    viewer.canvasHost.focus({ preventScroll: true });
  });
  // the page's own "Interactive view" link opens it as the button does
  document.querySelectorAll('a[href="#interactive-view"]').forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    open.click();
  }));
  return true;
}

// a module runs before DOMContentLoaded, when the builder (which builds then) may not be there yet
if (!init()) document.addEventListener("DOMContentLoaded", init, { once: true });
