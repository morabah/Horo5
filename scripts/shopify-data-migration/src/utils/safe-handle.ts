/**
 * Convert a string to a URL-safe handle.
 * Replaces spaces and special chars with hyphens, lowercase.
 */
export function toSafeHandle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate that a handle is safe and non-empty.
 */
export function validateHandle(handle: string, context: string): string {
  const safe = toSafeHandle(handle);
  if (!safe) {
    throw new Error(`Invalid handle derived from "${handle}" for ${context}`);
  }
  return safe;
}
