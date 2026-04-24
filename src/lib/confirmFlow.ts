/* ───── confirm-click coordination ────────────────────────────────
   A tiny shared state module so the ConfirmationExitPopup knows
   when to suppress itself — we don't want the popup firing on
   visibilitychange while the user is in the middle of switching
   to the Messages / WhatsApp app to send the confirmation.
──────────────────────────────────────────────────────────────────── */

let lastConfirmClickAt = 0;

export function markConfirmClicked() {
  lastConfirmClickAt = Date.now();
}

export function hadRecentConfirmClick(windowMs = 30_000) {
  return Date.now() - lastConfirmClickAt < windowMs;
}
