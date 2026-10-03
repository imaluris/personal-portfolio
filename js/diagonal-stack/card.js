import { h } from "./dom.js";
import { createSpring } from "./spring.js";
import { buildTransform, buildOpacity } from "./cardTransform.js";

/**
 * "Adotta" una card che esiste già nell'HTML (la .project-card del sito):
 * non la ricrea, le aggiunge solo numero ed etichetta e ne gestisce il transform.
 * Restituisce { el, update, release }.
 *
 * - title: testo mostrato accanto alla linea in hover
 * - wake: sveglia il loop di animazione (serve per l'hover)
 */
export function adoptCard(el, title, index, total, cfg, wake) {
  const originalStyle = el.getAttribute("style");

  el.classList.add("ds-card");
  el.style.width = `${cfg.cardW}px`;
  el.style.height = `${cfg.cardH}px`;
  el.style.marginLeft = `${-cfg.cardW / 2}px`;
  el.style.marginTop = `${-cfg.cardH / 2}px`;

  const number = h("span", "ds-card__number", String(index + 1).padStart(2, "0"));
  const label = h("span", "ds-card__label");
  label.append(h("span", "ds-card__line"), h("span", "ds-card__name", title));
  el.append(number, label);

  // Sollevamento in hover: una spring che va da 0 a -hoverLift.
  // Chi decide quale card è in hover è lo stack (setHover), non il browser.
  const lift = createSpring(0, cfg.hoverSpring);

  // "Fantasma": 0 = card normale, 1 = trasparente (è davanti a quella in hover)
  const ghost = createSpring(0, cfg.ghostSpring);

  let lastPointerEvents = "";

  /** Aggiorna lo stile della card. Restituisce true se la sua spring è ferma. */
  function update(dt, progress, velocity) {
    lift.update(dt);
    ghost.update(dt);

    el.style.transform = buildTransform(cfg, index, progress, velocity, total, lift.value);

    const baseOpacity = buildOpacity(index, progress, total);
    const opacity = baseOpacity * (1 - ghost.value * (1 - cfg.ghostOpacity));
    el.style.opacity = opacity.toFixed(3);

    // Le card quasi invisibili (in uscita o in ingresso) non intercettano il mouse
    const pointerEvents = baseOpacity < 0.3 ? "none" : "auto";
    if (pointerEvents !== lastPointerEvents) {
      el.style.pointerEvents = pointerEvents;
      lastPointerEvents = pointerEvents;
    }

    return lift.isSettled(0.05) && ghost.isSettled(0.01);
  }

  /** Rimette la card com'era prima */
  function release() {
    number.remove();
    label.remove();
    el.classList.remove("ds-card", "is-hovered");
    if (originalStyle === null) el.removeAttribute("style");
    else el.setAttribute("style", originalStyle);
  }

  /** true = la card è quella sotto il mouse: si alza e mostra linea e nome */
  function setHover(value) {
    el.classList.toggle("is-hovered", value);
    lift.target = value ? -cfg.hoverLift : 0;
    wake();
  }

  /** true = rendi la card trasparente (e sveglia il loop se serve) */
  function setGhost(value) {
    const target = value ? 1 : 0;
    if (ghost.target === target) return;
    ghost.target = target;
    wake();
  }

  return { el, update, release, setGhost, setHover };
}
