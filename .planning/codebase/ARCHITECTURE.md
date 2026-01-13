# Architecture

**Analysis Date:** 2026-01-13

## Pattern Overview

**Overall:** Client-Side Single-Page Application (SPA) with Tab-Based Navigation

**Key Characteristics:**
- Browser-only execution (no backend server)
- Multi-step workflow via tab interface
- Form-based data collection with auto-calculations
- PDF parsing and report generation client-side
- Modular JavaScript (recently refactored from monolithic HTML)

## Layers

**Presentation Layer:**
- Purpose: User interface and form controls
- Contains: HTML structure (`coshhgeneratorv5.html`), CSS styling (`css/**/*.css`)
- Depends on: Application layer for data processing
- Used by: End users (lab personnel, assessors)
- Entry: `coshhgeneratorv5.html` - Tab-based navigation with 11 tabs

**Application Layer:**
- Purpose: Business logic and risk assessment calculations
- Contains: JavaScript modules in `js/` directory
- Modules:
  - Configuration: `js/config/*.js` (procedures, hazards, controls)
  - Features: `js/eh40-loader.js`, `js/inventory-manager.js`, `js/floor-plan-viewer.js`
- Depends on: Configuration data and browser APIs
- Used by: Presentation layer event handlers

**Data Layer:**
- Purpose: Static configuration and reference data
- Contains: JSON/CSV data files in `data/` directory
  - `data/inventory/chemical-inventory.json` - Chemical inventory
  - `data/tracking/assessment-status.json` - Assessment status
  - `eh40_table.csv` - UK HSE Workplace Exposure Limits
- Depends on: Nothing (static data)
- Used by: Application layer for lookups and auto-fill

## Data Flow

**COSHH Assessment Creation:**

1. User selects "Inventory" tab → Loads chemical inventory from `data/inventory/chemical-inventory.json`
2. User clicks "Create Assessment" → Auto-fills chemical name, CAS number, hazards from inventory
3. **OR** User uploads MSDS PDF → PDF.js extracts text → Parsing logic extracts structured data
4. User completes form across tabs 1-8:
   - Tab 1: Personnel details
   - Tab 2: Substance identification → Auto-filled from MSDS/inventory
   - Tab 3: Hazard identification → GHS pictograms, H-phrases, P-phrases
   - Tab 4: Procedure details → Selects lab procedure (pipetting, weighing, etc.)
   - Tab 5: Risk evaluation → **Auto-calculated** (Severity × Likelihood = Risk)
   - Tab 6: Suitable controls → **Auto-suggested** PPE and general controls
   - Tab 7: Further actions
   - Tab 8: Acknowledgement and review dates
5. User clicks "Generate Report" → JavaScript builds HTML report
6. User prints report → Browser print dialog (styled with `css/print.css`)
7. User exports data → JSON file download via Blob API
8. User saves locally → Browser LocalStorage

**Risk Calculation Flow:**

1. Hazard information entered (H-phrases, signal word)
2. Procedure selected (exposureFactor, aerosol generation)
3. Quantity, frequency, duration specified
4. **Severity** calculated: H-phrases → severity map → score (1-5)
5. **Likelihood** calculated: procedure + quantity + frequency + duration → score (0-10)
6. **Risk** = Severity × Likelihood → categorized as Low (1-4), Medium (5-12), High (13-25)
7. **Control Band** determined: Hazard Group + Quantity + Physical Characteristics → Control Group (1-4, S)
8. **Controls auto-selected**: Based on Control Group and exposure routes
9. **Report generated**: Complete COSHH assessment with all calculated values

**State Management:**
- Form state lives in HTML form elements (inputs, selects, checkboxes, textareas)
- Parsed MSDS data stored in global `masterParsedMSDSData` object
- Inventory data loaded on demand into DOM table
- Assessment drafts saved to LocalStorage
- Exports as JSON files (FormData serialization)

## Key Abstractions

**Configuration Objects:**
- Purpose: Define risk assessment rules and control recommendations
- Examples: `procedureData`, `hPhraseSeverityMap`, `hPhraseToHazardGroup`, `controlBandData`
- Location: `js/config/*.js`
- Pattern: Plain JavaScript objects (exported via module scripts)

**Tab Management:**
- Purpose: Multi-step workflow navigation
- Implementation: `openTab(event, tabName)` function
- Pattern: Show/hide div elements with active class toggling

**Auto-Calculation Engine:**
- Purpose: Real-time risk assessment as user enters data
- Functions: `calculateOverallSeverity()`, `calculateOverallLikelihood()`, `determineRiskEvaluationParameters()`
- Pattern: Triggered on form field change events
- Location: Embedded in `coshhgeneratorv5.html` `<script>` section

**PDF Parser:**
- Purpose: Extract structured data from MSDS PDFs
- Implementation: PDF.js for text extraction + regex patterns for data extraction
- Functions: `parseUploadedMSDS()`, `processMSDSText()`, `extractSection()`
- Pattern: Multi-tier extraction with confidence scoring

## Entry Points

**Main Application:**
- Location: `coshhgeneratorv5.html`
- Triggers: User opens URL in browser
- Responsibilities:
  - Initialize tab navigation
  - Load external scripts (PDF.js, config modules, feature modules)
  - Set up form event listeners
  - Display default tab (MSDS input or Inventory)

**Module Scripts:**
- `js/config/procedures.js` - Lab procedure definitions
- `js/config/hazards.js` - H-phrase severity and hazard group mappings
- `js/config/controls.js` - Control band recommendations
- `js/eh40-loader.js` - Load UK workplace exposure limits
- `js/inventory-manager.js` - Chemical inventory table management
- `js/floor-plan-viewer.js` - Floor plan visualization for chemical locations

## Error Handling

**Strategy:** Graceful degradation with user-visible error messages

**Patterns:**
- PDF parsing errors → Display message in `#parserStatus` div
- File upload errors → Alert dialog
- LocalStorage quota exceeded → Silent fail (form still works without save)
- Missing data → Use defaults or show validation warnings

**No global error boundary** - errors may surface as browser console messages

## Cross-Cutting Concerns

**Logging:**
- Browser console.log() for debugging
- No structured logging or external service

**Validation:**
- Minimal client-side validation
- Required fields not enforced programmatically
- User expected to complete all relevant sections

**Form Persistence:**
- Auto-save to LocalStorage on form changes (if implemented)
- Manual save via "Save Locally" button
- Export to JSON file for long-term storage

---

*Architecture analysis: 2026-01-13*
*Update when major patterns change*
