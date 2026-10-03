/** Crea un elemento con classe e (opzionale) testo. Usa textContent: niente HTML iniettato. */
export function h(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
