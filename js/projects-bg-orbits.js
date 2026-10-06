// ===========================
// PROJECTS — Anelli orbitali di sfondo
// ===========================
// Anelli di puntini inclinati su piani diversi, che ruotano come orbite.
// Il mouse inclina leggermente l'insieme (parallax). Si ferma quando la sezione non è visibile.
(function () {
  const section = document.querySelector('.section-projects');
  const canvas  = document.getElementById('projects-canvas');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile     = window.matchMedia('(max-width: 768px)').matches;

  // ---- Parametri da ritoccare ----
  // radius: frazione del raggio massimo | tiltX/tiltZ: inclinazione (rad) | speed: giri al secondo (segno = verso)
  const RINGS = [
    { radius: 1.00, tiltX: 1.15, tiltZ:  0.35, speed:  0.020, dots: 110, size: 1.6 },
    { radius: 0.82, tiltX: 0.75, tiltZ: -0.80, speed: -0.030, dots:  90, size: 1.5 },
    { radius: 0.64, tiltX: 1.40, tiltZ:  1.10, speed:  0.040, dots:  70, size: 1.4 },
    { radius: 0.46, tiltX: 0.40, tiltZ:  0.20, speed: -0.055, dots:  50, size: 1.3 }
  ];
  // Sistemi di anelli, piazzati nelle zone libere accanto alla fascia diagonale delle card.
  // x, y: centro (frazione di larghezza/altezza) | size: raggio massimo (frazione del lato minore)
  const SYSTEMS = [
    { x: 0.80, y: 0.78, size: 0.40 },                 // grande, in basso a destra
    { x: 0.13, y: 0.30, size: 0.20, mobile: false }   // piccolo, in alto a sinistra
  ];
  const ALPHA_MAX  = 0.75;                 // opacità dei punti in primo piano
  const PARALLAX   = 0.35;                 // quanto il mouse inclina l'insieme
  const SATELLITES = isMobile ? 0 : 1;     // punto più grande che "orbita" su ogni anello

  let W = 0, H = 0, dpr = 1;
  let running = false, rafId = 0;
  let t = 0, last = 0;
  let mouseX = 0, mouseY = 0, tiltX = 0, tiltY = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Ruota (x,y,z) attorno a Z, poi X, poi Y
  function rotate(x, y, z, rz, rx, ry) {
    let c = Math.cos(rz), s = Math.sin(rz);
    let x1 = x * c - y * s, y1 = x * s + y * c, z1 = z;
    c = Math.cos(rx); s = Math.sin(rx);
    let y2 = y1 * c - z1 * s, z2 = y1 * s + z1 * c;
    c = Math.cos(ry); s = Math.sin(ry);
    return [x1 * c + z2 * s, y2, -x1 * s + z2 * c];
  }

  function dot(px, py, depth, size, boost) {
    // depth: 0 (dietro) → 1 (davanti). Dietro: cyan e tenue, davanti: viola e netto.
    const cr = Math.round(depth * 124);
    const cg = Math.round(208 - depth * 150);
    const cb = Math.round(211 + depth * 26);
    const a  = (0.08 + depth * (ALPHA_MAX - 0.08)) * boost;
    ctx.beginPath();
    ctx.arc(px, py, size * (0.5 + depth * 0.9), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
    ctx.fill();
  }

  function drawSystem(cx, cy, R) {
    const f = R * 3.2; // distanza focale: più bassa = prospettiva più forte

    for (const ring of RINGS) {
      const r = R * ring.radius;
      const spin = t * ring.speed * Math.PI * 2;

      for (let i = 0; i < ring.dots; i++) {
        const a = (i / ring.dots) * Math.PI * 2 + spin;
        const [x, y, z] = rotate(r * Math.cos(a), r * Math.sin(a), 0,
                                 ring.tiltZ, ring.tiltX + tiltX, tiltY);
        const p = f / (f - z);
        dot(cx + x * p, cy + y * p, (z / r + 1) / 2, ring.size * p, 1);
      }

      // Satellite: un punto più grande che percorre l'anello
      for (let s = 0; s < SATELLITES; s++) {
        const a = spin * 2 + s * Math.PI;
        const [x, y, z] = rotate(r * Math.cos(a), r * Math.sin(a), 0,
                                 ring.tiltZ, ring.tiltX + tiltX, tiltY);
        const p = f / (f - z);
        dot(cx + x * p, cy + y * p, (z / r + 1) / 2, ring.size * 3.2 * p, 1.4);
      }
    }
  }

  function draw(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    t += dt;

    ctx.clearRect(0, 0, W, H);

    // Parallax morbido verso la posizione del mouse
    tiltX += (mouseY * PARALLAX - tiltX) * 0.04;
    tiltY += (mouseX * PARALLAX - tiltY) * 0.04;

    for (const sys of SYSTEMS) {
      if (isMobile && sys.mobile === false) continue;
      drawSystem(W * sys.x, H * sys.y, Math.min(W, H) * sys.size);
    }

    if (running) rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  // Mouse normalizzato -1..1 rispetto alla sezione (il canvas ha pointer-events: none)
  section.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouseY = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
  });

  new IntersectionObserver(entries => {
    entries[0].isIntersecting ? start() : stop();
  }, { threshold: 0.1 }).observe(section);

  resize();
  // Con "riduci animazioni" disegna un solo fotogramma statico
  if (reduceMotion) requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
})();
