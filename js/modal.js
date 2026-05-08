(function () {
  const overlay = document.getElementById('project-modal');
  const panel   = overlay.querySelector('.modal-panel');

  const els = {
    img:        overlay.querySelector('.modal-img'),
    imgBg:      overlay.querySelector('.modal-img-bg'),
    typeBadge:  overlay.querySelector('.modal-type-badge'),
    yearBadge:  overlay.querySelector('.modal-year-badge'),
    statusDot:  overlay.querySelector('.modal-status-row .card-live-dot'),
    statusText: overlay.querySelector('.modal-status-text'),
    title:      overlay.querySelector('.modal-title'),
    desc:       overlay.querySelector('.modal-desc'),
    tags:       overlay.querySelector('.modal-tags'),
    btnSite:    overlay.querySelector('.modal-btn--primary'),
    btnGithub:  overlay.querySelector('.modal-btn--secondary'),
  };

  function openModal(card) {
    const imgEl     = card.querySelector('.card-img');
    const hasImg    = !!imgEl;
    const statusEl  = card.querySelector('.card-live');
    const statusTxt = statusEl ? statusEl.textContent.trim() : 'LIVE';
    const isLive    = !statusTxt.includes('PROGRESS');

    els.img.src = hasImg ? imgEl.src : '';
    els.img.alt = hasImg ? imgEl.alt : '';
    els.img.style.display = hasImg ? 'block' : 'none';
    els.imgBg.classList.toggle('is-placeholder', !hasImg);

    els.typeBadge.textContent  = card.querySelector('.card-type')?.textContent ?? '';
    els.yearBadge.textContent  = card.dataset.year ?? '';
    els.statusText.textContent = statusTxt;
    els.statusDot.style.background    = isLive ? '#00d0d3' : '#f59e0b';
    els.statusDot.style.boxShadow     = isLive ? '0 0 6px #00d0d3' : '0 0 6px #f59e0b';
    els.statusText.style.color        = isLive ? '#00d0d3' : '#f59e0b';

    els.title.textContent = card.querySelector('.card-title')?.textContent ?? '';
    els.desc.textContent  = card.dataset.desc ?? '';

    els.tags.innerHTML = '';
    card.querySelectorAll('.card-tag').forEach(t => {
      const s = document.createElement('span');
      s.className   = 'card-tag';
      s.textContent = t.textContent;
      els.tags.appendChild(s);
    });

    const siteUrl             = card.dataset.site || '#';
    els.btnSite.href          = siteUrl;
    els.btnSite.style.display = (statusTxt.includes('GITHUB') || siteUrl === '#') ? 'none' : '';
    els.btnGithub.href        = card.dataset.github || '#';

    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  }

  // Open on card click
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => openModal(card));
  });

  // Close on X button
  overlay.querySelector('.modal-close').addEventListener('click', closeModal);

  // Close on backdrop click (not panel)
  overlay.addEventListener('click', e => {
    if (!panel.contains(e.target)) closeModal();
  });

  // Close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });

  // Stop wheel events from reaching the section scroll handler when modal is open
  overlay.addEventListener('wheel', e => e.stopPropagation(), { passive: false });

  // Expand cursor ring on modal interactive elements
  const ring = document.getElementById('cursor-ring');
  if (ring) {
    overlay.querySelectorAll('button, a').forEach(el => {
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
})();
