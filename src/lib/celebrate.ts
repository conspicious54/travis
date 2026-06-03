import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#fb923c', '#fbbf24', '#22c55e', '#3b82f6', '#ffffff'];

export function celebrateConfirm() {
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 35,
    origin: { x: 0.5, y: 0.6 },
    colors: BRAND_COLORS,
    scalar: 0.9,
    ticks: 200,
  });
  vibrate([15, 30, 15]);
}

export function celebrateStepAdvance() {
  confetti({
    particleCount: 22,
    spread: 55,
    startVelocity: 20,
    origin: { x: 0.5, y: 0.55 },
    colors: BRAND_COLORS,
    scalar: 0.6,
    ticks: 90,
    gravity: 1.1,
  });
  vibrate(10);
}

export function celebrateComplete() {
  // Two-pulse celebration from both sides
  confetti({
    particleCount: 120,
    spread: 110,
    startVelocity: 45,
    origin: { x: 0.15, y: 0.7 },
    colors: BRAND_COLORS,
    angle: 60,
    scalar: 1.0,
  });
  confetti({
    particleCount: 120,
    spread: 110,
    startVelocity: 45,
    origin: { x: 0.85, y: 0.7 },
    colors: BRAND_COLORS,
    angle: 120,
    scalar: 1.0,
  });
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 130,
      startVelocity: 30,
      origin: { x: 0.5, y: 0.55 },
      colors: BRAND_COLORS,
      scalar: 0.85,
    });
  }, 280);
  vibrate([20, 40, 20, 40, 20]);
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    /* no-op */
  }
}
