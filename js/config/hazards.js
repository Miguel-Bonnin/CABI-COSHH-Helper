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
 *
 * === COSHH ESSENTIALS METHODOLOGY ===
 *
 * Based on HSE COSHH Essentials control banding approach:
 * https://www.hse.gov.uk/coshh/essentials/
 *
 * The system maps H-phrases to hazard groups that determine control approaches:
 *
 * Group E: Extreme hazard (Fatal toxicity, severe organ damage)
 *          Requires immediate containment and specialist controls
 *
 * Group S: Specialist (CMR: Carcinogens, Mutagens, Reproductive toxins)
 *          Requires expert assessment and specific control measures
 *          Also includes respiratory sensitizers (asthma risk)
 *
 * Group D: High hazard (Toxic, corrosive substances)
 *          Extensive engineering controls needed
 *
 * Group C: Moderate hazard (Harmful, irritant)
 *          Engineering controls recommended, LEV often sufficient
 *
 * Group B: Low hazard (Lesser hazards, flammability)
 *          Good general ventilation usually adequate
 *
 * Group A: Minimal hazard (No significant health hazards)
 *          Basic workplace hygiene sufficient
 *
 * DESIGN PRINCIPLE: When H-phrases are not in the mapping, the system defaults
 * to a conservative approach (Group C for unknown severity) to avoid under-protecting
 * workers. It is safer to over-control than to under-control.
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
    // Severity 5: Critical (immediate danger to life or long-term serious health effects)
    // These are the most serious hazards requiring maximum protection
    H300: 5, // Fatal if swallowed - acute oral toxicity category 1-2
    H310: 5, // Fatal in contact with skin - acute dermal toxicity category 1-2
    H330: 5, // Fatal if inhaled - acute inhalation toxicity category 1-2
    H340: 5, // May cause genetic defects (Mutagen Cat 1) - germ cell mutagenicity
    H350: 5, // May cause cancer (Carcinogen Cat 1) - highest carcinogenic concern
    H360: 5, // May damage fertility or the unborn child (Reproductive Cat 1) - proven reproductive toxin
    H370: 5, // Causes damage to organs (STOT SE Cat 1) - single exposure organ damage
    H372: 5, // Causes damage to organs through prolonged/repeated exposure (STOT RE Cat 1) - chronic organ damage

    // Severity 4: High (serious health effects but not immediately fatal)
    // These substances can cause significant harm and require strong controls
    H301: 4, // Toxic if swallowed - acute oral toxicity category 3
    H311: 4, // Toxic in contact with skin - acute dermal toxicity category 3
    H331: 4, // Toxic if inhaled - acute inhalation toxicity category 3
    H314: 4, // Causes severe skin burns and eye damage - skin corrosion category 1
    H318: 4, // Causes serious eye damage - serious eye damage category 1
    H334: 4, // May cause allergy or asthma symptoms (Respiratory Sensitizer) - lifelong condition risk
    H341: 4, // Suspected of causing genetic defects (Mutagen Cat 2) - precautionary mutagenic concern
    H351: 4, // Suspected of causing cancer (Carcinogen Cat 2) - limited evidence of carcinogenicity
    H361: 4, // Suspected of damaging fertility/unborn child (Reproductive Cat 2) - some evidence
    H371: 4, // May cause damage to organs (STOT SE Cat 2) - significant organ effects
    H373: 4, // May cause damage to organs through prolonged/repeated exposure (STOT RE Cat 2) - chronic concern

    // Severity 3: Moderate (reversible health effects, requires control)
    // These substances need engineering controls but effects are usually reversible
    H302: 3, // Harmful if swallowed - acute oral toxicity category 4
    H312: 3, // Harmful in contact with skin - acute dermal toxicity category 4
    H332: 3, // Harmful if inhaled - acute inhalation toxicity category 4
    H315: 3, // Causes skin irritation - reversible skin effects
    H319: 3, // Causes serious eye irritation - reversible eye effects
    H317: 3, // May cause an allergic skin reaction (Skin Sensitizer) - dermatitis risk
    H335: 3, // May cause respiratory irritation - short-term breathing discomfort
    H336: 3, // May cause drowsiness or dizziness (Narcotic effects) - CNS depression
    H224: 3, // Extremely flammable liquid and vapour - fire/explosion risk (category 1)

    // Severity 2: Low (minor hazards or physical hazards managed by standard precautions)
    // Primarily flammability hazards that are controlled by fire safety measures
    H220: 2, // Extremely flammable gas - requires ventilation and ignition control
    H221: 2, // Flammable gas - moderate fire hazard
    H222: 2, // Extremely flammable aerosol - pressurized container risk
    H223: 2, // Flammable aerosol - moderate aerosol fire risk
    H225: 2, // Highly flammable liquid and vapour - fire risk (category 2)

    // Severity 1: Minimal (lowest tier hazards)
    // These are considered minor hazards with standard workplace controls
    H226: 1, // Flammable liquid and vapour - low fire risk (category 3)
    H228: 1, // Flammable solid - combustible material

    // Default for unrecognized H-phrases: Conservative fallback
    // If an H-phrase isn't in this map, assume minimal severity
    // This prevents crashes but users should verify unknown H-phrases manually
    default: 1,
};

/**
 * H-Phrase to Hazard Group Mapping for Control Banding
 *
 * Hazard Groups (HSE COSHH Essentials):
 * E = Extreme hazard (Fatal toxicity)
 * D = High hazard (Toxic, corrosive)
 * C = Moderate hazard (Harmful, irritant)
 * B = Low hazard (Lesser hazards)
 * A = Minimal hazard (No significant hazards)
 * S = Specialist (CMR substances, sensitizers requiring specialist assessment)
 *
 * CONTROL BANDING LOGIC:
 * The hazard group combines with quantity and physical characteristics to determine
 * the control approach (general ventilation, LEV, containment, or specialist advice).
 *
 * This mapping is separate from severity scoring because:
 * - Severity drives risk level (low/medium/high)
 * - Hazard group drives control approach (what type of controls are needed)
 *
 * Example: H350 (carcinogen) has severity 5 AND hazard group S
 * - Severity 5 means "high risk" in the risk matrix
 * - Group S means "seek specialist advice" for control measures
 */
const hPhraseToHazardGroup = {
    // Group E: Extreme hazard (fatal acute toxicity, severe organ damage)
    // Control approach: Immediate containment, possibly full enclosure
    H300: 'E', // Fatal if swallowed - highest acute toxicity
    H310: 'E', // Fatal in contact with skin - skin contact can be lethal
    H330: 'E', // Fatal if inhaled - inhalation can be lethal
    H370: 'E', // Causes damage to organs - proven severe organ effects
    H372: 'E', // Causes damage to organs (repeated exposure) - chronic severe effects

    // Group S: Specialist (CMR substances and respiratory sensitizers)
    // Control approach: Requires expert COSHH assessor input, specific to substance
    // These substances have special legal requirements under COSHH regulations
    H340: 'S', // May cause genetic defects - Category 1 mutagen, tightly regulated
    H350: 'S', // May cause cancer - Category 1 carcinogen, requires specialist controls
    H360: 'S', // May damage fertility or unborn child - Category 1 reproductive toxin
    H334: 'S', // May cause allergy or asthma (Respiratory Sensitizer) - can cause lifelong asthma

    // Group D: High hazard (toxic substances, corrosives)
    // Control approach: Engineering controls typically required (LEV, containment)
    H301: 'D', // Toxic if swallowed - significant acute toxicity
    H311: 'D', // Toxic in contact with skin - can cause serious harm via skin
    H331: 'D', // Toxic if inhaled - inhalation poses serious risk
    H314: 'D', // Causes severe skin burns and eye damage - corrosive, immediate damage
    H318: 'D', // Causes serious eye damage - can cause blindness

    // Group C: Moderate hazard (harmful, irritant, highly flammable)
    // Control approach: Engineering controls recommended, LEV often adequate
    // This is the DEFAULT group for unmapped H-phrases (conservative approach)
    H302: 'C', // Harmful if swallowed - lower acute toxicity
    H312: 'C', // Harmful in contact with skin - can cause harm but not severe
    H332: 'C', // Harmful if inhaled - inhalation risk but not acutely toxic
    H315: 'C', // Causes skin irritation - reversible skin effects
    H319: 'C', // Causes serious eye irritation - reversible eye damage
    H317: 'C', // May cause allergic skin reaction - dermatitis but not respiratory
    H224: 'C', // Extremely flammable - fire/explosion risk needs good controls
    H225: 'C', // Highly flammable - significant fire risk

    // Fallback defaults for edge cases
    default_low_sev: 'B', // For low severity H-phrases not explicitly mapped
    default_no_sig_haz: 'A', // For substances with no significant hazards
};

// Note: These are global variables accessible throughout the application
// Loaded via <script src="js/config/hazards.js"> (not as ES6 module)
