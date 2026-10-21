/* The interactive input_data.json builder (docs/UsingTheSoftware/input_builder.md).
 *
 * SCHEMA below describes every key of the input file - its status (R required, O optional,
 * C conditional), kind, allowed values, default and, for conditional keys, when it applies (the note shown
 * under each key comes from input_builder_notes.js, by the key's place in the file); a
 * top-level key can also be `held` at a fixed value, and hidden from the form, while a condition lasts.
 * A number can also be given in other terms (`convert`, e.g. a von Mises yield stress from σy); the file keeps the key's own.
 * The numerical settings are marked `adv`: the form shows them, wherever they sit in the file, in one
 * "Advanced settings" box at the bottom.
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
  const noBodies = (o) => !(Array.isArray(o["rigid bodies"]) && o["rigid bodies"].length);
  const BC = ["free", "fixed", "prescribed"];

  const STAGE_TRACK = (def) => F(def.side, "obj", { fields: [
    F("type", "selvec", { n: 3, options: ["off", "roller", "fixed"], def: def.type }),
    F("distance", "vec", { n: 3, def: def.distance, unit: "m" }),
    F("advance", "selvec", { n: 3, options: ["positive", "negative", "both"], def: ["positive", "positive", "positive"] }),
    F("remove", "selvec", { n: 3, options: ["yes", "no"], def: def.remove }),
  ] });

  const SCHEMA = [
    F("GPU", "select", { options: ["on", "off"], def: "off", ref: "gpu/" }),
    F("domain update", "select", { status: "O", adv: true, options: ["none", "stretch"], def: "stretch", ref: "material_points/#domain-update" }),
    F("domain", "obj", { ref: "domain/", fields: [
      F("gravity", "vec", { n: 3, def: [0.0, 0.0, -9.81], unit: "m/s²" }),
    ] }),
    F("material points", "obj", { ref: "material_points/", fields: [
      F("extra capacity", "num", { adv: true, def: 1.2, min: 1 }),
      F("element size", "num", { def: 1.0, gt: 0, unit: "m" }),
      F("number of material points per element 1", "int", { def: 2, min: 1, label: "material points per element (per axis)" }),
      F("material size", "obj", { fields: [
        F("min", "fixed", { def: [0.0, 0.0], unit: "m" }),
        F("max", "vec", { n: 2, def: [10.0, 10.0], unit: "m" }),
      ] }),
      F("layers", "list", { min: 1, itemName: "layer", item: [
        F("thickness", "num", { def: 10.0, gt: 0, unit: "m" }),
        F("material", "obj", { fields: [
          F("type", "select", { options: ["elastic", "von mises", "willam warnke"], def: "elastic" }),
          F("E", "num", { def: 2.0e7, gt: 0, unit: "Pa" }),
          F("nu", "num", { def: 0.25, label: "nu (Poisson's ratio)" }),
          F("yield stress", "num", { status: "C", when: is("type", "von mises"), def: 5.0e4, gt: 0, unit: "Pa",
            convert: [["uniaxial σy", Math.sqrt(2 / 3)], ["pure shear k", Math.SQRT2]] }),
          F("friction angle", "num", { status: "C", when: is("type", "willam warnke"), def: 32.0, unit: "°" }),
          F("dilation angle", "num", { status: "C", when: is("type", "willam warnke"), def: 2.0, unit: "°" }),
          F("cohesion", "num", { status: "C", when: is("type", "willam warnke"), def: 300.0, unit: "Pa" }),
          F("density", "num", { def: 1800.0, gt: 0, unit: "kg/m³" }),
          F("E overburden", "obj", { status: "O", ref: "material_points/#stress-dependent-stiffness",
            fields: [
              F("reference stress", "num", { def: 1.0e5, gt: 0, unit: "Pa" }),
              F("exponent", "num", { def: 0.5 }),
            ] }),
        ] }),
      ] }),
    ] }),
    F("rigid bodies", "list", { min: 0, itemName: "system", ref: "rigid_bodies/",
      item: [
        F("offset", "vec", { n: 3, status: "O", def: [0.0, 0.0, 0.0], unit: "m" }),
        F("points", "list", { min: 1, itemName: "point", ref: "rigid_bodies/#points", item: [
          F("position", "vec", { n: 3, def: [0.0, 0.0, 0.0], unit: "m" }),
          F("mass", "num", { def: 1000.0, gt: 0, unit: "kg" }),
          F("rotational inertia", "vec", { n: 3, def: [1.0, 1.0, 1.0], unit: "kg·m²" }),
          F("boundary conditions", "bc6", { def: ["free", "free", "free", "free", "free", "free"] }),
        ] }),
        F("constraints", "list", { status: "O", min: 0, itemName: "constraint", ref: "rigid_bodies/#how-the-constraints-work", item: [
          F("type", "select", { options: ["coincidence", "rotation lock", "distance lock", "distance stop"], def: "rotation lock" }),
          F("points", "ivec", { n: 2, def: [1, 2] }),
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
          F("name", "text", { status: "O", def: "body" }),
          F("stl", "text", { def: "body.stl" }),
          F("mesh cache", "text", { def: "body_mesh.txt" }),
          F("point", "int", { def: 1, min: 1 }),
        ] }),
        F("tracked nodes", "list", { status: "O", min: 0, itemName: "tracked node", ref: "rigid_bodies/#tracked-nodes", item: [
          F("position", "vec", { n: 3, def: [0.0, 0.0, 0.0], unit: "m" }),
          F("point", "int", { def: 1, min: 1 }),
        ] }),
      ] }),
    F("contact", "obj", { ref: "contact/", fields: [
      F("friction coefficient", "num", { def: 0.0, min: 0 }),
    ], held: { when: noBodies, value: { "friction coefficient": 0.0 }, why: "the file has no rigid bodies" } }),
    F("analysis", "list", { min: 1, itemName: "stage", ref: "analysis/", item: [
      F("type", "select", { options: ["static", "dynamic"], def: "static" }),
      F("load steps", "int", { status: "C", when: is("type", "static"), def: 10, min: 1 }),
      F("load", "select", { status: "C", when: is("type", "static"), options: ["gravity ramp", "full"], def: "gravity ramp" }),
      F("dt", "num", { status: "C", when: is("type", "dynamic"), def: 0.005, gt: 0, unit: "s" }),
      F("final time", "num", { status: "C", when: is("type", "dynamic"), def: 1.0, gt: 0, unit: "s" }),
      F("beta", "num", { status: "C", when: is("type", "dynamic"), adv: true, def: 0.5, label: "beta (Newmark β)" }),
      F("gamma", "num", { status: "C", when: is("type", "dynamic"), adv: true, def: 1.0, label: "gamma (Newmark γ)" }),
      F("rigid bodies", "select", { options: ["on", "off"], def: "off" }),
      F("rigid body surface placement", "select", { status: "O", options: ["on", "off"], def: "on" }),
      F("adaptivity", "obj", { status: "O", ref: "analysis/#adaptivity", fields: [
        F("type", "select", { options: ["none", "uniform", "rigid body surface"], def: "none" }),
        F("element size", "num", { status: "C", when: is("type", "rigid body surface"), def: 0.1, gt: 0, unit: "m" }),
        F("region", "num", { status: "O", when: is("type", "rigid body surface"), def: 0.06, gt: 0, unit: "m" }),
        F("element size in region", "num", { status: "O", when: is("type", "rigid body surface"), def: 0.1, gt: 0, unit: "m" }),
      ] }),
      F("rigid body boundary conditions", "list", { status: "O", min: 0, itemName: "point", ref: "analysis/#rigid-body-boundary-conditions",
        item: [
          F("system", "int", { def: 1, min: 1 }),
          F("point", "int", { def: 1, min: 1 }),
          F("boundary conditions", "bc6", { def: ["fixed", "fixed", "fixed", "fixed", "fixed", "fixed"] }),
        ] }),
      F("boundary conditions", "obj", { status: "O", ref: "analysis/#boundary-conditions", fields: [
        F("min", "selvec", { n: 3, options: ["free", "roller", "fixed"], def: ["roller", "roller", "fixed"] }),
        F("max", "selvec", { n: 3, options: ["free", "roller", "fixed"], def: ["roller", "roller", "free"] }),
      ] }),
      F("boundary track", "obj", { status: "O", ref: "analysis/#boundary-track", fields: [
        STAGE_TRACK({ side: "min", type: ["fixed", "off", "off"], distance: [0.5, 0.0, 0.0], remove: ["yes", "no", "no"] }),
        STAGE_TRACK({ side: "max", type: ["fixed", "off", "off"], distance: [2.5, 0.0, 0.0], remove: ["no", "no", "no"] }),
      ] }),
    ] }),
    F("solver", "obj", { adv: true, ref: "solver/", fields: [
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
      F("vtk percent", "num", { status: "C", when: is("vtk", "on"), def: 1.0, min: 0 }),
      F("vtk material point fields", "fields", { status: "O", options: MP_FIELDS }),
      F("vtk rigid body fields", "fields", { status: "O", options: RB_FIELDS }),
      F("csv", "select", { options: ["on", "off"], def: "on" }),
      F("csv directory", "text", { status: "C", when: is("csv", "on"), def: "csv" }),
      F("csv percent", "num", { status: "C", when: is("csv", "on"), def: 1.0, min: 0 }),
      F("csv material point fields", "fields", { status: "O", options: MP_FIELDS }),
      F("csv rigid body fields", "fields", { status: "O", options: RB_FIELDS }),
    ] }),
  ];
  // the note under each key, by its place in the file ("domain › gravity"): input_builder_notes.js
  const NOTES = window.MPM3S_NOTES || {};
  (function note(fields, path) {
    for (const f of fields) {
      const p = path.concat(f.key);
      if (NOTES[p.join(" › ")]) f.help = NOTES[p.join(" › ")];
      if (f.kind === "obj") note(f.fields, p);
      if (f.kind === "list") note(f.item, p);
    }
  })(SCHEMA, []);
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
      // "rigid body surface" refines around a body: with no body in the file it has nothing to refine around; with the
      // stage's bodies off, MPM3S replaces it with no adaptivity (setup_analysis.jl stage_adapt)
      if (a && typeof a === "object" && a.type === "rigid body surface") {
        if (!arr(root["rigid bodies"]).length)
          add("error", ["analysis", i, "adaptivity", "type"], "\"rigid body surface\" needs a rigid body, and this file has none - use \"none\" or \"uniform\"");
        else if (st["rigid bodies"] === "off")
          add("warn", ["analysis", i, "adaptivity", "type"], "this stage has \"rigid bodies\" \"off\", so MPM3S ignores \"rigid body surface\" here and uses no adaptivity");
      }
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
  const FLOAT_KINDS = new Set(["num", "vec", "fixed"]);
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
  const BC6_ITEM = { fields: [F("prescribed", "num")] };   // a bc6 slot's { "prescribed": x }
  function inline(v, spec) {
    if (prim(v)) return typeof v === "number" ? fmtNum(v, !!(spec && FLOAT_KINDS.has(spec.kind))) : JSON.stringify(v);
    if (Array.isArray(v)) {
      if (spec && spec.kind === "bc6")
        return "[" + v.map((x) => (x && typeof x === "object" ? inline(x, BC6_ITEM) : inline(x, null))).join(", ") + "]";
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
  // The same layout as fmt, as HTML in which every key-value pair and list item is wrapped in a
  // span carrying its path, so a key picked in the form can be found in the preview, and every value
  // is an editable span (all but the fixed ones).
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const attr = (path) => esc(JSON.stringify(path)).replace(/"/g, "&quot;");
  const wrap = (path, html) => `<span class="ib-kv" data-p="${attr(path)}">${html}</span>`;
  const valH = (v, spec, path) => spec && spec.kind === "fixed" ? esc(inline(v, spec))
    : `<span class="ib-val" contenteditable="plaintext-only" spellcheck="false" data-p="${attr(path)}">${esc(inline(v, spec))}</span>`;
  function inlineH(v, spec, path) {
    if (prim(v)) return valH(v, spec, path);
    if (Array.isArray(v)) {
      if (spec && spec.kind === "bc6")
        return "[" + v.map((x, i) => (x && typeof x === "object" ? inlineH(x, BC6_ITEM, path.concat(i)) : valH(x, null, path.concat(i)))).join(", ") + "]";
      return "[" + v.map((x, i) => (prim(x) ? valH(x, spec, path.concat(i)) : inlineH(x, itemSpec(spec), path.concat(i)))).join(", ") + "]";
    }
    const ks = Object.keys(v);
    return ks.length ? "{ " + ks.map((k) => wrap(path.concat(k), esc(JSON.stringify(k) + ": ") + inlineH(v[k], subSpec(spec, k), path.concat(k)))).join(", ") + " }" : "{}";
  }
  function fmtH(v, spec, ind, force, path) {
    if (prim(v)) return valH(v, spec, path);
    if (Array.isArray(v)) {
      if (v.every(prim) || (spec && spec.kind === "bc6")) return inlineH(v, spec, path);
      if (!v.length) return "[]";
      const is = itemSpec(spec);
      return "[\n" + v.map((x, i) => ind + "    " + wrap(path.concat(i), fmtH(ordered(x, is), is, ind + "    ", false, path.concat(i)))).join(",\n") + "\n" + ind + "]";
    }
    const o = ordered(v, spec);
    const hasLists = Object.values(o).some((x) => Array.isArray(x) && x.some((y) => !prim(y)));
    if (!force && !hasLists && inline(o, spec).length + ind.length <= 72) return inlineH(o, spec, path);
    return "{\n" + Object.keys(o).map((k) => ind + "    " + wrap(path.concat(k), esc(JSON.stringify(k) + ": ") + fmtH(o[k], subSpec(spec, k), ind + "    ", false, path.concat(k)))).join(",\n") + "\n" + ind + "}";
  }
  function toSections(root) {
    const spec = { fields: SCHEMA };
    const o = ordered(root, spec);
    return Object.keys(o).map((k) => {
      const f = subSpec(spec, k), force = !!(f && f.kind === "obj");
      return { key: k,
        text: "    " + JSON.stringify(k) + ": " + fmt(o[k], f, "    ", force),
        html: "    " + wrap([k], esc(JSON.stringify(k) + ": ") + fmtH(o[k], f, "    ", force, [k])) };
    });
  }
  const toText = (root) => "{\n" + toSections(root).map((x) => x.text).join(",\n\n") + "\n}\n";

  // ── the form ───────────────────────────────────────────────────────────────────────────
  let state = null;
  // The main sections start minimised and everything inside them open. A section opened or closed by hand
  // stays so, kept by path; a list item (stage, layer, ...) folded by hand is kept by the item itself, so it
  // stays folded when the list is reordered.
  const opened = new Map();
  const folded = new WeakSet();
  // open every section and list item around a node of the form
  function reveal(node) {
    for (let d = node.closest("details, .ib-item"); d; d = d.parentElement.closest("details, .ib-item")) {
      if (d.tagName === "DETAILS") d.open = true;
      else if (d.classList.contains("ib-collapsed")) { d.classList.remove("ib-collapsed"); folded.delete(d.ibItem); }
    }
  }
  const el = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "title") {                    // shown by the builder's own hover hint (below)
        e.dataset.tip = v;
        if (tag === "button" && !(attrs || {})["aria-label"]) e.setAttribute("aria-label", v);
      }
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
      case "fixed": obj[f.key] = clone(f.def); return el("code", { class: "ib-fixed", id: pathId(path) }, inline(f.def, f));
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

  // a number, vector or fixed value with its unit to the right of it (a vector's on its last box, to wrap with it)
  function withUnit(ctl, unit) {
    if (!unit || !ctl.matches("input, .ib-vec, .ib-fixed")) return ctl;
    const u = el("span", { class: "ib-unit" }, unit);
    if (ctl.matches(".ib-vec")) { ctl.lastElementChild.append(u); return ctl; }
    return el("span", { class: "ib-withunit" }, ctl, u);
  }
  // A number given in other terms (the schema's `convert`, [label, factor]): the key is factor × the typed value.
  // Each box shows the key's value in its own terms and follows the key's box as either is typed in.
  function converter(f, obj, main) {
    const sig = (x, n) => Number(x.toPrecision(n));
    const boxes = f.convert.map(([label, k]) => {
      const inp = el("input", { type: "text", inputmode: "decimal", class: "ib-num", "aria-label": label });
      inp.addEventListener("input", () => {
        const t = inp.value.trim(), x = Number(t);
        inp.classList.toggle("ib-bad", t === "" || !isFinite(x));
        if (inp.classList.contains("ib-bad")) return;
        obj[f.key] = sig(k * x, 8);
        main.value = fmtNum(obj[f.key], true);
        main.classList.remove("ib-bad");
        show(inp);
        update();
      });
      return { inp, k, label };
    });
    const show = (typing) => {
      for (const b of boxes) if (b.inp !== typing) {
        b.inp.value = typeof obj[f.key] === "number" ? fmtNum(sig(obj[f.key] / b.k, 6), true) : "";
        b.inp.classList.remove("ib-bad");
      }
    };
    main.addEventListener("input", () => show(null));
    show(null);
    return el("div", { class: "ib-convert" }, "or give",
      boxes.flatMap((b, i) => [i ? "or" : null, el("label", { class: "ib-comp" }, el("span", {}, b.label), withUnit(b.inp, f.unit))]));
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

  function helpBits(f, path) {
    const bits = [];
    if (f.help) bits.push(el("span", { class: "ib-help" }, f.help));
    if (f.ref) {
      const name = f.label || f.key, key = path.join(".");
      const peek = el("a", { class: "ib-ref ib-peek", href: REF + f.ref, role: "button", title: `Show the reference for "${f.key}" here` }, "Peek " + name);
      peek.addEventListener("click", (e) => { e.preventDefault(); togglePeek(peek, f, key); });
      bits.push(peek, el("a", { class: "ib-ref", href: REF + f.ref, target: "_blank", rel: "noopener", title: "Open the reference page in a new tab" }, `Go to ${name} ↗`));
      if (peekOpen.has(key)) setTimeout(() => togglePeek(peek, f, key, true), 0);   // keep it open across re-renders
    }
    return bits;
  }

  // ── peek: show the part of a reference page a key links to, inline ─────────────────────
  const peekOpen = new Set(), pageCache = new Map();
  function fetchPage(url) {                       // XHR rather than fetch, so it also works from file://
    if (!pageCache.has(url)) pageCache.set(url, new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.onload = () => (xhr.status === 200 || (xhr.status === 0 && xhr.responseText) ? resolve(xhr.responseText) : reject(new Error(`HTTP ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("could not load the page"));
      xhr.send();
    }));
    return pageCache.get(url);
  }
  // the section an anchor names (its heading and everything up to the next heading of the same
  // level or higher), or the whole page body when there is no anchor
  function extract(doc, hash) {
    const body = doc.querySelector(".md-content__inner") || doc.body;
    const out = document.createDocumentFragment();
    const start = hash ? doc.getElementById(hash) : null;
    if (start && /^H[1-6]$/.test(start.tagName)) {
      const level = Number(start.tagName[1]);
      out.append(start.cloneNode(true));
      for (let n = start.nextElementSibling; n; n = n.nextElementSibling) {
        if (/^H[1-6]$/.test(n.tagName) && Number(n.tagName[1]) <= level) break;
        out.append(n.cloneNode(true));
      }
    } else {
      for (const n of body.children) if (n.tagName !== "H1" && !n.matches(".md-source-file, .md-feedback, nav")) out.append(n.cloneNode(true));
    }
    return out;
  }
  function togglePeek(link, f, key, forceOpen) {
    const host = link.closest(".ib-row") || link.closest("details.ib-group");
    const existing = host && host.querySelector(":scope > .ib-peekpanel");
    if (existing && !forceOpen) { existing.remove(); peekOpen.delete(key); link.classList.remove("ib-peek-on"); return; }
    if (existing) return;
    peekOpen.add(key); link.classList.add("ib-peek-on");
    const [page, hash] = (REF + f.ref).split("#");
    const pageUrl = new URL(page, location.href);
    const fetchUrl = pageUrl.href.endsWith("/") ? pageUrl.href + "index.html" : pageUrl.href;
    const bodyBox = el("div", { class: "ib-peekbody md-typeset" }, "Loading the reference...");
    const panel = el("div", { class: "ib-peekpanel" },
      el("div", { class: "ib-peekhead" }, el("strong", {}, `Reference: ${f.label || f.key}`),
        el("span", {},
          el("a", { class: "ib-ref", href: REF + f.ref, target: "_blank", rel: "noopener" }, "Go to page ↗"),
          el("button", { class: "ib-btn ib-small", type: "button", title: "close", onclick: () => togglePeek(link, f, key) }, "✕"))),
      bodyBox);
    if (host.tagName === "DETAILS") { const meta = host.querySelector(":scope > .ib-meta"); (meta || host.querySelector("summary")).after(panel); }
    else host.append(panel);
    fetchPage(fetchUrl).then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const frag = extract(doc, hash);
      // links and images in the borrowed section point at the reference page, and open in a new tab
      frag.querySelectorAll("[href]").forEach((a) => {
        const h = a.getAttribute("href");
        if (h.startsWith("#") && a.classList.contains("headerlink")) { a.remove(); return; }
        if (h.startsWith("#__codelineno")) { a.replaceWith(...a.childNodes); return; }     // code line-number anchors: plain text
        a.setAttribute("href", new URL(h, pageUrl).href);
        if (a.tagName === "A") { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
      });
      frag.querySelectorAll("[src]").forEach((x) => x.setAttribute("src", new URL(x.getAttribute("src"), pageUrl).href));
      frag.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));        // no duplicate ids on this page
      bodyBox.replaceChildren(frag);
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([bodyBox]).catch(() => {});
    }).catch((e) => bodyBox.replaceChildren(`Could not load the reference (${e.message}). `,
      el("a", { href: REF + f.ref, target: "_blank", rel: "noopener" }, "Open it in a new tab ↗")));
  }

  function tagTop(node, key, handle) {
    node.dataset.top = key;
    if (handle) handle.addEventListener("click", () => markActive(key, true));
    // a deeper item scrolls the preview to itself instead (flashPath)
    node.addEventListener("focusin", (e) => { if (activeKey !== key) markActive(key, e.target.closest("[data-p]") === node); });
  }
  // a section that only its arrow opens and closes (a click elsewhere on its title row does not): `shut` at first,
  // or open, until it is opened or closed by hand
  function section(cls, id, key, shut, ...head) {
    const box = el("details", { class: cls, id: id });
    box.open = opened.has(key) ? opened.get(key) : !shut;
    box.addEventListener("toggle", () => opened.set(key, box.open));
    const chevron = el("button", { class: "ib-chevron", type: "button", title: "Show or hide this section", "aria-label": "Show or hide this section" });
    chevron.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); box.open = !box.open; });
    const summary = el("summary", {}, ...head, chevron);
    summary.addEventListener("click", (e) => { if (!e.target.closest("input, select, a, button")) e.preventDefault(); });
    box.append(summary);
    return box;
  }
  // The form draws the `adv` keys only in the advanced box (adv true), and the rest everywhere else; where an
  // object's own `adv` keys would be, it says where they went.
  function renderFields(fields, obj, path, host, adv) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      host.append(el("span", { class: "ib-mismatch" }, "The file has ", el("code", {}, inline(obj, null)), " here - it should be an object { ... }."));
      return;
    }
    let moved = !path.length || adv;               // at the top level the box itself is the pointer
    for (const f of fields) {
      if (!applies(f, obj) || (f.held && f.held.when(obj))) continue;
      if (!f.adv !== !adv) {
        if (moved) continue;
        moved = true;
        const keys = fields.filter((x) => x.adv && applies(x, obj)).map((x) => el("code", {}, x.key));
        const first = path.concat(f.key);
        host.append(el("div", { class: "ib-advnote" }, keys.flatMap((k, i) => (i ? [i === keys.length - 1 ? " and " : ", ", k] : [k])),
          keys.length > 1 ? " are" : " is", " in ",
          el("a", { href: "#ib-advanced", onclick: (e) => { e.preventDefault(); goToForm(first); } }, "Advanced settings"), " at the bottom"));
        continue;
      }
      const p = path.concat(f.key), present = obj[f.key] !== undefined;
      const st = f.kind === "fixed" ? "O" : f.status === "R" && f.when ? "C" : f.status;   // the box colour: required, conditional or optional
      const label = el("span", { class: "ib-key", title: { R: "required", C: "required in this situation", O: "optional" }[st] }, f.label || f.key);
      let toggle = null;
      if (f.status === "O") {
        toggle = el("input", { type: "checkbox", class: "ib-toggle", title: "include this optional key" });
        toggle.checked = present;
        toggle.addEventListener("change", () => {
          if (toggle.checked) {
            obj[f.key] = defaultFor(f);
            if (f.kind === "list" && f.min === 0) obj[f.key] = [makeObject(f.item)];
            opened.set(p.join("."), true);
          }
          else delete obj[f.key];
          render();
        });
      }
      if (f.kind === "obj" || f.kind === "list") {
        const box = section("ib-group ib-st-" + st, pathId(p), p.join("."), !path.length && !adv, toggle, label,
          f.kind === "list" && present && Array.isArray(obj[f.key]) ? el("span", { class: "ib-count" }, ` (${obj[f.key].length})`) : null);
        const meta = helpBits(f, p);
        if (meta.length) box.append(el("div", { class: "ib-meta" }, meta));
        if (!present) {
          if (f.status !== "O") box.append(el("button", { class: "ib-btn", type: "button", onclick: () => { obj[f.key] = defaultFor(f); opened.set(p.join("."), true); render(); } }, `Add "${f.key}"`));
        } else if (f.kind === "obj" && (typeof obj[f.key] !== "object" || obj[f.key] === null || Array.isArray(obj[f.key]))) {
          box.append(mismatch(f, obj, p.concat("value"), "it should be an object { ... }"));
        } else if (f.kind === "list" && !Array.isArray(obj[f.key])) {
          box.append(mismatch(f, obj, p.concat("value"), "it should be a list [ ... ]"));
        } else if (f.kind === "obj") {
          renderFields(f.fields, obj[f.key], p, box);
        } else {
          const list = obj[f.key];
          list.forEach((item, i) => {
            const fold = el("button", { class: "ib-chevron", type: "button", title: "Show or hide this " + f.itemName, "aria-label": "Show or hide this " + f.itemName });
            const card = el("div", { class: "ib-item" + (folded.has(item) ? " ib-collapsed" : ""), id: pathId(p.concat(i)), "data-p": JSON.stringify(p.concat(i)) },
              el("div", { class: "ib-item-head" }, el("strong", {}, `${f.itemName} ${i + 1}`),
                el("span", { class: "ib-item-btns" },
                  i > 0 ? el("button", { class: "ib-btn ib-small", type: "button", title: "move up", onclick: () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; render(); } }, "↑") : null,
                  el("button", { class: "ib-btn ib-small", type: "button", title: "duplicate", onclick: () => { list.splice(i + 1, 0, clone(item)); render(); } }, "⧉"),
                  list.length > f.min ? el("button", { class: "ib-btn ib-small ib-remove", type: "button", title: "remove", onclick: () => { list.splice(i, 1); render(); } }, "✕") : null,
                  fold)));
            card.ibItem = item;
            fold.addEventListener("click", () => {
              if (card.classList.toggle("ib-collapsed")) folded.add(item); else folded.delete(item);
            });
            renderFields(f.item, item, p.concat(i), card);
            box.append(card);
          });
          box.append(el("button", { class: "ib-btn", type: "button", onclick: () => { list.push(makeObject(f.item)); render(); } }, `+ Add ${f.itemName}`));
        }
        box.dataset.p = JSON.stringify(p);
        if (!path.length) tagTop(box, f.key, box.querySelector("summary"));
        host.append(box);
      } else {
        const ctl = present || f.status !== "O" ? control(f, obj, p) : el("span", { class: "ib-default" }, "not set - the default is used");
        const row = el("div", { class: "ib-row ib-st-" + st + (present || f.status !== "O" ? "" : " ib-off") },
          el("label", { class: "ib-label" }, toggle, label),
          el("div", { class: "ib-control" }, withUnit(ctl, f.unit), f.convert && ctl.tagName === "INPUT" ? converter(f, obj, ctl) : null,
            el("div", { class: "ib-meta" }, helpBits(f, p))));
        row.dataset.p = JSON.stringify(p);
        if (!path.length) tagTop(row, f.key, row.querySelector(".ib-label"));
        host.append(row);
      }
    }
  }
  // the numerical settings (the schema's `adv` keys) in one red box below the form, in file order: a top-level key
  // as it is, a key inside an object or a list item under that object's or item's name
  function renderAdvanced(host) {
    const reset = el("button", { class: "ib-btn ib-small ib-advreset", type: "button", title: "Put every advanced setting back to its default",
      onclick: advDefaults }, "Set to default");
    const box = section("ib-group ib-adv", "ib-advanced", "__advanced", true, el("span", { class: "ib-key" }, "Advanced settings"), reset);
    if (NOTES["Advanced settings"]) box.append(el("div", { class: "ib-meta" }, el("span", { class: "ib-help" }, NOTES["Advanced settings"])));
    const group = (title, fields, obj, path) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj) || !fields.some((x) => x.adv && applies(x, obj))) return;
      const card = el("div", { class: "ib-item" }, el("div", { class: "ib-item-head" }, el("strong", {}, title)));
      renderFields(fields, obj, path, card, true);
      box.append(card);
    };
    for (const f of SCHEMA) {
      if (f.adv) renderFields([f], state, [], box, true);
      else if (f.kind === "obj" && f.fields.some((x) => x.adv)) group(f.key, f.fields, state[f.key], [f.key]);
      else if (f.kind === "list" && f.item.some((x) => x.adv) && Array.isArray(state[f.key]))
        state[f.key].forEach((item, i) => group(`${f.key}: ${f.itemName} ${i + 1}`, f.item, item, [f.key, i]));
    }
    host.append(box);
  }
  // every `adv` key that applies back to its default, as a blank file has it (an optional one unset), and say how
  // many values that changed beside the button
  function advDefaults() {
    let n = 0;
    const leaves = (a, b) => (a && b && typeof a === "object" && typeof b === "object"
      ? [...new Set([...Object.keys(a), ...Object.keys(b)])].reduce((s, k) => s + leaves(a[k], b[k]), 0)
      : JSON.stringify(a) === JSON.stringify(b) ? 0 : 1);
    const reset = (fields, obj) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
      for (const f of fields) {
        if (!f.adv || !applies(f, obj)) continue;
        const was = obj[f.key];
        if (f.status === "O") delete obj[f.key]; else obj[f.key] = defaultFor(f);
        n += leaves(was, obj[f.key]);
      }
    };
    for (const f of SCHEMA) {
      if (f.adv) reset([f], state);
      else if (f.kind === "obj") reset(f.fields, state[f.key]);
      else if (f.kind === "list" && Array.isArray(state[f.key])) state[f.key].forEach((item) => reset(f.item, item));
    }
    render();
    const btn = root.querySelector(".ib-advreset");
    btn.after(el("span", { class: "ib-advdone" }, n ? `${n} value${n > 1 ? "s" : ""} reset` : "Already the defaults"));
    setTimeout(() => root.querySelectorAll(".ib-advdone").forEach((x) => x.remove()), 3500);
  }

  // ── page wiring ────────────────────────────────────────────────────────────────────────
  let root, formHost, preview, issuesHost, statusLine, fileText = "", activeKey = null;
  let hl = null;                                   // the red highlight: { path, start }
  let savedText = "";                              // the file as last loaded or downloaded
  let loading = false;                             // a new file is being loaded (not an edit)
  // the run viewer (run_viewer/run_viewer.js) reads the file from here and hears of every change
  window.MPM3S_INPUT = () => fileText;
  // STL files uploaded for it, by file name (the solver reads each beside the JSON, by the name it gives)
  const meshes = (window.MPM3S_MESHES = window.MPM3S_MESHES || new Map());
  const HL_MS = 2600;                              // 2 s red, then the fade
  // the deepest wrapped item of the preview on a path (a vector component maps to its vector)
  function findInPreview(path) {
    for (let n = path.length; n > 0; n--) {
      const hit = preview.querySelector(`.ib-kv[data-p="${CSS.escape(JSON.stringify(path.slice(0, n)))}"]`);
      if (hit) return hit;
    }
    return null;
  }
  // highlight a sub-item red in the preview for 2 s, then fade; a re-render (typing) carries on the fade
  function paintHl() {
    preview.querySelectorAll(".ib-hl").forEach((n) => { n.classList.remove("ib-hl"); n.style.animationDelay = ""; });
    const age = hl ? performance.now() - hl.start : HL_MS;
    if (age >= HL_MS) { hl = null; return null; }
    const hit = findInPreview(hl.path);
    if (!hit) return null;
    void hit.offsetWidth;
    hit.style.animationDelay = -age + "ms";
    hit.classList.add("ib-hl");
    hit.addEventListener("animationend", (e) => { if (e.target === hit) hit.classList.remove("ib-hl"); }, { once: true });
    return hit;
  }
  function flashPath(path) {
    if (activeKey !== path[0]) markActive(path[0], false);
    if (path.length < 2) return;                   // whole sections have their own blue box
    hl = { path, start: performance.now() };
    const hit = paintHl();
    if (!hit) return;
    const pre = preview.parentElement, top = hit.offsetTop, h = hit.offsetHeight;
    if (top < pre.scrollTop + 8 || top + Math.min(h, pre.clientHeight / 2) > pre.scrollTop + pre.clientHeight)
      pre.scrollTo({ top: Math.max(0, top - pre.clientHeight / 3), behavior: "smooth" });
  }
  function goToForm(path) {
    for (let n = path.length; n > 0; n--) {
      const target = formHost.querySelector(`[data-p="${CSS.escape(JSON.stringify(path.slice(0, n)))}"]`);
      if (target) {
        if (target.tagName === "DETAILS") target.open = true;
        reveal(target);
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.remove("ib-flag-blue"); void target.offsetWidth; target.classList.add("ib-flag-blue");
        return true;
      }
    }
    return false;
  }
  // ── editing a value in the preview: Enter or leaving it saves, Esc cancels ──
  const getAt = (path) => path.reduce((o, k) => (o == null ? undefined : o[k]), state);
  function setAt(path, v) {
    const parent = getAt(path.slice(0, -1));
    if (parent && typeof parent === "object") parent[path[path.length - 1]] = v;
  }
  // the typed text as a value: a string stays a string (quotes optional), a number stays a number
  // when it reads as one; anything else is taken as JSON, or as text, and checked like the form's
  function parseTyped(text, old) {
    const t = text.trim();
    if (typeof old === "string") {
      if (/^".*"$/s.test(t)) try { return JSON.parse(t); } catch (e) { /* fall through */ }
      return t;
    }
    if (typeof old === "number" && t !== "" && Number.isFinite(Number(t))) return Number(t);
    try { return JSON.parse(t); } catch (e) { return t; }
  }
  function commitVal(span, next) {
    const path = JSON.parse(span.dataset.p), text = span.textContent;
    if (span.dataset.cancel || text === span.dataset.orig) { if (span.dataset.cancel) update(); else return; }
    else {
      const old = getAt(path), v = parseTyped(text, old);
      if (JSON.stringify(v) === JSON.stringify(old)) update();   // same value: just tidy its layout
      else {
        setAt(path, v);
        // as in the form: a changed choice adds the keys it needs and drops the ones it no longer uses
        const f = siblingsOf(path).find((x) => x.key === path[path.length - 1]);
        if (f && f.kind === "select") refresh(getAt(path.slice(0, -1)), siblingsOf(path));
        render(); flashPath(path);
      }
    }
    // the preview (and the form) were redrawn: put the focus back where it was going
    if (next && next.classList.contains("ib-val")) {
      const again = preview.querySelector(`.ib-val[data-p="${CSS.escape(next.dataset.p)}"]`);
      if (again) again.focus();
    } else if (next && next.id && !next.isConnected) {
      const again = document.getElementById(next.id);
      if (again) again.focus();
    }
  }
  function wireEditing() {
    preview.addEventListener("focusin", (e) => {
      const span = e.target.closest(".ib-val");
      if (!span) return;
      span.dataset.orig = span.textContent;
      requestAnimationFrame(() => {                  // select it all, ready to type over
        if (document.activeElement !== span) return;
        const r = document.createRange(); r.selectNodeContents(span);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      });
    });
    preview.addEventListener("keydown", (e) => {
      const span = e.target.closest(".ib-val");
      if (!span) return;
      if (e.key === "Enter") { e.preventDefault(); span.blur(); }
      else if (e.key === "Escape") { e.preventDefault(); span.dataset.cancel = "1"; span.blur(); }
    });
    preview.addEventListener("focusout", (e) => {
      const span = e.target.closest(".ib-val");
      if (span) commitVal(span, e.relatedTarget);
    });
  }
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
      const box = el("span", { class: "ib-sec", "data-key": x.key });
      box.innerHTML = x.html + (i < secs.length - 1 ? "," : "");
      box.addEventListener("click", (e) => {
        if (e.target.closest(".ib-val")) return;            // a value is edited in place
        const kv = e.target.closest(".ib-kv");
        if (kv && goToForm(JSON.parse(kv.dataset.p))) return;
        const target = formHost.querySelector(`[data-top="${CSS.escape(x.key)}"]`);
        if (target) { if (target.tagName === "DETAILS") target.open = true; reveal(target); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
      return box;
    }), "}\n");
    if (activeKey) markActive(activeKey, false);
    if (hl) paintHl();
    document.dispatchEvent(new CustomEvent("mpm3s-input", { detail: { fresh: loading } }));
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
            reveal(target);
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
    holdFixed(state);                              // e.g. the last rigid body removed: "contact" goes back to 0.0
    formHost.replaceChildren();
    renderFields(SCHEMA, state, [], formHost);
    renderAdvanced(formHost);
    update();
    window.scrollTo(0, y);
  }
  // keys held at a fixed value whatever a loaded file says; what was changed, or null
  function holdFixed(obj) {
    const notes = [];
    const ms = obj && obj["material points"] && obj["material points"]["material size"];
    if (ms && typeof ms === "object" && !Array.isArray(ms) && JSON.stringify(ms.min) !== "[0,0]") {
      const had = ms.min;
      ms.min = [0.0, 0.0];
      if (had !== undefined) notes.push(`"material size" "min" was ${JSON.stringify(had)}; it is always [0.0, 0.0]`);
    }
    // the schema's `held` keys, while their condition lasts ("contact" with no rigid bodies)
    if (obj && typeof obj === "object" && !Array.isArray(obj))
      for (const f of SCHEMA) {
        if (!f.held || !f.held.when(obj) || JSON.stringify(obj[f.key]) === JSON.stringify(f.held.value)) continue;
        if (obj[f.key] !== undefined) notes.push(`"${f.key}" was ${inline(obj[f.key], f)}; it is ${inline(f.held.value, f)} as ${f.held.why}`);
        obj[f.key] = clone(f.held.value);
      }
    return notes.length ? notes.join(". ") : null;
  }
  function load(obj, label) {
    const note = holdFixed(obj);
    if (note) label = (label ? label + ". " : "") + note;
    state = obj;
    opened.clear();
    loading = true;
    render();
    loading = false;
    savedText = fileText;
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
      setFileName("input_data.json");
    } }, "Start");
    // a JSON, its STL files (for the interactive view), or both at once
    const fileIn = el("input", { type: "file", accept: ".json,application/json,.stl", multiple: true, class: "ib-file" });
    fileIn.addEventListener("change", () => {
      const files = [...fileIn.files], stls = files.filter((f) => /\.stl$/i.test(f.name));
      const file = files.find((f) => !stls.includes(f));
      fileIn.value = "";
      stls.forEach((f) => meshes.set(f.name, f));
      const also = stls.length ? ` and ${stls.length} STL file${stls.length > 1 ? "s" : ""}` : "";
      if (!file) {
        if (!stls.length) return;
        statusFlash(`Added ${stls.map((f) => f.name).join(", ")} for the interactive view`);
        document.dispatchEvent(new CustomEvent("mpm3s-meshes"));
        return;
      }
      file.text().then((t) => { try { load(JSON.parse(t), `Loaded ${file.name}${also}`); setFileName(file.name); } catch (e) { statusFlash(`${file.name} is not valid JSON, so nothing was loaded: ${e.message}`, true); } });
    });
    const paste = el("textarea", { class: "ib-paste", rows: 6, placeholder: "Paste an input_data.json here" });
    const pasteBox = el("details", { class: "ib-pastebox" }, el("summary", {}, "Paste a file"), paste,
      el("button", { class: "ib-btn", type: "button", onclick: () => {
        try { load(JSON.parse(paste.value), "Loaded the pasted file"); paste.value = ""; pasteBox.open = false; }
        catch (e) { statusFlash(`Not valid JSON, so nothing was loaded: ${e.message}`, true); }
      } }, "Load"));
    preview = el("code", {});
    wireEditing();
    issuesHost = el("ul", { class: "ib-issues" });
    statusLine = el("div", { class: "ib-statusline" });
    const copyBtn = el("button", { class: "ib-btn", type: "button", onclick: () => {
      navigator.clipboard.writeText(fileText).then(() => statusFlash("Copied to the clipboard"), () => statusFlash("Copy failed - select the text instead"));
    } }, "Copy");
    // Download, joined to the name the file is saved under (the same name in every copy of the box)
    let fileName = "input_data.json";
    const saveName = () => { const n = fileName.trim() || "input_data.json"; return /\.json$/i.test(n) ? n : n + ".json"; };
    // an uploaded file is saved back under its own name; a tutorial or blank file as input_data.json
    function setFileName(n, typing) {
      fileName = n;
      root.querySelectorAll(".ib-fname").forEach((x) => { if (x !== typing) x.value = fileName; x.size = Math.max(10, fileName.length); });
      root.querySelectorAll(".ib-fname-label").forEach((x) => (x.textContent = saveName()));
    }
    const download = () => {
      const blob = new Blob([fileText], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: saveName() });
      document.body.append(a); a.click(); a.remove();
      savedText = fileText;
    };
    const dlBox = () => {
      const name = el("input", { class: "ib-fname", type: "text", value: fileName, spellcheck: "false", "aria-label": "File name" });
      name.size = Math.max(10, fileName.length);
      name.addEventListener("input", () => setFileName(name.value, name));
      name.addEventListener("keydown", (e) => { if (e.key === "Enter") download(); });
      return el("span", { class: "ib-dl" },
        el("button", { class: "ib-btn ib-primary", type: "button", title: "Save the file as it is now", onclick: download }, "Download"), name);
    };
    // nothing is kept by the browser: say so, and ask before leaving with changes not downloaded
    const warn = el("div", { class: "ib-warn", role: "note" },
      el("strong", {}, "Do not refresh this page"), " - your progress will be lost. ",
      dlBox(),
      " to save your progress and ",
      el("button", { class: "ib-btn", type: "button", title: "Upload a saved input_data.json", onclick: () => fileIn.click() }, "Upload"),
      " it later.");
    addEventListener("beforeunload", (e) => { if (fileText !== savedText) { e.preventDefault(); e.returnValue = ""; } });
    formHost = el("div", { class: "ib-form" });
    const pick$ = (e) => {
      const host = e.target.closest("[data-p]");
      if (host && formHost.contains(host)) flashPath(JSON.parse(host.dataset.p));
    };
    formHost.addEventListener("focusin", pick$);
    formHost.addEventListener("click", pick$);
    root.append(
      warn,
      el("div", { class: "ib-toolbar" },
        el("label", { class: "ib-start" }, "Start from ", pick, startBtn),
        el("label", { class: "ib-btn ib-filebtn", title: "An input_data.json, with the STL files it names to see the bodies in the interactive view" }, "Upload files", fileIn),
        pasteBox),
      el("div", { class: "ib-layout" },
        formHost,
        el("div", { class: "ib-side" },
          statusLine, issuesHost,
          el("div", { class: "ib-preview-head" }, el("span", { class: "ib-fname-label" }, fileName), el("span", {}, copyBtn, dlBox())),
          el("pre", { class: "ib-preview" }, preview))));
    // a mouse click (detail > 0) leaves a link or button focused; release it. Keyboard use keeps focus.
    root.addEventListener("click", (e) => {
      if (!e.detail) return;
      const t = e.target.closest("a, button, input[type=checkbox]");
      if (t) requestAnimationFrame(() => t.blur());
    });
    // Hover hints ("required", "Peek ...", ...). Material only gives hints to what is on the page when
    // it loads, and the form is redrawn on every edit, so the builder shows its own: after a short
    // hover, gone as soon as the pointer leaves, clicks or anything scrolls.
    const tip = el("div", { class: "ib-tip", role: "tooltip" });
    document.body.append(tip);
    let tipFor = null, tipTimer = 0;
    const hideTip = () => { clearTimeout(tipTimer); tipFor = null; tip.classList.remove("ib-tip-on"); };
    root.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-tip]");
      if (t === tipFor) return;
      hideTip();
      if (!t || !root.contains(t)) return;
      tipFor = t;
      tipTimer = setTimeout(() => {
        if (!t.isConnected) return;
        tip.textContent = t.dataset.tip;
        tip.classList.add("ib-tip-on");
        const r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
        const below = r.top - h - 10 < 8;
        tip.classList.toggle("ib-tip-below", below);
        tip.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8) + "px";
        tip.style.top = (below ? r.bottom + 10 : r.top - h - 10) + "px";
        tip.style.setProperty("--ib-tail-x", r.left + r.width / 2 - parseFloat(tip.style.left) + "px");
      }, 250);
    });
    root.addEventListener("mouseleave", hideTip);
    root.addEventListener("mousedown", hideTip, true);
    addEventListener("scroll", hideTip, true);
    new ResizeObserver(hideTip).observe(root);     // the layout moved under it (a message went, ...)
    const t1 = templates.length ? clone(templates[0].json) : makeObject(SCHEMA);
    pick.value = templates.length ? "0" : "blank";
    load(t1);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
