// Tutti i numeri da tweakare stanno qui.
// Le misure sono pensate per una scena di 1355 x 849 px;
// la scena viene poi scalata per adattarsi al contenitore.
// Ogni valore si può sovrascrivere dalle opzioni di createDiagonalStack().

export const defaultConfig = {
  // Scena
  stageW: 1355,
  stageH: 849,
  perspective: 1600,

  // Card
  cardW: 290,
  cardH: 400,
  rotateY: 20, // gradi: angolo delle card rispetto allo schermo

  // Posizione della card "frontale" (t = 0), rispetto al centro della scena
  baseX: -380,
  baseY: 190,

  // Passo tra una card e la successiva lungo la diagonale
  stepX: 150, // verso destra
  stepY: -95, // verso l'alto
  stepZ: -220, // verso il fondo (profondità)

  // Scroll: quanti pixel di scroll servono per far avanzare di una card
  scrollPerCard: 400,

  // Sensibilità degli input
  wheelSensitivity: 1,
  touchSensitivity: 1.4,
  keyStep: 120, // frecce su/giù
  keyPageStep: 400, // PageUp / PageDown / Spazio

  // Spring che leviga lo scroll (più rigida = più reattiva)
  scrollSpring: { stiffness: 120, damping: 28, mass: 0.9 },

  // Spring che leviga la velocità (dà il rimbalzo alla curva)
  waveSpring: { stiffness: 80, damping: 16, mass: 1 },

  // Curva: di quanto si sollevano le card in base alla velocità
  wavePerVelocity: 0.1, // px per (px/s)
  maxWave: 200, // px
  bumpSharpness: 2, // 1 = arco largo, 2-3 = curva più stretta e netta

  // Inclinazione extra in base alla velocità
  tiltPerVelocity: 0.006, // gradi per (px/s)
  maxTilt: 10, // gradi

  // Hover
  hoverLift: 26, // px: di quanto si alza la card
  hoverSpring: { stiffness: 260, damping: 24, mass: 0.8 },

  // Card davanti a quella in hover: diventa trasparente per far leggere quella sotto
  ghostOpacity: 0.2, // 1 = nessun effetto, 0 = invisibile
  ghostSpring: { stiffness: 220, damping: 26, mass: 0.8 },
};
