'use client';

import { useState, useEffect } from 'react';
import { getFlag, type FeatureFlagDefinition, type FeatureFlagValue } from '../utils/featureFlags';

/**
 * React hook for reading a feature flag value.
 * Returns the default on SSR / first render, then resolves from localStorage/experiment on mount.
 */
export function useFeatureFlag(definition: FeatureFlagDefinition): FeatureFlagValue {
  const [value, setValue] = useState<FeatureFlagValue>(definition.defaultValue);

  useEffect(() => {
    setValue(getFlag(definition));
  }, [definition]);

  return value;
}

/**
 * Convenience: boolean flag check.
 */
export function useFlagEnabled(definition: FeatureFlagDefinition): boolean {
  const val = useFeatureFlag(definition);
  return val === true || val === 'true' || val === 1 || val === '1';
}
