"use client";

const prefix = "fitness-os-signout-intent:";
const lifetime = 5000;
const intents = new Map<string, number>();

/** Mark only after the user has handled or explicitly discarded pending edits. */
export function markIntentionalSignOut(userId: string): void {
  const timestamp = Date.now();
  intents.set(userId, timestamp);
  try { localStorage.setItem(`${prefix}${userId}`, String(timestamp)); } catch { /* Memory still covers this tab. */ }
  setTimeout(() => {
    if (intents.get(userId) === timestamp) intents.delete(userId);
    try {
      if (localStorage.getItem(`${prefix}${userId}`) === String(timestamp)) localStorage.removeItem(`${prefix}${userId}`);
    } catch { /* Storage may be unavailable. */ }
  }, lifetime);
}

/** A short-lived, token-free signal distinguishes explicit cross-tab logout. */
export function wasIntentionalSignOut(userId: string): boolean {
  const now = Date.now();
  let timestamp = intents.get(userId);
  try {
    const saved = localStorage.getItem(`${prefix}${userId}`);
    if (saved !== null) timestamp = Number(saved);
  } catch { /* Fall back to this tab's marker. */ }
  if (timestamp !== undefined && Number.isFinite(timestamp) && timestamp <= now && now - timestamp < lifetime) return true;
  intents.delete(userId);
  try { localStorage.removeItem(`${prefix}${userId}`); } catch { /* Storage may be unavailable. */ }
  return false;
}
