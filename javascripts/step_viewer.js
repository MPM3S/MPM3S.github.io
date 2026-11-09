// Step viewer: shows one `.step` of a `.step-viewer` at a time, with back/next arrows below it.
// Markup: <div class="step-viewer" markdown> <div class="step" markdown>…</div> … </div>
// Without JavaScript every step is shown, one under the other.
(function () {
  const ARROW = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11v2H8l5.5 5.5-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5 8 11h12z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11v2h12l-5.5 5.5 1.42 1.42L19.84 12l-7.92-7.92L10.5 5.5 16 11H4z"/></svg>',
  };

  function init(viewer) {
    if (viewer.classList.contains("is-js")) return;
    const steps = Array.from(viewer.children).filter((el) => el.classList.contains("step"));
    if (steps.length < 2) return;
    viewer.classList.add("is-js");

    const nav = document.createElement("div");
    nav.className = "step-nav";
    nav.innerHTML =
      '<button type="button" class="step-nav__btn" data-dir="-1" aria-label="Previous step">' + ARROW.prev + "</button>" +
      '<span class="step-nav__count" aria-live="polite"></span>' +
      '<button type="button" class="step-nav__btn" data-dir="1" aria-label="Next step">' + ARROW.next + "</button>";
    viewer.appendChild(nav);
    const [prev, next] = nav.querySelectorAll("button");
    const count = nav.querySelector(".step-nav__count");

    let current = 0;
    function show(k) {
      current = Math.max(0, Math.min(steps.length - 1, k));
      steps.forEach((step, j) => {
        step.classList.toggle("is-active", j === current);
        step.inert = j !== current;
      });
      prev.disabled = current === 0;
      next.disabled = current === steps.length - 1;
      count.textContent = "Step " + (current + 1) + " of " + steps.length;
    }

    nav.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (btn) show(current + Number(btn.dataset.dir));
    });
    viewer.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { show(current + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { show(current - 1); e.preventDefault(); }
    });
    show(0);
  }

  function run() { document.querySelectorAll(".step-viewer").forEach(init); }
  if (typeof document$ !== "undefined") document$.subscribe(run);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
