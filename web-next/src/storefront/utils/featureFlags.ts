/**
 * Lightweight feature-flag and A/B cohort bucketing.
 * No external service required — deterministic hashing on a stable visitor id.
 *
 * Flags are persisted in localStorage so the same visitor always sees the same variant.
 */

const FLAG_PREFIX = 'horo-flag-v1:';
const VISITOR_ID_KEY = 'horo-visitor-id';

export type FeatureFlagValue = string | boolean | number;

export type FeatureFlagDefinition = {
  /** Unique flag key */
  key: string;
  /** default when no local override and not in an experiment */
  defaultValue: FeatureFlagValue;
  /** optional A/B test: array of variant values */
  experiment?: {
    variants: FeatureFlagValue[];
    /** 0–1 rollout fraction (default 1 = 100%) */
    rollout?: number;
  };
};

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

/**
 * Simple string hash → integer in [0, 1)
 */
export function hashFraction(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0; // to 32-bit signed int
  }
  const positive = Math.abs(h);
  return positive / 0x7fffffff; // max 32-bit signed positive
}

export function resolveExperimentVariant(
  definition: FeatureFlagDefinition,
  visitorId: string,
): FeatureFlagValue | null {
  if (!definition.experiment || definition.experiment.variants.length === 0) {
    return null;
  }

  const { variants, rollout = 1 } = definition.experiment;
  const frac = hashFraction(`${visitorId}:${definition.key}`);

  if (frac > rollout) {
    // outside rollout — return default
    return null;
  }

  // Bucket into variant
  const variantIndex = Math.floor(frac / (rollout / variants.length));
  return variants[Math.min(variantIndex, variants.length - 1)];
}

function readLocalOverride(key: string): FeatureFlagValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${FLAG_PREFIX}${key}`);
    if (raw === null) return null;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    const num = Number(raw);
    if (!Number.isNaN(num) && raw === String(num)) return num;
    return raw;
  } catch {
    return null;
  }
}

function writeLocalOverride(key: string, value: FeatureFlagValue): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${FLAG_PREFIX}${key}`, String(value));
  } catch {
    // ignore
  }
}

/**
 * Get the resolved value for a feature flag.
 * Priority: localStorage override → experiment bucket → default.
 */
export function getFlag(definition: FeatureFlagDefinition): FeatureFlagValue {
  const override = readLocalOverride(definition.key);
  if (override !== null) return override;

  const visitorId = getVisitorId();
  const variant = resolveExperimentVariant(definition, visitorId);
  if (variant !== null) {
    writeLocalOverride(definition.key, variant);
    return variant;
  }

  return definition.defaultValue;
}

/**
 * Convenience: boolean flag check.
 */
export function isEnabled(definition: FeatureFlagDefinition): boolean {
  const val = getFlag(definition);
  return val === true || val === 'true' || val === 1 || val === '1';
}

/**
 * Force a flag value (e.g. from URL param for preview).
 */
export function setFlag(key: string, value: FeatureFlagValue): void {
  writeLocalOverride(key, value);
}

/**
 * Clear a local override so the experiment bucket re-applies.
 */
export function clearFlag(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${FLAG_PREFIX}${key}`);
  } catch {
    // ignore
  }
}

// ─── Pre-defined flags ─────────────────────────────────────────────

/** Compact home layout experiment (Phase 1) */
export const COMPACT_HOME_FLAG: FeatureFlagDefinition = {
  key: 'compact_home',
  defaultValue: false,
  experiment: {
    variants: [true, false],
    rollout: 0.5,
  },
};

/** PDP cross-sell widget experiment */
export const PDP_CROSS_SELL_FLAG: FeatureFlagDefinition = {
  key: 'pdp_cross_sell',
  defaultValue: true,
};

/** Exit-intent modal experiment */
export const EXIT_INTENT_FLAG: FeatureFlagDefinition = {
  key: 'exit_intent',
  defaultValue: true,
};

/** Referral program visibility */
export const REFERRAL_PROGRAM_FLAG: FeatureFlagDefinition = {
  key: 'referral_program',
  defaultValue: true,
};
