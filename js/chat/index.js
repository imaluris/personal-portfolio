// Punto di ingresso della chat: collega l'interfaccia (ui.js) al server (api.js)
// e tiene la cronologia della conversazione.
import { sendMessages } from './api.js';
import { createChatUI } from './ui.js';

const WELCOME =
  'Ciao! Sono l\'assistente AI di Andrea. Posso raccontarti le sue esperienze, le competenze e i progetti. Cosa vuoi sapere?';

const history = [];

const ui = createChatUI({
  async onSend(text) {
    ui.addMessage('user', text);
    history.push({ role: 'user', content: text });
    ui.setBusy(true);
    ui.showTyping();

    try {
      const reply = await sendMessages(history);
      history.push({ role: 'assistant', content: reply });
      ui.addMessage('assistant', reply);
    } catch (err) {
      history.pop(); // la domanda non ha avuto risposta: si può riprovare
      ui.addMessage('error', err.message);
    } finally {
      ui.hideTyping();
      ui.setBusy(false);
    }
  },
});

ui.addMessage('assistant', WELCOME);
