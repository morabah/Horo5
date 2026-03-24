/** Business days = Mon–Fri (simple shipping copy; not holiday-aware). */

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Advances from `from` by `n` business days (skips Sat/Sun). */
export function addBusinessDays(from: Date, n: number): Date {
  if (n <= 0) {
    const d = new Date(from);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) left -= 1;
  }
  return d;
}

const shortDate = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric' });

/** e.g. standard 3–5 business days from order date → "Mar 26 – Mar 30" */
export function formatDeliveryWindow(minBusinessDays: number, maxBusinessDays: number, from: Date = new Date()): string {
  const d0 = new Date(from);
  d0.setHours(12, 0, 0, 0);
  const start = addBusinessDays(d0, minBusinessDays);
  const end = addBusinessDays(d0, maxBusinessDays);
  return `${shortDate.format(start)} – ${shortDate.format(end)}`;
}
