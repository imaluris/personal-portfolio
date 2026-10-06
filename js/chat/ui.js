// Interfaccia della chat: costruisce il widget e gestisce apertura, messaggi e input.
// Non sa nulla del server: quando l'utente invia un testo chiama onSend(testo).

const SUGGESTIONS = [
  'Che esperienze ha Andrea?',
  'Quali sono le sue competenze tecniche?',
  'Che progetti ha realizzato?',
];

const NOTE =
  'Assistente AI: può sbagliare. Le conversazioni possono essere registrate per migliorare il servizio.';

const CHAT_ICON =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// La pagina intercetta rotella, touch e frecce per cambiare sezione:
// dentro la chat devono funzionare normalmente (scorrere i messaggi, scrivere).
function isolateFromPage(panel) {
  ['wheel', 'touchstart', 'touchmove', 'touchend', 'keydown'].forEach((type) => {
    panel.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
  });
}

// Stesso effetto del cursore personalizzato usato nel modal dei progetti
function bindCursorRing(elements) {
  const ring = document.getElementById('cursor-ring');
  if (!ring) return;
  elements.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      ring.style.width = ring.style.height = '48px';
    });
    item.addEventListener('mouseleave', () => {
      ring.style.width = ring.style.height = '28px';
    });
  });
}

export function createChatUI({ onSend }) {
  const root = el('div', 'chat-widget');

  const launcher = el('button', 'chat-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-label', "Apri la chat con l'assistente AI");
  launcher.setAttribute('aria-expanded', 'false');
  launcher.innerHTML = CHAT_ICON;

  const panel = el('section', 'chat-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', "Chat con l'assistente AI di Andrea");

  const header = el('header', 'chat-header');
  const titles = el('div');
  titles.append(el('p', 'chat-title', 'ASSISTENTE AI'), el('p', 'chat-subtitle', 'Chiedimi di Andrea'));
  const closeBtn = el('button', 'chat-close', '×');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Chiudi la chat');
  header.append(titles, closeBtn);

  const messages = el('div', 'chat-messages');
  messages.setAttribute('role', 'log');
  messages.setAttribute('aria-live', 'polite');

  const suggestions = el('div', 'chat-suggestions');
  SUGGESTIONS.forEach((text) => {
    const chip = el('button', 'chat-chip', text);
    chip.type = 'button';
    chip.addEventListener('click', () => submit(text));
    suggestions.append(chip);
  });

  const form = el('form', 'chat-form');
  const input = el('input', 'chat-input');
  input.type = 'text';
  input.maxLength = 300;
  input.placeholder = 'Scrivi una domanda…';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Scrivi una domanda su Andrea');
  const sendBtn = el('button', 'chat-send', 'INVIA');
  sendBtn.type = 'submit';
  form.append(input, sendBtn);

  const note = el('p', 'chat-note', NOTE);

  panel.append(header, messages, suggestions, form, note);
  root.append(launcher, panel);
  document.body.append(root);

  isolateFromPage(panel);
  bindCursorRing([launcher, closeBtn, sendBtn, input, ...suggestions.children]);

  let busy = false;
  let typingNode = null;

  function setOpen(open) {
    root.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus({ preventScroll: true });
    else launcher.focus({ preventScroll: true });
  }

  function addMessage(role, text) {
    const node = el('div', `chat-msg chat-msg--${role}`, text);
    messages.append(node);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    typingNode = el('div', 'chat-msg chat-msg--assistant chat-typing');
    typingNode.setAttribute('aria-label', 'Sto scrivendo');
    typingNode.append(el('span'), el('span'), el('span'));
    messages.append(typingNode);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    typingNode?.remove();
    typingNode = null;
  }

  function setBusy(value) {
    busy = value;
    input.disabled = value;
    sendBtn.disabled = value;
    if (!value) input.focus({ preventScroll: true });
  }

  function submit(text) {
    const clean = text.trim();
    if (!clean || busy) return;
    suggestions.remove();
    input.value = '';
    onSend(clean);
  }

  launcher.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
  closeBtn.addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(input.value);
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  return { addMessage, showTyping, hideTyping, setBusy };
}
