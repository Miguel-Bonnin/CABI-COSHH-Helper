# CABI COSHH Helper - Technical Documentation

This document provides in-depth technical information about how the CABI COSHH Helper works, including the risk assessment methodology, code structure, and customization guide.

## Table of Contents

1. [Risk Assessment Methodology](#risk-assessment-methodology)
2. [Code Structure](#code-structure)
3. [Key Functions Reference](#key-functions-reference)
4. [Customization Guide](#customization-guide)
5. [Future Modularization](#future-modularization)

---

## Risk Assessment Methodology

### Overview

The CABI COSHH Helper uses a **two-dimensional risk matrix** based on:
1. **Severity** (consequence of harm)
2. **Likelihood** (probability of exposure)

**Final Risk = Severity × Likelihood**

Risk levels are categorized as:
- **1-4**: Low Risk (Green)
- **5-12**: Medium Risk (Amber)
- **13-25**: High Risk (Red)

---

### 1. Severity Calculation

**Function**: `calculateOverallSeverity()` (Lines 955-968)

Severity is determined primarily by **H-phrases** (Hazard statements) from the SDS.

#### H-Phrase Severity Mapping

The tool uses `hPhraseSeverityMap` (defined around lines 230-280) to map H-phrases to severity levels:

| Severity Level | H-Phrase Examples | Description |
|---------------|-------------------|-------------|
| **5** (Critical) | H300, H310, H330, H350, H360 | Fatal toxicity, carcinogens, reproductive toxins |
| **4** (High) | H301, H311, H331, H314, H318, H351, H361, H370, H371 | Toxic, corrosive, suspected carcinogens, organ damage |
| **3** (Moderate) | H302, H312, H332, H315, H319, H335, H372, H373 | Harmful, irritant, organ damage with repeated exposure |
| **2** (Low) | H304, H336, H412, H413 | Aspiration hazard, drowsiness, aquatic toxicity |
| **1** (Minimal) | No significant hazards | Default for substances without severe H-phrases |

#### Logic Flow:

```javascript
1. Parse all H-phrases from the MSDS
2. For each H-phrase:
   - Look up severity in hPhraseSeverityMap
   - Track the MAXIMUM severity found
3. Override checks:
   - If Signal Word = "Danger" → minimum severity = 3
   - If Signal Word = "Warning" → minimum severity = 2
4. Return the maximum severity (1-5)
```

**Example**:
- Formamide has:
  - H351 (suspected carcinogen) → severity 4
  - H360 (reproductive toxin) → severity 5
  - H373 (organ damage) → severity 3
- Maximum = **5** → Critical Severity

---

### 2. Likelihood Calculation

**Function**: `calculateOverallLikelihood()` (Lines 969-998)

Likelihood is calculated by summing scores from multiple factors:

#### A. Procedure/Exposure Factor (0-3 points)

Based on the laboratory procedure selected from `procedureData`:

| Procedure | Exposure Factor | Points | Aerosol Bonus |
|-----------|----------------|--------|---------------|
| Weighing solids | 0.3 | 0.9 | 0 |
| Pipetting liquids | 0.5 | 1.5 | 0 |
| Mixing/stirring | 0.6 | 1.8 | +1 |
| Heating/refluxing | 0.8 | 2.4 | +2 |
| Grinding/milling | 0.9 | 2.7 | +2 |
| Spray application | 1.0 | 3.0 | +2 |

**Code**:
```javascript
const procDetails = procedureData[procedureKey];
likelihoodScore += (procDetails.exposureFactor || 0.5) * 3;
likelihoodScore += (procDetails.aerosol || 0) * 2;
```

#### B. Quantity Used (0-3 points)

Normalized to milliliters/milligrams:

| Quantity (normalized) | Points |
|-----------------------|--------|
| > 500 mL/g | +3 |
| 50-500 mL/g | +2 |
| 1-50 mL/g | +1 |
| < 1 mL/g | 0 |

**Code**:
```javascript
let normalizedQuantity = quantityValue;
if (['µL', 'µg'].includes(quantityUnit)) normalizedQuantity /= 1000;
if (['L', 'kg'].includes(quantityUnit)) normalizedQuantity *= 1000;

if (normalizedQuantity > 500) likelihoodScore += 3;
else if (normalizedQuantity > 50) likelihoodScore += 2;
else if (normalizedQuantity > 1) likelihoodScore += 1;
```

#### C. Material Type (0-2 points)

Physical characteristics that increase exposure risk:

| Material Type | Points |
|---------------|--------|
| Volatile, dusty, gas, aerosol | +2 |
| Other | 0 |

#### D. Task Frequency (0-3 points)

| Frequency | Points |
|-----------|--------|
| Multiple times daily | +3 |
| Daily | +2 |
| Weekly | +1 |
| Monthly or less | 0 |

#### E. Task Duration (0-3 points)

| Duration | Points |
|----------|--------|
| Very long (>4 hours) | +3 |
| Long (1-4 hours) | +2 |
| Medium (15min-1hr) | +1 |
| Short (<15 min) | 0 |

#### Total Likelihood:

```javascript
likelihoodScore = Σ(Procedure + Quantity + MaterialType + Frequency + Duration)
// Capped at maximum of 10
return Math.min(10, likelihoodScore);
```

**Example**:
- Pipetting (1.5) + Medium quantity (2) + Volatile (2) + Weekly (1) + Medium duration (1) = **7.5**

---

### 3. Control Banding (Step 2 - Risk Evaluation)

**Function**: `determineRiskEvaluationParameters()` (Lines 999-1035)

This determines the **Control Group** (1-4 or S for Specialist) using the HSE COSHH Essentials methodology.

#### A. Hazard Group Determination

Maps H-phrases to Hazard Groups A-E or S using `hPhraseToHazardGroup`:

| Hazard Group | Description | Example H-Phrases |
|--------------|-------------|-------------------|
| **E** | Extreme hazard | H350, H340, H360 (CMR substances: Carcinogenic, Mutagenic, Reproductive) |
| **D** | High hazard | H301, H311, H331, H314, H318 (Toxic, corrosive) |
| **C** | Moderate hazard | H302, H312, H332, H315, H319 (Harmful, irritant) |
| **B** | Low hazard | Lesser irritants |
| **A** | Minimal hazard | No significant hazards |
| **S** | Specialist | Requires specialist assessment (e.g., H334 respiratory sensitizers) |

#### B. Quantity/Volume Category

| Normalized Quantity | Category |
|---------------------|----------|
| ≤ 10 mL/g | Small |
| 10-250 mL/g | Medium |
| > 250 mL/g | Large |

#### C. Physical Characteristics Group

Based on material state and volatility:

| Material Type | Category |
|---------------|----------|
| Solid, non-dusty, low volatility | Low |
| Liquid (medium volatility), dusty solid | Medium |
| Volatile liquid, very dusty, gas, aerosol | High |

#### D. Control Group Matrix

The Control Group is determined by combining:
- **Hazard Group** (A-E, S)
- **Quantity** (Small/Medium/Large)
- **Physical Characteristics** (Low/Medium/High)

Using the `controlBandData` lookup table (Lines ~540-580):

```javascript
const controlBandData = {
    "1": {
        hazard: "A",
        generalControls: "General ventilation",
        ppeBasic: "Lab coat, safety glasses"
    },
    "2": {
        hazard: "B-C",
        quantity: "Small-Medium",
        generalControls: "General ventilation plus engineering controls",
        ppeBasic: "Gloves, lab coat, safety glasses"
    },
    "3": {
        hazard: "C-D",
        quantity: "Medium-Large",
        generalControls: "LEV (Local Exhaust Ventilation)",
        ppeBasic: "Gloves, lab coat, safety glasses, possibly respirator"
    },
    "4": {
        hazard: "D-E",
        quantity: "Large",
        physChar: "High",
        generalControls: "LEV + Containment",
        ppeBasic: "Full PPE including respirator"
    },
    "S": {
        hazard: "E or Specialist",
        generalControls: "Specialist advice required"
    }
};
```

**Output**: Control Group 1, 2, 3, 4, or S

**Example (Formamide)**:
- Hazard Group: E (H360 reproductive toxin)
- Quantity: Small (10 mL)
- Physical Characteristics: Medium (liquid, moderate volatility)
- **Result**: Control Group 3 or S (depending on exact matrix lookup)

---

### 4. Suitable Controls (Step 3)

**Function**: `updateSuitableControls()` (Lines 1039-1168)

Based on the Control Group and exposure routes, the tool **auto-checks** appropriate control measures:

#### General Controls

| Control Group | Recommended Controls |
|---------------|---------------------|
| 1 | General Ventilation |
| 2 | General Ventilation + Engineering Controls |
| 3 | LEV (Local Exhaust Ventilation) |
| 4 | LEV + Containment |
| S | Specialist advice required |

#### PPE (Personal Protective Equipment)

PPE is suggested based on:

##### 1. Exposure Routes (checked by user):

- **Inhalation** → Respiratory protection (if dusty/volatile/aerosol AND Control Group ≥ 2)
- **Skin** → Gloves/Protective Clothing
- **Eye** → Eye Protection/Face Shield

##### 2. P-Phrases (Precautionary statements) from MSDS:

- P280 → Gloves, Eye Protection
- P260 → Respiratory Protection
- P262 → Eye Protection
- P303+P361+P353 → Emergency shower/eyewash

##### 3. H-Phrases (automatic inference):

- H314, H318 (corrosive/serious eye damage) → Face Shield
- H315, H319 (skin/eye irritant) → Gloves, Safety Glasses
- H330-H335 (inhalation hazard) → Respiratory Protection
- H300-H311 (acute toxicity) → Full PPE

**Code location**: Lines 1103-1114

**Example Auto-Selection Logic**:
```javascript
// Check if PPE text mentions gloves
const ppeGloveCb = document.querySelector('input[name="ppeControl"][value="Gloves200_201"]');
if (ppeGloveCb && ppeText.toLowerCase().includes("glove")) {
    ppeGloveCb.checked = true;
}

// Check for corrosive hazards
if (hPhrases.some(h => h.startsWith("H314") || h.startsWith("H318"))) {
    const ppeEyeCb = document.querySelector('input[name="ppeControl"][value="Eye300_301"]');
    if (ppeEyeCb) ppeEyeCb.checked = true;
    ppeText += " Face shield or goggles. ";
}
```

---

## Code Structure

### File Organization

Currently, the entire application is in a **single HTML file** (`coshhgeneratorv5.html`, ~1400 lines):

```
coshhgeneratorv5.html
├── HTML Structure (Lines 1-480)
│   ├── <head> (Lines 1-194)
│   │   ├── Meta tags & title
│   │   ├── PDF.js library (CDN)
│   │   └── <style> (Lines 37-194)
│   │       ├── Layout & Typography
│   │       ├── Tab Navigation
│   │       ├── Forms & Controls
│   │       ├── Risk Matrix Styling
│   │       └── Print Styles (@media print)
│   │
│   └── <body> (Lines 195-480)
│       ├── Header (CABI logo, title)
│       ├── Tab Navigation Buttons
│       ├── Tab Content Containers
│       │   ├── MSDS Input Tab (0)
│       │   ├── Personnel Tab (1)
│       │   ├── Substance & Task Tab (2)
│       │   ├── Hazard Identification Tab (3)
│       │   ├── Procedure Details Tab (4)
│       │   ├── Risk Evaluation Tab (5)
│       │   ├── Suitable Controls Tab (6)
│       │   ├── Further Actions Tab (7)
│       │   └── Acknowledgement Tab (8)
│       │
│       ├── Report Output Section
│       └── App Footer
│
└── <script> (Lines 481-1400+)
    ├── Global Variables & Configuration (Lines 195-195)
    │   └── masterParsedMSDSData = {}
    │
    ├── Data Structures (Lines 200-580)
    │   ├── procedureData (Lines ~200-230)
    │   │   └── Lab procedures with exposure factors
    │   ├── hPhraseSeverityMap (Lines ~230-280)
    │   │   └── H-phrase → Severity mapping
    │   ├── hPhraseToHazardGroup (Lines ~280-350)
    │   │   └── H-phrase → Hazard Group (A-E, S)
    │   └── controlBandData (Lines ~540-580)
    │       └── Control Group → Recommendations
    │
    ├── UI & Navigation (Lines 481-583)
    │   ├── openTab(evt, tabName)
    │   └── DOMContentLoaded event listeners
    │
    ├── PDF Parsing Module (Lines 584-929)
    │   ├── parseUploadedMSDS() - Lines 586-611
    │   │   └── Uses PDF.js to extract text
    │   ├── parsePastedMSDS() - Lines 612-619
    │   │   └── Parses manually pasted text
    │   ├── processMSDSText(text) - Lines 623-804
    │   │   ├── Extract Chemical Name (Lines 628-675)
    │   │   ├── Extract CAS Number (Lines 682-731)
    │   │   ├── Extract Signal Word (Lines 735-737)
    │   │   ├── Extract/Infer Pictograms (Lines 739-812)
    │   │   ├── Extract H-Phrases (Lines 814-824)
    │   │   ├── Extract P-Phrases (Lines 826-832)
    │   │   └── Extract Sections 4,6,7,13 (Lines 764-796)
    │   ├── displayParsePreview(parsedData) - Lines 814-835
    │   │   └── Shows editable preview table
    │   └── applyParsedDataToForm() - Lines 837-921
    │       └── Populates form fields with parsed data
    │
    ├── Risk Assessment Module (Lines 930-1035)
    │   ├── handleProcedureChange() - Lines 931-948
    │   │   └── Updates activity description & routes
    │   ├── getHphrases() - Lines 950-953
    │   ├── getSignalWord() - Lines 954-954
    │   ├── calculateOverallSeverity() - Lines 955-968
    │   │   └── H-phrases → Severity (1-5)
    │   ├── calculateOverallLikelihood() - Lines 969-998
    │   │   └── Procedure + Quantity + Frequency → Likelihood (0-10)
    │   └── determineRiskEvaluationParameters() - Lines 999-1035
    │       ├── Determine Hazard Group (A-E, S)
    │       ├── Determine Quantity Category
    │       ├── Determine Physical Characteristics
    │       └── Lookup Control Group (1-4, S)
    │
    ├── Dynamic Control Logic (Lines 1036-1168)
    │   ├── updateSuitableControls() - Lines 1039-1168
    │   │   ├── Auto-check General Controls based on Control Group
    │   │   ├── Auto-check PPE based on:
    │   │   │   ├── Exposure routes
    │   │   │   ├── P-phrases
    │   │   │   └── H-phrases
    │   │   └── Generate PPE specification text
    │   └── runFullRiskAssessmentLogic() - Called throughout
    │       └── Master function that triggers all calculations
    │
    ├── Report Generation (Lines 1171-1256)
    │   ├── generateFullReport() - Lines 1171-1254
    │   │   ├── Collect all form data (with RadioNodeList fix)
    │   │   ├── Build HTML report structure
    │   │   └── Display in #fullReportOutput
    │   └── printReport() - Lines 1255-1256
    │       └── window.print()
    │
    ├── Data Management (Lines 1257-1400+)
    │   ├── saveLocally() - Lines 1257-1278
    │   │   └── Save to localStorage
    │   ├── loadLocally() - Lines 1279-1321
    │   │   └── Load from localStorage
    │   ├── exportToJson() - Lines 1322-1345
    │   │   └── Download JSON file
    │   └── importFromJsonFile() - Lines 1348+
    │       └── Load from uploaded JSON
    │
    └── Helper Functions
        ├── updateConfidenceMarker(elementId, confidence)
        ├── setRadio(name, value)
        └── displayRiskMatrix()
```

### Key Data Structures

#### 1. `procedureData` (Lines ~200-230)

Defines laboratory procedures with their risk characteristics:

```javascript
const procedureData = {
    "pipetting": {
        label: "Pipetting / Dispensing Liquids",
        desc: "Pipetting, dispensing, or transferring liquids",
        routes: ["skin", "inhalation", "eye"],  // Auto-check these exposure routes
        exposureFactor: 0.5,  // 0.0-1.0 scale for likelihood calculation
        aerosol: 0,  // 0-2 scale for aerosol generation
        volCat: "Small",  // Default quantity category
        requiresContainment: false
    },
    // ... more procedures
};
```

#### 2. `hPhraseSeverityMap` (Lines ~230-280)

Maps H-phrases to severity scores:

```javascript
const hPhraseSeverityMap = {
    "H300": 5,  // Fatal if swallowed
    "H310": 5,  // Fatal in contact with skin
    "H330": 5,  // Fatal if inhaled
    "H350": 5,  // May cause cancer
    "H360": 5,  // May damage fertility or the unborn child
    "H301": 4,  // Toxic if swallowed
    // ... etc
    "default": 2
};
```

#### 3. `hPhraseToHazardGroup` (Lines ~280-350)

Maps H-phrases to Hazard Groups for Control Banding:

```javascript
const hPhraseToHazardGroup = {
    "H350": "E",  // Carcinogen → Extreme
    "H360": "E",  // Reproductive → Extreme
    "H340": "E",  // Mutagen → Extreme
    "H314": "D",  // Corrosive → High
    "H302": "C",  // Harmful if swallowed → Moderate
    // ... etc
    "H334": "S",  // Respiratory sensitizer → Specialist
    "default_low_sev": "B",
    "default_no_sig_haz": "A"
};
```

#### 4. `controlBandData` (Lines ~540-580)

Control recommendations for each Control Group:

```javascript
const controlBandData = {
    "1": {
        hazard: "Minimal hazard (Group A)",
        quantity: "Small",
        physChar: "Low",
        generalControls: "General ventilation is adequate...",
        ppeBasic: "Standard lab coat and safety glasses",
        gcGuidanceSheet: "100",
        ppeGuidanceSheet: "N/A"
    },
    // ... Groups 2, 3, 4, S
};
```

---

## Key Functions Reference

### riskCalculator Module (Phase 1 Extraction)

**Location**: `js/modules/riskCalculator.js`

**Purpose**: Pure calculation functions extracted for testability and modularization. These functions compute risk severity and likelihood scores without DOM dependencies, enabling automated unit testing.

**Extraction History**: Originally embedded inline in `coshhgeneratorv5.html` (lines 1067-1109). Extracted in Phase 1 (Jan 2026) using Test-Driven Development (TDD) approach to enable comprehensive test coverage.

#### Functions

##### `calculateOverallSeverity(hPhrases, signalWord)`

**Purpose**: Calculate harm severity from H-phrases and GHS signal words

**Parameters**:
- `hPhrases` (string[]): Array of H-phrase codes (e.g., `['H350', 'H314']`)
- `signalWord` (string): GHS signal word (`'Danger'`, `'Warning'`, or `''`)

**Returns**: Integer 1-5 (1=minimal, 5=critical)

**Algorithm**:
1. Iterates through H-phrases to find highest severity in `hPhraseSeverityMap`
2. Uses pattern matching (startsWith) to handle variants (e.g., H360F matches H360)
3. If no H-phrases matched, uses signal word fallback: 'Danger'→3, 'Warning'→2, otherwise→1
4. Returns maximum severity found

**Example**:
```javascript
calculateOverallSeverity(['H350', 'H360F', 'H373'], 'Danger')
// Returns: 5 (H360 reproductive toxin is severity 5)
```

##### `calculateOverallLikelihood(procedureData, quantity, unit, frequency, duration)`

**Purpose**: Calculate exposure probability from procedure characteristics and usage factors

**Parameters**:
- `procedureData` (Object|null): Procedure characteristics with `exposureFactor` (0.0-1.0) and `aerosol` (0-2)
- `quantity` (number): Amount used
- `unit` (string): Unit of measurement (`'µg'`, `'mg'`, `'g'`, `'kg'`, `'µL'`, `'mL'`, `'L'`)
- `frequency` (string): Task frequency (`'multiple_daily'`, `'daily'`, `'weekly'`, etc.)
- `duration` (string): Task duration (`'very_long'`, `'long'`, `'medium'`, `'short'`)

**Returns**: Integer 0-10 (capped at 10)

**Algorithm** (from original line 1081-1109):
1. Base score = `exposureFactor × 3 + aerosol × 2` (or 1.5 if no procedure data)
2. Add quantity factor: >500=+3, >50=+2, >1=+1 (after normalizing to mL/mg)
3. Add frequency: multiple_daily=+3, daily=+2, weekly=+1
4. Add duration: very_long=+3, long=+2, medium=+1
5. Cap final score at 10

**Example**:
```javascript
const procedure = { exposureFactor: 0.8, aerosol: 0.8 };
calculateOverallLikelihood(procedure, 1000, 'mL', 'daily', 'long')
// Returns: ~9 (high likelihood due to large quantity, high exposure procedure)
```

**Testing**: Full test coverage with 25 tests in `tests/riskCalculator.test.js`:
- 11 tests for severity calculation (H-phrase mapping, signal word fallback, edge cases)
- 14 tests for likelihood calculation (quantity normalization, frequency/duration scoring, boundary conditions)
- 18 validation tests (input type checking, range validation)

**Total tests**: 43 covering all code paths and error conditions

**Note**: These functions were extracted in Phase 1 (Jan 2026) to enable automated testing. They maintain identical logic to the original inline implementation while providing better testability and reusability.

---

### Risk Assessment Functions

#### `calculateOverallSeverity()` (Lines 955-968)

**Purpose**: Determine harm severity from H-phrases and signal words.

**Parameters**: None (reads from form)

**Returns**: Integer 1-5
- 5 = Critical (fatal, CMR substances)
- 4 = High (toxic, corrosive)
- 3 = Moderate (harmful, irritant)
- 2 = Low
- 1 = Minimal

**Dependencies**:
- `getHphrases()` - parses H-phrases from form field
- `hPhraseSeverityMap` - lookup table for H-phrase → severity
- `getSignalWord()` - extracts Danger/Warning for override

**Logic**:
```javascript
function calculateOverallSeverity() {
    const hPhrases = getHphrases();
    let maxSeverity = 0;

    // No H-phrases = minimal hazard
    if (hPhrases.length === 0) maxSeverity = 1;

    // Find maximum severity from H-phrases
    hPhrases.forEach(phrase => {
        for (const pattern in hPhraseSeverityMap) {
            if (phrase.startsWith(pattern)) {
                if (hPhraseSeverityMap[pattern] > maxSeverity) {
                    maxSeverity = hPhraseSeverityMap[pattern];
                }
            }
        }
    });

    // Default severity if no matches
    if (maxSeverity === 0 && hPhrases.length > 0) {
        maxSeverity = hPhraseSeverityMap["default"];
    }

    // Signal Word overrides
    const signalWord = getSignalWord();
    if (signalWord === "Danger" && maxSeverity < 4) {
        maxSeverity = Math.max(maxSeverity, 3);
    }
    if (signalWord === "Warning" && maxSeverity < 2) {
        maxSeverity = Math.max(maxSeverity, 2);
    }

    return maxSeverity;
}
```

---

#### `calculateOverallLikelihood()` (Lines 969-998)

**Purpose**: Calculate exposure probability from procedure, quantity, frequency, etc.

**Parameters**: None (reads from form)

**Returns**: Integer 0-10 (capped at 10)

**Factors**:
1. **Procedure**: exposureFactor × 3 + aerosol × 2
2. **Quantity**: 0-3 points based on normalized amount
3. **Material Type**: +2 if volatile/dusty/gas/aerosol
4. **Frequency**: 0-3 points (monthly → multiple daily)
5. **Duration**: 0-3 points (short → very long)

**Logic**:
```javascript
function calculateOverallLikelihood() {
    let likelihoodScore = 0;

    // 1. Procedure factor
    const procedureKey = document.getElementById('labProcedure')?.value;
    const procDetails = procedureData[procedureKey];
    if (procDetails) {
        likelihoodScore += (procDetails.exposureFactor || 0.5) * 3;
        likelihoodScore += (procDetails.aerosol || 0) * 2;
    } else {
        likelihoodScore += 1.5; // Default if no procedure selected
    }

    // 2. Quantity factor
    const quantityValue = parseFloat(document.getElementById('quantityValue')?.value) || 0;
    const quantityUnit = document.getElementById('quantityUnit')?.value || 'mL';

    // Normalize to mL/mg
    let normalizedQuantity = quantityValue;
    if (['µL', 'µg'].includes(quantityUnit)) normalizedQuantity /= 1000;
    if (['L', 'kg'].includes(quantityUnit)) normalizedQuantity *= 1000;

    if (normalizedQuantity > 500) likelihoodScore += 3;
    else if (normalizedQuantity > 50) likelihoodScore += 2;
    else if (normalizedQuantity > 1) likelihoodScore += 1;

    // 3. Material type factor
    const materialType = document.getElementById('materialTypeForm')?.value || "";
    if (materialType.includes("volatile") || materialType.includes("dusty") ||
        materialType.includes("gas") || materialType.includes("aerosol")) {
        likelihoodScore += 2;
    }

    // 4. Frequency factor
    const frequency = document.getElementById('taskFrequency')?.value || "weekly";
    if (frequency === "multiple_daily") likelihoodScore += 3;
    else if (frequency === "daily") likelihoodScore += 2;
    else if (frequency === "weekly") likelihoodScore += 1;

    // 5. Duration factor
    const duration = document.getElementById('taskDuration')?.value || "medium";
    if (duration === "very_long") likelihoodScore += 3;
    else if (duration === "long") likelihoodScore += 2;
    else if (duration === "medium") likelihoodScore += 1;

    return Math.min(10, likelihoodScore);
}
```

---

#### `determineRiskEvaluationParameters()` (Lines 999-1035)

**Purpose**: Implement HSE Control Banding logic.

**Parameters**: None (reads from form)

**Side Effects**: Sets radio buttons for:
- Hazard Group (A-E, S)
- Quantity Group (Small/Medium/Large)
- Physical Characteristics (Low/Medium/High)
- Control Group (1-4, S)

**Logic**:
1. Map H-phrases → Hazard Group using `hPhraseToHazardGroup`
2. Calculate Quantity Category from normalized quantity
3. Determine Physical Characteristics from material type
4. Lookup Control Group in `controlBandData` based on above factors

---

#### `updateSuitableControls()` (Lines 1039-1168)

**Purpose**: Auto-select appropriate control measures based on risk assessment.

**Parameters**: None (reads from form and calculated risk parameters)

**Actions**:
- Checks general control checkboxes (Ventilation, LEV, Containment, etc.)
- Checks PPE checkboxes (Gloves, Eye Protection, Respiratory, etc.)
- Auto-fills PPE specification text from P-phrases
- Manages respiratory protection visibility (greyed out if not needed)

**Key Logic Sections**:

1. **General Controls** (based on Control Group):
```javascript
const controlGroupVal = document.querySelector('input[name="controlGroup"]:checked')?.value;

if (controlGroupVal === "1") {
    // Check "General Ventilation"
} else if (controlGroupVal === "2") {
    // Check "General Ventilation" + additional
} else if (controlGroupVal === "3") {
    // Check "LEV"
} else if (controlGroupVal === "4") {
    // Check "LEV" + "Containment"
} else if (controlGroupVal === "S") {
    // Check "Specialist"
}
```

2. **PPE from P-phrases** (Lines 1082-1114):
```javascript
// Extract PPE requirements from P-phrases
let ppeText = "";
const pPhrases = masterParsedMSDSData.pPhrases?.value || "";

if (pPhrases.includes("P280")) {
    ppeText += "Wear protective gloves/clothing/eye/face protection. ";
}

// Auto-check corresponding checkboxes
if (ppeText.toLowerCase().includes("glove")) {
    document.querySelector('input[name="ppeControl"][value="Gloves200_201"]').checked = true;
}
if (ppeText.toLowerCase().includes("eye") || ppeText.toLowerCase().includes("goggle")) {
    document.querySelector('input[name="ppeControl"][value="Eye300_301"]').checked = true;
}
// etc.
```

3. **Respiratory Protection Logic** (Lines 1115-1145):
```javascript
// Show/hide respiratory PPE based on:
// - Inhalation route checked
// - Material is dusty/volatile/aerosol
// - Control Group ≥ 2

const requiresRPE = inhalationRouteChecked &&
                    isDustyVolatileAerosol &&
                    (controlGroupVal === "2" || controlGroupVal === "3" ||
                     controlGroupVal === "4" || controlGroupVal === "S");

if (!requiresRPE) {
    // Grey out respiratory checkbox
    respLabel.classList.add('greyed-out');
    respCheckbox.checked = false;
} else {
    // Enable respiratory checkbox
    respLabel.classList.remove('greyed-out');
}
```

---

### PDF Parsing Functions

#### `processMSDSText(text)` (Lines 623-804)

**Purpose**: Extract structured data from MSDS text using regex patterns.

**Parameters**:
- `text` (string): Full text extracted from PDF or pasted by user

**Returns**: None (populates `masterParsedMSDSData` object)

**Extracts**:
1. **Chemical Name** - Multi-tier approach:
   - Pattern 1: "Product name: [Name]"
   - Pattern 2: Section 3 composition table
   - Pattern 3: Capitalized text before Section 1
   - Filters out P-phrases and codes

2. **CAS Number** - Four-tier approach:
   - Pattern 1: Section 3 composition table (highest confidence)
   - Pattern 2: "CAS No" or "CAS-No." with colon
   - Pattern 3: General CAS patterns
   - Pattern 4: Any XXX-XX-X format in early text

3. **Signal Word** - "Danger" or "Warning"

4. **Pictograms**:
   - Explicit: Search for "GHS08", "GHS07", etc.
   - **Inferred**: Map H-phrases to GHS codes if none found

5. **H-Phrases** - `H\d{3}` patterns

6. **P-Phrases** - `P\d{3}` patterns

7. **Sections** - Using `extractSection()` helper:
   - First Aid (Section 4)
   - Handling & Storage (Section 7)
   - Spillage (Section 6)
   - Disposal (Section 13)

**Output Structure**:
```javascript
masterParsedMSDSData = {
    chemicalName: { value: "Formamide", confidence: "high" },
    casNumber: { value: "75-12-7", confidence: "high" },
    signalWord: { value: "Danger", confidence: "high" },
    parsedRawPictograms: { value: "GHS08", confidence: "medium" },
    hPhrases: { value: "H351, H360, H373", confidence: "high" },
    pPhrases: { value: "P201, P202, P260, P280, ...", confidence: "high" },
    firstAid: { value: "Rinse immediately...", confidence: "high" },
    handlingAndStorage: { value: "Keep in properly labelled...", confidence: "medium" },
    spillage: { value: "Soak up with inert absorbent...", confidence: "high" },
    disposal: { value: "Dispose of contents/container...", confidence: "medium" }
};
```

---

#### `applyParsedDataToForm()` (Lines 837-921)

**Purpose**: Populate form fields with parsed MSDS data from preview table.

**Parameters**: None (reads from `masterParsedMSDSData`)

**Actions**:
1. Read edited values from preview table inputs
2. Update `masterParsedMSDSData` with edited values
3. Populate main form fields:
   - Chemical name → `#chemicalName`
   - CAS number → `#casNumber`
   - GHS pictograms → Check checkboxes matching `GHS08`, `GHS07`, etc.
   - H-phrases → `#hPhrasesForm`
   - First aid → `#firstAidReqs`
   - Spillage → `#spillReqs`
   - Disposal → `#disposalPrecautions`
   - Handling & Storage → `#storageReqs`
4. Update confidence markers (✅⚠️❓)
5. **Trigger `runFullRiskAssessmentLogic()`** to calculate risk

**Important Note**: Pictogram matching uses checkbox values like "GHS07_HarmfulIrritant" and extracts "GHS07" prefix.

---

### Data Management Functions

#### `exportToJson()` (Lines 1322-1345)

**Purpose**: Export current form state to JSON file for saving/sharing.

**Parameters**: None (reads from form)

**Output**: Downloads `cabi_coshh_dynamic_YYYY-MM-DD.json`

**Logic**:
```javascript
function exportToJson() {
    const form = document.getElementById('coshhFullForm');
    const data = {};

    // Collect all form data
    new FormData(form).forEach((value, key) => {
        const element = form.elements[key];

        // Handle RadioNodeList (multiple elements with same name)
        if (element instanceof RadioNodeList) {
            const firstElement = element[0];
            if (firstElement && firstElement.type === 'checkbox') {
                // Build array of checked values
                if(!data[key]) data[key] = [];
                data[key].push(value);
            } else if (firstElement && firstElement.type === 'radio') {
                data[key] = value; // Only store checked radio value
            }
        }
        else if (element && element.type === 'checkbox') {
            if(!data[key]) data[key] = [];
            data[key].push(value);
        }
        else if (element && element.type === 'radio') {
            if (element.checked) data[key] = value;
        }
        else {
            data[key] = value;
        }
    });

    // Create and download JSON file
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cabi_coshh_dynamic_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
```

**Critical Fix (Commit 851d0b6)**: Proper handling of `RadioNodeList` when multiple checkboxes share the same name (e.g., `ppeControl`).

---

#### `importFromJsonFile()` (Lines 1348+)

**Purpose**: Load assessment from uploaded JSON file.

**Parameters**: None (reads from file input `#importFile`)

**Actions**:
1. Read JSON file
2. Parse JSON data
3. Populate all form fields:
   - Text inputs/textareas: Direct value assignment
   - Radio buttons: Check matching value
   - Checkboxes: Check if value in array OR matches single value
   - Handles both array and single value formats
4. Run `runFullRiskAssessmentLogic()` to recalculate

**Checkbox Handling**:
```javascript
if (formElementOrGroup instanceof RadioNodeList) {
    const elements = Array.from(formElementOrGroup);
    if (elements[0].type === 'checkbox' && Array.isArray(data[key])) {
        // data[key] = ["Gloves200_201", "Eye300_301"]
        const groupValues = data[key];
        elements.forEach(checkbox => {
            checkbox.checked = groupValues.includes(checkbox.value);
        });
    }
}
```

---

## Customization Guide

### 1. Adjusting Severity Scores

**Location**: Lines ~230-280 (search for `hPhraseSeverityMap`)

**To modify existing H-phrase severity**:
```javascript
const hPhraseSeverityMap = {
    "H300": 5,  // Change from 5 to 4 to reduce severity
    "H301": 4,  // Increase from 4 to 5 to increase severity
    // ...
};
```

**To add a new H-phrase**:
```javascript
"H426": 3,  // Example: New hazard statement
```

**Impact**: Changes how `calculateOverallSeverity()` scores the substance.

---

### 2. Modifying Control Group Recommendations

**Location**: Lines ~540-580 (search for `controlBandData`)

**To change control recommendations**:
```javascript
const controlBandData = {
    "2": {
        hazard: "Low to moderate hazard",
        generalControls: "General ventilation plus engineering controls",
        ppeBasic: "Gloves, lab coat, safety glasses",
        // Modify these text descriptions:
        gcGuidanceSheet: "100",  // HSE guidance sheet number
        ppeGuidanceSheet: "200", // HSE PPE guidance sheet number
    }
};
```

**Impact**: Changes the auto-filled guidance text and control recommendations.

---

### 3. Adding New Laboratory Procedures

**Location**: Lines ~200-230 (search for `procedureData`)

**Step 1**: Add to `procedureData`:
```javascript
const procedureData = {
    // ... existing procedures ...

    "centrifugation": {  // New procedure key
        label: "Centrifugation",  // Display name
        desc: "Centrifuging samples",  // Activity description template
        routes: ["skin", "inhalation"],  // Auto-check these exposure routes
        exposureFactor: 0.6,  // 0.0-1.0 (affects likelihood calculation)
        aerosol: 1,  // 0-2 (aerosol generation bonus points)
        volCat: "Small",  // Small/Medium/Large (default quantity category)
        requiresContainment: false  // true if needs special containment
    }
};
```

**Step 2**: Add to HTML dropdown (Line ~255):
```html
<select id="labProcedure" name="labProcedure" onchange="handleProcedureChange()">
    <option value="">-- Select Procedure --</option>
    <!-- ... existing options ... -->
    <option value="centrifugation">Centrifugation</option>
</select>
```

**Tips for `exposureFactor`**:
- 0.1-0.3: Very low exposure (e.g., weighing in closed container)
- 0.4-0.6: Moderate exposure (e.g., pipetting, mixing)
- 0.7-0.9: High exposure (e.g., heating, grinding)
- 1.0: Very high exposure (e.g., spraying, pouring from height)

---

### 4. Changing Risk Matrix Thresholds

**Location**: Within `displayRiskMatrix()` or similar function (search for risk level thresholds)

Current thresholds:
```javascript
if (risk <= 4) {
    riskLevel = 'Low';
    riskColor = '#90EE90';  // Light green
} else if (risk <= 12) {
    riskLevel = 'Medium';
    riskColor = '#FFD700';  // Gold
} else {
    riskLevel = 'High';
    riskColor = '#FF6347';  // Tomato red
}
```

**To make risk assessment more/less cautious**:
```javascript
// More cautious (lower thresholds):
if (risk <= 3) {           // Was 4
    riskLevel = 'Low';
} else if (risk <= 10) {   // Was 12
    riskLevel = 'Medium';
} else {
    riskLevel = 'High';
}

// Less cautious (higher thresholds):
if (risk <= 6) {           // Was 4
    riskLevel = 'Low';
} else if (risk <= 15) {   // Was 12
    riskLevel = 'Medium';
} else {
    riskLevel = 'High';
}
```

**Impact**: Changes when substances are flagged as Medium vs. High risk.

---

### 5. Customizing PPE Auto-Selection Logic

**Location**: Lines 1082-1145 (within `updateSuitableControls()`)

**To add custom PPE logic based on specific H-phrases**:
```javascript
// After existing PPE logic, add:

const hPhrases = getHphrases();

// Example: Force full face shield for corrosives
if (hPhrases.some(h => h.startsWith("H314") || h.startsWith("H318"))) {
    const ppeEyeCb = document.querySelector('input[name="ppeControl"][value="Eye300_301"]');
    if (ppeEyeCb) ppeEyeCb.checked = true;

    const ppeSpecifyTypeEl = document.getElementById('ppeSpecifyType');
    if (ppeSpecifyTypeEl && !ppeSpecifyTypeEl.value.includes("face shield")) {
        ppeSpecifyTypeEl.value += "\nFull face shield required for corrosive substances.";
    }
}

// Example: Auto-select lab coat for all substances with skin contact route
const skinRouteChecked = document.querySelector('input[name="exposureRoute"][value="skin"]')?.checked;
if (skinRouteChecked) {
    const ppeClothingCb = document.querySelector('input[name="ppeControl"][value="Clothing100"]');
    if (ppeClothingCb) ppeClothingCb.checked = true;
}
```

---

### 6. Adjusting Likelihood Calculation

**Location**: Lines 969-998 (`calculateOverallLikelihood()`)

**Example modifications**:

**A. Change quantity thresholds**:
```javascript
// Current:
if (normalizedQuantity > 500) likelihoodScore += 3;
else if (normalizedQuantity > 50) likelihoodScore += 2;
else if (normalizedQuantity > 1) likelihoodScore += 1;

// Modified (more strict for small quantities):
if (normalizedQuantity > 250) likelihoodScore += 3;
else if (normalizedQuantity > 25) likelihoodScore += 2;
else if (normalizedQuantity > 0.5) likelihoodScore += 1;
```

**B. Adjust frequency scoring**:
```javascript
// Current:
if (frequency === "multiple_daily") likelihoodScore += 3;
else if (frequency === "daily") likelihoodScore += 2;
else if (frequency === "weekly") likelihoodScore += 1;

// Modified (increase weight of frequent use):
if (frequency === "multiple_daily") likelihoodScore += 4;
else if (frequency === "daily") likelihoodScore += 3;
else if (frequency === "weekly") likelihoodScore += 2;
else if (frequency === "monthly") likelihoodScore += 1;
```

---

### 7. Modifying Hazard Group Assignment

**Location**: Lines ~280-350 (`hPhraseToHazardGroup`)

**To change which H-phrases map to which Hazard Group**:
```javascript
const hPhraseToHazardGroup = {
    // Move H351 from D to E (treat suspected carcinogens as extreme):
    "H351": "E",  // Was probably D

    // Move H302 from C to B (treat harmful if swallowed as lower hazard):
    "H302": "B",  // Was C

    // Add new H-phrase:
    "H420": "E",  // Ozone layer damage

    // ...
};
```

**Impact**: Changes the Control Band determination and recommended controls.

---

### 8. Adding New GHS Pictogram Mappings

**Location**: Lines 759-795 (H-phrase to GHS pictogram mapping within `processMSDSText()`)

**To add new pictogram inference**:
```javascript
const hPhraseToGHS = {
    // ... existing mappings ...

    // Add new H-phrases:
    'H420': 'GHS09',  // Ozone layer damage
    'H421': 'GHS09',  // Environmental hazard

    // Change existing mapping:
    'H319': 'GHS05',  // Change eye irritation from GHS07 to GHS05 (more severe)
};
```

---

## Future Modularization

### Current Architecture Limitations

The monolithic HTML file (~1400 lines) has several drawbacks:

1. **Navigation**: Difficult to find specific logic quickly
2. **Collaboration**: Merge conflicts when multiple developers edit
3. **Testing**: Cannot unit test individual functions easily
4. **Reusability**: Logic is tightly coupled to DOM
5. **Maintenance**: Changes require scrolling through large file

### Recommended Modular Structure

```
cabi-coshh-helper/
├── index.html                  # Main HTML structure (~200 lines)
│
├── css/
│   ├── layout.css             # Page layout, typography
│   ├── forms.css              # Form styles, inputs
│   ├── tabs.css               # Tab navigation
│   ├── risk-matrix.css        # Risk matrix styling
│   └── print.css              # Print-specific styles
│
├── js/
│   ├── config/
│   │   ├── procedures.js      # procedureData export
│   │   ├── hazards.js         # hPhraseSeverityMap, hPhraseToHazardGroup
│   │   └── controls.js        # controlBandData
│   │
│   ├── modules/
│   │   ├── pdfParser.js       # PDF extraction & parsing
│   │   ├── riskCalculator.js  # Severity & likelihood calculations
│   │   ├── controlBanding.js  # Control group determination
│   │   ├── controlLogic.js    # Auto-selection of controls & PPE
│   │   ├── reportGenerator.js # Report HTML generation
│   │   └── riskMatrix.js      # Risk matrix display
│   │
│   ├── utils/
│   │   ├── dataManager.js     # Import/export JSON functions
│   │   ├── formHelpers.js     # Form manipulation utilities
│   │   └── validation.js      # Input validation
│   │
│   └── main.js                # App initialization, event listeners
│
├── examples/
│   ├── HiDi Formamide.pdf
│   └── cabi_coshh_dynamic_2025-10-07.json
│
├── assets/
│   ├── images/
│   │   ├── CABI_Logo.svg
│   │   └── ghs_*.svg          # GHS pictogram SVGs
│   └── fonts/                 # (optional) Web fonts
│
├── .gitignore
├── README.md
├── TECHNICAL.md
└── package.json               # (if using build tools)
```

### Migration Roadmap

#### Phase 1: Extract CSS (~2 hours)

**Benefits**: Immediate code reduction, easier styling updates

1. Create `css/` directory
2. Split styles into logical files:
   - `layout.css`: Body, container, header, footer
   - `forms.css`: Inputs, labels, buttons, checkboxes
   - `tabs.css`: Tab navigation
   - `risk-matrix.css`: Risk matrix table
   - `print.css`: `@media print` rules
3. Update `index.html`:
   ```html
   <link rel="stylesheet" href="css/layout.css">
   <link rel="stylesheet" href="css/forms.css">
   <link rel="stylesheet" href="css/tabs.css">
   <link rel="stylesheet" href="css/risk-matrix.css">
   <link rel="stylesheet" href="css/print.css">
   ```

#### Phase 2: Extract Configuration Data (~3 hours)

**Benefits**: Easy to update procedures and hazard mappings

1. Create `js/config/` directory
2. Extract to `procedures.js`:
   ```javascript
   // js/config/procedures.js
   export const procedureData = {
       "pipetting": { ... },
       "weighing": { ... },
       // ...
   };
   ```
3. Extract to `hazards.js`:
   ```javascript
   // js/config/hazards.js
   export const hPhraseSeverityMap = { ... };
   export const hPhraseToHazardGroup = { ... };
   ```
4. Extract to `controls.js`:
   ```javascript
   // js/config/controls.js
   export const controlBandData = { ... };
   ```
5. Import in main script:
   ```javascript
   import { procedureData } from './config/procedures.js';
   import { hPhraseSeverityMap, hPhraseToHazardGroup } from './config/hazards.js';
   import { controlBandData } from './config/controls.js';
   ```

#### Phase 3: Modularize JavaScript (~1 week)

**Benefits**: Testable, maintainable, reusable code

1. Create `js/modules/` directory

2. **pdfParser.js**:
   ```javascript
   export async function parseUploadedMSDS(file) { ... }
   export function processMSDSText(text) { ... }
   export function extractSection(text, keywords, stopKeywords) { ... }
   ```

3. **riskCalculator.js**:
   ```javascript
   export function calculateOverallSeverity(hPhrases, signalWord) { ... }
   export function calculateOverallLikelihood(procedure, quantity, frequency, duration) { ... }
   ```

4. **controlBanding.js**:
   ```javascript
   export function determineHazardGroup(hPhrases) { ... }
   export function determineQuantityCategory(quantity, unit) { ... }
   export function determinePhysicalCharacteristics(materialType) { ... }
   export function lookupControlGroup(hazardGroup, quantityCategory, physChar) { ... }
   ```

5. **controlLogic.js**:
   ```javascript
   export function updateGeneralControls(controlGroup) { ... }
   export function updatePPEControls(exposureRoutes, hPhrases, pPhrases, controlGroup) { ... }
   export function generatePPEText(pPhrases) { ... }
   ```

6. **reportGenerator.js**:
   ```javascript
   export function generateFullReport(formData) { ... }
   export function generateRiskMatrix(severity, likelihood) { ... }
   ```

7. **dataManager.js**:
   ```javascript
   export function exportToJson(formData) { ... }
   export function importFromJsonFile(file) { ... }
   export function saveLocally(formData) { ... }
   export function loadLocally() { ... }
   ```

8. **main.js** (orchestration):
   ```javascript
   import * as pdfParser from './modules/pdfParser.js';
   import * as riskCalculator from './modules/riskCalculator.js';
   import * as controlBanding from './modules/controlBanding.js';
   import * as controlLogic from './modules/controlLogic.js';
   import * as reportGenerator from './modules/reportGenerator.js';
   import * as dataManager from './modules/dataManager.js';

   // Event listeners
   document.getElementById('parseMSDSBtn').addEventListener('click', async () => {
       const file = document.getElementById('msdsFile').files[0];
       const parsedData = await pdfParser.parseUploadedMSDS(file);
       // ...
   });

   // Initialize app
   document.addEventListener('DOMContentLoaded', initializeApp);
   ```

#### Phase 4: Add Build System (Optional, ~1 day)

**Benefits**: Modern workflow, hot reload, bundling

1. Install Vite (lightweight, fast):
   ```bash
   npm install -D vite
   ```

2. Update `package.json`:
   ```json
   {
     "name": "cabi-coshh-helper",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

3. Development workflow:
   ```bash
   npm run dev    # Start dev server with hot reload
   npm run build  # Bundle for production
   ```

4. (Optional) Create single-file build script:
   ```javascript
   // build-single-file.js
   // Bundles all modules back into single HTML for deployment
   ```

#### Phase 5: Add Testing (~3 days)

**Benefits**: Confidence in changes, regression prevention

1. Install testing framework:
   ```bash
   npm install -D vitest @testing-library/dom
   ```

2. Write unit tests:
   ```javascript
   // tests/riskCalculator.test.js
   import { describe, it, expect } from 'vitest';
   import { calculateOverallSeverity } from '../js/modules/riskCalculator.js';

   describe('calculateOverallSeverity', () => {
       it('should return 5 for H350 (carcinogen)', () => {
           const result = calculateOverallSeverity(['H350'], 'Danger');
           expect(result).toBe(5);
       });

       it('should return 3 for Signal Word Danger with no H-phrases', () => {
           const result = calculateOverallSeverity([], 'Danger');
           expect(result).toBe(3);
       });

       // ... more tests
   });
   ```

3. Run tests:
   ```bash
   npm test
   ```

### Backwards Compatibility

To maintain the single-file option for restricted environments:

**Option A**: Keep both versions
- `coshhgeneratorv5.html` - Monolithic (current)
- `index.html` - Modular (new)
- Update monolithic file by manually syncing changes

**Option B**: Build script to create single file
```javascript
// build-single-file.js
import fs from 'fs';
import { bundle } from './bundler.js';

// Bundle all CSS into <style>
const css = bundle('css/**/*.css');

// Bundle all JS into <script>
const js = bundle('js/**/*.js');

// Inject into HTML template
const html = fs.readFileSync('index.html', 'utf8')
    .replace('<!-- CSS_PLACEHOLDER -->', `<style>${css}</style>`)
    .replace('<!-- JS_PLACEHOLDER -->', `<script>${js}</script>`);

fs.writeFileSync('dist/coshhgeneratorv5-bundled.html', html);
```

### Recommended Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| 1. Extract CSS | 2 hours | High |
| 2. Extract Config | 3 hours | High |
| 3. Modularize JS | 5 days | Medium |
| 4. Build System | 1 day | Low |
| 5. Add Testing | 3 days | Medium |

**Total**: ~2 weeks for full modularization

### Benefits Summary

| Benefit | Current | Modular |
|---------|---------|---------|
| Code navigation | Scroll through 1400 lines | Jump to specific module |
| Finding functions | Ctrl+F, guess line numbers | Import from named module |
| Editing | Risk of breaking unrelated code | Isolated changes |
| Testing | Manual browser testing only | Automated unit tests |
| Collaboration | Merge conflicts | Cleaner git diffs |
| Performance | Load 1400 lines | Load only needed modules |
| Maintainability | High cognitive load | Logical organization |

---

## Appendix: Common Customization Scenarios

### Scenario 1: Make Risk Assessment More Conservative

**Requirement**: Flag more substances as high risk

**Changes needed**:
1. Lower severity thresholds for H-phrases
2. Lower risk matrix thresholds
3. Increase likelihood scores for common procedures

```javascript
// 1. Increase H-phrase severities
const hPhraseSeverityMap = {
    "H351": 5,  // Was 4 - treat suspected carcinogens as severe
    "H373": 4,  // Was 3 - treat organ damage as more severe
    // ...
};

// 2. Lower risk matrix thresholds
if (risk <= 3) {           // Was 4
    riskLevel = 'Low';
} else if (risk <= 9) {    // Was 12
    riskLevel = 'Medium';
} else {
    riskLevel = 'High';
}

// 3. Increase procedure exposure factors
const procedureData = {
    "pipetting": {
        exposureFactor: 0.7,  // Was 0.5
        aerosol: 1,           // Was 0
        // ...
    }
};
```

---

### Scenario 2: Add New Hazard Class (e.g., Nanomaterials)

**Requirement**: Add special handling for nanomaterials

**Changes needed**:
1. Add material type option
2. Add hazard group "N" for nanomaterials
3. Update control banding logic

```javascript
// 1. Add to HTML (Material Type dropdown):
<option value="nano">Nanomaterial</option>

// 2. Add hazard group
const hPhraseToHazardGroup = {
    // ... existing ...
    "NANO": "N",  // Special flag for nanomaterials
};

// 3. Add control group
const controlBandData = {
    // ... existing ...
    "N": {
        hazard: "Nanomaterial - Specialist assessment required",
        generalControls: "Containment, LEV, specialist advice",
        ppeBasic: "Full PPE, respiratory protection mandatory",
        gcGuidanceSheet: "N/A",
        ppeGuidanceSheet: "400"
    }
};

// 4. Update control logic
function determineRiskEvaluationParameters() {
    // ... existing logic ...

    // Check for nanomaterial
    const materialType = document.getElementById('materialTypeForm')?.value;
    if (materialType === "nano" || materialType.toLowerCase().includes("nano")) {
        setRadio("hazardGroup", "N");
        setRadio("controlGroup", "N");
        return; // Skip normal control banding
    }

    // ... rest of function
}
```

---

### Scenario 3: Integrate with LIMS System

**Requirement**: Auto-populate from laboratory information management system

**Changes needed**:
1. Add API integration module
2. Create data mapping function
3. Add "Import from LIMS" button

```javascript
// js/modules/limsIntegration.js
export async function fetchFromLIMS(chemicalId) {
    const response = await fetch(`/api/lims/chemicals/${chemicalId}`);
    const limsData = await response.json();

    return {
        chemicalName: limsData.name,
        casNumber: limsData.cas_number,
        supplier: limsData.supplier,
        quantity: limsData.inventory_quantity,
        location: limsData.storage_location,
        // Map LIMS fields to form fields
    };
}

export function populateFromLIMS(limsData) {
    document.getElementById('chemicalName').value = limsData.chemicalName;
    document.getElementById('casNumber').value = limsData.casNumber;
    // ... populate other fields

    runFullRiskAssessmentLogic();
}
```

```html
<!-- Add to HTML -->
<button onclick="importFromLIMS()">Import from LIMS</button>
<input type="text" id="limsChemicalId" placeholder="Chemical ID">
```

---

## Contributing

When making changes to the CABI COSHH Helper:

1. **Test thoroughly** with example PDFs in `/examples` directory
2. **Update documentation** if logic changes (this file + README.md)
3. **Use descriptive commit messages** following the existing pattern
4. **Add inline comments** for complex logic
5. **Consider backwards compatibility** when modifying data structures

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-new-procedure

# 2. Make changes, test locally

# 3. Commit with descriptive message
git add .
git commit -m "Add centrifugation procedure with aerosol risk"

# 4. Push and create PR
git push origin feature/add-new-procedure
```

### Code Style

- **Indentation**: 4 spaces (or 2 spaces for HTML)
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: Explain "why" not "what"
- **Line length**: ~120 characters max

---

## Version History

- **v5.0** (2025-10-07): Enhanced PDF parsing with Section 3 table support, H-phrase pictogram inference
- **v4.1** (2025-10-06): Fixed PPE checkbox serialization (RadioNodeList handling)
- **v4.0** (2025-01): Initial GitHub release with PDF parsing

---

## Support & Contact

For questions, issues, or contributions:
- **GitHub Issues**: [CABI-COSHH-Helper/issues](https://github.com/miguel-bonnin/CABI-COSHH-Helper/issues)
- **Internal**: Contact CABI Health & Safety department
- **Developer**: J. Miguel Bonnin (m.bonnin@cabi.org)

---

**Last Updated**: 2025-10-07
