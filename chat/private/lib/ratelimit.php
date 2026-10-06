<?php
// Limiti di utilizzo salvati in piccoli file JSON (l'hosting non ha un database).
declare(strict_types=1);

function ensure_dir(string $dir): void
{
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
}

/**
 * Massimo $max messaggi ogni $window secondi per visitatore.
 * Restituisce false se il visitatore ha superato il limite.
 */
function rate_allow(string $dataDir, string $ipHash, int $max, int $window): bool
{
    ensure_dir($dataDir);
    $file = $dataDir . '/rl_' . $ipHash . '.json';
    $fh = fopen($file, 'c+');
    if ($fh === false) {
        return true; // meglio non bloccare tutti se il disco ha problemi
    }
    flock($fh, LOCK_EX);

    $now = time();
    $times = json_decode((string) stream_get_contents($fh), true);
    $times = is_array($times) ? $times : [];
    $times = array_values(array_filter($times, fn ($t) => is_int($t) && $t > $now - $window));

    $allowed = count($times) < $max;
    if ($allowed) {
        $times[] = $now;
    }

    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($times));
    flock($fh, LOCK_UN);
    fclose($fh);

    cleanup_old_files($dataDir);
    return $allowed;
}

/** Tetto di messaggi al giorno per tutto il sito: protegge la spesa. */
function daily_allow(string $dataDir, int $cap): bool
{
    ensure_dir($dataDir);
    $fh = fopen($dataDir . '/daily_' . date('Ymd') . '.txt', 'c+');
    if ($fh === false) {
        return true;
    }
    flock($fh, LOCK_EX);

    $count = (int) trim((string) stream_get_contents($fh));
    $allowed = $count < $cap;
    if ($allowed) {
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, (string) ($count + 1));
    }

    flock($fh, LOCK_UN);
    fclose($fh);
    return $allowed;
}

/** Ogni tanto elimina i file dei limiti più vecchi di un giorno. */
function cleanup_old_files(string $dataDir): void
{
    if (random_int(1, 50) !== 1) {
        return;
    }
    foreach (glob($dataDir . '/{rl_*.json,daily_*.txt}', GLOB_BRACE) ?: [] as $f) {
        if (filemtime($f) < time() - 86400) {
            @unlink($f);
        }
    }
}
