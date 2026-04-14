const HOME_WAITLIST_STORAGE_KEY = 'horo-home-waitlist-v1';

export function notifyHomeWaitlistSignup(email: string) {
  const normalized = email.trim().toLowerCase();
  const existing = loadHomeWaitlistEmails();
  const next = Array.from(new Set([...existing, normalized]));
  localStorage.setItem(HOME_WAITLIST_STORAGE_KEY, JSON.stringify(next));
  if (process.env.NODE_ENV === "development") {
    console.info('[HOME] waitlist signup', normalized);
  }
}

function loadHomeWaitlistEmails(): string[] {
  const raw = localStorage.getItem(HOME_WAITLIST_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}
