// ===========================
// PROJECTS — Griglia di punti reattiva
// ===========================
// Griglia regolare di puntini: vicino al cursore si ingrandiscono, si schiariscono
// (dal viola al cyan morbido) e si spostano come un campo di forza.
// Su mobile fa da cursore il dito. Le card coprono quasi tutto lo schermo, quindi
// i punti sotto il dito vengono ridisegnati anche in primo piano, sopra le card.
// Si ferma quando la sezione non è visibile.
(function () {
  const section = document.querySelector('.section-projects');
  const canvas  = document.getElementById('projects-canvas');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile     = window.matchMedia('(max-width: 768px)').matches;

  // Mobile: secondo canvas sopra le card (pointer-events: none), solo per i punti attivi
  let front = null, fctx = null;
  if (window.matchMedia('(max-width: 768px)').matches) {
    front = document.createElement('canvas');
    front.id = 'projects-canvas-front';
    front.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none;';
    section.appendChild(front);
    fctx = front.getContext('2d');
  }

  // ---- Parametri da ritoccare ----
  const SPACING     = isMobile ? 38 : 34;   // distanza tra i punti (px)
  const DOT_R       = 1.3;                  // raggio a riposo
  const DOT_R_MAX   = 2.8;                  // raggio massimo vicino al cursore
  const BASE_ALPHA  = 0.22;                 // opacità a riposo
  const MAX_ALPHA   = 0.6;                  // opacità massima vicino al cursore
  const INFLUENCE   = 190;                  // raggio d'azione del cursore (px)
  const PUSH        = 16;                   // di quanto il cursore spinge via i punti (px)
  const FRONT_ALPHA = 0.85;                 // mobile: opacità dei punti sopra le card (moltiplicatore)
  const FOLLOW      = 0.12;                 // morbidezza con cui la griglia segue il mouse
  // Colori presi dagli effetti di tech stack e contatti
  const COLD = [124, 58, 237];              // viola #7c3aed (lontano dal cursore)
  const HOT  = [0, 188, 212];               // cyan dei contatti, più morbido di #00d0d3

  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0;
  let running = false, rafId = 0;
  let idle = true;                // true = nessun fotogramma in coda
  let mx = -9999, my = -9999;     // cursore (smussato)
  let tx = -9999, ty = -9999;     // cursore (reale)
  let presence = 0, presenceTarget = 0; // 0 = cursore assente, 1 = presente

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (front) {
      front.width  = canvas.width;
      front.height = canvas.height;
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    cols = Math.ceil(W / SPACING) + 1;
    rows = Math.ceil(H / SPACING) + 1;
    if (idle) requestAnimationFrame(draw); // ridisegna subito, anche se l'animazione è ferma
  }

  const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  function draw(now) {
    mx += (tx - mx) * FOLLOW;
    my += (ty - my) * FOLLOW;
    presence += (presenceTarget - presence) * 0.08;

    ctx.clearRect(0, 0, W, H);
    if (fctx) fctx.clearRect(0, 0, W, H);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let x = c * SPACING, y = r * SPACING;

        // Influenza del cursore: 1 sul cursore, 0 oltre INFLUENCE
        const dx = x - mx, dy = y - my;
        const dist = Math.hypot(dx, dy);
        const k = smooth(1 - dist / INFLUENCE) * presence;

        if (k > 0 && dist > 0.01) {
          // Spinge il punto lontano dal cursore
          x += (dx / dist) * k * PUSH;
          y += (dy / dist) * k * PUSH;
        }

        const alpha = BASE_ALPHA + k * (MAX_ALPHA - BASE_ALPHA);
        const rad   = DOT_R + k * (DOT_R_MAX - DOT_R);

        const cr = Math.round(COLD[0] + (HOT[0] - COLD[0]) * k);
        const cg = Math.round(COLD[1] + (HOT[1] - COLD[1]) * k);
        const cb = Math.round(COLD[2] + (HOT[2] - COLD[2]) * k);

        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.fill();

        // Mobile: i punti attivi (sotto il dito) anche sopra le card
        if (fctx && k > 0.04) {
          fctx.beginPath();
          fctx.arc(x, y, rad, 0, Math.PI * 2);
          fctx.fillStyle = `rgba(${cr},${cg},${cb},${k * MAX_ALPHA * FRONT_ALPHA})`;
          fctx.fill();
        }
      }
    }

    // Continua solo finché il cursore è presente o la griglia si sta ancora assestando
    if (running && (presenceTarget === 1 || presence > 0.005)) {
      rafId = requestAnimationFrame(draw);
    } else {
      idle = true;
    }
  }

  function wake() {
    if (!running || !idle) return;
    idle = false;
    rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    wake();
  }

  function stop() {
    running = false;
    idle = true;
    cancelAnimationFrame(rafId);
  }

  // Cursore (il canvas ha pointer-events: none, quindi ascoltiamo la sezione)
  section.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    tx = e.clientX - rect.left;
    ty = e.clientY - rect.top;
    if (presenceTarget === 0) { mx = tx; my = ty; } // niente "volo" dal punto precedente
    presenceTarget = 1;
    wake();
  });
  section.addEventListener('mouseleave', () => { presenceTarget = 0; wake(); });

  // Touch: il dito fa da cursore (listener passivi, non bloccano lo scorrimento delle pagine)
  function touchMove(e) {
    const rect = canvas.getBoundingClientRect();
    tx = e.touches[0].clientX - rect.left;
    ty = e.touches[0].clientY - rect.top;
    if (presenceTarget === 0) { mx = tx; my = ty; }
    presenceTarget = 1;
    wake();
  }
  section.addEventListener('touchstart', touchMove, { passive: true });
  section.addEventListener('touchmove',  touchMove, { passive: true });
  section.addEventListener('touchend',    () => { presenceTarget = 0; wake(); });
  section.addEventListener('touchcancel', () => { presenceTarget = 0; wake(); });

  new IntersectionObserver(entries => {
    entries[0].isIntersecting ? start() : stop();
  }, { threshold: 0.1 }).observe(section);

  resize();
  // Con "riduci animazioni" disegna un solo fotogramma statico
  if (reduceMotion) requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
})();
