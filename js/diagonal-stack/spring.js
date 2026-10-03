const SUBSTEP = 1 / 240; // passo fisso: stabile anche con molle rigide
const MAX_DT = 0.05; // se la scheda resta in background non facciamo salti enormi

/**
 * Spring fisica (stessa convenzione di Motion: stiffness, damping, mass).
 * Si imposta `target`, si chiama update(dt) a ogni frame e si legge `value`.
 */
export function createSpring(initial, { stiffness, damping, mass }) {
  const spring = {
    value: initial,
    velocity: 0,
    target: initial,

    update(dt) {
      let remaining = Math.min(dt, MAX_DT);
      while (remaining > 0) {
        const step = Math.min(SUBSTEP, remaining);
        const force = -stiffness * (spring.value - spring.target) - damping * spring.velocity;
        spring.velocity += (force / mass) * step;
        spring.value += spring.velocity * step;
        remaining -= step;
      }
    },

    /** true quando è (praticamente) ferma sul target */
    isSettled(precision = 0.05) {
      return (
        Math.abs(spring.velocity) < precision &&
        Math.abs(spring.value - spring.target) < precision
      );
    },
  };

  return spring;
}
