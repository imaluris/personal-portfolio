// La rotella può riportare righe o pagine invece dei pixel
function normalizeWheel(event) {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

/**
 * Scroll "virtuale" senza fine.
 * Non usa lo scroll nativo (che ha un inizio e una fine): accumula i delta di
 * rotella, touch e tastiera in un numero che cresce o cala all'infinito.
 * Il loop lo gestiscono le card.
 *
 * - cfg: i numeri di config.js
 * - isEnabled: se restituisce false l'input viene ignorato (e la pagina scorre normalmente)
 * - onChange: chiamata a ogni input (serve a svegliare il loop di animazione)
 *
 * Ascolta su window, ma agisce solo quando isEnabled() è true.
 */
export function createInput({ cfg, isEnabled, onChange }) {
  let value = 0;

  const add = (delta) => {
    value += delta;
    onChange();
  };

  const onWheel = (e) => {
    if (!isEnabled()) return;
    e.preventDefault();
    add(normalizeWheel(e) * cfg.wheelSensitivity);
  };

  let lastTouchY = null;
  const onTouchStart = (e) => {
    lastTouchY = isEnabled() ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e) => {
    if (lastTouchY === null || !isEnabled()) return;
    const y = e.touches[0].clientY;
    add((lastTouchY - y) * cfg.touchSensitivity);
    lastTouchY = y;
  };
  const onTouchEnd = () => {
    lastTouchY = null;
  };

  const keyDeltas = {
    ArrowDown: cfg.keyStep,
    ArrowUp: -cfg.keyStep,
    PageDown: cfg.keyPageStep,
    PageUp: -cfg.keyPageStep,
  };
  const onKeyDown = (e) => {
    const delta = keyDeltas[e.key];
    if (delta === undefined || !isEnabled()) return;
    e.preventDefault();
    add(delta);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("keydown", onKeyDown);

  return {
    get value() {
      return value;
    },
    destroy() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}
