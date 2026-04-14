/** Business days = Mon–Fri (simple shipping copy; not holiday-aware). */

const EGYPT_TIME_ZONE = 'Africa/Cairo';
const EGYPT_LOCAL_PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: EGYPT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  hourCycle: 'h23',
});
const SHORT_DATE = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const WALL_CLOCK_TIME = new Intl.DateTimeFormat('en-EG', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
});

type EgyptLocalParts = {
  day: number;
  hour: number;
  minute: number;
  month: number;
  weekday: number;
  year: number;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getEgyptLocalParts(from: Date): EgyptLocalParts {
  const parts = EGYPT_LOCAL_PARTS_FORMATTER.formatToParts(from);
  const lookup = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const weekday = WEEKDAY_INDEX[lookup('weekday')] ?? 0;

  return {
    day: Number(lookup('day')),
    hour: Number(lookup('hour')),
    minute: Number(lookup('minute')),
    month: Number(lookup('month')),
    weekday,
    year: Number(lookup('year')),
  };
}

function toBusinessDate(parts: Pick<EgyptLocalParts, 'day' | 'month' | 'year'>): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0));
}

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function formatCutoffTime(hour: number, minute: number): string {
  return WALL_CLOCK_TIME.format(new Date(Date.UTC(2000, 0, 1, hour, minute, 0, 0)));
}

/** Advances from `from` by `n` business days (skips Sat/Sun). */
export function addBusinessDays(from: Date, n: number): Date {
  if (n <= 0) {
    const d = new Date(from);
    d.setUTCHours(12, 0, 0, 0);
    return d;
  }
  const d = new Date(from);
  d.setUTCHours(12, 0, 0, 0);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (!isWeekend(d)) left -= 1;
  }
  return d;
}

/** e.g. standard 3–5 business days from order date → "Mar 26 – Mar 30" */
export function formatDeliveryWindow(minBusinessDays: number, maxBusinessDays: number, from: Date = new Date()): string {
  const base = toBusinessDate(getEgyptLocalParts(from));
  const start = addBusinessDays(base, minBusinessDays);
  const end = addBusinessDays(base, maxBusinessDays);
  return `${SHORT_DATE.format(start)} – ${SHORT_DATE.format(end)}`;
}

/** First moment we treat as “next shipping day” at noon (simple weekend skip). */
export function getNextShippingAnchor(from: Date = new Date()): Date {
  const d = toBusinessDate(getEgyptLocalParts(from));
  while (isWeekend(d)) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

export type PdpDeliveryRules = {
  cutoffHourLocal: number;
  cutoffMinuteLocal: number;
  /** Upper bound (business days) for “arrives by” copy — usually same as standard max window. */
  standardMaxBusinessDays: number;
  /** Standard tier window shown on PDP (min inclusive business days from order anchor). */
  standardMinDays: number;
  standardMaxDays: number;
  expressMinDays: number;
  expressMaxDays: number;
};

const RANGE_DASH = "\u2013";

/** PDP label line — must track Medusa `metadata.delivery` (not static copy). */
export function formatPdpStandardBadgeLabel(rules: PdpDeliveryRules): string {
  return `Standard · ${rules.standardMinDays}${RANGE_DASH}${rules.standardMaxDays} business days`;
}

export function formatPdpExpressBadgeLabel(rules: PdpDeliveryRules): string {
  return `Express · ${rules.expressMinDays}${RANGE_DASH}${rules.expressMaxDays} business days`;
}

/**
 * PDP urgency line + “arrives by” using Egypt-local same-day cutoff (not holiday-aware).
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
  const egyptNow = getEgyptLocalParts(now);
  const shipDate = toBusinessDate(egyptNow);
  const cutoffTime = formatCutoffTime(rules.cutoffHourLocal, rules.cutoffMinuteLocal);
  const cutoffMinutes = rules.cutoffHourLocal * 60 + rules.cutoffMinuteLocal;
  const currentMinutes = egyptNow.hour * 60 + egyptNow.minute;

  if (isWeekend(shipDate)) {
    const nextBusinessDay = getNextShippingAnchor(shipDate);
    const arrivesBy = addBusinessDays(nextBusinessDay, rules.standardMaxBusinessDays);
    return {
      urgencyLine: copy.weekendHold,
      arrivesLine: copy.arrivesByStandard.replace('{date}', SHORT_DATE.format(arrivesBy)),
    };
  }

  if (currentMinutes <= cutoffMinutes) {
    const minutesLeft = cutoffMinutes - currentMinutes;
    const hoursLeft = Math.max(1, Math.ceil(minutesLeft / 60));
    const urgency =
      hoursLeft <= 2
        ? copy.tightWindowHours.replace('{hours}', String(hoursLeft))
        : copy.beforeCutoffHours.replace('{hours}', String(hoursLeft)).replace('{cutoffTime}', cutoffTime);
    const arrivesBy = addBusinessDays(shipDate, rules.standardMaxBusinessDays);
    return {
      urgencyLine: urgency,
      arrivesLine: copy.arrivesByStandard.replace('{date}', SHORT_DATE.format(arrivesBy)),
    };
  }

  const tomorrow = new Date(shipDate);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const shipStart = getNextShippingAnchor(tomorrow);
  const arrivesBy = addBusinessDays(shipStart, rules.standardMaxBusinessDays);
  return {
    urgencyLine: copy.afterCutoff,
    arrivesLine: copy.arrivesByStandard.replace('{date}', SHORT_DATE.format(arrivesBy)),
  };
}
