// Sezione Projects, solo desktop: le .project-card diventano uno stack diagonale infinito.
// Sotto i 768px non fa nulla e resta la griglia a pagine di sempre.
import { createDiagonalStack } from './diagonal-stack/stack.js';

const DESKTOP = window.matchMedia('(min-width: 769px)');

const section = document.querySelector('.section-projects');
const cards   = [...document.querySelectorAll('.project-card')];

let stack = null;
let container = null;
let active = false; // la sezione Projects è quella visibile?

function mount() {
  if (stack || !section || !cards.length) return;

  container = document.createElement('div');
  container.className = 'projects-stack';
  section.append(container);

  stack = createDiagonalStack(container, cards, {
    getTitle: (card) => card.querySelector('.card-title')?.textContent.trim() ?? '',
    isBlocked: () => document.body.classList.contains('modal-open'),
  });
  stack.setActive(active);
  section.classList.add('is-stack');
}

function unmount() {
  if (!stack) return;
  stack.destroy();
  container.remove();
  stack = null;
  container = null;
  section.classList.remove('is-stack');
}

function sync() {
  if (DESKTOP.matches) mount();
  else unmount();
}

DESKTOP.addEventListener('change', sync);
sync();

/** true quando lo stack è in uso (desktop): serve a scroll.js per non usare le pagine card */
export function isStackActive() {
  return stack !== null;
}

/** Da chiamare quando la sezione Projects diventa (o smette di essere) quella visibile */
export function setStackActive(value) {
  active = value;
  stack?.setActive(value);
}
