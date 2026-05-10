import { hashFraction, resolveExperimentVariant, type FeatureFlagDefinition } from '../featureFlags';

describe('hashFraction', () => {
  it('returns a value between 0 and 1', () => {
    const result = hashFraction('test-user-123');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });

  it('is deterministic for the same input', () => {
    const a = hashFraction('same-input');
    const b = hashFraction('same-input');
    expect(a).toBe(b);
  });

  it('spreads roughly across the range', () => {
    const values = Array.from({ length: 100 }, (_, i) => hashFraction(`input-${i}`));
    const min = Math.min(...values);
    const max = Math.max(...values);
    expect(max - min).toBeGreaterThan(0.5);
  });
});

describe('resolveExperimentVariant', () => {
  const definition: FeatureFlagDefinition = {
    key: 'test_flag',
    defaultValue: false,
    experiment: {
      variants: ['a', 'b', 'c'],
      rollout: 1,
    },
  };

  it('returns a variant from the list', () => {
    const result = resolveExperimentVariant(definition, 'visitor-1');
    expect(definition.experiment?.variants).toContain(result);
  });

  it('is deterministic for the same visitor', () => {
    const a = resolveExperimentVariant(definition, 'visitor-2');
    const b = resolveExperimentVariant(definition, 'visitor-2');
    expect(a).toBe(b);
  });

  it('returns null when rollout is 0', () => {
    const zeroRollout: FeatureFlagDefinition = {
      key: 'zero',
      defaultValue: false,
      experiment: { variants: ['a', 'b'], rollout: 0 },
    };
    expect(resolveExperimentVariant(zeroRollout, 'v')).toBeNull();
  });

  it('returns null when no experiment', () => {
    const noExp: FeatureFlagDefinition = {
      key: 'noexp',
      defaultValue: true,
    };
    expect(resolveExperimentVariant(noExp, 'v')).toBeNull();
  });
});
