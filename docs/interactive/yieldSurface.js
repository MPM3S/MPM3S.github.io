// Shared renderer for the yield-surface figures. A figure supplies only the
// yield radius rho(xi, theta) and the hydrostatic range; the surface, its
// deviatoric section, the meridian markers, labels and controls follow.
// Stresses are tension positive throughout, so compression lies at negative xi.
window.drawYieldSurface = function (opt) {
  const BLUE = '#0000FF', RED = '#E00000', CYAN = '#00A3FF', PURPLE = '#68246d';

  document.head.insertAdjacentHTML('beforeend',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
    'family=Open+Sans:ital,wght@0,400;0,600;1,400&display=swap">');
  const FONT = '"Open Sans", system-ui, sans-serif';   // matches the site body text
  document.head.insertAdjacentHTML('beforeend', '<style>' +
    'html,body{margin:0;height:100%;overflow:hidden}' +
    '#wrap{width:100%;height:100%;display:flex;flex-direction:row}' +
    '#plot{flex:1;min-width:0;height:100%;position:relative;top:-10%}' +
    '#ctrl{flex:0 0 auto;padding:14px 0 10px 16px;margin-right:2%;box-sizing:border-box;display:flex;' +
    'flex-direction:column;justify-content:flex-start;color:#222;' +
    'font:16px/1.6 ' + FONT + '}' +
    '#ctrl .row{display:flex;align-items:center;gap:6px;white-space:nowrap}' +
    '#ctrl button{width:26px;height:26px;border:1px solid #666;' +
    'background:#fff;border-radius:4px;cursor:pointer;font-size:12px;line-height:1;padding:0}' +
    '#ctrl button:hover{background:#eee}#val{min-width:120px}' +
    '#sc{color:' + RED + '}#st{color:' + BLUE + '}' +
    '#ord,#ord2{color:#555;font-style:italic}</style>');
  document.body.innerHTML =
    '<div id="wrap"><div id="ctrl">' +
    '<div class="row"><button id="up" title="increase hydrostatic stress">&#9650;</button>' +
    '<button id="down" title="decrease hydrostatic stress">&#9660;</button>' +
    '<span id="val"></span></div>' +
    '<div class="row" id="ord">tension positive</div>' +
    '<div class="row" id="ord2">σ₁ ≥ σ₂ ≥ σ₃</div>' +
    '<div class="row" id="sc"></div><div class="row" id="st"></div></div>' +
    '<div id="plot"></div></div>';

  const N = 48, rho = opt.rho, xiMin = opt.xiMin, xiMax = opt.xiMax;
  const step = (xiMax - xiMin) / 16;
  const n  = [1, 1, 1].map(v => v / Math.sqrt(3)); // hydrostatic axis
  const e1 = [1, -1, 0].map(v => v / Math.sqrt(2)); // deviatoric plane basis
  const e2 = [1, 1, -2].map(v => v / Math.sqrt(6));

  // Lode angle of a direction in the deviatoric plane, from
  // sin(3.theta) = -3.sqrt(3).J3 / (2.J2^(3/2)) evaluated on the unit circle.
  const lode = a => {
    const s = [0, 1, 2].map(k => Math.cos(a) * e1[k] + Math.sin(a) * e2[k]);
    const J2 = 0.5 * (s[0] * s[0] + s[1] * s[1] + s[2] * s[2]);
    const J3 = s[0] * s[1] * s[2];
    const v = -3 * Math.sqrt(3) * J3 / (2 * Math.pow(J2, 1.5));
    return Math.asin(Math.max(-1, Math.min(1, v))) / 3;
  };
  const pt = (xi, a, off) => {                     // off pushes labels clear of the surface
    const r = rho(xi, lode(a)) + (off === undefined ? 0 : off);
    return [0, 1, 2].map(k => xi * n[k] + r * (Math.cos(a) * e1[k] + Math.sin(a) * e2[k]));
  };
  const pack = ps => ({ x: ps.map(p => p[0]), y: ps.map(p => p[1]), z: ps.map(p => p[2]) });
  const ring = (xi, m) => pack(Array.from({ length: m + 1 }, (_, j) => pt(xi, 2 * Math.PI * j / m)));

  // Tension positive: theta = +pi/6 is the triaxial compression meridian and
  // theta = -pi/6 the triaxial extension (tensile) meridian. Each repeats every
  // 120 degrees about the hydrostatic axis, but only one of the three obeys the
  // ordering convention sigma_1 >= sigma_2 >= sigma_3, so only that one is drawn.
  // Adding xi.n shifts all three components equally, so the ordering depends on
  // the deviatoric direction alone and is the same at every xi.
  const ordered = a => {
    const d = [0, 1, 2].map(k => Math.cos(a) * e1[k] + Math.sin(a) * e2[k]);
    return d[0] >= d[1] - 1e-9 && d[1] >= d[2] - 1e-9;
  };
  const COMP = [0, 1, 2].map(m =>  Math.PI / 2 + m * 2 * Math.PI / 3).find(ordered);
  const TENS = [0, 1, 2].map(m => -Math.PI / 2 + m * 2 * Math.PI / 3).find(ordered);

  // yield surface
  const x = [], y = [], z = [];
  for (let i = 0; i <= N; i++) {
    const r = ring(xiMin + (xiMax - xiMin) * i / N, N);
    x.push(r.x); y.push(r.y); z.push(r.z);
  }

  const mark = c => ({ size: 6, color: c, line: { color: '#000', width: 1 } });
  // Label anchored at the point it names, offset in SCREEN pixels (dx, dy) with a
  // leader line back to it. A 3D stand-off cannot work here: the same radial
  // distance projects to a different screen distance at every xi and camera
  // angle, so labels either sat on their marker or drifted far from it.
  const note = (p, t, c, dx, dy) => ({
    x: p[0], y: p[1], z: p[2], text: t,
    showarrow: true, ax: dx, ay: dy, arrowhead: 2, arrowsize: 1.1,
    arrowwidth: 1.2, arrowcolor: c,
    font: { family: FONT, size: 16, color: c }, bgcolor: '#fff', bordercolor: c,
    borderwidth: 1, borderpad: 3, opacity: 0.95
  });
  const k0 = xiMin - 0.3 * (xiMax - xiMin), k1 = xiMax + 0.3 * (xiMax - xiMin);
  const ax = t => ({ title: t, zeroline: false, backgroundcolor: '#fff', gridcolor: '#e6e6e6' });
  const gd = document.getElementById('plot');

  const traces = xi => [ring(xi, 180), pack([pt(xi, TENS)]), pack([pt(xi, COMP)])];
  // tensile and compression project close together, so they are pushed to
  // opposite sides; the leader lines keep each label tied to its own point
  const notes  = xi => [
    note(pt(xi, Math.PI), 'deviatoric section', CYAN, -70, -55),
    note(pt(xi, TENS), 'tensile meridian', BLUE, -85, 50),
    note(pt(xi, COMP), 'compression meridian', RED, 90, 45),
    // anchored at the far end of the axis, so the label goes left to stay in frame
    note([k1 * n[0], k1 * n[1], k1 * n[2]], 'hydrostatic axis', '#000', -75, -30)
  ];
  const XI0 = opt.xi0 !== undefined ? opt.xi0 : (xiMin + xiMax) / 2;
  const t0 = traces(XI0);

  Plotly.newPlot(gd, [
    { type: 'surface', x: x, y: y, z: z, showscale: false, opacity: 0.7,
      colorscale: [[0, PURPLE], [1, PURPLE]], hoverinfo: 'skip' },
    Object.assign({ type: 'scatter3d', mode: 'lines', hoverinfo: 'skip',
      line: { color: CYAN, width: 8 } }, t0[0]),
    Object.assign({ type: 'scatter3d', mode: 'markers', hoverinfo: 'skip',
      marker: mark(BLUE) }, t0[1]),
    Object.assign({ type: 'scatter3d', mode: 'markers', hoverinfo: 'skip',
      marker: mark(RED) }, t0[2]),
    { type: 'scatter3d', mode: 'lines', hoverinfo: 'skip',
      x: [k0 * n[0], k1 * n[0]], y: [k0 * n[1], k1 * n[1]], z: [k0 * n[2], k1 * n[2]],
      line: { color: '#000', width: 3 } }
  ], {
    margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false, paper_bgcolor: '#fff',
    font: { family: FONT },
    scene: { aspectmode: 'data',
             xaxis: ax('σ₁'), yaxis: ax('σ₂'), zaxis: ax('σ₃'),
             annotations: notes(XI0),
             camera: { eye: { x: 1.44, y: -1.17, z: 0.87 } } }
  }, { responsive: true, displayModeBar: false });

  // The control column changes width when the web font finishes loading, which
  // shrinks the plot after Plotly has already measured it. Re-measure on any
  // size change so the figure never sits with a stale width.
  if (window.ResizeObserver) new ResizeObserver(() => Plotly.Plots.resize(gd)).observe(gd);
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(() => Plotly.Plots.resize(gd));

  // arrows move the deviatoric section along the hydrostatic axis
  const sig = p => '(' + p.map(v => v.toFixed(2)).join(', ') + ')';
  let xi = XI0;
  function setXi(v) {
    xi = Math.max(xiMin, Math.min(xiMax, v));
    const t = traces(xi);
    // restyle/relayout rather than redraw, so the user's camera is left untouched
    Plotly.restyle(gd, { x: t.map(p => p.x), y: t.map(p => p.y), z: t.map(p => p.z) }, [1, 2, 3]);
    Plotly.relayout(gd, { 'scene.annotations': notes(xi) });
    document.getElementById('val').textContent = 'ξ = ' + xi.toFixed(2);
    document.getElementById('sc').textContent = 'Compression: ' + sig(pt(xi, COMP));
    document.getElementById('st').textContent = 'Tensile: ' + sig(pt(xi, TENS));
  }
  const click = (id, dir) => document.getElementById(id).addEventListener('click', e => {
    e.preventDefault(); setXi(xi + dir * step);
  });
  click('up', 1); click('down', -1);
  setXi(xi);
};
