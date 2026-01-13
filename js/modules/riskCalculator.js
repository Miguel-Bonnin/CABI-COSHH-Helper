/**
 * Risk Calculator Module
 *
 * Pure functions for calculating risk severity and likelihood scores
 * Extracted from coshhgeneratorv5.html for testability and reusability
 */

import { hPhraseSeverityMap } from '../config/hazards.js';

/**
 * Find the highest severity score from an array of H-phrases
 *
 * @param {string[]} hPhrases - Array of H-phrase codes
 * @returns {number} Highest severity score found, or 0 if none match
 * @private
 */
function getMaxHPhraseSeverity(hPhrases) {
  let maxSeverity = 0;

  for (const phrase of hPhrases) {
    const normalizedPhrase = phrase.toUpperCase();

    // Check each pattern in severity map (uses startsWith for H-phrase variants)
    for (const pattern in hPhraseSeverityMap) {
      if (pattern !== 'default' && normalizedPhrase.startsWith(pattern)) {
        maxSeverity = Math.max(maxSeverity, hPhraseSeverityMap[pattern]);
      }
    }
  }

  return maxSeverity;
}

/**
 * Get severity score based on GHS signal word
 *
 * @param {string} signalWord - GHS signal word ('Danger', 'Warning', or '')
 * @returns {number} Severity score: Danger=3, Warning=2, otherwise=1
 * @private
 */
function getSignalWordSeverity(signalWord) {
  const normalized = signalWord.trim().toLowerCase();
  if (normalized === 'danger') return 3;
  if (normalized === 'warning') return 2;
  return 1;
}

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
  // Handle empty H-phrases array
  if (hPhrases.length === 0) {
    return getSignalWordSeverity(signalWord);
  }

  // Find highest severity from H-phrases
  let maxSeverity = getMaxHPhraseSeverity(hPhrases);

  // If no H-phrases matched, use default severity
  if (maxSeverity === 0) {
    maxSeverity = hPhraseSeverityMap['default'];
  }

  // Apply signal word fallback (only if it would increase severity)
  const signalWordSeverity = getSignalWordSeverity(signalWord);
  return Math.max(maxSeverity, signalWordSeverity);
}
