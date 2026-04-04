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

/** First moment we treat as “next shipping day” at noon (simple weekend skip). */
export function getNextShippingAnchor(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  while (isWeekend(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export type PdpDeliveryRules = {
  cutoffHourLocal: number;
  cutoffMinuteLocal: number;
  standardMaxBusinessDays: number;
};

/**
 * PDP urgency line + “arrives by” using local same-day cutoff (not holiday-aware).
 * Templates use {hours}, {cutoffTime}, {date} placeholders.
 */
export function buildPdpDeliveryLines(
  now: Date,
  rules: PdpDeliveryRules,
  copy: {
    beforeCutoffHours: string;
    tightWindowHours: string;
    afterCutoff: string;
    weekendHold: string;
    arrivesByStandard: string;
  },
): { urgencyLine: string; arrivesLine: string } {
  const anchor = getNextShippingAnchor(now);
  const cutoff = new Date(anchor);
  cutoff.setHours(rules.cutoffHourLocal, rules.cutoffMinuteLocal, 0, 0);

  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const cutoffTime = timeFmt.format(cutoff);

  const shipDate = new Date(now);
  shipDate.setHours(12, 0, 0, 0);
  if (isWeekend(shipDate)) {
    const urgency = copy.weekendHold;
    const nextMon = getNextShippingAnchor(shipDate);
    const arrivesBy = addBusinessDays(nextMon, rules.standardMaxBusinessDays);
    return {
      urgencyLine: urgency,
      arrivesLine: copy.arrivesByStandard.replace('{date}', shortDate.format(arrivesBy)),
    };
  }

  if (now.getTime() <= cutoff.getTime()) {
    const msLeft = cutoff.getTime() - now.getTime();
    const hoursLeft = Math.max(1, Math.ceil(msLeft / 3_600_000));
    const urgency =
      hoursLeft <= 2
        ? copy.tightWindowHours.replace('{hours}', String(hoursLeft))
        : copy.beforeCutoffHours.replace('{hours}', String(hoursLeft)).replace('{cutoffTime}', cutoffTime);
    const arrivesBy = addBusinessDays(shipDate, rules.standardMaxBusinessDays);
    return {
      urgencyLine: urgency,
      arrivesLine: copy.arrivesByStandard.replace('{date}', shortDate.format(arrivesBy)),
    };
  }

  const tomorrow = new Date(shipDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const shipStart = getNextShippingAnchor(tomorrow);
  const arrivesBy = addBusinessDays(shipStart, rules.standardMaxBusinessDays);
  return {
    urgencyLine: copy.afterCutoff,
    arrivesLine: copy.arrivesByStandard.replace('{date}', shortDate.format(arrivesBy)),
  };
}
