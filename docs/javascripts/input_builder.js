/* The interactive input_data.json builder (docs/UsingTheSoftware/input_builder.md).
 *
 * SCHEMA below describes every key of the input file - its status (R required, O optional,
 * C conditional), kind, allowed values, default and, for conditional keys, when it applies.
 * The form, the validation and the JSON preview are all built from it, so a change to the
 * input format is made here once. The tutorials' input files (input_builder_templates.js)
 * are the starting points.
 */
(function () {
  "use strict";

  // ── the schema ─────────────────────────────────────────────────────────────────────────
  const MP_FIELDS = ["initial position", "position", "displacement", "velocity", "acceleration", "lp",
    "deformation gradient", "stress", "strain", "volume", "initial volume"];
  const RB_FIELDS = ["position", "velocity", "acceleration", "angular velocity", "angular acceleration",
    "mass", "reaction force", "reaction moment"];
  const REF = "../InputFormat/";                       // the reference pages, relative to this page
  const F = (key, kind, o) => Object.assign({ key: key, kind: kind, status: "R" }, o || {});
  const is = (k, ...v) => (o) => v.includes(o[k]);
  const not = (k, ...v) => (o) => !v.includes(o[k]);
  const BC = ["free", "fixed", "prescribed"];

  const STAGE_TRACK = (def) => F(def.side, "obj", { fields: [
    F("type", "selvec", { n: 3, options: ["off", "roller", "fixed"], def: def.type }),
    F("distance", "vec", { n: 3, def: def.distance, unit: "m" }),
    F("advance", "selvec", { n: 3, options: ["positive", "negative", "both"], def: ["positive", "positive", "positive"] }),
    F("remove", "selvec", { n: 3, options: ["yes", "no"], def: def.remove }),
  ] });

  const SCHEMA = [
    F("GPU", "select", { options: ["on", "off"], def: "off", ref: "gpu/",
      help: "\"on\" runs on an NVIDIA GPU, \"off\" on the CPU." }),
    F("domain update", "select", { status: "O", options: ["none", "stretch"], def: "stretch", ref: "material_points/#domain-update",
      help: "Lets the material points' domains stretch with the soil - normal for compression problems. Default \"none\"." }),
    F("domain", "obj", { ref: "domain/", fields: [
      F("gravity", "vec", { n: 3, def: [0.0, 0.0, -9.81], unit: "m/s²", help: "May be zero; it need not point straight down." }),
    ] }),
    F("material points", "obj", { ref: "material_points/", fields: [
      F("extra capacity", "num", { def: 1.2, min: 1, help: "Storage for material points, as a multiple of the initial number; refinement needs headroom." }),
      F("element size", "num", { def: 1.0, gt: 0, unit: "m", help: "The base element size, before rounding to the octree." }),
      F("number of material points per element 1", "int", { def: 2, min: 1, label: "material points per element (per axis)" }),
      F("material size", "obj", { fields: [
        F("min", "vec", { n: 2, status: "O", def: [0.0, 0.0], unit: "m", help: "Ignored: the block always starts at x = y = 0." }),
        F("max", "vec", { n: 2, def: [10.0, 10.0], unit: "m", help: "Plan extent of the soil block." }),
      ] }),
      F("layers", "list", { min: 1, itemName: "layer", help: "From the surface down; the block rests on z = 0.", item: [
        F("thickness", "num", { def: 10.0, gt: 0, unit: "m" }),
        F("material", "obj", { fields: [
          F("type", "select", { options: ["elastic", "von mises", "willam warnke"], def: "elastic" }),
          F("E", "num", { def: 2.0e7, gt: 0, unit: "Pa" }),
          F("nu", "num", { def: 0.25, label: "nu (Poisson's ratio)" }),
          F("yield stress", "num", { status: "C", when: is("type", "von mises"), def: 5.0e4, gt: 0, unit: "Pa" }),
          F("friction angle", "num", { status: "C", when: is("type", "willam warnke"), def: 32.0, unit: "°" }),
          F("dilation angle", "num", { status: "C", when: is("type", "willam warnke"), def: 2.0, unit: "°" }),
          F("cohesion", "num", { status: "C", when: is("type", "willam warnke"), def: 300.0, unit: "Pa" }),
          F("density", "num", { def: 1800.0, gt: 0, unit: "kg/m³", help: "Use the buoyant density for submerged soil." }),
          F("E overburden", "obj", { status: "O", ref: "material_points/#stress-dependent-stiffness",
            help: "Makes the stiffness grow with depth.", fields: [
              F("reference stress", "num", { def: 1.0e5, gt: 0, unit: "Pa" }),
              F("exponent", "num", { def: 0.5 }),
            ] }),
        ] }),
      ] }),
    ] }),
    F("rigid bodies", "list", { min: 0, itemName: "system", ref: "rigid_bodies/",
      help: "Leave empty for an analysis without rigid bodies.", item: [
        F("offset", "vec", { n: 3, status: "O", def: [0.0, 0.0, 0.0], unit: "m", help: "Moves the whole system after it is assembled." }),
        F("points", "list", { min: 1, itemName: "point", ref: "rigid_bodies/#points", item: [
          F("position", "vec", { n: 3, def: [0.0, 0.0, 0.0], unit: "m" }),
          F("mass", "num", { def: 1000.0, gt: 0, unit: "kg" }),
          F("rotational inertia", "vec", { n: 3, def: [1.0, 1.0, 1.0], unit: "kg·m²" }),
          F("boundary conditions", "bc6", { def: ["free", "free", "free", "free", "free", "free"] }),
        ] }),
        F("constraints", "list", { status: "O", min: 0, itemName: "constraint", ref: "rigid_bodies/#how-the-constraints-work", item: [
          F("type", "select", { options: ["coincidence", "rotation lock", "distance lock", "distance stop"], def: "rotation lock" }),
          F("points", "ivec", { n: 2, def: [1, 2], help: "The two points joined, numbered within this system." }),
          F("rotation centre", "vec", { n: 3, status: "C", when: is("type", "rotation lock", "distance stop"), def: [0.0, 0.0, 0.0], unit: "m" }),
          F("position 1", "vec", { n: 3, status: "C", when: not("type", "rotation lock"), def: [0.0, 0.0, 0.0], unit: "m" }),
          F("position 2", "vec", { n: 3, status: "C", when: not("type", "rotation lock"), def: [0.0, 0.0, 0.0], unit: "m" }),
          F("direction 1", "vec", { n: 3, status: "C", when: is("type", "rotation lock"), def: [0.0, 1.0, 0.0] }),
          F("direction 2", "vec", { n: 3, status: "C", when: is("type", "rotation lock"), def: [0.0, 1.0, 0.0] }),
          F("distance", "num", { status: "C", when: is("type", "distance lock"), def: 1.0, gt: 0, unit: "m" }),
          F("angle limit", "num", { status: "C", when: is("type", "distance stop"), def: 35.0, unit: "°" }),
          F("stiffness", "num", { def: 1.0e9, gt: 0, unit: "N/m" }),
          F("rotational stiffness", "num", { status: "C", when: is("type", "rotation lock"), def: 1.0e8, gt: 0, unit: "N·m" }),
        ] }),
        F("stl files", "list", { status: "O", min: 0, itemName: "surface", ref: "rigid_bodies/#stl-files", item: [
          F("name", "text", { status: "O", def: "body", help: "A label for your own reference; never read." }),
          F("stl", "text", { def: "body.stl", help: "Relative to the input file." }),
          F("mesh cache", "text", { def: "body_mesh.txt", help: "Written if missing; delete it when the STL changes." }),
          F("point", "int", { def: 1, min: 1 }),
        ] }),
        F("tracked nodes", "list", { status: "O", min: 0, itemName: "tracked node", ref: "rigid_bodies/#tracked-nodes", item: [
          F("position", "vec", { n: 3, def: [0.0, 0.0, 0.0], unit: "m" }),
          F("point", "int", { def: 1, min: 1 }),
        ] }),
      ] }),
    F("contact", "obj", { ref: "contact/", fields: [
      F("friction coefficient", "num", { def: 0.0, min: 0, help: "Needed even with no rigid bodies." }),
    ] }),
    F("analysis", "list", { min: 1, itemName: "stage", ref: "analysis/", help: "The stages, run in order.", item: [
      F("type", "select", { options: ["static", "dynamic"], def: "static" }),
      F("load steps", "int", { status: "C", when: is("type", "static"), def: 10, min: 1 }),
      F("load", "select", { status: "C", when: is("type", "static"), options: ["gravity ramp", "full"], def: "gravity ramp" }),
      F("dt", "num", { status: "C", when: is("type", "dynamic"), def: 0.005, gt: 0, unit: "s" }),
      F("final time", "num", { status: "C", when: is("type", "dynamic"), def: 1.0, gt: 0, unit: "s" }),
      F("beta", "num", { status: "C", when: is("type", "dynamic"), def: 0.5 }),
      F("gamma", "num", { status: "C", when: is("type", "dynamic"), def: 1.0 }),
      F("rigid bodies", "select", { options: ["on", "off"], def: "off" }),
      F("rigid body surface placement", "select", { status: "O", options: ["on", "off"], def: "on",
        help: "Moves the bodies vertically at the start of the stage so they rest on the soil. Default \"off\"." }),
      F("adaptivity", "obj", { status: "O", ref: "analysis/#adaptivity", fields: [
        F("type", "select", { options: ["none", "uniform", "rigid body surface"], def: "none" }),
        F("element size", "num", { status: "C", when: is("type", "rigid body surface"), def: 0.1, gt: 0, unit: "m" }),
        F("region", "num", { status: "O", when: is("type", "rigid body surface"), def: 0.06, gt: 0, unit: "m" }),
        F("element size in region", "num", { status: "O", when: is("type", "rigid body surface"), def: 0.1, gt: 0, unit: "m" }),
      ] }),
      F("rigid body boundary conditions", "list", { status: "O", min: 0, itemName: "point", ref: "analysis/#rigid-body-boundary-conditions",
        help: "Replaces a point's boundary conditions for this stage only.", item: [
          F("system", "int", { def: 1, min: 1 }),
          F("point", "int", { def: 1, min: 1 }),
          F("boundary conditions", "bc6", { def: ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }),
        ] }),
      F("boundary conditions", "obj", { status: "O", ref: "analysis/#boundary-conditions", help: "Default: every face free.", fields: [
        F("min", "selvec", { n: 3, options: ["free", "roller", "fixed"], def: ["roller", "roller", "fixed"], help: "The faces at x = 0, y = 0, z = 0." }),
        F("max", "selvec", { n: 3, options: ["free", "roller", "fixed"], def: ["roller", "roller", "free"], help: "The opposite faces." }),
      ] }),
      F("boundary track", "obj", { status: "O", ref: "analysis/#boundary-track", help: "Domain boundaries that move with the rigid bodies.", fields: [
        STAGE_TRACK({ side: "min", type: ["fixed", "off", "off"], distance: [0.5, 0.0, 0.0], remove: ["yes", "no", "no"] }),
        STAGE_TRACK({ side: "max", type: ["fixed", "off", "off"], distance: [2.5, 0.0, 0.0], remove: ["no", "no", "no"] }),
      ] }),
    ] }),
    F("solver", "obj", { ref: "solver/", fields: [
      F("tolerance", "num", { def: 1.0e-6, gt: 0 }),
      F("max newton iterations", "int", { def: 20, min: 1 }),
      F("max linear iterations", "int", { status: "O", def: 100, min: 1 }),
      F("poor factor", "num", { def: 0.25, min: 0 }),
      F("ghost factor", "num", { def: 0.025, min: 0 }),
      F("ghost factor mass", "num", { def: 0.25, min: 0 }),
    ] }),
    F("output", "obj", { ref: "output/", fields: [
      F("vtk", "select", { options: ["on", "off"], def: "on" }),
      F("vtk directory", "text", { status: "C", when: is("vtk", "on"), def: "vtk" }),
      F("vtk percent", "num", { status: "C", when: is("vtk", "on"), def: 1.0, min: 0, help: "% of each stage's steps; 0 writes every step." }),
      F("vtk material point fields", "fields", { status: "O", options: MP_FIELDS, help: "Leaving the key out writes every field." }),
      F("vtk rigid body fields", "fields", { status: "O", options: RB_FIELDS }),
      F("csv", "select", { options: ["on", "off"], def: "on" }),
      F("csv directory", "text", { status: "C", when: is("csv", "on"), def: "csv" }),
      F("csv percent", "num", { status: "C", when: is("csv", "on"), def: 1.0, min: 0, help: "% of each stage's steps; 0 writes every step." }),
      F("csv material point fields", "fields", { status: "O", options: MP_FIELDS }),
      F("csv rigid body fields", "fields", { status: "O", options: RB_FIELDS }),
    ] }),
  ];
  const REMOVED = { "size": "\"domain\" \"size\" was removed from MPM3S; the background mesh is sized from the soil." };

  // ── defaults and conditional keys ──────────────────────────────────────────────────────
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const applies = (f, obj) => !f.when || f.when(obj);
  function defaultFor(f) {
    if (f.kind === "obj") return makeObject(f.fields);
    if (f.kind === "list") return f.min > 0 ? Array.from({ length: f.min }, () => makeObject(f.item)) : [];
    if (f.kind === "fields") return f.options.slice();
    return clone(f.def);
  }
  function makeObject(fields) {
    const o = {};
    for (let pass = 0; pass < 2; pass++)          // twice, so conditional keys see their drivers
      for (const f of fields)
        if (f.status !== "O" && applies(f, o) && o[f.key] === undefined) o[f.key] = defaultFor(f);
    return o;
  }
  // after a driver (e.g. a "type") changes: drop keys that no longer apply, add the newly required ones
  function refresh(obj, fields) {
    for (const f of fields) {
      if (!applies(f, obj)) delete obj[f.key];
      else if (f.status !== "O" && obj[f.key] === undefined) obj[f.key] = defaultFor(f);
    }
  }

  // ── validation ─────────────────────────────────────────────────────────────────────────
  function validate(root) {
    const issues = [];
    const add = (level, path, msg) => issues.push({ level: level, path: path, msg: msg });
    const isNum = (v) => typeof v === "number" && isFinite(v);
    function checkValue(f, v, path) {
      const num = (x, p) => {
        if (!isNum(x)) return add("error", p, "must be a number");
        if (f.kind === "int" || f.kind === "ivec") { if (!Number.isInteger(x)) add("error", p, "must be a whole number"); }
        if (f.gt !== undefined && !(x > f.gt)) add("error", p, `must be greater than ${f.gt}`);
        if (f.min !== undefined && x < f.min) add("error", p, `must be at least ${f.min}`);
      };
      switch (f.kind) {
        case "select": if (!f.options.includes(v)) add("error", path, `must be one of ${f.options.map((o) => `"${o}"`).join(", ")}`); break;
        case "num": case "int": num(v, path); break;
        case "text": if (typeof v !== "string" || !v) add("error", path, "must be a non-empty string"); break;
        case "vec": case "ivec":
          if (!Array.isArray(v) || v.length !== f.n) add("error", path, `must be a list of ${f.n} numbers`);
          else v.forEach((x, i) => num(x, path.concat(i)));
          break;
        case "selvec":
          if (!Array.isArray(v) || v.length !== f.n) add("error", path, `must be a list of ${f.n} entries`);
          else v.forEach((x, i) => { if (!f.options.includes(x)) add("error", path.concat(i), `must be one of ${f.options.map((o) => `"${o}"`).join(", ")}`); });
          break;
        case "bc6":
          if (!Array.isArray(v) || v.length !== 6) add("error", path, "must be a list of 6 entries");
          else v.forEach((x, i) => {
            if (x === "free" || x === "fixed") return;
            if (x && typeof x === "object" && isNum(x.prescribed)) return;
            add("error", path.concat(i), "must be \"free\", \"fixed\" or {\"prescribed\": number}");
          });
          break;
        case "fields":
          if (!Array.isArray(v)) add("error", path, "must be a list of field names");
          else v.forEach((x) => { if (!f.options.includes(x)) add("warn", path, `"${x}" is not a known field name`); });
          break;
        case "obj":
          if (!v || typeof v !== "object" || Array.isArray(v)) add("error", path, "must be an object { ... }");
          else checkObject(v, f.fields, path);
          break;
        case "list":
          if (!Array.isArray(v)) add("error", path, "must be a list [ ... ]");
          else {
            if (v.length < f.min) add("error", path, `needs at least ${f.min} ${f.itemName}`);
            v.forEach((x, i) => checkObject(x, f.item, path.concat(i)));
          }
          break;
      }
    }
    function checkObject(o, fields, path) {
      if (!o || typeof o !== "object") return add("error", path, "must be an object { ... }");
      const known = new Set(fields.map((f) => f.key));
      for (const f of fields) {
        const p = path.concat(f.key), v = o[f.key];
        if (v === undefined) {
          if (f.status !== "O" && applies(f, o)) add("error", p, "is missing (required)");
          continue;
        }
        if (!applies(f, o)) { add("warn", p, "does not apply here, so MPM3S ignores it"); continue; }
        checkValue(f, v, p);
      }
      for (const k of Object.keys(o)) if (!known.has(k))
        add("warn", path.concat(k), REMOVED[k] || "is not a key MPM3S knows - check the spelling; it is ignored");
    }
    checkObject(root, SCHEMA, []);

    // rules across keys (each guarded: a broken file may have anything in these places)
    const arr = (x) => (Array.isArray(x) ? x : []);
    for (const [i, st] of arr(root.analysis).entries()) {
      const a = st && st.adaptivity;
      if (a && typeof a === "object" && ("region" in a) !== ("element size in region" in a))
        add("error", ["analysis", i, "adaptivity"], "give both \"region\" and \"element size in region\", or neither");
      for (const [j, r] of arr(st && st["rigid body boundary conditions"]).entries()) {
        if (!r || typeof r !== "object") continue;
        const sys = arr(root["rigid bodies"])[r.system - 1];
        if (!sys) add("error", ["analysis", i, "rigid body boundary conditions", j, "system"], `there is no rigid-body system ${r.system}`);
        else if (!arr(sys.points)[r.point - 1]) add("error", ["analysis", i, "rigid body boundary conditions", j, "point"], `system ${r.system} has no point ${r.point}`);
      }
    }
    for (const [s, sys] of arr(root["rigid bodies"]).entries()) {
      const n = arr(sys && sys.points).length;
      for (const [k, key] of [["constraints", "points"], ["stl files", "point"], ["tracked nodes", "point"]]) {
        for (const [j, item] of arr(sys && sys[k]).entries()) {
          if (!item || typeof item !== "object") continue;
          const pts = [].concat(item[key]);
          if (pts.some((p) => Number.isInteger(p) && (p < 1 || p > n)))
            add("error", ["rigid bodies", s, k, j, key], `refers to a point this system does not have (it has ${n})`);
        }
      }
    }
    return issues;
  }

  // ── the JSON text, laid out like the tutorial files ────────────────────────────────────
  // The schema says which numbers are decimals ("num", "vec": always printed with a point,
  // as the tutorial files are) and which are whole numbers ("int", "ivec").
  const FLOAT_KINDS = new Set(["num", "vec"]);
  function fmtNum(x, isFloat) {
    if (typeof x !== "number" || !isFinite(x)) return JSON.stringify(x);
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e6 || a < 1e-3)) {
      let [m, e] = x.toExponential().split("e");
      if (!m.includes(".")) m += ".0";
      return m + "e" + Number(e);
    }
    return isFloat && Number.isInteger(x) ? x.toFixed(1) : String(x);
  }
  const prim = (v) => v === null || typeof v !== "object";
  const subSpec = (spec, key) => (spec && spec.fields ? spec.fields.find((f) => f.key === key) || null : null);
  const itemSpec = (spec) => (spec && spec.kind === "list" ? { fields: spec.item } : null);
  function inline(v, spec) {
    if (prim(v)) return typeof v === "number" ? fmtNum(v, !!(spec && FLOAT_KINDS.has(spec.kind))) : JSON.stringify(v);
    if (Array.isArray(v)) {
      if (spec && spec.kind === "bc6")
        return "[" + v.map((x) => (x && typeof x === "object" ? inline(x, { fields: [F("prescribed", "num")] }) : inline(x, null))).join(", ") + "]";
      return "[" + v.map((x) => inline(x, prim(x) ? spec : itemSpec(spec))).join(", ") + "]";
    }
    const ks = Object.keys(v);
    return ks.length ? "{ " + ks.map((k) => JSON.stringify(k) + ": " + inline(v[k], subSpec(spec, k))).join(", ") + " }" : "{}";
  }
  function ordered(v, spec) {                     // schema order first, then any unknown keys
    const fields = spec && spec.fields;
    if (!fields || !v || typeof v !== "object" || Array.isArray(v)) return v;
    const out = {};
    for (const f of fields) if (f.key in v) out[f.key] = v[f.key];
    for (const k of Object.keys(v)) if (!(k in out)) out[k] = v[k];
    return out;
  }
  function fmt(v, spec, ind, force) {
    if (prim(v)) return inline(v, spec);
    if (Array.isArray(v)) {
      if (v.every(prim) || (spec && spec.kind === "bc6")) return inline(v, spec);
      if (!v.length) return "[]";
      const is = itemSpec(spec);
      return "[\n" + v.map((x) => ind + "    " + fmt(ordered(x, is), is, ind + "    ", false)).join(",\n") + "\n" + ind + "]";
    }
    const o = ordered(v, spec);
    const one = inline(o, spec);
    const hasLists = Object.values(o).some((x) => Array.isArray(x) && x.some((y) => !prim(y)));
    if (!force && !hasLists && one.length + ind.length <= 72) return one;
    return "{\n" + Object.keys(o).map((k) => ind + "    " + JSON.stringify(k) + ": " + fmt(o[k], subSpec(spec, k), ind + "    ", false)).join(",\n") + "\n" + ind + "}";
  }
  function toSections(root) {
    const spec = { fields: SCHEMA };
    const o = ordered(root, spec);
    return Object.keys(o).map((k) => {
      const f = subSpec(spec, k);
      return { key: k, text: "    " + JSON.stringify(k) + ": " + fmt(o[k], f, "    ", !!(f && f.kind === "obj")) };
    });
  }
  const toText = (root) => "{\n" + toSections(root).map((x) => x.text).join(",\n\n") + "\n}\n";

  // ── the form ───────────────────────────────────────────────────────────────────────────
  let state = null;
  const openSet = new Set(["GPU", "domain", "material points", "analysis"]);
  const el = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null) e.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined) e.append(kid.nodeType ? kid : String(kid));
    return e;
  };
  const pathId = (path) => "ib-" + path.join("--").replace(/[^A-Za-z0-9_-]/g, "_");
  const AXES = ["x", "y", "z"];
  const BC_LABELS = ["uₓ", "u_y", "u_z", "θₓ", "θ_y", "θ_z"];

  function numberInput(get, set, path, isInt) {
    const v = get();
    const inp = el("input", { type: "text", inputmode: "decimal", class: "ib-num", id: pathId(path),
      value: typeof v === "number" ? fmtNum(v, !isInt) : (v === undefined ? "" : String(v)) });
    inp.addEventListener("input", () => {
      const t = inp.value.trim(), x = Number(t);
      const ok = t !== "" && isFinite(x) && (!isInt || Number.isInteger(x));
      inp.classList.toggle("ib-bad", !ok);
      set(ok ? x : t);
      update();
    });
    return inp;
  }
  function selectInput(options, get, set, path, structural) {
    const v = get();
    const s = el("select", { id: pathId(path), class: "ib-select" },
      v === undefined || !options.includes(v) ? el("option", { value: "" }, v === undefined ? "- choose -" : String(v)) : null,
      options.map((o) => el("option", { value: o }, o)));
    s.value = v === undefined || !options.includes(v) ? "" : v;
    s.addEventListener("change", () => { set(s.value); structural ? render() : update(); });
    return s;
  }

  // a key whose value has the wrong shape: show what the file has, and offer the default
  function mismatch(f, obj, path, what) {
    return el("span", { class: "ib-mismatch", id: pathId(path) },
      "The file has ", el("code", {}, inline(obj[f.key], null)), ` - ${what}. `,
      el("button", { class: "ib-btn ib-small", type: "button", onclick: () => { obj[f.key] = defaultFor(f); render(); } }, "Replace with the default"));
  }
  // a required key that is missing: offer to add it, rather than adding it silently
  function addMissing(f, obj, path) {
    return el("span", { class: "ib-mismatch", id: pathId(path) }, "Missing. ",
      el("button", { class: "ib-btn ib-small", type: "button", onclick: () => { obj[f.key] = defaultFor(f); render(); } }, "Add it"));
  }
  const SHAPE = { vec: (f) => `a list of ${f.n} numbers`, ivec: (f) => `a list of ${f.n} whole numbers`,
    selvec: (f) => `a list of ${f.n} entries`, bc6: () => "a list of 6 entries", fields: () => "a list of field names" };

  function control(f, obj, path) {
    const get = () => obj[f.key], set = (x) => { obj[f.key] = x; };
    if (SHAPE[f.kind]) {
      const v = obj[f.key], n = f.kind === "bc6" ? 6 : f.n;
      if (v === undefined) return addMissing(f, obj, path);
      if (!Array.isArray(v) || (n !== undefined && v.length !== n)) return mismatch(f, obj, path, `it should be ${SHAPE[f.kind](f)}`);
    }
    switch (f.kind) {
      case "select": return selectInput(f.options, get, (x) => { set(x); refresh(obj, siblingsOf(path)); }, path, true);
      case "num": return numberInput(get, set, path, false);
      case "int": return numberInput(get, set, path, true);
      case "text": {
        const inp = el("input", { type: "text", class: "ib-text", id: pathId(path), value: get() === undefined ? "" : get() });
        inp.addEventListener("input", () => { set(inp.value); update(); });
        return inp;
      }
      case "vec": case "ivec": {
        const arr = obj[f.key];
        return el("span", { class: "ib-vec" }, Array.from({ length: f.n }, (_, i) =>
          el("label", { class: "ib-comp" }, el("span", {}, f.n === 2 && f.kind === "ivec" ? (i ? "b" : "a") : AXES[i]),
            numberInput(() => arr[i], (x) => { arr[i] = x; }, path.concat(i), f.kind === "ivec"))));
      }
      case "selvec": {
        const arr = obj[f.key];
        return el("span", { class: "ib-vec" }, Array.from({ length: f.n }, (_, i) =>
          el("label", { class: "ib-comp" }, el("span", {}, AXES[i]),
            selectInput(f.options, () => arr[i], (x) => { arr[i] = x; }, path.concat(i), false))));
      }
      case "bc6": {
        const arr = obj[f.key];
        return el("span", { class: "ib-vec ib-bc" }, Array.from({ length: 6 }, (_, i) => {
          const isP = arr[i] && typeof arr[i] === "object";
          const box = el("label", { class: "ib-comp" }, el("span", {}, BC_LABELS[i]),
            selectInput(BC, () => (isP ? "prescribed" : arr[i]), (x) => { arr[i] = x === "prescribed" ? { prescribed: 0.0 } : x; }, path.concat(i), true));
          if (isP) box.append(numberInput(() => arr[i].prescribed, (x) => { arr[i].prescribed = x; }, path.concat(i, "q"), false));
          return box;
        }));
      }
      case "fields": {
        const arr = obj[f.key];
        return el("span", { class: "ib-fields" }, f.options.map((name) => {
          const cb = el("input", { type: "checkbox" });
          cb.checked = arr.includes(name);
          cb.addEventListener("change", () => {
            const i = arr.indexOf(name);
            if (cb.checked && i < 0) arr.push(name); else if (!cb.checked && i >= 0) arr.splice(i, 1);
            arr.sort((a, b) => f.options.indexOf(a) - f.options.indexOf(b));
            update();
          });
          return el("label", { class: "ib-chip" }, cb, name);
        }));
      }
    }
    return null;
  }

  // the field list a path's parent object follows, so a driver change can refresh its siblings
  function fieldsAt(path) {
    let fields = SCHEMA;
    for (const step of path) {
      if (typeof step === "number") continue;
      const f = fields.find((x) => x.key === step);
      if (!f) return [];
      fields = f.kind === "obj" ? f.fields : f.kind === "list" ? f.item : [];
    }
    return fields;
  }
  const siblingsOf = (path) => fieldsAt(path.slice(0, -1));

  function helpBits(f) {
    const bits = [];
    if (f.unit) bits.push(el("span", { class: "ib-unit" }, f.unit));
    if (f.help) bits.push(el("span", { class: "ib-help" }, f.help));
    if (f.ref) bits.push(el("a", { class: "ib-ref", href: REF + f.ref, target: "_blank", rel: "noopener" }, "reference ↗"));
    return bits;
  }

  function tagTop(node, key, handle) {
    node.dataset.top = key;
    if (handle) handle.addEventListener("click", () => markActive(key, true));
    node.addEventListener("focusin", () => { if (activeKey !== key) markActive(key, true); });
  }
  function renderFields(fields, obj, path, host) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      host.append(el("span", { class: "ib-mismatch" }, "The file has ", el("code", {}, inline(obj, null)), " here - it should be an object { ... }."));
      return;
    }
    for (const f of fields) {
      if (!applies(f, obj)) continue;
      const p = path.concat(f.key), present = obj[f.key] !== undefined;
      const st = f.status === "R" && f.when ? "C" : f.status;          // the box colour: required, conditional or optional
      const label = el("span", { class: "ib-key", title: { R: "required", C: "required in this situation", O: "optional" }[st] }, f.label || f.key);
      let toggle = null;
      if (f.status === "O") {
        toggle = el("input", { type: "checkbox", class: "ib-toggle", title: "include this optional key" });
        toggle.checked = present;
        toggle.addEventListener("change", () => {
          if (toggle.checked) { obj[f.key] = defaultFor(f); if (f.kind === "list" && f.min === 0) obj[f.key] = [makeObject(f.item)]; openSet.add(p.join(".")); }
          else delete obj[f.key];
          render();
        });
      }
      if (f.kind === "obj" || f.kind === "list") {
        const box = el("details", { class: "ib-group ib-st-" + st, id: pathId(p) });
        box.open = openSet.has(p.join(".")) || path.length > 0;
        box.addEventListener("toggle", () => (box.open ? openSet.add(p.join(".")) : openSet.delete(p.join("."))));
        const summary = el("summary", {}, toggle, label,
          f.kind === "list" && present && Array.isArray(obj[f.key]) ? el("span", { class: "ib-count" }, ` (${obj[f.key].length})`) : null);
        box.append(summary);
        const meta = helpBits(f);
        if (meta.length) box.append(el("div", { class: "ib-meta" }, meta));
        if (!present) {
          if (f.status !== "O") box.append(el("button", { class: "ib-btn", type: "button", onclick: () => { obj[f.key] = defaultFor(f); render(); } }, `Add "${f.key}"`));
        } else if (f.kind === "obj" && (typeof obj[f.key] !== "object" || obj[f.key] === null || Array.isArray(obj[f.key]))) {
          box.append(mismatch(f, obj, p.concat("value"), "it should be an object { ... }"));
        } else if (f.kind === "list" && !Array.isArray(obj[f.key])) {
          box.append(mismatch(f, obj, p.concat("value"), "it should be a list [ ... ]"));
        } else if (f.kind === "obj") {
          renderFields(f.fields, obj[f.key], p, box);
        } else {
          const list = obj[f.key];
          list.forEach((item, i) => {
            const card = el("div", { class: "ib-item", id: pathId(p.concat(i)) },
              el("div", { class: "ib-item-head" }, el("strong", {}, `${f.itemName} ${i + 1}`),
                el("span", { class: "ib-item-btns" },
                  i > 0 ? el("button", { class: "ib-btn ib-small", type: "button", title: "move up", onclick: () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; render(); } }, "↑") : null,
                  el("button", { class: "ib-btn ib-small", type: "button", title: "duplicate", onclick: () => { list.splice(i + 1, 0, clone(item)); render(); } }, "⧉"),
                  list.length > f.min ? el("button", { class: "ib-btn ib-small ib-remove", type: "button", title: "remove", onclick: () => { list.splice(i, 1); render(); } }, "✕") : null)));
            renderFields(f.item, item, p.concat(i), card);
            box.append(card);
          });
          box.append(el("button", { class: "ib-btn", type: "button", onclick: () => { list.push(makeObject(f.item)); render(); } }, `+ Add ${f.itemName}`));
        }
        if (!path.length) tagTop(box, f.key, box.querySelector("summary"));
        host.append(box);
      } else {
        const row = el("div", { class: "ib-row ib-st-" + st + (present || f.status !== "O" ? "" : " ib-off") },
          el("label", { class: "ib-label" }, toggle, label),
          el("div", { class: "ib-control" }, present || f.status !== "O" ? control(f, obj, p) : el("span", { class: "ib-default" }, "not set - the default is used"),
            el("div", { class: "ib-meta" }, helpBits(f))));
        if (!path.length) tagTop(row, f.key, row.querySelector(".ib-label"));
        host.append(row);
      }
    }
  }

  // ── page wiring ────────────────────────────────────────────────────────────────────────
  let root, formHost, preview, issuesHost, statusLine, fileText = "", activeKey = null;
  // highlight a section's box in the preview and scroll the preview (not the page) to it
  function markActive(key, scroll) {
    activeKey = key;
    preview.querySelectorAll(".ib-sec").forEach((b) => b.classList.toggle("ib-sec-active", b.dataset.key === key));
    const box = preview.querySelector(`.ib-sec[data-key="${CSS.escape(key)}"]`);
    if (box && scroll) {
      const pre = preview.parentElement;
      pre.scrollTo({ top: Math.max(0, box.offsetTop - 8), behavior: "smooth" });
      box.classList.remove("ib-sec-flash"); void box.offsetWidth; box.classList.add("ib-sec-flash");
    }
  }
  function update() {
    const secs = toSections(state);
    fileText = "{\n" + secs.map((x) => x.text).join(",\n\n") + "\n}\n";
    preview.replaceChildren("{\n", ...secs.map((x, i) => {
      const box = el("span", { class: "ib-sec", "data-key": x.key, title: "go to this section of the form" }, x.text + (i < secs.length - 1 ? "," : ""));
      box.addEventListener("click", () => {
        const target = formHost.querySelector(`[data-top="${CSS.escape(x.key)}"]`);
        if (target) { if (target.tagName === "DETAILS") target.open = true; target.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
      return box;
    }), "}\n");
    if (activeKey) markActive(activeKey, false);
    const issues = validate(state);
    issuesHost.replaceChildren();
    root.querySelectorAll(".ib-flag").forEach((n) => n.classList.remove("ib-flag"));
    const errors = issues.filter((x) => x.level === "error").length, warns = issues.length - errors;
    statusLine.className = "ib-statusline " + (errors ? "ib-has-errors" : warns ? "ib-has-warns" : "ib-ok");
    statusLine.textContent = errors ? `${errors} error${errors > 1 ? "s" : ""}${warns ? `, ${warns} warning${warns > 1 ? "s" : ""}` : ""} - fix these before running`
      : warns ? `Valid, with ${warns} warning${warns > 1 ? "s" : ""}` : "Valid: every required key is present and every value is allowed";
    for (const it of issues) {
      const where = it.path.length ? it.path.map((x) => (typeof x === "number" ? `[${x + 1}]` : `"${x}"`)).join(" → ") : "file";
      const li = el("li", { class: "ib-issue ib-" + it.level }, el("strong", {}, where), " " + it.msg);
      li.addEventListener("click", () => {
        for (let n = it.path.length; n > 0; n--) {
          const target = document.getElementById(pathId(it.path.slice(0, n)));
          if (target) {
            let d = target.closest("details"); while (d) { d.open = true; d = d.parentElement.closest("details"); }
            target.scrollIntoView({ behavior: "smooth", block: "center" }); target.classList.add("ib-flag"); if (target.focus) target.focus();
            break;
          }
        }
      });
      issuesHost.append(li);
      const target = document.getElementById(pathId(it.path));
      if (target) target.classList.add("ib-flag");
    }
  }
  function render() {
    const y = window.scrollY;
    formHost.replaceChildren();
    renderFields(SCHEMA, state, [], formHost);
    update();
    window.scrollTo(0, y);
  }
  function load(obj, label) {
    state = obj;
    render();
    if (label) statusFlash(label);
  }
  function statusFlash(msg, bad) {
    root.querySelectorAll(".ib-flash").forEach((x) => x.remove());
    const n = el("div", { class: "ib-flash" + (bad ? " ib-flash-bad" : "") }, msg);
    root.querySelector(".ib-toolbar").append(n);
    setTimeout(() => n.remove(), bad ? 12000 : 3500);
  }

  function build() {
    root = document.getElementById("input-builder");
    if (!root) return;
    const templates = window.MPM3S_TEMPLATES || [];
    const pick = el("select", { class: "ib-select" }, el("option", { value: "blank" }, "A blank file"),
      templates.map((t, i) => el("option", { value: String(i) }, t.name)));
    const startBtn = el("button", { class: "ib-btn ib-primary", type: "button", onclick: () => {
      if (pick.value === "blank") load(makeObject(SCHEMA), "Started a blank file");
      else { const t = templates[Number(pick.value)]; load(clone(t.json), `Loaded ${t.file}`); }
    } }, "Start");
    const fileIn = el("input", { type: "file", accept: ".json,application/json", class: "ib-file" });
    fileIn.addEventListener("change", () => {
      const file = fileIn.files[0]; if (!file) return;
      file.text().then((t) => { try { load(JSON.parse(t), `Loaded ${file.name}`); } catch (e) { statusFlash(`${file.name} is not valid JSON, so nothing was loaded: ${e.message}`, true); } });
      fileIn.value = "";
    });
    const paste = el("textarea", { class: "ib-paste", rows: 6, placeholder: "Paste an input_data.json here" });
    const pasteBox = el("details", { class: "ib-pastebox" }, el("summary", {}, "Paste a file"), paste,
      el("button", { class: "ib-btn", type: "button", onclick: () => {
        try { load(JSON.parse(paste.value), "Loaded the pasted file"); paste.value = ""; pasteBox.open = false; }
        catch (e) { statusFlash(`Not valid JSON, so nothing was loaded: ${e.message}`, true); }
      } }, "Load"));
    preview = el("code", {});
    issuesHost = el("ul", { class: "ib-issues" });
    statusLine = el("div", { class: "ib-statusline" });
    const copyBtn = el("button", { class: "ib-btn", type: "button", onclick: () => {
      navigator.clipboard.writeText(fileText).then(() => statusFlash("Copied to the clipboard"), () => statusFlash("Copy failed - select the text instead"));
    } }, "Copy");
    const dlBtn = el("button", { class: "ib-btn ib-primary", type: "button", onclick: () => {
      const blob = new Blob([fileText], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: "input_data.json" });
      document.body.append(a); a.click(); a.remove();
    } }, "Download input_data.json");
    formHost = el("div", { class: "ib-form" });
    root.append(
      el("div", { class: "ib-toolbar" },
        el("label", { class: "ib-start" }, "Start from ", pick, startBtn),
        el("label", { class: "ib-btn ib-filebtn" }, "Load a file", fileIn),
        pasteBox),
      el("div", { class: "ib-layout" },
        formHost,
        el("div", { class: "ib-side" },
          statusLine, issuesHost,
          el("div", { class: "ib-preview-head" }, el("span", {}, "input_data.json"), el("span", {}, copyBtn, dlBtn)),
          el("pre", { class: "ib-preview" }, preview))));
    const t1 = templates.length ? clone(templates[0].json) : makeObject(SCHEMA);
    pick.value = templates.length ? "0" : "blank";
    load(t1);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
