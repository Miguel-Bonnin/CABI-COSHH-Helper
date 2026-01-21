/**
 * @fileoverview Risk assessment calculation functions extracted for testability and reuse
 * @module riskCalculator
 *
 * Pure functions for calculating risk severity and likelihood scores
 * Extracted from coshhgeneratorv5.html for testability and reusability
 */

import { hPhraseSeverityMap } from '../config/hazards.js';
import { debug, info } from './logger.js';

/**
 * Valid units for quantity measurement
 * @constant {string[]}
 */
const VALID_UNITS = ['µg', 'mg', 'g', 'kg', 'µL', 'mL', 'L'];

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
    // Validate inputs
    if (!Array.isArray(hPhrases)) {
        throw new TypeError(
            `calculateOverallSeverity: hPhrases must be an array, got ${typeof hPhrases}`
        );
    }
    if (typeof signalWord !== 'string') {
        throw new TypeError(
            `calculateOverallSeverity: signalWord must be a string, got ${typeof signalWord}`
        );
    }

    debug('Calculating severity', { hPhrases, signalWord });

    // Handle empty H-phrases array
    if (hPhrases.length === 0) {
        const severity = getSignalWordSeverity(signalWord);
        debug('No H-phrases, using signal word only', { severity });
        return severity;
    }

    // Find highest severity from H-phrases
    let maxSeverity = getMaxHPhraseSeverity(hPhrases);

    // If no H-phrases matched, use default severity
    if (maxSeverity === 0) {
        maxSeverity = hPhraseSeverityMap['default'];
    }

    // Apply signal word fallback (only if it would increase severity)
    const signalWordSeverity = getSignalWordSeverity(signalWord);
    const finalSeverity = Math.max(maxSeverity, signalWordSeverity);

    debug('Severity calculation complete', {
        maxSeverity,
        signalWordSeverity,
        finalSeverity,
        dominantHazard: hPhrases[0]
    });

    return finalSeverity;
}

/**
 * Normalize quantity to base unit (mL for liquids, or generic base for mass)
 *
 * @param {number} quantity - The quantity value
 * @param {string} unit - The unit (µg, mg, g, kg, µL, mL, L)
 * @returns {number} Normalized quantity in base unit
 * @private
 *
 * The original code treats mL/mg/g as base units, with:
 * - Micro units (µL, µg) divided by 1000
 * - Large units (L, kg) multiplied by 1000
 * This gives us a consistent scale where:
 * - 1000µL = 1mL
 * - 1000µg = 1mg
 * - 1L = 1000mL
 * - 1kg = 1000g
 */
function normalizeQuantity(quantity, unit) {
    let normalized = quantity;

    // Convert micro units (divide by 1000)
    if (['µL', 'µg'].includes(unit)) {
        normalized /= 1000;
    }

    // Convert large units (multiply by 1000)
    if (['L', 'kg'].includes(unit)) {
        normalized *= 1000;
    }

    // g needs to be converted to mg (multiply by 1000)
    // This ensures 1000mg = 1g in normalized form
    if (unit === 'g') {
        normalized *= 1000;
    }

    // mg and mL are base units (no conversion)

    return normalized;
}

/**
 * Get quantity score based on normalized quantity thresholds
 *
 * @param {number} normalizedQuantity - Quantity in base units (mg or mL)
 * @returns {number} Score from 0-3
 * @private
 */
function getQuantityScore(normalizedQuantity) {
    if (normalizedQuantity > 500) return 3;
    if (normalizedQuantity > 50) return 2;
    if (normalizedQuantity > 1) return 1;
    return 0;
}

/**
 * Get frequency score based on task frequency
 *
 * @param {string} frequency - Task frequency (multiple_daily, daily, weekly, etc.)
 * @returns {number} Score from 0-3
 * @private
 */
function getFrequencyScore(frequency) {
    if (frequency === 'multiple_daily') return 3;
    if (frequency === 'daily') return 2;
    if (frequency === 'weekly') return 1;
    return 0;
}

/**
 * Get duration score based on task duration
 *
 * @param {string} duration - Task duration (very_long, long, medium, etc.)
 * @returns {number} Score from 0-3
 * @private
 */
function getDurationScore(duration) {
    if (duration === 'very_long') return 3;
    if (duration === 'long') return 2;
    if (duration === 'medium') return 1;
    return 0;
}

/**
 * Calculate overall likelihood score based on procedure, quantity, frequency, and duration
 *
 * @param {Object|null} procedureData - Procedure characteristics with exposureFactor and aerosol
 * @param {number} quantity - Amount used
 * @param {string} unit - Unit of measurement (µg, mg, g, kg, µL, mL, L)
 * @param {string} frequency - Task frequency (multiple_daily, daily, weekly, etc.)
 * @param {string} duration - Task duration (very_long, long, medium, etc.)
 * @returns {number} Likelihood score from 0-10
 *
 * Algorithm (from coshhgeneratorv5.html line 1081-1109):
 * 1. Base score from procedure exposureFactor * 3 + aerosol * 2
 * 2. If no procedure data, use default base of 1.5
 * 3. Add quantity factor based on normalized quantity thresholds
 * 4. Add material type bonus (handled via aerosol in procedureData)
 * 5. Add frequency multiplier (multiple_daily=3, daily=2, weekly=1)
 * 6. Add duration multiplier (very_long=3, long=2, medium=1)
 * 7. Cap final score at 10
 */
export function calculateOverallLikelihood(procedureData, quantity, unit, frequency, duration) {
    // Validate inputs
    if (typeof quantity !== 'number' || isNaN(quantity)) {
        throw new TypeError(
            `calculateOverallLikelihood: quantity must be a number, got ${typeof quantity}`
        );
    }
    if (quantity < 0) {
        throw new RangeError(
            `calculateOverallLikelihood: quantity must be non-negative, got ${quantity}`
        );
    }
    if (typeof unit !== 'string') {
        throw new TypeError(
            `calculateOverallLikelihood: unit must be a string, got ${typeof unit}`
        );
    }
    if (!VALID_UNITS.includes(unit)) {
        throw new TypeError(
            `calculateOverallLikelihood: unit must be one of [${VALID_UNITS.join(', ')}], got '${unit}'`
        );
    }
    if (typeof frequency !== 'string') {
        throw new TypeError(
            `calculateOverallLikelihood: frequency must be a string, got ${typeof frequency}`
        );
    }
    if (typeof duration !== 'string') {
        throw new TypeError(
            `calculateOverallLikelihood: duration must be a string, got ${typeof duration}`
        );
    }

    debug('Calculating likelihood', {
        quantity,
        unit,
        frequency,
        duration,
        procedure: procedureData?.name || 'default'
    });

    let likelihoodScore = 0;

    // Step 1-2: Base score from procedure characteristics
    if (procedureData && procedureData.exposureFactor !== undefined) {
        likelihoodScore += (procedureData.exposureFactor || 0.5) * 3;
        likelihoodScore += (procedureData.aerosol || 0) * 2;
        debug('Base score from procedure', {
            exposureFactor: procedureData.exposureFactor,
            aerosol: procedureData.aerosol,
            baseScore: likelihoodScore
        });
    } else {
        // Default base score if no procedure data
        likelihoodScore += 1.5;
        debug('Using default base score (no procedure data)', { baseScore: 1.5 });
    }

    // Step 3: Add quantity factor based on normalized quantity
    const normalizedQuantity = normalizeQuantity(quantity, unit);
    const quantityScore = getQuantityScore(normalizedQuantity);
    likelihoodScore += quantityScore;
    debug('Quantity factor added', { normalizedQuantity, quantityScore, runningTotal: likelihoodScore });

    // Step 5: Add frequency multiplier
    const frequencyScore = getFrequencyScore(frequency);
    likelihoodScore += frequencyScore;
    debug('Frequency factor added', { frequency, frequencyScore, runningTotal: likelihoodScore });

    // Step 6: Add duration multiplier
    const durationScore = getDurationScore(duration);
    likelihoodScore += durationScore;
    debug('Duration factor added', { duration, durationScore, runningTotal: likelihoodScore });

    // Step 7: Cap at 10
    const finalLikelihood = Math.min(10, likelihoodScore);
    debug('Likelihood calculation complete', {
        uncappedScore: likelihoodScore,
        likelihood: finalLikelihood
    });

    return finalLikelihood;
}
