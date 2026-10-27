// Accessibility: larger text for the whole app (Bootstrap sizes are rem-based, so this scales everything).
// Per-device preference, kept in this browser only.
export const TEXT_SIZES = { normal: '100%', large: '112.5%', xlarge: '125%' };
const KEY = 'sa_text_size';

export function getTextSize() {
  try { return TEXT_SIZES[localStorage.getItem(KEY)] ? localStorage.getItem(KEY) : 'normal'; } catch { return 'normal'; }
}

export function applyTextSize(size = getTextSize()) {
  document.documentElement.style.fontSize = TEXT_SIZES[size] || TEXT_SIZES.normal;
  try { localStorage.setItem(KEY, size); } catch { /* private mode: still applies for this visit */ }
}
