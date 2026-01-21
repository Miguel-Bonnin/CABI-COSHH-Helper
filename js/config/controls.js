/**
 * Control Band Data Configuration
 *
 * This file defines the control measures and PPE recommendations for each control band
 * in the HSE COSHH Essentials control banding system.
 *
 * Control Bands:
 * - Band 1: Low hazard + low exposure = General ventilation
 * - Band 2: Moderate hazard/exposure = Engineering controls (LEV)
 * - Band 3: High hazard/exposure = Containment required
 * - Band 4: Very high hazard/exposure = Specialist advice needed
 * - Band S: Special cases (carcinogens, mutagens, respiratory sensitizers)
 *
 * Each band specifies:
 * - general: The primary control measure checkbox identifier
 * - ppeSheet: The PPE guidance sheet reference
 * - ppeText: Detailed PPE recommendations for this control band
 *
 * @type {Object.<string, {general: string, ppeSheet: string, ppeText: string}>}
 */
const controlBandData = {
    1: {
        general: 'Ventilation100',
        ppeSheet: 'S100_S200',
        ppeText:
            'Basic PPE: Lab coat, safety glasses. Check MSDS for glove type if skin contact likely.',
    },
    2: {
        general: 'LEV200_201',
        ppeSheet: 'S100_S200',
        ppeText:
            'Effective LEV. PPE: As per Band 1 + specific gloves based on MSDS/breakthrough, consider face shield if splash risk.',
    },
    3: {
        general: 'Containment300_301',
        ppeSheet: 'S100_S200',
        ppeText:
            'Full containment. PPE: As per Band 2, higher level gloves, potential for RPE during maintenance/breach.',
    },
    4: {
        general: 'Specialist400',
        ppeSheet: 'S100_S200',
        ppeText:
            'Specialist advice required for controls and PPE. Likely full containment and high-level RPE.',
    },
    S: {
        general: 'Specialist400',
        ppeSheet: 'S100_S200',
        ppeText:
            'Specialist advice required (e.g., for carcinogens, mutagens, respiratory sensitisers). High level controls & PPE expected.',
    },
};
