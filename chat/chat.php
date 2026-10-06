<?php
// Endpoint della chat. Riceve la conversazione, applica i controlli
// e chiede la risposta all'API di Claude. La chiave API resta solo qui.
declare(strict_types=1);

$private = __DIR__ . '/private';

require $private . '/lib/respond.php';
require $private . '/lib/input.php';
require $private . '/lib/ratelimit.php';
require $private . '/lib/log.php';
require $private . '/lib/anthropic.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!is_file($private . '/config.php')) {
    fail(500, 'Chat non configurata.');
}
$config = require $private . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail(405, 'Metodo non consentito.');
}

// Accetta solo richieste che arrivano dal sito
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, $config['allowed_origins'], true)) {
    fail(403, 'Origine non consentita.');
}

// Messaggi dal browser, ripuliti e limitati
$body = json_decode(file_get_contents('php://input') ?: '', true);
$messages = clean_messages($body['messages'] ?? null, $config);
if ($messages === null) {
    fail(400, 'Messaggio non valido o troppo lungo.');
}

// Limiti di utilizzo: per visitatore e totale giornaliero
$dataDir = $private . '/data';
$ipHash  = hash_ip($_SERVER['REMOTE_ADDR'] ?? '', $config['ip_salt']);

if (!rate_allow($dataDir, $ipHash, $config['rate_limit']['max'], $config['rate_limit']['window'])) {
    fail(429, 'Hai fatto molte domande in poco tempo. Riprova tra qualche minuto.');
}
if (!daily_allow($dataDir, $config['daily_cap'])) {
    fail(429, 'La chat ha raggiunto il limite di oggi. Riprova domani o scrivi ad Andrea dal modulo contatti.');
}

// Prompt di sistema: regole + dati del profilo
$system = trim((string) file_get_contents($private . '/prompt.md'))
    . "\n\n--- PROFILO DI ANDREA ---\n"
    . trim((string) file_get_contents($private . '/profilo.md'));

$answer = ask_claude($config, $system, $messages);
if ($answer === null) {
    fail(502, 'Al momento non riesco a rispondere. Riprova tra poco.');
}

log_chat($dataDir, $ipHash, end($messages)['content'], $answer);

echo json_encode(['reply' => $answer], JSON_UNESCAPED_UNICODE);
