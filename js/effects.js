// ===========================
// CUSTOM CURSOR
// ===========================
if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
  const ring      = document.getElementById('cursor-ring');
  const dotCenter = document.getElementById('cursor-dot-center');

  let mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dotCenter.style.left = mx + 'px';
    dotCenter.style.top  = my + 'px';
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  (function animRing() {
    rx = lerp(rx, mx, 0.15);
    ry = lerp(ry, my, 0.15);
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  // Espande il ring su elementi interattivi
  const selectors = 'a, button, .project-card, .tech-badge, .nav-item, .scroll-indicator, .scroll-nav, .social-link';
  document.querySelectorAll(selectors).forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width = ring.style.height = '48px';
      ring.style.borderColor = '#a855f7';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width = ring.style.height = '28px';
      ring.style.borderColor = '#00d0d3';
    });
  });
}

// ===========================
// TECH STACK — Floating particles
// ===========================
(function() {
  const canvas = document.getElementById('tech-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [];
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const lineMax  = isMobile ? .20 : .06;

  function resize() {
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
      r: Math.random() * 2 + .5,
      color: Math.random() > .5 ? '#00d0d3' : '#7c3aed',
      alpha: isMobile ? Math.random() * .5 + .4 : Math.random() * .4 + .1
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach((p, i) => {
      pts.slice(i + 1).forEach(q => {
        const dx = p.x - q.x, dy = p.y - q.y;
        const d  = Math.hypot(dx, dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(0,208,211,${lineMax * (1 - d / 120)})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      });
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

// ===========================
// CONTACT — Orbiting sphere
// ===========================
(function() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [], t = 0;

  function resize() {
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    pts = [];
    const N = 300;
    for (let i = 0; i < N; i++) {
      const phi   = Math.acos(1 - 2 * (i + 0.5) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      pts.push({ phi, theta, r: Math.random() * 1.5 + 0.8 });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const cx = W * 0.5, cy = H * 0.5;
    const R  = Math.min(W, H) * 0.4;
    t += 0.004;
    pts.forEach(p => {
      const theta = p.theta + t;
      const x     = R * Math.sin(p.phi) * Math.cos(theta);
      const y     = R * Math.cos(p.phi);
      const z     = R * Math.sin(p.phi) * Math.sin(theta);
      const scale = (z + R) / (2 * R);
      const mix   = scale;
      const cr    = Math.round(mix * 123);
      const cg    = Math.round(188 - mix * 100);
      const cb    = Math.round(212 - mix * 23);
      ctx.beginPath();
      ctx.arc(cx + x, cy + y, p.r * (0.5 + scale * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.2 + scale * 0.8})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

// ===========================
// CONTACT — Form AJAX (Formspree)
// ===========================
(function () {
  const form = document.querySelector('.contact-form');
  const successMsg = form && form.querySelector('.form-success');
  if (!form || !successMsg) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        successMsg.style.display = '';
        btn.style.display = 'none';
      } else {
        btn.disabled = false;
      }
    } catch (_) {
      btn.disabled = false;
    }
  });
})();

// ===========================
// CONTACT — Info obfuscation
// ===========================
(function () {
  const ph = ['+39 3926', '289669'];
  const em = ['a.castellani', 'perelli@gmail.com'];
  const phoneVal = ph.join('');
  const emailVal = em.join('');
  const pEl = document.getElementById('phone-link');
  const eEl = document.getElementById('email-link');
  if (pEl) {
    pEl.href = 'tel:' + phoneVal.replace(/\s/g, '');
    pEl.querySelector('span').textContent = phoneVal;
  }
  if (eEl) {
    eEl.href = 'mailto:' + emailVal;
    eEl.querySelector('span').textContent = emailVal;
  }
})();
