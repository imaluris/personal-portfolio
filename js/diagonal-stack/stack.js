import { defaultConfig } from "./config.js";
import { h } from "./dom.js";
import { createSpring } from "./spring.js";
import { createInput } from "./input.js";
import { adoptCard } from "./card.js";
import { getT } from "./cardTransform.js";

/**
 * Monta la pila diagonale usando delle card già presenti nella pagina.
 *
 *   const stack = createDiagonalStack(container, cardElements, { getTitle });
 *   stack.setActive(true);  // da qui in poi rotella/tasti muovono le card
 *   stack.destroy();        // rimette le card dov'erano
 *
 * - container: elemento con una dimensione (la scena si scala per adattarsi)
 * - cards: array di elementi (le .project-card)
 * - options.getTitle(el): testo per l'etichetta in hover
 * - options.isBlocked(): se true (es. modale aperta) l'input viene ignorato
 * - altre options sovrascrivono config.js
 */
export function createDiagonalStack(container, cards, options = {}) {
  const { getTitle = (el) => el.textContent.trim(), isBlocked = () => false, ...overrides } = options;
  const cfg = { ...defaultConfig, ...overrides };
  const total = cards.length;

  // Ricordiamo in quale contenitore stava ogni card, per rimetterla a posto in destroy()
  const homes = cards.map((el) => ({ el, parent: el.parentNode }));

  // ---------- DOM ----------
  // .ds-scene ha la perspective, .ds-world è il contesto 3D (preserve-3d).
  // Tenerli separati è importante: altrimenti l'hover sulle card non funziona.
  const scene = h("div", "ds-scene");
  scene.style.width = `${cfg.stageW}px`;
  scene.style.height = `${cfg.stageH}px`;
  scene.style.marginLeft = `${-cfg.stageW / 2}px`;
  scene.style.marginTop = `${-cfg.stageH / 2}px`;
  scene.style.perspective = `${cfg.perspective}px`;

  const world = h("div", "ds-world");
  scene.append(world);
  container.classList.add("ds-stage");
  container.append(scene);

  // ---------- Animazione ----------
  const scroll = createSpring(0, cfg.scrollSpring); // segue l'input grezzo
  const wave = createSpring(0, cfg.waveSpring); // segue la velocità dello scroll

  let rafId = null;
  let lastTime = 0;
  let active = false;
  let currentProgress = 0;
  let hoveredIndex = null; // indice della card sotto il mouse
  let pointer = null; // ultima posizione del mouse { x, y }, null se fuori dalla pagina

  // Il loop gira solo finché qualcosa si muove, poi si ferma da solo.
  function wake() {
    if (rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  const items = cards.map((el, i) => adoptCard(el, getTitle(el), i, total, cfg, wake));
  world.append(...cards);

  // ---------- Input ----------
  const input = createInput({
    cfg,
    isEnabled: () => active && !isBlocked(),
    onChange: wake,
  });

  // ---------- Hover ----------
  // Non usiamo :hover del browser: durante lo scroll il browser aggiorna l'hover solo
  // quando il mouse si muove, e la card trasparente non verrebbe mai "presa".
  // Quindi a ogni frame (e a ogni movimento del mouse) chiediamo noi quali card
  // stanno sotto il cursore.
  const cardEls = new Set(cards);

  // Restituisce le card sotto il cursore, dalla più vicina alla più lontana.
  // (elementsFromPoint nei contesti 3D dà l'ordine sbagliato, elementFromPoint è affidabile:
  // lo ripetiamo togliendo ogni volta la card trovata dal "bersaglio" del mouse.)
  function cardsUnderPointer() {
    if (!pointer || !active || isBlocked()) return [];
    const found = [];
    const previous = [];
    for (let i = 0; i < total; i++) {
      const el = document.elementFromPoint(pointer.x, pointer.y);
      const card = el && el.closest(".ds-card");
      if (!card || !cardEls.has(card)) break; // sopra c'è altro (menu, frecce...) o non ci sono card
      found.push(card);
      previous.push(card.style.pointerEvents);
      card.style.pointerEvents = "none";
    }
    found.forEach((card, i) => (card.style.pointerEvents = previous[i]));
    return found;
  }

  function updateHover(progress) {
    const under = cardsUnderPointer();
    const next = under.length ? cards.indexOf(under[0]) : null; // la più vicina al cursore
    if (next === hoveredIndex) return false;
    if (hoveredIndex !== null) items[hoveredIndex].setHover(false);
    hoveredIndex = next;
    if (next !== null) items[next].setHover(true);
    return true; // l'hover è cambiato
  }

  const onPointerMove = (e) => {
    if (e.pointerType === "touch") return;
    pointer = { x: e.clientX, y: e.clientY };
    updateHover(currentProgress);
  };
  const onPointerLeave = () => {
    pointer = null;
    updateHover(currentProgress);
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);

  // ---------- Loop ----------
  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // 1. scroll grezzo -> scroll levigato
    scroll.target = input.value;
    scroll.update(dt);

    // 2. velocità dello scroll levigato -> seconda spring (la curva rimbalza)
    wave.target = scroll.velocity;
    wave.update(dt);

    // 3. pixel di scroll -> numero di card
    const progress = scroll.value / cfg.scrollPerCard;
    currentProgress = progress;

    let hoverChanged = updateHover(progress);

    // La card che copre quella in hover (quella subito prima, più vicina allo schermo)
    // diventa trasparente. Dopo il "salto" del loop la precedente è in fondo: niente effetto.
    let frontIndex = null;
    if (hoveredIndex !== null) {
      const prev = (hoveredIndex - 1 + total) % total;
      if (getT(prev, progress, total) < getT(hoveredIndex, progress, total)) frontIndex = prev;
    }
    items.forEach((item, i) => item.setGhost(i === frontIndex));

    let busy = !scroll.isSettled(0.05) || !wave.isSettled(0.5);
    for (const item of items) {
      if (!item.update(dt, progress, wave.value)) busy = true;
    }

    // A fine animazione ricontrolliamo la card sotto il cursore: alcune card hanno appena
    // cambiato opacità/pointer-events, e il loop sta per fermarsi.
    if (!busy) hoverChanged = updateHover(progress) || hoverChanged;
    if (hoverChanged) busy = true;

    rafId = busy ? requestAnimationFrame(frame) : null;
  }

  // ---------- Adattamento alla dimensione del contenitore ----------
  const resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    const scale = Math.min(width / cfg.stageW, height / cfg.stageH);
    scene.style.transform = `scale(${scale})`;
  });
  resizeObserver.observe(container);

  wake(); // primo frame: mette le card al loro posto

  return {
    /** true = la sezione è visibile e l'input muove le card */
    setActive(value) {
      active = value;
      updateHover(currentProgress);
    },
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      input.destroy();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      items.forEach((item) => item.release());
      // Rimette ogni card nella sua pagina, nello stesso ordine di prima
      homes.forEach(({ el, parent }) => parent.append(el));
      container.classList.remove("ds-stage");
      scene.remove();
    },
  };
}
