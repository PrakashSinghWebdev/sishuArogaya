/**
 * Start hour (0–23, fractional) of a diet-plan meal slot like "7:00 – 8:00 AM",
 * "12:00 – 1:00 PM" or "10:30 AM". Slots with no clock time ("During night",
 * "Every 2–3 hours") return null.
 */
export function mealStartHour(time) {
  // first number + the first AM/PM after it — "7:00 – 8:00 AM" → 7 AM, "11 AM – 12 PM" → 11 AM
  const m = /(\d{1,2})(?::(\d{2}))?[^AP]*?(AM|PM)/i.exec(time || '');
  if (!m) return null;
  const h = Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  return h + Number(m[2] || 0) / 60;
}

/** Index of the meal happening now: the last one whose start time has passed (wraps to the last meal before the first). */
export function currentMealIndex(meals, now = new Date()) {
  const hour = now.getHours() + now.getMinutes() / 60;
  let idx = -1, latest = -1, lastTimed = -1;
  meals.forEach((meal, i) => {
    const start = mealStartHour(meal.time);
    if (start == null) return;
    lastTimed = i;
    if (start <= hour && start >= latest) { latest = start; idx = i; }
  });
  return idx === -1 ? lastTimed : idx;
}

/** One-line summary of a meal's foods; "pick one" lists show their first 2 choices. */
export function mealItemsText(meal) {
  return (meal.items || []).map((item) => item.type === 'options'
    ? item.options.slice(0, 2).map((o) => `${o.emoji} ${o.name}`).join(' / ')
    : `${item.emoji} ${item.name}${item.qty ? ` (${item.qty})` : ''}`
  ).join(' + ');
}
