<?php
// Chiamata all'API di Claude (Messages API) con cURL.
declare(strict_types=1);

/**
 * Restituisce il testo della risposta, oppure null se qualcosa va storto.
 * Gli errori tecnici finiscono in data/errors.log, mai al visitatore.
 */
function ask_claude(array $config, string $system, array $messages): ?string
{
    $payload = json_encode([
        'model'      => $config['model'],
        'max_tokens' => $config['max_tokens'],
        'system'     => $system,
        'messages'   => $messages,
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTPHEADER     => [
            'content-type: application/json',
            'x-api-key: ' . $config['api_key'],
            'anthropic-version: 2023-06-01',
        ],
    ]);

    $response = curl_exec($ch);
    $status   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($response === false || $status !== 200) {
        log_error(dirname(__DIR__) . '/data', "HTTP $status $curlErr " . substr((string) $response, 0, 300));
        return null;
    }

    $data = json_decode($response, true);
    $text = $data['content'][0]['text'] ?? null;
    return is_string($text) && trim($text) !== '' ? trim($text) : null;
}

function log_error(string $dataDir, string $message): void
{
    ensure_dir($dataDir);
    @file_put_contents($dataDir . '/errors.log', date('c') . ' ' . $message . "\n", FILE_APPEND | LOCK_EX);
}
