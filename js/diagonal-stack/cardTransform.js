import { clamp } from "./math.js";

/**
 * t = posizione della card lungo la diagonale, avvolta in loop.
 *   t = 0   -> card frontale (in basso a sinistra)
 *   t > 0   -> card più lontane (in alto a destra)
 *   t = -1  -> la card sta uscendo; subito dopo "salta" a t = total - 1,
 *              cioè in fondo alla diagonale, dove entra sfumando.
 *
 * t è sempre nell'intervallo [-1, total - 1).
 */
export function getT(index, progress, total) {
  const raw = index - progress;
  return ((((raw + 1) % total) + total) % total) - 1;
}

/**
 * Transform 3D della card.
 * - progress: indice "frazionario" della card frontale (guidato dallo scroll)
 * - velocity: velocità levigata dello scroll (px/s), guida la curva
 * - hoverLift: spostamento verticale extra in hover (px, negativo = verso l'alto)
 */
export function buildTransform(cfg, index, progress, velocity, total, hoverLift) {
  const t = getT(index, progress, total);

  // La curva è una "gobba" lungo la diagonale: nulla alle estremità,
  // massima in mezzo. Scroll verso il basso => la gobba sale.
  const bend = clamp(velocity * cfg.wavePerVelocity, -cfg.maxWave, cfg.maxWave);
  const u = clamp((t + 1) / total, 0, 1);
  const bump = Math.pow(Math.sin(Math.PI * u), cfg.bumpSharpness);
  const lift = -bend * bump;

  const tilt = clamp(velocity * cfg.tiltPerVelocity, -cfg.maxTilt, cfg.maxTilt) * bump;

  const x = cfg.baseX + t * cfg.stepX;
  const y = cfg.baseY + t * cfg.stepY + lift + hoverLift;
  const z = t * cfg.stepZ;

  return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${cfg.rotateY}deg) rotateX(${tilt.toFixed(3)}deg)`;
}

/**
 * Sfuma in uscita (basso a sinistra) e in ingresso (fondo della diagonale),
 * così il "salto" del loop non si vede.
 */
export function buildOpacity(index, progress, total) {
  const t = getT(index, progress, total);
  const fadeOut = clamp(1 + t, 0, 1);
  const fadeIn = clamp(total - 1 - t, 0, 1);
  return Math.min(fadeOut, fadeIn);
}
