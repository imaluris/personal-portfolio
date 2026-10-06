<?php
// Registro delle conversazioni: un file al mese, una riga JSON per domanda.
// Serve a capire come viene usata la chat. L'IP è salvato solo come impronta anonima.
declare(strict_types=1);

function log_chat(string $dataDir, string $ipHash, string $question, string $answer): void
{
    ensure_dir($dataDir);
    $line = json_encode([
        'time'     => date('c'),
        'visitor'  => $ipHash,
        'question' => $question,
        'answer'   => $answer,
    ], JSON_UNESCAPED_UNICODE);

    @file_put_contents($dataDir . '/chat-' . date('Y-m') . '.log', $line . "\n", FILE_APPEND | LOCK_EX);
}
