/**
 * Minimal logger for the seeder script.
 * Respects --verbose flag. Always prints errors and summaries.
 */

let _verbose = false;

export function setVerbose(value: boolean): void {
  _verbose = value;
}

export function info(message: string): void {
  if (_verbose) {
    console.log(`[info] ${message}`);
  }
}

export function success(message: string): void {
  console.log(`\x1b[32m[ok]\x1b[0m ${message}`);
}

export function warn(message: string): void {
  console.log(`\x1b[33m[warn]\x1b[0m ${message}`);
}

export function error(message: string): void {
  console.error(`\x1b[31m[err]\x1b[0m ${message}`);
}

export function dryRun(message: string): void {
  console.log(`\x1b[34m[dry-run]\x1b[0m ${message}`);
}

export function section(title: string): void {
  console.log(`\n--- ${title} ---`);
}
