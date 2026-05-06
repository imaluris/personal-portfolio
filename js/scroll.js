const sections  = document.querySelectorAll('.section');
const navItems  = document.querySelectorAll('.nav-item[data-section]');
const canvas    = document.getElementById('three-canvas');
let currentIndex = 0;
let isAnimating  = false;

function goToSection(newIndex) {
  if (isAnimating || newIndex === currentIndex) return;
  if (newIndex < 0 || newIndex >= sections.length) return;

  isAnimating = true;

  const direction = newIndex > currentIndex ? 1 : -1;
  const leaving   = sections[currentIndex];
  const entering  = sections[newIndex];
  const ease      = 'transform 0.8s cubic-bezier(0.77, 0, 0.175, 1)';

  // Posiziona la sezione entrante fuori schermo senza transizione
  entering.style.transition = 'none';
  entering.style.transform  = `translateY(${direction * 100}%)`;

  // Animazione canvas: segue la sezione home
  if (currentIndex === 0) {
    // Stiamo lasciando la home → canvas sale
    canvas.style.transition = ease;
    canvas.style.transform  = 'translateY(-100%)';
  } else if (newIndex === 0) {
    // Stiamo tornando alla home → canvas entra dal basso
    canvas.style.transition = 'none';
    canvas.style.transform  = 'translateY(100%)';
  }

  entering.offsetHeight; // force reflow

  leaving.style.transition  = ease;
  entering.style.transition = ease;

  leaving.style.transform  = `translateY(${-direction * 100}%)`;
  entering.style.transform = 'translateY(0)';

  if (newIndex === 0) {
    canvas.style.transition = ease;
    canvas.style.transform  = 'translateY(0)';
  }

  // Aggiorna nav
  navItems.forEach(item => {
    item.classList.toggle('active', +item.dataset.section === newIndex);
  });

  currentIndex = newIndex;
  setTimeout(() => { isAnimating = false; }, 820);
}

// Rotella del mouse
window.addEventListener('wheel', (e) => {
  if (e.deltaY > 0) goToSection(currentIndex + 1);
  else              goToSection(currentIndex - 1);
}, { passive: true });

// Scroll indicator della home (va alla prossima)
document.querySelector('.scroll-indicator')?.addEventListener('click', (e) => {
  e.preventDefault();
  goToSection(currentIndex + 1);
});

// Freccia su nella sezione projects
document.querySelector('.scroll-nav--up')?.addEventListener('click', (e) => {
  e.preventDefault();
  goToSection(currentIndex - 1);
});

// Freccia giù nella sezione projects
document.querySelector('.scroll-nav--down')?.addEventListener('click', (e) => {
  e.preventDefault();
  goToSection(currentIndex + 1);
});

// Click sulle voci di nav
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    goToSection(+item.dataset.section);
  });
});

// Form contact - invio asincrono (non lascia la pagina)
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
