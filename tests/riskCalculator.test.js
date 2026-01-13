import { describe, it, expect } from 'vitest';
import { calculateOverallSeverity } from '../js/modules/riskCalculator.js';

describe('calculateOverallSeverity', () => {
  it('should return severity 5 for H350 (carcinogen)', () => {
    const result = calculateOverallSeverity(['H350'], '');
    expect(result).toBe(5);
  });

  it('should return severity 4 for H314 (severe skin burns)', () => {
    const result = calculateOverallSeverity(['H314'], '');
    expect(result).toBe(4);
  });

  it('should return severity 3 for signal word "Danger" with no H-phrases', () => {
    const result = calculateOverallSeverity([], 'Danger');
    expect(result).toBe(3);
  });

  it('should return severity 2 for signal word "Warning" with no H-phrases', () => {
    const result = calculateOverallSeverity([], 'Warning');
    expect(result).toBe(2);
  });

  it('should return severity 1 for no hazards (empty array, no signal word)', () => {
    const result = calculateOverallSeverity([], '');
    expect(result).toBe(1);
  });

  it('should return highest severity when multiple H-phrases are present', () => {
    // H302 = severity 3, H350 = severity 5, H315 = severity 3
    const result = calculateOverallSeverity(['H302', 'H350', 'H315'], '');
    expect(result).toBe(5);
  });

  it('should match H-phrases case insensitively', () => {
    const result = calculateOverallSeverity(['h350'], '');
    expect(result).toBe(5);
  });

  it('should handle signal word case insensitively', () => {
    const result = calculateOverallSeverity([], 'danger');
    expect(result).toBe(3);
  });

  it('should prioritize H-phrase severity over signal word', () => {
    // H350 = severity 5, but Danger = 3, should return 5
    const result = calculateOverallSeverity(['H350'], 'Danger');
    expect(result).toBe(5);
  });

  it('should return default severity 1 for unrecognized H-phrases', () => {
    const result = calculateOverallSeverity(['H999'], '');
    expect(result).toBe(1);
  });

  it('should handle partial H-phrase matches (e.g., H360F should match H360)', () => {
    // H360F (reproductive toxicity - fertility) should match H360 prefix
    const result = calculateOverallSeverity(['H360F'], '');
    expect(result).toBe(5);
  });
});
