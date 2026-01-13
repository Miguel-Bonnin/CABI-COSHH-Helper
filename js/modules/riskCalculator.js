/**
 * Risk Calculator Module
 *
 * Pure functions for calculating risk severity and likelihood scores
 * Extracted from coshhgeneratorv5.html for testability and reusability
 */

import { hPhraseSeverityMap } from '../config/hazards.js';

/**
 * Calculate overall severity score based on H-phrases and signal word
 *
 * @param {string[]} hPhrases - Array of H-phrase codes (e.g., ['H350', 'H314'])
 * @param {string} signalWord - GHS signal word ('Danger', 'Warning', or '')
 * @returns {number} Severity score from 1-5
 *
 * Algorithm:
 * 1. Iterate through H-phrases to find highest severity in map
 * 2. Use pattern matching (startsWith) to handle variants (e.g., H360F matches H360)
 * 3. If no H-phrases matched, use signal word fallback:
 *    - 'Danger' → 3
 *    - 'Warning' → 2
 *    - Otherwise → 1
 * 4. Return highest severity found
 */
export function calculateOverallSeverity(hPhrases, signalWord) {
  let maxSeverity = 0;

  // If no H-phrases provided at all, set to 1
  if (hPhrases.length === 0) {
    maxSeverity = 1;
  }

  // Check each H-phrase against severity map
  hPhrases.forEach(phrase => {
    // Normalize to uppercase for case-insensitive matching
    const normalizedPhrase = phrase.toUpperCase();

    // Check for pattern match using startsWith for H-phrase variants
    for (const pattern in hPhraseSeverityMap) {
      if (pattern !== 'default' && normalizedPhrase.startsWith(pattern)) {
        if (hPhraseSeverityMap[pattern] > maxSeverity) {
          maxSeverity = hPhraseSeverityMap[pattern];
        }
      }
    }
  });

  // If no severity found from H-phrases but H-phrases were present, use default
  if (maxSeverity === 0 && hPhrases.length > 0) {
    maxSeverity = hPhraseSeverityMap['default'];
  }

  // Apply signal word fallback
  const normalizedSignalWord = signalWord.trim();
  if (normalizedSignalWord.toLowerCase() === 'danger' && maxSeverity < 4) {
    maxSeverity = Math.max(maxSeverity, 3);
  }
  if (normalizedSignalWord.toLowerCase() === 'warning' && maxSeverity < 2) {
    maxSeverity = Math.max(maxSeverity, 2);
  }

  return maxSeverity;
}
