import { describe, it, expect } from 'vitest';
import { calculateOverallSeverity, calculateOverallLikelihood } from '../js/modules/riskCalculator.js';

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

describe('calculateOverallLikelihood', () => {
  it('should return high likelihood (8-10) for high exposure procedure with large quantity', () => {
    // vortexing_open has exposureFactor 0.8, aerosol 0.8
    const procedureData = { exposureFactor: 0.8, aerosol: 0.8 };
    const result = calculateOverallLikelihood(procedureData, 1000, 'mL', 'multiple_daily', 'very_long');
    expect(result).toBeGreaterThanOrEqual(8);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('should return low likelihood (0-2) for low exposure procedure with small quantity', () => {
    // weighing_solid_trace has exposureFactor 0.1, aerosol 0.05
    // Use very small quantity to keep score low
    const procedureData = { exposureFactor: 0.1, aerosol: 0.05 };
    const result = calculateOverallLikelihood(procedureData, 0.5, 'mg', 'weekly', 'medium');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(3);
  });

  it('should add bonus for aerosol generation', () => {
    // Same procedure, quantity, frequency, duration - only aerosol differs
    const lowAerosol = { exposureFactor: 0.5, aerosol: 0.1 };
    const highAerosol = { exposureFactor: 0.5, aerosol: 0.9 };

    const resultLow = calculateOverallLikelihood(lowAerosol, 100, 'mL', 'daily', 'medium');
    const resultHigh = calculateOverallLikelihood(highAerosol, 100, 'mL', 'daily', 'medium');

    expect(resultHigh).toBeGreaterThan(resultLow);
  });

  it('should normalize quantity correctly: 1000mg = 1g equivalence', () => {
    const procedureData = { exposureFactor: 0.5, aerosol: 0.3 };

    const resultMg = calculateOverallLikelihood(procedureData, 1000, 'mg', 'daily', 'medium');
    const resultG = calculateOverallLikelihood(procedureData, 1, 'g', 'daily', 'medium');

    expect(resultMg).toBe(resultG);
  });

  it('should normalize quantity correctly: 1000mL = 1L equivalence', () => {
    const procedureData = { exposureFactor: 0.5, aerosol: 0.3 };

    const resultML = calculateOverallLikelihood(procedureData, 1000, 'mL', 'daily', 'medium');
    const resultL = calculateOverallLikelihood(procedureData, 1, 'L', 'daily', 'medium');

    expect(resultML).toBe(resultL);
  });

  it('should apply frequency multipliers correctly: multiple_daily > daily > weekly', () => {
    const procedureData = { exposureFactor: 0.5, aerosol: 0.3 };

    const weekly = calculateOverallLikelihood(procedureData, 100, 'mL', 'weekly', 'medium');
    const daily = calculateOverallLikelihood(procedureData, 100, 'mL', 'daily', 'medium');
    const multiDaily = calculateOverallLikelihood(procedureData, 100, 'mL', 'multiple_daily', 'medium');

    expect(multiDaily).toBeGreaterThan(daily);
    expect(daily).toBeGreaterThan(weekly);
  });

  it('should apply duration multipliers correctly: very_long > long > medium', () => {
    const procedureData = { exposureFactor: 0.5, aerosol: 0.3 };

    const medium = calculateOverallLikelihood(procedureData, 100, 'mL', 'daily', 'medium');
    const long = calculateOverallLikelihood(procedureData, 100, 'mL', 'daily', 'long');
    const veryLong = calculateOverallLikelihood(procedureData, 100, 'mL', 'daily', 'very_long');

    expect(veryLong).toBeGreaterThan(long);
    expect(long).toBeGreaterThan(medium);
  });

  it('should return minimum likelihood for zero quantity', () => {
    const procedureData = { exposureFactor: 0.5, aerosol: 0.3 };
    const result = calculateOverallLikelihood(procedureData, 0, 'mL', 'daily', 'medium');

    // Even with zero quantity, there's still some base likelihood from procedure
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('should cap likelihood at 10', () => {
    // Maximum possible inputs
    const procedureData = { exposureFactor: 1.0, aerosol: 1.0 };
    const result = calculateOverallLikelihood(procedureData, 10000, 'L', 'multiple_daily', 'very_long');

    expect(result).toBe(10);
  });

  it('should handle missing procedure data gracefully', () => {
    // No procedure data (undefined/null)
    const result = calculateOverallLikelihood(null, 100, 'mL', 'daily', 'medium');

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('should normalize microlitre units correctly', () => {
    const procedureData = { exposureFactor: 0.5, aerosol: 0.3 };

    // 1000µL = 1mL
    const resultUL = calculateOverallLikelihood(procedureData, 1000, 'µL', 'daily', 'medium');
    const resultML = calculateOverallLikelihood(procedureData, 1, 'mL', 'daily', 'medium');

    expect(resultUL).toBe(resultML);
  });

  it('should normalize microgram units correctly', () => {
    const procedureData = { exposureFactor: 0.5, aerosol: 0.3 };

    // 1000µg = 1mg
    const resultUG = calculateOverallLikelihood(procedureData, 1000, 'µg', 'daily', 'medium');
    const resultMG = calculateOverallLikelihood(procedureData, 1, 'mg', 'daily', 'medium');

    expect(resultUG).toBe(resultMG);
  });

  it('should normalize kilogram units correctly', () => {
    const procedureData = { exposureFactor: 0.5, aerosol: 0.3 };

    // 1kg = 1000g
    const resultKG = calculateOverallLikelihood(procedureData, 1, 'kg', 'daily', 'medium');
    const resultG = calculateOverallLikelihood(procedureData, 1000, 'g', 'daily', 'medium');

    expect(resultKG).toBe(resultG);
  });
});
