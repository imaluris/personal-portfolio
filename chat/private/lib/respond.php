<?php
// Risposta di errore in JSON e fine della richiesta.
declare(strict_types=1);

function fail(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
