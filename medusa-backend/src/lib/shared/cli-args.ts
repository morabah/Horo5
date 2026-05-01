/**
 * Shared CLI argument helpers for Medusa `exec` scripts.  Extracted to
 * eliminate copy-paste clones of `normalizeArgs` and `readOption` across
 * inventory and catalog-sync scripts.
 */

/** Normalise raw Medusa `exec` args into a clean string array. */
export function normalizeArgs(args: unknown): string[] {
  return (Array.isArray(args) ? args : [])
    .filter((arg): arg is string => typeof arg === "string")
    .filter((arg) => arg !== "--")
}

/**
 * Read a named option from CLI args.
 * Supports `--name=value` (inline) or `--name value` (positional).
 */
export function readOption(args: string[], name: string): string | undefined {
  const prefix = `${name}=`
  const inline = args.find((arg) => arg.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)

  const index = args.indexOf(name)
  if (index >= 0) return args[index + 1]
  return undefined
}
