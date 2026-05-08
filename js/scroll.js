const sections       = document.querySelectorAll('.section');
const navItems       = document.querySelectorAll('.nav-item[data-section]');
const canvas         = document.getElementById('three-canvas');
const cardPages      = document.querySelectorAll('.projects-page');
const PROJECTS_INDEX = 1;
const ease           = 'transform 0.8s cubic-bezier(0.77, 0, 0.175, 1)';

let currentIndex  = 0;
let cardPageIndex = 0;
let isAnimating   = false;

const totalCardPages = cardPages.length;

// Posiziona le pagine card: prima visibile, le altre sotto
cardPages.forEach((page, i) => {
  page.style.transform = i === 0 ? 'translateY(0)' : 'translateY(100%)';
});

function goToCardPage(newPage) {
  if (isAnimating) return false;
  if (newPage < 0 || newPage >= totalCardPages) return false;
  if (newPage === cardPageIndex) return false;

  isAnimating = true;

  const direction    = newPage > cardPageIndex ? 1 : -1;
  const leavingPage  = cardPages[cardPageIndex];
  const enteringPage = cardPages[newPage];

  enteringPage.style.transition = 'none';
  enteringPage.style.transform  = `translateY(${direction * 100}%)`;
  enteringPage.offsetHeight;

  leavingPage.style.transition  = ease;
  enteringPage.style.transition = ease;
  leavingPage.style.transform   = `translateY(${-direction * 100}%)`;
  enteringPage.style.transform  = 'translateY(0)';

  cardPageIndex = newPage;
  setTimeout(() => { isAnimating = false; }, 820);
  return true;
}

function resetCardPages() {
  cardPageIndex = 0;
  cardPages.forEach((p, i) => {
    p.style.transition = 'none';
    p.style.transform  = i === 0 ? 'translateY(0)' : 'translateY(100%)';
  });
}

function goToSection(newIndex) {
  if (isAnimating || newIndex === currentIndex) return;
  if (newIndex < 0 || newIndex >= sections.length) return;

  isAnimating = true;

  // Resetta le pagine card quando si torna alla sezione projects
  if (newIndex === PROJECTS_INDEX) resetCardPages();

  const direction = newIndex > currentIndex ? 1 : -1;
  const leaving   = sections[currentIndex];
  const entering  = sections[newIndex];

  entering.style.transition = 'none';
  entering.style.transform  = `translateY(${direction * 100}%)`;

  if (currentIndex === 0) {
    canvas.style.transition = ease;
    canvas.style.transform  = 'translateY(-100%)';
  } else if (newIndex === 0) {
    canvas.style.transition = 'none';
    canvas.style.transform  = 'translateY(100%)';
  }

  entering.offsetHeight;

  leaving.style.transition  = ease;
  entering.style.transition = ease;
  leaving.style.transform   = `translateY(${-direction * 100}%)`;
  entering.style.transform  = 'translateY(0)';

  if (newIndex === 0) {
    canvas.style.transition = ease;
    canvas.style.transform  = 'translateY(0)';
  }

  navItems.forEach(item => {
    item.classList.toggle('active', +item.dataset.section === newIndex);
  });

  currentIndex = newIndex;
  setTimeout(() => { isAnimating = false; }, 820);
}

// Rotella del mouse
window.addEventListener('wheel', (e) => {
  if (currentIndex === PROJECTS_INDEX) {
    if (e.deltaY > 0 && cardPageIndex < totalCardPages - 1) {
      goToCardPage(cardPageIndex + 1);
      return;
    }
    if (e.deltaY < 0 && cardPageIndex > 0) {
      goToCardPage(cardPageIndex - 1);
      return;
    }
  }
  if (e.deltaY > 0) goToSection(currentIndex + 1);
  else              goToSection(currentIndex - 1);
}, { passive: true });

// Scroll indicator della home
document.querySelector('.scroll-indicator')?.addEventListener('click', (e) => {
  e.preventDefault();
  goToSection(currentIndex + 1);
});

// Frecce su/giù: nelle projects considerano anche le pagine card
document.querySelectorAll('.scroll-nav--up').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentIndex === PROJECTS_INDEX && cardPageIndex > 0) {
      goToCardPage(cardPageIndex - 1);
    } else {
      goToSection(currentIndex - 1);
    }
  });
});

document.querySelectorAll('.scroll-nav--down').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentIndex === PROJECTS_INDEX && cardPageIndex < totalCardPages - 1) {
      goToCardPage(cardPageIndex + 1);
    } else {
      goToSection(currentIndex + 1);
    }
  });
});

// Click nav laterale
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    goToSection(+item.dataset.section);
  });
});

// Touch swipe per mobile
let _touchY = 0;

window.addEventListener('touchstart', (e) => {
  _touchY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (document.getElementById('project-modal')?.classList.contains('is-open')) return;

  const dy = _touchY - e.changedTouches[0].clientY;
  if (Math.abs(dy) < 45) return;

  const scroller = currentIndex === PROJECTS_INDEX
    ? (cardPages[cardPageIndex] ?? sections[currentIndex])
    : sections[currentIndex];

  if (scroller && scroller.scrollHeight > scroller.clientHeight + 4) {
    if (dy > 0 && scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 4) return;
    if (dy < 0 && scroller.scrollTop > 4) return;
  }

  if (currentIndex === PROJECTS_INDEX) {
    if (dy > 0 && cardPageIndex < totalCardPages - 1) { goToCardPage(cardPageIndex + 1); return; }
    if (dy < 0 && cardPageIndex > 0) { goToCardPage(cardPageIndex - 1); return; }
  }
  if (dy > 0) goToSection(currentIndex + 1);
  else        goToSection(currentIndex - 1);
}, { passive: true });

// Form contact - invio asincrono
const contactForm = document.querySelector('.contact-form');
const formSuccess = document.querySelector('.form-success');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'INVIO IN CORSO...';
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        contactForm.reset();
        formSuccess.style.display = 'block';
        btn.style.display = 'none';
      } else {
        btn.textContent = 'ERRORE — RIPROVA';
        btn.disabled = false;
      }
    } catch {
      btn.textContent = 'ERRORE — RIPROVA';
      btn.disabled = false;
    }
  });
}
