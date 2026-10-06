// Comunicazione con il server: manda la conversazione a chat.php e restituisce la risposta.

// Per provare in locale si può impostare window.CHAT_ENDPOINT prima di caricare lo script.
const ENDPOINT = window.CHAT_ENDPOINT || '/chat/chat.php';
const TIMEOUT_MS = 35000;

export async function sendMessages(messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // risposta non JSON: gestita sotto
    }

    if (!res.ok || !data?.reply) {
      throw new Error(data?.error || 'Qualcosa è andato storto. Riprova tra poco.');
    }
    return data.reply;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La risposta sta impiegando troppo tempo. Riprova.');
    }
    if (err instanceof TypeError) {
      throw new Error('Connessione non riuscita. Controlla la rete e riprova.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
