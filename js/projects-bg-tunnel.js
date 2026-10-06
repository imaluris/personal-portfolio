// ===========================
// PROJECTS — Tunnel di cerchi di sfondo
// ===========================
// Cerchi concentrici che vengono verso di te, come se viaggiassi dentro un tunnel.
// Scorrendo lo stack (rotella, touch, frecce) il tunnel accelera; scorrendo
// all'indietro inverte la marcia. Si ferma quando la sezione non è visibile.
(function () {
  const section = document.querySelector('.section-projects');
  const canvas  = document.getElementById('projects-canvas');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile     = window.matchMedia('(max-width: 768px)').matches;

  // ---- Parametri da ritoccare ----
  const COLORS      = ['0,208,211', '124,58,237']; // cyan, viola (alternati)
  const RINGS       = isMobile ? 10 : 16;  // numero di cerchi
  const VP_X        = 0.78;                // punto di fuga (frazione di larghezza)
  const VP_Y        = 0.72;                // punto di fuga (frazione di altezza)
  const BASE_SPEED  = 0.035;               // avanzamento a riposo (cicli al secondo)
  const SCROLL_GAIN = 0.0008;              // quanto lo scroll accelera il tunnel
  const MAX_BOOST   = 0.6;                 // accelerazione massima dallo scroll
  const DAMPING     = 0.6;                 // secondi di "coda" dopo lo scroll
  const FAR         = 2.6;                 // profondità del cerchio più lontano (più grande = più piccolo)
  const NEAR        = 0.14;                // profondità del cerchio più vicino
  const ALPHA       = 0.40;                // opacità massima
  const PARALLAX    = 0.03;                // quanto il mouse sposta il punto di fuga

  let W = 0, H = 0, dpr = 1;
  let running = false, rafId = 0;
  let phase = 0, boost = 0, last = 0;
  let mouseX = 0, mouseY = 0, offX = 0, offY = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  function draw(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;

    // La spinta dello scroll si spegne piano piano
    boost *= Math.exp(-dt / DAMPING);
    phase -= (BASE_SPEED + boost) * dt;
    phase -= Math.floor(phase); // tiene phase tra 0 e 1

    offX += (mouseX * PARALLAX * W - offX) * 0.05;
    offY += (mouseY * PARALLAX * H - offY) * 0.05;

    ctx.clearRect(0, 0, W, H);
    const cx = W * VP_X + offX, cy = H * VP_Y + offY;
    const R  = Math.min(W, H) * 0.5;
    const k  = R * 0.35;
    const t  = now / 1000;
    ctx.lineCap = 'round';

    for (let i = 0; i < RINGS; i++) {
      // u va da 0 (vicino) a 1 (lontano); la scala logaritmica dà la prospettiva
      const u = (i / RINGS + phase) % 1;
      const z = NEAR * Math.pow(FAR / NEAR, u);
      const radius = k / z;

      // Sfuma in lontananza e quando il cerchio sta per uscire dallo schermo
      const fade = smooth((1 - u) / 0.35) * smooth(u / 0.12);
      if (fade <= 0.01) continue;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${COLORS[i % 2]},${ALPHA * fade})`;
      ctx.lineWidth = 0.8 + Math.min(2.2, 0.35 / z);

      // Cerchi pari pieni, dispari tratteggiati (puntini) che girano piano
      if (i % 2) {
        ctx.setLineDash([1.5, 11]);
        ctx.lineDashOffset = -t * 6 * (i % 4 === 1 ? 1 : -1);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

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

  // ---- Reazione allo scroll dello stack ----
  // Stessi input dello stack (rotella, touch, frecce): scroll in giù = si avanza nel tunnel.
  function push(delta) {
    if (!running) return;
    boost = Math.max(-MAX_BOOST, Math.min(MAX_BOOST, boost + delta * SCROLL_GAIN));
  }

  window.addEventListener('wheel', e => {
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    push(e.deltaY * unit);
  }, { passive: true });

  let lastTouchY = null;
  window.addEventListener('touchstart', e => { lastTouchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (lastTouchY === null) return;
    const y = e.touches[0].clientY;
    push((lastTouchY - y) * 1.4);
    lastTouchY = y;
  }, { passive: true });
  window.addEventListener('touchend', () => { lastTouchY = null; });

  const keyDeltas = { ArrowDown: 120, ArrowUp: -120, PageDown: 400, PageUp: -400 };
  window.addEventListener('keydown', e => {
    if (keyDeltas[e.key] !== undefined) push(keyDeltas[e.key]);
  });

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
