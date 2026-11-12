---
description: MPM3S is software for large-deformation soil-structure interaction problems, using the Material Point Method.
---

# Introduction

<p class="lead">MPM3S is software for large-deformation soil–structure interaction problems, using the Material Point Method (MPM).</p>

<div class="hero-carousel">
<a class="hero" href="../TutorialProblems/Tutorial_6/"><img class="gif-box" src="../../img/gifs/AC14_dr32_hero_first.png" width="1000" height="372" alt="The AC-14 anchor dragged through sand, coloured by displacement magnitude (Tutorial 6)."><span class="hero-caption">AC14 embedment</span></a>
<button class="hero-next" type="button" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.58 13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg></button>
</div>

<script>
/* The hero shows the anchor gif, then the plough gif, and so on: each plays once from its first frame,
   holds its last frame for a moment, then slides out to the left as the next slides in from the right.
   The chevron moves on at once, holding the frame showing now as it slides out.
   The page starts with a still of the anchor gif's first frame (*_first.png: the same pixels).
   - Where the browser can decode a gif itself (ImageDecoder: Chrome, Edge, Firefox), the frames are drawn
     on a canvas over the img, as they download, so a gif can be held on any frame and started again at will.
   - Elsewhere (Safari) the img plays the gif: from its own address the first time, as it downloads, then
     from a fresh blob: address of its bytes each time so that it starts from its first frame again; and
     drawImage copies the frame showing now (Safari draws that frame).
   Each gif is downloaded once; the next one is fetched as soon as the one playing has arrived. */
(function () {
  const box = document.querySelector(".md-typeset .hero-carousel");
  const link = box && box.querySelector(".hero");
  const img = link && link.querySelector("img");
  const next = box && box.querySelector(".hero-next");
  const cap = link && link.querySelector(".hero-caption");
  if (!img || !next || !cap || !window.fetch || !window.URL || !window.Promise) return;   // the still stays
  const dir = "../../img/gifs/";
  const slides = [
    { href: link.getAttribute("href"), title: "Tutorial 6: Drag anchor", alt: img.alt, caption: cap.textContent, first: img.getAttribute("src"),
      gif: dir + "AC14_dr32_hero.gif", ms: 16000 },
    { href: "../TutorialProblems/Tutorial_5/", title: "Tutorial 5: Cable burial plough", caption: "cable burial plough",
      alt: "The plough driven through sand, coloured by displacement magnitude (Tutorial 5).",
      first: dir + "plough_dr44_hero_first.png", gif: dir + "plough_dr44_hero.gif", ms: 16080 },
  ];
  const HOLD = 1500;                              // ms on a gif's last frame before the next one slides in
  const calm = matchMedia("(prefers-reduced-motion: reduce)");   // then: a fade, and no moving on by itself
  const after = (i) => (i + 1) % slides.length;
  let current = 0, busy = false, run = 0, onCanvas = false, shown = null;
  const view = document.createElement("canvas");
  view.className = "hero-layer"; view.width = 1000; view.height = 372;
  const decoders = {}, blobs = {};

  function once(cache, key, make) {
    if (!cache[key]) cache[key] = make().catch((e) => { delete cache[key]; throw e; });
    return cache[key];
  }
  const decoderFor = (src) => once(decoders, src, () => fetch(src).then((r) => {
    if (!r.ok || !r.body) throw new Error(src);
    return new ImageDecoder({ data: r.body, type: "image/gif" });   // decodes as it downloads
  }));
  const blobOf = (src) => once(blobs, src, () => fetch(src).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(src)))));
  const fetchAhead = (s) => (onCanvas ? decoderFor(s.gif) : blobOf(s.gif)).catch(() => {});
  const until = (t) => new Promise((res) => {     // on animation frames, so it waits while the tab is hidden
    const f = (now) => (now >= t - 8 ? res() : requestAnimationFrame(f));
    requestAnimationFrame(f);
  });

  function ended(me) {                            // on the last frame: hold it, then the next gif
    if (me !== run || calm.matches) return;
    setTimeout(() => { if (me === run) go(after(current)); }, HOLD);
  }
  async function playCanvas(s, me) {
    const ctx = view.getContext("2d");
    let due = 0;
    try {
      const dec = await decoderFor(s.gif);
      dec.completed.then(() => fetchAhead(slides[after(slides.indexOf(s))]), () => {});
      for (let i = 0; ; i++) {
        let frame;
        try { frame = (await dec.decode({ frameIndex: i })).image; }   // waits while that frame downloads
        catch (e) { if (i > 0 && dec.complete) break; throw e; }       // past the last frame
        if (me !== run) { frame.close(); return; }
        box.classList.remove("is-loading");
        await until(due);
        if (me !== run) { frame.close(); return; }
        ctx.drawImage(frame, 0, 0, view.width, view.height);
        due = Math.max(due, performance.now()) + (frame.duration || 1e5) / 1000;
        frame.close();
      }
      await until(due);                           // the last frame's own time
      ended(me);
    } catch (e) {                                 // not decodable here after all: the img plays it
      if (me === run) { onCanvas = false; view.remove(); playImg(s, me); }
    }
  }
  function playImg(s, me) {
    if (!blobs[s.gif]) return playUrl(s, me);
    return blobOf(s.gif).then((b) => {
      if (me !== run) return;
      fetchAhead(slides[after(slides.indexOf(s))]);
      const u = URL.createObjectURL(b);
      img.src = u;
      if (shown) URL.revokeObjectURL(shown);
      shown = u;
      return img.decode().catch(() => {}).then(() => {
        box.classList.remove("is-loading");
        setTimeout(() => ended(me), s.ms);
      });
    }).catch(() => { if (me === run) { box.classList.remove("is-loading"); img.src = s.gif; } });
  }
  function playUrl(s, me) {                       // a gif's first showing: from its address, so it plays as it
    const loaded = new Promise((res) => {         // downloads (new to the page, so from its first frame), and is
      const done = () => { img.removeEventListener("load", done); img.removeEventListener("error", done); res(); };
      img.addEventListener("load", done); img.addEventListener("error", done);
    });                                           // then copied from the browser's cache for showings after
    img.src = s.gif;
    box.classList.remove("is-loading");
    loaded.then(() => {
      if (me !== run) return;
      blobOf(s.gif).catch(() => {});
      fetchAhead(slides[after(slides.indexOf(s))]);
    });
    Promise.all([loaded, new Promise((res) => setTimeout(res, s.ms))]).then(() => ended(me));
  }
  function play(i) {
    const me = ++run;
    current = i;
    onCanvas ? playCanvas(slides[i], me) : playImg(slides[i], me);
  }

  function layer(el, text) {                      // a picture with its caption, laid over the hero
    const d = document.createElement("div"), c = document.createElement("span");
    d.className = "hero-layer"; d.setAttribute("aria-hidden", "true");
    el.className = "hero-fill";
    c.className = "hero-caption"; c.textContent = text;
    d.append(el, c);
    return d;
  }
  function frozen() {                             // the picture showing now, on a canvas laid over it
    const c = document.createElement("canvas");
    c.width = view.width; c.height = view.height;
    const x = c.getContext("2d");
    try { x.drawImage(img, 0, 0, c.width, c.height); } catch (e) {}   // the still, or (Safari) the gif's frame now
    if (onCanvas) x.drawImage(view, 0, 0);
    return layer(c, slides[current].caption);
  }
  function still(s) {
    const p = new Image();
    p.alt = ""; p.src = s.first;
    return p.decode().catch(() => {}).then(() => layer(p, s.caption));
  }
  function move(el, from, to) {
    if (!el.animate) return Promise.resolve();
    const k = calm.matches ? [{ opacity: from === 0 ? 1 : 0 }, { opacity: to === 0 ? 1 : 0 }]
                           : [{ transform: `translateX(${from}%)` }, { transform: `translateX(${to}%)` }];
    return el.animate(k, { duration: calm.matches ? 300 : 700, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "both" })
      .finished.catch(() => {});
  }
  function label() {
    next.setAttribute("aria-label", "Show the next animation: " + slides[after(current)].title);   // no titles: their tooltips show under the hero
  }
  function go(i) {
    if (busy) return;
    busy = true;
    run++;                                        // the canvas stops on the frame showing now
    const s = slides[i], out = frozen();
    link.appendChild(out);
    fetchAhead(s);
    still(s).then((inc) => {
      link.appendChild(inc);
      current = i;
      link.href = s.href; img.alt = s.alt; cap.textContent = s.caption;
      label();
      return Promise.all(calm.matches ? [move(inc, 100, 0)] : [move(out, 0, -100), move(inc, 100, 0)])
        .then(() => { img.src = s.first; return img.decode().catch(() => {}); })
        .then(() => {
          view.getContext("2d").clearRect(0, 0, view.width, view.height);
          out.remove(); inc.remove();             // the img shows the same first frame underneath
          box.classList.add("is-loading");        // shows only while the gif is still on its way
          play(i);
        });
    }).finally(() => { busy = false; });
  }

  next.addEventListener("click", () => go(after(current)));
  next.addEventListener("pointerenter", () => fetchAhead(slides[after(current)]));
  next.addEventListener("focus", () => fetchAhead(slides[after(current)]));
  addEventListener("pageshow", (e) => { if (e.persisted && !busy) play(current); });   // back to the page: again
  const decodable = window.ImageDecoder && window.ReadableStream
    ? ImageDecoder.isTypeSupported("image/gif").catch(() => false) : Promise.resolve(false);
  decodable.then((yes) => {
    onCanvas = !!yes;
    if (onCanvas) link.insertBefore(view, cap);   // under the caption
    label();
    next.hidden = false;
    play(0);
  });
})();
</script>

<div class="cta" markdown>

[:material-play-circle: Run your first simulation →](GettingStarted/install_and_run.md){ .md-button .md-button--primary }
[:material-school: Explore the tutorials →](TutorialProblems/TutorialProblems.md){ .md-button }

</div>

## What is MPM3S?

MPM3S is software for the analysis of soil-structure interactions problems using the Material Point Method which was developed at Durham University between 2025 and 2027 as part of the project [Leveraging The Material Point Method For Large Deformation Soil-Structure Interaction To Realise Net Zero](../project.md). 

The code has its origins in AMPLE ([A Material Point Learning Environment](https://wmcoombs.github.io/AMPLE/)).

## Next steps

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

## What can it model?

Click an animation to open its tutorial.

<div class="grid gif-gallery">
<figure><a href="../TutorialProblems/Tutorial_1/"><img src="../../img/gifs/MPM3S_column.gif" alt="The column compressing under its own weight, coloured by displacement magnitude." class="gif-box" loading="lazy"></a>
<figcaption><a href="../TutorialProblems/Tutorial_1/">Tutorial 1: Self-weight column</a></figcaption></figure>
<figure><a href="../TutorialProblems/Tutorial_2/"><img src="../../img/gifs/cube.gif" alt="The rigid cube compressing the soil, coloured by displacement magnitude." class="gif-box" loading="lazy"></a>
<figcaption><a href="../TutorialProblems/Tutorial_2/">Tutorial 2: Compaction via a rigid body</a></figcaption></figure>
<figure><a href="../TutorialProblems/Tutorial_3/"><img src="../../img/gifs/CPT_dr32.gif" alt="The cone pushed into the sand, coloured by displacement magnitude." class="gif-box" loading="lazy"></a>
<figcaption><a href="../TutorialProblems/Tutorial_3/">Tutorial 3: Cone Penetration Test</a></figcaption></figure>
<figure><a href="../TutorialProblems/Tutorial_4/"><img src="../../img/gifs/sphere_mu0.2.gif" alt="The sphere rolling down the slope with μ = 0.2, coloured by displacement magnitude." class="gif-box" loading="lazy"></a>
<figcaption><a href="../TutorialProblems/Tutorial_4/">Tutorial 4: Rolling sphere</a></figcaption></figure>
<figure><a href="../TutorialProblems/Tutorial_5/"><img src="../../img/gifs/plough_dr44.gif" alt="The plough driven down into the sand and along it, coloured by displacement magnitude." class="gif-box" loading="lazy"></a>
<figcaption><a href="../TutorialProblems/Tutorial_5/">Tutorial 5: Cable burial plough</a></figcaption></figure>
<figure><a href="../TutorialProblems/Tutorial_6/"><img src="../../img/gifs/AC14_dr32.gif" alt="The AC-14 anchor dragged through the sand, coloured by displacement magnitude." class="gif-box" loading="lazy"></a>
<figcaption><a href="../TutorialProblems/Tutorial_6/">Tutorial 6: Drag anchor</a></figcaption></figure>
</div>

## Key features

- single phase deformable solid material considering large deformation mechanics and elasto-plastic material behaviour
- coupled deformable solid material-rigid body interactions
- implicit solvers for quasi-static and dynamic problems
- automatic mesh generation and evolution with minimal required user intervention
- written in native [Julia](https://julialang.org/) with [Docker](https://www.docker.com/) containers for easy deployment
- unit and validation tests to check correctness and provide user confidence
- JSON ([JavaScript Object Notation](https://www.json.org/json-en.html)) and STL (unstructured triangulated surface rigid body representation) input file formats
- flexible CSV (Comma-Separated Values), VTK (Visualization Toolkit) and VTU (VTK-like, XML-based file supporting compression and parallel processing) output file formats

## Scope and limitations

MPM3S is not intended for:

- problems that could easily be solved with conventional finite element methods
- small strain solid mechanics problems
- analysis of the stresses/deformations *within* a structure interacting with the deformable material

## The Material Point Method

The Material Point Method (MPM) is a computational technique for modelling solid mechanics problems (not just soil-structure interaction) with close links to the Finite Element Method. The advantage of the MPM over many other methods is its ability to return solutions for problems involving very large deformations.

A detailed explanation of the MPM is in the [Material Point Method overview](TechnicalReferences/MPMoverview.md).
