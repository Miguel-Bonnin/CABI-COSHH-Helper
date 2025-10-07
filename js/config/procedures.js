/**
 * Laboratory Procedure Configuration
 *
 * Defines all available laboratory procedures with their risk characteristics.
 * Used for auto-filling exposure routes and calculating likelihood scores.
 *
 * Structure:
 * - desc: Description for activity field
 * - volCat: Default volume category (Small/Medium/Large)
 * - exposureFactor: 0.0-1.0 scale for likelihood calculation
 * - routes: Array of exposure routes to auto-check
 * - aerosol: 0.0-1.0 scale for aerosol generation potential
 */

const procedureData = {
    "pipetting_micro": {
        desc: "Pipetting microlitre volumes (<1mL)",
        volCat: "Small",
        exposureFactor: 0.2,
        routes: ["SkinContact", "EyeContact"],
        aerosol: 0.1
    },
    "pipetting_small": {
        desc: "Pipetting small volumes (1-50mL)",
        volCat: "Small",
        exposureFactor: 0.3,
        routes: ["SkinContact", "EyeContact", "Ingestion"],
        aerosol: 0.2
    },
    "pipetting_large": {
        desc: "Pipetting larger volumes (>50mL)",
        volCat: "Medium",
        exposureFactor: 0.4,
        routes: ["SkinContact", "EyeContact", "Ingestion"],
        aerosol: 0.3
    },
    "decanting_small": {
        desc: "Decanting liquids (small scale, <1L)",
        volCat: "Medium",
        exposureFactor: 0.4,
        routes: ["SkinContact", "EyeContact", "Inhalation"],
        aerosol: 0.3
    },
    "decanting_large": {
        desc: "Decanting liquids (large scale, >1L)",
        volCat: "Large",
        exposureFactor: 0.6,
        routes: ["SkinContact", "EyeContact", "Inhalation"],
        aerosol: 0.4
    },
    "weighing_solid_trace": {
        desc: "Weighing trace/mg solids (enclosed balance)",
        volCat: "Small",
        exposureFactor: 0.1,
        routes: ["SkinContact"],
        aerosol: 0.05
    },
    "weighing_solid_small_enclosed": {
        desc: "Weighing grams of solid (enclosed balance)",
        volCat: "Small",
        exposureFactor: 0.2,
        routes: ["SkinContact"],
        aerosol: 0.1
    },
    "weighing_solid_open": {
        desc: "Weighing solids (open bench, potential for dust)",
        volCat: "Medium",
        exposureFactor: 0.7,
        routes: ["Inhalation", "SkinContact"],
        aerosol: 0.6
    },
    "mixing_stirring_closed": {
        desc: "Mixing/stirring in a closed vessel",
        volCat: "Medium",
        exposureFactor: 0.2,
        routes: ["SkinContact"],
        aerosol: 0.1
    },
    "mixing_stirring_open": {
        desc: "Mixing/stirring in an open vessel",
        volCat: "Medium",
        exposureFactor: 0.5,
        routes: ["SkinContact", "EyeContact", "Inhalation"],
        aerosol: 0.4
    },
    "vortexing_closed": {
        desc: "Vortexing in a capped tube",
        volCat: "Small",
        exposureFactor: 0.1,
        routes: [],
        aerosol: 0.05
    },
    "vortexing_open": {
        desc: "Vortexing in an open tube (aerosol risk)",
        volCat: "Small",
        exposureFactor: 0.8,
        routes: ["Inhalation", "EyeContact"],
        aerosol: 0.8
    },
    "centrifuging_sealed": {
        desc: "Centrifuging with sealed rotors/tubes",
        volCat: "Medium",
        exposureFactor: 0.1,
        routes: [],
        aerosol: 0.05
    },
    "centrifuging_unsealed": {
        desc: "Centrifuging with unsealed tubes (aerosol risk)",
        volCat: "Medium",
        exposureFactor: 0.9,
        routes: ["Inhalation"],
        aerosol: 0.9
    },
    "heating_reflux_closed": {
        desc: "Heating/reflux in a closed system",
        volCat: "Medium",
        exposureFactor: 0.2,
        routes: ["Inhalation"],
        aerosol: 0.1
    },
    "heating_open_beaker": {
        desc: "Heating in an open beaker",
        volCat: "Medium",
        exposureFactor: 0.6,
        routes: ["Inhalation", "EyeContact"],
        aerosol: 0.5
    },
    "surface_wiping_small": {
        desc: "Surface wiping/cleaning (small area)",
        volCat: "Small",
        exposureFactor: 0.4,
        routes: ["SkinContact", "Inhalation"],
        aerosol: 0.2
    },
    "surface_wiping_large": {
        desc: "Surface wiping/cleaning (large area)",
        volCat: "Medium",
        exposureFactor: 0.6,
        routes: ["SkinContact", "Inhalation"],
        aerosol: 0.3
    },
    "other_manual": {
        desc: "User described procedure:",
        volCat: "Medium",
        exposureFactor: 0.5,
        routes: ["SkinContact", "Inhalation", "EyeContact", "Ingestion"],
        aerosol: 0.3
    }
};
