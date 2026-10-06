<?php
// Pulizia dei messaggi che arrivano dal browser.
// Il browser non è affidabile: qualsiasi cosa può essere stata modificata.
declare(strict_types=1);

/**
 * Restituisce l'elenco di messaggi pronto per l'API, oppure null se non valido.
 * - tiene solo gli ultimi N messaggi
 * - accetta solo i ruoli "user" e "assistant"
 * - l'ultimo messaggio deve essere dell'utente e non superare il limite di caratteri
 * - i messaggi precedenti vengono accorciati (non possono essere usati per iniettare testi lunghi)
 */
function clean_messages(mixed $raw, array $config): ?array
{
    if (!is_array($raw) || $raw === []) {
        return null;
    }

    $raw = array_slice($raw, -$config['max_history']);
    $maxLast = $config['max_message_chars'];
    $clean = [];

    foreach ($raw as $m) {
        if (!is_array($m) || !isset($m['role'], $m['content']) || !is_string($m['content'])) {
            return null;
        }
        if ($m['role'] !== 'user' && $m['role'] !== 'assistant') {
            return null;
        }
        $text = trim($m['content']);
        if ($text === '') {
            return null;
        }
        $clean[] = ['role' => $m['role'], 'content' => mb_substr($text, 0, 600)];
    }

    // L'API vuole che si parta da "user"
    while ($clean !== [] && $clean[0]['role'] !== 'user') {
        array_shift($clean);
    }

    $last = end($clean);
    if ($last === false || $last['role'] !== 'user') {
        return null;
    }

    $lastOriginal = trim((string) $raw[array_key_last($raw)]['content']);
    if (mb_strlen($lastOriginal) > $maxLast) {
        return null;
    }
    $clean[array_key_last($clean)]['content'] = $lastOriginal;

    return $clean;
}

/** Impronta anonima del visitatore: serve per i limiti e i log, non è reversibile. */
function hash_ip(string $ip, string $salt): string
{
    return substr(hash('sha256', $ip . '|' . $salt), 0, 16);
}
