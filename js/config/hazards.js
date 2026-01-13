/**
 * Hazard Classification Configuration
 *
 * Maps H-phrases (Hazard statements) to:
 * 1. Severity scores (1-5) for risk calculation
 * 2. Hazard Groups (A-E, S) for control banding
 *
 * Used by:
 * - calculateOverallSeverity() for risk matrix
 * - determineRiskEvaluationParameters() for control group selection
 */

/**
 * H-Phrase to Severity Mapping
 *
 * Severity Scale:
 * 5 = Critical (Fatal toxicity, CMR substances)
 * 4 = High (Toxic, corrosive, suspected CMR)
 * 3 = Moderate (Harmful, irritant, organ damage)
 * 2 = Low (Aspiration hazard, aquatic toxicity)
 * 1 = Minimal (Default for unrecognized H-phrases)
 */
const hPhraseSeverityMap = {
    // Severity 5: Critical
    "H300": 5,  // Fatal if swallowed
    "H310": 5,  // Fatal in contact with skin
    "H330": 5,  // Fatal if inhaled
    "H340": 5,  // May cause genetic defects (Mutagen Cat 1)
    "H350": 5,  // May cause cancer (Carcinogen Cat 1)
    "H360": 5,  // May damage fertility or the unborn child (Reproductive Cat 1)
    "H370": 5,  // Causes damage to organs (STOT SE Cat 1)
    "H372": 5,  // Causes damage to organs through prolonged/repeated exposure (STOT RE Cat 1)

    // Severity 4: High
    "H301": 4,  // Toxic if swallowed
    "H311": 4,  // Toxic in contact with skin
    "H331": 4,  // Toxic if inhaled
    "H314": 4,  // Causes severe skin burns and eye damage
    "H318": 4,  // Causes serious eye damage
    "H334": 4,  // May cause allergy or asthma symptoms (Respiratory Sensitizer)
    "H341": 4,  // Suspected of causing genetic defects (Mutagen Cat 2)
    "H351": 4,  // Suspected of causing cancer (Carcinogen Cat 2)
    "H361": 4,  // Suspected of damaging fertility/unborn child (Reproductive Cat 2)
    "H371": 4,  // May cause damage to organs (STOT SE Cat 2)
    "H373": 4,  // May cause damage to organs through prolonged/repeated exposure (STOT RE Cat 2)

    // Severity 3: Moderate
    "H302": 3,  // Harmful if swallowed
    "H312": 3,  // Harmful in contact with skin
    "H332": 3,  // Harmful if inhaled
    "H315": 3,  // Causes skin irritation
    "H319": 3,  // Causes serious eye irritation
    "H317": 3,  // May cause an allergic skin reaction (Skin Sensitizer)
    "H335": 3,  // May cause respiratory irritation
    "H336": 3,  // May cause drowsiness or dizziness (Narcotic effects)
    "H224": 3,  // Extremely flammable liquid and vapour

    // Severity 2: Low
    "H220": 2,  // Extremely flammable gas
    "H221": 2,  // Flammable gas
    "H222": 2,  // Extremely flammable aerosol
    "H223": 2,  // Flammable aerosol
    "H225": 2,  // Highly flammable liquid and vapour

    // Severity 1: Minimal
    "H226": 1,  // Flammable liquid and vapour
    "H228": 1,  // Flammable solid

    // Default for unrecognized H-phrases
    "default": 1
};

/**
 * H-Phrase to Hazard Group Mapping
 *
 * Hazard Groups (HSE COSHH Essentials):
 * E = Extreme hazard (Fatal toxicity)
 * D = High hazard (Toxic, corrosive)
 * C = Moderate hazard (Harmful, irritant)
 * B = Low hazard (Lesser hazards)
 * A = Minimal hazard (No significant hazards)
 * S = Specialist (CMR substances, sensitizers requiring specialist assessment)
 */
const hPhraseToHazardGroup = {
    // Group E: Extreme hazard
    "H300": "E",  // Fatal if swallowed
    "H310": "E",  // Fatal in contact with skin
    "H330": "E",  // Fatal if inhaled
    "H370": "E",  // Causes damage to organs
    "H372": "E",  // Causes damage to organs (repeated exposure)

    // Group S: Specialist (CMR substances)
    "H340": "S",  // May cause genetic defects
    "H350": "S",  // May cause cancer
    "H360": "S",  // May damage fertility or unborn child
    "H334": "S",  // May cause allergy or asthma (Respiratory Sensitizer)

    // Group D: High hazard
    "H301": "D",  // Toxic if swallowed
    "H311": "D",  // Toxic in contact with skin
    "H331": "D",  // Toxic if inhaled
    "H314": "D",  // Causes severe skin burns and eye damage
    "H318": "D",  // Causes serious eye damage

    // Group C: Moderate hazard
    "H302": "C",  // Harmful if swallowed
    "H312": "C",  // Harmful in contact with skin
    "H332": "C",  // Harmful if inhaled
    "H315": "C",  // Causes skin irritation
    "H319": "C",  // Causes serious eye irritation
    "H317": "C",  // May cause allergic skin reaction
    "H224": "C",  // Extremely flammable
    "H225": "C",  // Highly flammable

    // Defaults
    "default_low_sev": "B",       // For low severity H-phrases
    "default_no_sig_haz": "A"     // For no significant hazards
};

// Export for ES6 modules
export { hPhraseSeverityMap, hPhraseToHazardGroup };
