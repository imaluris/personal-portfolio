// ===========================
// PROJECTS — Onde concentriche di sfondo
// ===========================
// Cerchi che si espandono lentamente e svaniscono (cyan e viola).
// Il mouse genera nuove onde. L'animazione si ferma quando la sezione non è visibile.
(function () {
  const section = document.querySelector('.section-projects');
  const canvas  = document.getElementById('projects-canvas');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile     = window.matchMedia('(max-width: 768px)').matches;

  // ---- Parametri da ritoccare ----
  const COLORS        = ['0,208,211', '124,58,237']; // cyan, viola
  const MAX_RIPPLES   = isMobile ? 6 : 12;
  const AMBIENT_EVERY = 1500;   // ms tra un'onda automatica e l'altra
  const MOUSE_EVERY   = 320;    // ms minimi tra due onde da mouse
  const MOUSE_MIN_DIST = 90;    // px di movimento prima di una nuova onda
  const RINGS         = 3;      // anelli concentrici per onda
  const RING_GAP      = 0.07;   // distanza tra gli anelli (frazione del raggio massimo)
  const ALPHA         = 0.22;   // opacità massima dell'anello

  let W = 0, H = 0, dpr = 1;
  let ripples = [];
  let running = false, rafId = 0;
  let lastAmbient = 0, lastMouse = 0, lastMX = -999, lastMY = -999;
  let colorIndex = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y, small) {
    if (ripples.length >= MAX_RIPPLES) ripples.shift();
    colorIndex = (colorIndex + 1) % COLORS.length;
    ripples.push({
      x, y,
      color: COLORS[colorIndex],
      born: performance.now(),
      life: small ? 3800 : 7000,
      maxR: Math.min(W, H) * (small ? 0.35 : 0.65)
    });
  }

  function spawnAmbient() {
    // Onde sparse, con più probabilità verso il centro dello stack di card
    const x = W * (0.15 + Math.random() * 0.6);
    const y = H * (0.15 + Math.random() * 0.7);
    spawn(x, y, false);
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);

    if (now - lastAmbient > AMBIENT_EVERY) {
      spawnAmbient();
      lastAmbient = now;
    }

    ripples = ripples.filter(r => now - r.born < r.life);

    for (const r of ripples) {
      const t = (now - r.born) / r.life;          // 0 → 1
      const ease = 1 - Math.pow(1 - t, 2);         // parte veloce, rallenta
      const fade = Math.pow(1 - t, 1.5);           // svanisce verso la fine

      for (let i = 0; i < RINGS; i++) {
        const radius = (ease - i * RING_GAP) * r.maxR;
        if (radius <= 0) continue;
        const a = ALPHA * fade * (1 - i / (RINGS + 1));
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.color},${a})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    if (running) rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    rafId = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  // Mouse: nuova onda dove passa il cursore (il canvas ha pointer-events: none,
  // quindi ascoltiamo la sezione)
  section.addEventListener('mousemove', e => {
    if (!running) return;
    const now = performance.now();
    if (now - lastMouse < MOUSE_EVERY) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (Math.hypot(x - lastMX, y - lastMY) < MOUSE_MIN_DIST) return;
    lastMouse = now; lastMX = x; lastMY = y;
    spawn(x, y, true);
  });

  // Attiva l'animazione solo quando la sezione è visibile
  new IntersectionObserver(entries => {
    entries[0].isIntersecting ? start() : stop();
  }, { threshold: 0.1 }).observe(section);

  resize();
  window.addEventListener('resize', resize);
})();
