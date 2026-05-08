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
// PROJECTS — Glowing grid lines
// ===========================
(function () {
  const canvas = document.getElementById('projects-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, vX = [], hY = [];
  const pulses = [];

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const colGap = 100, rowGap = 30, padT = 6, padB = 20;
    const colW = (W - colGap * 2) / 3;
    const rowH = (H - padT - padB - rowGap) / 2;

    vX = [colW + colGap / 2, colW * 2 + colGap * 1.5];
    hY = [padT + rowH + rowGap / 2];

    pulses.length = 0;
    [
      { axis: 'v', i: 0, speed: 0.50, color: '#00d0d3', len: 60 },
      { axis: 'v', i: 0, speed: -0.40, color: '#7c3aed', len: 45 },
      { axis: 'v', i: 1, speed: 0.45, color: '#7c3aed', len: 55 },
      { axis: 'v', i: 1, speed: -0.50, color: '#a855f7', len: 40 },
      { axis: 'h', i: 0, speed: 0.55, color: '#00d0d3', len: 80 },
      { axis: 'h', i: 0, speed: -0.45, color: '#7c3aed', len: 65 },
    ].forEach(s => {
      const fixed = s.axis === 'v' ? vX[s.i] : hY[s.i];
      const max = s.axis === 'v' ? H : W;
      pulses.push({ axis: s.axis, fixed, t: Math.random() * max, speed: s.speed, len: s.len, color: s.color });
    });
  }

  function hexRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.lineWidth = 1;
    vX.forEach(x => {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H);
      ctx.strokeStyle = 'rgba(0,208,211,0.05)'; ctx.stroke();
    });
    hY.forEach(y => {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.strokeStyle = 'rgba(0,208,211,0.05)'; ctx.stroke();
    });

    const pulse = (Math.sin(Date.now() * 0.002) + 1) * 0.5;
    vX.forEach(x => {
      hY.forEach(y => {
        ctx.beginPath();
        ctx.arc(x, y, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,208,211,${0.2 + pulse * 0.2})`;
        ctx.lineWidth = 1; ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,208,211,${0.6 + pulse * 0.3})`; ctx.fill();
      });
    });

    pulses.forEach(p => {
      p.t += p.speed;
      const max = p.axis === 'v' ? H : W;
      if (p.speed > 0 && p.t > max + p.len) p.t = -p.len;
      if (p.speed < 0 && p.t < -p.len) p.t = max + p.len;

      const [r, g, b] = hexRgb(p.color);
      const half = p.len / 2;

      ctx.save();
      [[5, 0.08], [2, 0.22], [1, 0.9]].forEach(([lw, alpha]) => {
        let grad;
        if (p.axis === 'v') {
          grad = ctx.createLinearGradient(p.fixed, p.t - half, p.fixed, p.t + half);
        } else {
          grad = ctx.createLinearGradient(p.t - half, p.fixed, p.t + half, p.fixed);
        }
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        if (p.axis === 'v') { ctx.moveTo(p.fixed, p.t - half); ctx.lineTo(p.fixed, p.t + half); }
        else { ctx.moveTo(p.t - half, p.fixed); ctx.lineTo(p.t + half, p.fixed); }
        ctx.lineWidth = lw; ctx.strokeStyle = grad; ctx.stroke();
      });
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

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
