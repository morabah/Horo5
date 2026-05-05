/**
 * Simple console logger for the migration pipeline.
 */

export function info(message: string): void {
  console.log(`[info] ${message}`);
}

export function dryRun(message: string): void {
  console.log(`[dry-run] ${message}`);
}

export function success(message: string): void {
  console.log(`[ok] ${message}`);
}

export function warn(message: string): void {
  console.warn(`[warn] ${message}`);
}

export function error(message: string): void {
  console.error(`[err] ${message}`);
}

export function section(title: string): void {
  console.log(`\n--- ${title} ---`);
}
