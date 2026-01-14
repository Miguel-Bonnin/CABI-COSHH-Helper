# COSHH Helper Architecture

> **Last Updated:** January 2026
> **Major Milestones:** Modularization (Phase 1, Jan 2026), Runtime Safety (Phase 2, Jan 2026)

## 1. System Overview

The CABI COSHH Helper is a **browser-based Single-Page Application (SPA)** that assists lab personnel in creating compliant COSHH (Control of Substances Hazardous to Health) assessments. The application runs entirely client-side with no backend server currently deployed.

**Deployment:**
- Hosted on GitHub Pages: https://miguel-bonnin.github.io/CABI-COSHH-Helper/
- Static file serving (HTML, CSS, JavaScript, data files)
- No server-side processing required

**Core Capabilities:**
- Parse MSDS (Material Safety Data Sheet) PDFs to extract hazard information
- Auto-calculate risk scores based on severity and likelihood
- Recommend control measures and PPE based on hazard data
- Generate professional COSHH assessment reports
- Manage chemical inventory with assessment status tracking
- Persist draft assessments in browser LocalStorage
- Export/import assessments as JSON files

**Current State:**
The application is functional but undergoing systematic improvement to demonstrate maintainability and reliability to IT stakeholders. Recent phases (Jan 2026) established automated testing and runtime safety infrastructure.

## 2. Design Principles

### Vanilla JavaScript for Maintainability
**Decision:** No frontend frameworks (React, Vue, Angular)
**Rationale:** Easier for IT department to maintain long-term; reduces dependency overhead; already working pattern
**Trade-offs:** More manual DOM manipulation; no reactivity system; larger monolithic HTML initially

### Modular ES6 Architecture
**Evolution:** Originally a monolithic HTML file (~3000 lines); progressively refactored into modules (Phase 1-2, Jan 2026)
**Pattern:** ES6 module imports with separate configuration and feature files
**Benefits:** Better code organization, testability, and maintainability

**Module Types:**
- **Config modules** (`js/config/*.js`): Static data exported as JavaScript objects (procedures, hazards, controls)
- **Feature modules** (`js/*.js`): Self-contained features (inventory manager, EH40 loader, floor plan viewer)
- **Utility modules** (`js/modules/*.js`): Pure functions for calculations and DOM safety (riskCalculator, domHelpers)

### Pure Functions for Testability
**Decision:** Extract calculation logic into pure functions without DOM dependencies
**Implementation:** `calculateOverallSeverity()` and `calculateOverallLikelihood()` in `js/modules/riskCalculator.js`
**Benefits:** Unit testable with Vitest; predictable behavior; easier debugging
**Testing:** 69 tests with 100% pass rate (as of Phase 2 completion)

### Progressive Enhancement from Monolithic HTML
**Strategy:** Incrementally extract functionality from main HTML file into modules
**Progress:**
- Phase 1 (Jan 2026): CSS extracted to `css/*.css`, config data to `js/config/*.js`
- Phase 2 (Jan 2026): Risk calculations to `js/modules/riskCalculator.js`, DOM helpers to `js/modules/domHelpers.js`
- Future: Continue extracting as complexity demands

### Client-Side First Architecture
**Decision:** Build complete frontend functionality before requesting backend support
**Purpose:** Demonstrate stability and maintainability to gain IT approval for backend integration
**Current:** 100% browser-based with LocalStorage and JSON export/import
**Future:** Backend will add database, authentication, and workflow (pending IT approval)

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                            Browser                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              COSHH Helper Application (SPA)               │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │   MSDS      │  │    Risk     │  │   Report    │     │  │
│  │  │   Parser    │──│  Calculator │──│  Generator  │     │  │
│  │  │  (PDF.js)   │  │  (Severity  │  │   (HTML)    │     │  │
│  │  │             │  │  ×Likelihood)│  │             │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  │         │                │                 │            │  │
│  │         └────────────────┼─────────────────┘            │  │
│  │                          │                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │  Inventory  │  │   Control   │  │  Floor Plan │     │  │
│  │  │   Manager   │  │  Recommender│  │   Viewer    │     │  │
│  │  │             │  │  (PPE, Eng) │  │             │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │         Data Layer        │                               │  │
│  │  ┌────────────────┐  ┌───┴──────────┐  ┌─────────────┐  │  │
│  │  │  LocalStorage  │  │ Static Files │  │External CDN │  │  │
│  │  │ (Draft Assess.)│  │ (Inventory,  │  │  (PDF.js,   │  │  │
│  │  │                │  │  Hazards,    │  │  CABI Logo) │  │  │
│  │  │                │  │  Controls)   │  │             │  │  │
│  │  └────────────────┘  └──────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Optional External Integration (Admin Only)        │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │          ChemInventory API (CABI Internal)          │  │  │
│  │  │   (Admin scripts fetch inventory data via Node.js)  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Component Responsibilities:**

| Component | Purpose | Implementation | Data Sources |
|-----------|---------|----------------|--------------|
| **MSDS Parser** | Extract hazard data from PDF | PDF.js + regex patterns | Uploaded PDF files |
| **Risk Calculator** | Compute severity × likelihood | Pure functions (tested) | Form inputs, H-phrases |
| **Report Generator** | Generate printable assessment | HTML templating | Form data, calculations |
| **Inventory Manager** | Display chemical inventory | DOM table with filters | `data/inventory/*.json` |
| **Control Recommender** | Suggest PPE and controls | Rule-based lookup | `js/config/controls.js` |
| **Floor Plan Viewer** | Visualize chemical locations | SVG rendering | Floor plan images |

## 4. Technology Choices

### Why Vanilla JavaScript?
**Chosen:** Plain ES6+ JavaScript without frameworks
**Alternatives considered:** React, Vue (rejected due to maintenance concerns)
**Benefits:**
- No framework lock-in or upgrade cycles
- Easier for IT staff to maintain long-term
- Simpler deployment (no build step initially)
- Already working pattern in existing code

**Trade-offs:**
- More manual DOM manipulation
- No built-in reactivity or state management
- Larger initial HTML file (mitigated by modularization)

### Why Vitest?
**Chosen:** Vitest test framework (added Phase 1, Jan 2026)
**Alternatives considered:** Jest (rejected due to heavier dependencies)
**Benefits:**
- Fast execution with native ES modules support
- Lighter weight than Jest + jsdom
- Compatible with ES6 module architecture
- Modern API with good developer experience

**Configuration:** `vitest.config.js` with happy-dom environment

### Why happy-dom?
**Chosen:** happy-dom for DOM simulation in tests
**Alternatives considered:** jsdom (more complete but slower)
**Benefits:**
- Faster than jsdom for most use cases
- Sufficient for testing pure calculation functions
- Lighter memory footprint

**Limitation:** Some advanced DOM APIs not supported (not needed for current tests)

### Why ES6 Modules?
**Chosen:** Native ES6 modules with `type: "module"` in package.json
**Alternatives considered:** CommonJS (incompatible with browser imports), bundlers (premature complexity)
**Benefits:**
- Works in both browser and Node.js (Vitest)
- Enables code splitting and tree shaking
- Modern JavaScript standard
- No build step required for browser execution

**Implementation:** `<script type="module">` tags in HTML, `import`/`export` syntax

### Why PDF.js from CDN?
**Chosen:** PDF.js 2.10.377 from cdnjs.cloudflare.com
**Alternatives considered:** npm package (requires build step), local copy (version staleness)
**Benefits:**
- No build step required
- Browser caching across sites
- Easy version updates

**Trade-off:** Network dependency (mitigated by CDN reliability)

### Why LocalStorage for Persistence?
**Chosen:** Browser LocalStorage for draft assessments
**Alternatives considered:** IndexedDB (overkill), backend database (not available yet)
**Benefits:**
- No backend required
- Simple API for key-value storage
- Automatic persistence across sessions

**Limitations:**
- 5-10MB storage limit
- String-only storage (JSON serialization required)
- No synchronization across devices

### Why No Backend (Currently)?
**Decision:** Client-side only application
**Rationale:** Prove frontend quality before requesting IT support for backend
**Current capabilities:**
- All features work without server
- JSON export for sharing/archival
- Admin scripts run separately to fetch inventory data

**Future:** Backend will add database, authentication, and workflow (see Section 7)

## 5. Data Flow

### Complete Assessment Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                      Assessment Creation Flow                     │
└──────────────────────────────────────────────────────────────────┘

1. Input: MSDS Upload or Inventory Selection
   ├─ User uploads PDF → PDF.js extracts text
   │  └─ Regex patterns extract: CAS number, H-phrases, signal word,
   │     product name, hazard pictograms
   │
   └─ User selects from inventory → Auto-fill chemical details
      └─ Loads from data/inventory/chemical-inventory.json

2. Form Population (Tabs 1-4)
   ├─ Tab 1: Personnel details (assessor, lab manager, date)
   ├─ Tab 2: Substance identification (auto-filled from MSDS/inventory)
   ├─ Tab 3: Hazard identification (GHS pictograms, H-phrases, P-phrases)
   └─ Tab 4: Procedure details (lab procedure, quantity, frequency, duration)

3. Auto-Calculation (Tab 5: Risk Evaluation)
   ├─ Severity Calculation:
   │  └─ Input: H-phrases array, signal word
   │     └─ hPhraseSeverityMap lookup (js/config/hazards.js)
   │        └─ Output: Severity score (1-5)
   │
   ├─ Likelihood Calculation:
   │  └─ Input: Procedure, quantity, unit, frequency, duration
   │     └─ procedureData lookup + quantity normalization
   │        └─ Output: Likelihood score (0-10)
   │
   └─ Risk Score = Severity × Likelihood
      └─ Classification: Low (1-4), Medium (5-12), High (13-25)

4. Control Recommendations (Tab 6)
   ├─ Control Band Determination:
   │  └─ Input: Hazard group (from H-phrases), quantity, physical state
   │     └─ controlBandData lookup (js/config/controls.js)
   │        └─ Output: Control Group (1, 2, 3, 4, or S for sensitizers)
   │
   └─ PPE Selection:
      └─ Based on Control Group + exposure routes
         └─ Auto-checks: Gloves, lab coat, eye protection, respiratory

5. Additional Information (Tabs 7-8)
   ├─ Tab 7: Further actions, monitoring requirements
   └─ Tab 8: Acknowledgement, review dates

6. Report Generation (Report Tab)
   ├─ JavaScript builds HTML report from form data
   ├─ Includes: All input data, calculated risk scores, control recommendations
   ├─ Styled with css/print.css for professional printing
   └─ User prints via browser print dialog

7. Persistence Options
   ├─ LocalStorage: Auto-save draft (triggered on form change)
   ├─ JSON Export: Download complete assessment as .json file
   └─ Future: Save to backend database (pending IT approval)
```

### State Management Pattern

**Form State:**
- Lives in HTML form elements (`<input>`, `<select>`, `<textarea>`, `<checkbox>`)
- Accessed via `document.getElementById()` or safe DOM helpers
- No centralized state store (form is the source of truth)

**Parsed MSDS Data:**
- Stored in global `masterParsedMSDSData` object (in main HTML)
- Structure: `{ productName, casNumber, hPhrases, pPhrases, signalWord, ... }`
- Populated by PDF parser, used to auto-fill form fields

**Inventory Data:**
- Loaded on demand from `data/inventory/chemical-inventory.json`
- Rendered into DOM table with filters and search
- Not stored in application state (re-fetched on refresh)

**LocalStorage Schema:**
```javascript
// Key: "coshh_assessment_draft"
// Value: JSON string of FormData object
{
  assessorName: "...",
  chemicalName: "...",
  casNumber: "...",
  hPhrases: ["H350", "H314", ...],
  // ... all form fields
}
```

## 6. Module Organization

### Directory Structure
```
js/
├── config/                   # Static configuration data
│   ├── procedures.js         # Lab procedure definitions
│   ├── hazards.js            # H-phrase severity mappings
│   └── controls.js           # Control band recommendations
│
├── modules/                  # Utility modules (pure functions)
│   ├── riskCalculator.js     # Risk calculation logic
│   └── domHelpers.js         # Safe DOM query functions
│
├── eh40-loader.js            # UK HSE Workplace Exposure Limits loader
├── inventory-manager.js      # Chemical inventory table management
└── floor-plan-viewer.js      # Floor plan visualization
```

### Module Categories

**Config Modules** (js/config/*.js)
- **Purpose:** Provide static reference data for risk assessment
- **Pattern:** Export const objects with configuration data
- **Examples:**
  - `procedures.js`: Lab procedure definitions with exposure factors
  - `hazards.js`: H-phrase to severity score mappings, hazard group classifications
  - `controls.js`: Control band data, PPE recommendations
- **Usage:** Imported by calculation functions and form builders
- **No tests:** Static data, validated through integration use

**Utility Modules** (js/modules/*.js)
- **Purpose:** Provide pure functions for calculations and DOM safety
- **Pattern:** Export functions with no side effects
- **Examples:**
  - `riskCalculator.js`: `calculateOverallSeverity()`, `calculateOverallLikelihood()`
  - `domHelpers.js`: `safeGetElementById()`, `safeSetTextContent()`, `safeAddEventListener()`
- **Usage:** Imported by main HTML and feature modules
- **Tested:** 69 unit tests (100% pass rate)

**Feature Modules** (js/*.js at root)
- **Purpose:** Self-contained features with DOM interaction
- **Pattern:** ES6 modules with initialization functions
- **Examples:**
  - `inventory-manager.js`: Renders inventory table, handles filtering/search
  - `eh40-loader.js`: Loads UK workplace exposure limits from CSV
  - `floor-plan-viewer.js`: Displays floor plans with chemical locations
- **Usage:** Loaded via `<script type="module">` in main HTML
- **Not tested:** Integration-level features (future E2E tests)

**Main HTML** (coshhgeneratorv5.html)
- **Purpose:** UI structure, tab navigation, orchestration
- **Contents:**
  - HTML form structure (11 tabs)
  - Inline `<script>` section with orchestration logic
  - Event handlers for form interactions
  - PDF parsing implementation
  - Report generation logic
- **Future refactoring:** Extract more logic into modules as complexity grows

### Dependency Graph

```
coshhgeneratorv5.html (main application)
├── js/config/procedures.js (procedureData)
├── js/config/hazards.js (hPhraseSeverityMap, hPhraseToHazardGroup)
├── js/config/controls.js (controlBandData)
├── js/modules/riskCalculator.js
│   └── js/config/hazards.js (hPhraseSeverityMap)
├── js/modules/domHelpers.js
├── js/inventory-manager.js
│   └── data/inventory/chemical-inventory.json (fetched at runtime)
├── js/eh40-loader.js
│   └── eh40_table.csv (fetched at runtime)
└── js/floor-plan-viewer.js
    └── assets/floor-plans/*.svg (loaded on demand)
```

### Import Strategy

**Browser-side imports:**
```html
<!-- Config modules: Plain scripts (no type="module") for global access -->
<script src="js/config/procedures.js"></script>
<script src="js/config/hazards.js"></script>
<script src="js/config/controls.js"></script>

<!-- Feature modules: ES6 modules with type="module" -->
<script type="module" src="js/inventory-manager.js"></script>
<script type="module" src="js/eh40-loader.js"></script>
<script type="module" src="js/floor-plan-viewer.js"></script>
```

**Test-side imports:**
```javascript
// Vitest can import ES6 modules directly
import { calculateOverallSeverity } from '../js/modules/riskCalculator.js';
import { safeGetElementById } from '../js/modules/domHelpers.js';
```

## 7. Future Architecture

### Current State (January 2026)
**Deployment:** Frontend-only, hosted on GitHub Pages
**Storage:** Browser LocalStorage for drafts, JSON export for archival
**Authentication:** None (public access)
**Data management:** Admin scripts manually fetch inventory via ChemInventory API
**Workflow:** Manual draft → completion → printing → manual upload to ChemInventory

### Planned Backend Integration

**Goal:** Automated workflow with user authentication and database storage

**Backend Technology (Proposed):**
- **Runtime:** Node.js with Express or similar framework
- **Database:** PostgreSQL or MySQL for assessment storage
- **Authentication:** Session-based or JWT with role-based access control
- **API:** RESTful API for CRUD operations on assessments

**Architecture Evolution:**
```
┌─────────────────────────────────────────────────────────────────┐
│                         Future Architecture                      │
└─────────────────────────────────────────────────────────────────┘

                    Browser (Frontend SPA)
                            │
                    [Same UI as current]
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        Authentication   Assessment   Inventory
            API            API          API
              │             │             │
              └─────────────┼─────────────┘
                            │
                    Backend Server
                   (Node.js/Express)
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
         User Database  Assessment DB  ChemInventory
        (auth, roles)  (drafts, final)  API (external)
```

### Workflow Architecture

**Roles:**
- **Lab Manager:** Creates draft assessments
- **COSH Assessor:** Reviews and approves drafts
- **Admin:** Manages users and system configuration

**Workflow States:**
```
Draft → Submitted → Under Review → Approved → Published
  │         │           │            │           │
  └─────────┴───────────┴────────────┴───────────┘
           (All stored in database)
                                                  │
                                                  ▼
                                          ChemInventory API
                                        (auto-publish on approval)
```

**Benefits:**
- No duplicate COSHH assessments (centralized database)
- Clear approval chain with audit trail
- Automated publishing to ChemInventory eliminates manual data entry
- Role-based access control ensures proper review process

### Migration Strategy

**Phase 1: Frontend Stabilization (Current - Jan 2026)**
- ✅ Establish automated testing (Phase 1: Testing Foundation)
- ✅ Add runtime validation and error handling (Phase 2: Runtime Safety)
- ⏳ Create comprehensive documentation (Phase 3: Documentation Excellence - in progress)
- Refactor for code quality and maintainability
- Demonstrate stability to IT stakeholders

**Phase 2: Backend Foundation (Pending IT Approval)**
- Set up Node.js/Express backend with database
- Implement user authentication and authorization
- Create API endpoints for assessment CRUD operations
- Migrate LocalStorage data to database storage
- **No frontend UX changes** - same workflow, different storage

**Phase 3: Workflow Integration**
- Add workflow states (draft → review → approve)
- Implement role-based access control
- Add approval UI for COSH assessors
- Create audit trail for all state changes

**Phase 4: ChemInventory Integration**
- Replace admin scripts with server-side API integration
- Auto-publish approved assessments to ChemInventory
- Sync inventory data via scheduled tasks
- Implement error handling and retry logic

### Key Architectural Principles for Backend

**Preserve Frontend Independence:**
- Backend is an enhancement, not a rewrite
- Existing frontend continues to work if backend unavailable (graceful degradation)
- API design follows REST principles for clear contracts

**Maintain Modular Architecture:**
- Backend follows same modular pattern as frontend
- Separate routes, controllers, services, data access layers
- Config-driven approach for environment-specific settings

**Security First:**
- HTTPS required for all communication
- Secure session management with httpOnly cookies
- Input validation on both client and server
- SQL injection prevention via parameterized queries
- Rate limiting on authentication endpoints

**Testability:**
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for complete workflows
- Same testing philosophy as frontend (Vitest/Jest)

---

---

## Appendix: Detailed Technical Context

This appendix provides additional implementation details for developers working with the codebase.

### A. Data Flow Deep Dive

#### masterParsedMSDSData Object Structure

When a PDF is parsed, the extracted data is stored in the global `masterParsedMSDSData` object:

```javascript
masterParsedMSDSData = {
  productName: "Acetone",
  casNumber: "67-64-1",
  supplierInfo: "Supplier Name",
  hPhrases: ["H225", "H319", "H336"],
  pPhrases: ["P210", "P233", "P305+P351+P338"],
  signalWord: "Danger",
  pictograms: ["flame", "exclamation"],
  physicalState: "liquid",
  flashPoint: "-20°C",
  autoIgnitionTemp: "465°C",
  // ... additional extracted fields
}
```

This object is accessed by form-filling functions to populate fields across multiple tabs.

#### Form Field to Calculation Data Flow

```
Tab 2 (Substance) → Tab 3 (Hazards) → Tab 4 (Procedure) → Tab 5 (Risk Eval)
     │                    │                  │                   │
     ▼                    ▼                  ▼                   ▼
[Chemical Name]      [H-phrases]        [Procedure]        [Severity]
[CAS Number]         [Signal Word]      [Quantity]         [Likelihood]
[Physical State]     [Pictograms]       [Frequency]        [Risk Score]
                                        [Duration]
                                             │
                                             ▼
                                    Tab 6 (Controls)
                                             │
                                             ▼
                                    [Control Band]
                                    [PPE Selection]
                                    [Engineering Controls]
```

**Calculation Trigger Points:**
- `calculateOverallSeverity()` called when H-phrases or signal word changes (Tab 3)
- `calculateOverallLikelihood()` called when procedure, quantity, frequency, or duration changes (Tab 4)
- Risk score recalculated whenever severity or likelihood changes
- Control band determined whenever hazard group or quantity changes

#### Example: Risk Calculation Chain

**User Action:** Selects "Pipetting" procedure, 50mL quantity, daily frequency, long duration

**Execution Flow:**
1. `onchange` event on procedure dropdown calls `updateRiskEvaluation()`
2. `updateRiskEvaluation()` reads all relevant form fields
3. Looks up procedure data: `procedureData["pipetting"]`
   ```javascript
   {
     name: "Pipetting",
     exposureFactor: 0.3,
     aerosol: 0,
     description: "Manual pipetting operations"
   }
   ```
4. Calls `calculateOverallLikelihood(procedureData, 50, "mL", "daily", "long")`
5. Internal calculation:
   - Base score: `0.3 * 3 + 0 * 2 = 0.9`
   - Normalized quantity: `50 mL` (base unit)
   - Quantity score: `2` (50 > 50 threshold)
   - Frequency score: `2` (daily)
   - Duration score: `2` (long)
   - Total: `0.9 + 2 + 2 + 2 = 6.9` (capped at 10)
6. Likelihood displayed in Tab 5: "6.9"
7. Risk score updated: `Severity × 6.9`

#### LocalStorage Persistence Flow

**Auto-save trigger:** Form `onchange` event (debounced)

**Save process:**
1. Serialize form data using `FormData` API
2. Convert to JSON string
3. Store in LocalStorage: `localStorage.setItem("coshh_assessment_draft", jsonString)`

**Load process:**
1. Check for saved draft: `localStorage.getItem("coshh_assessment_draft")`
2. Parse JSON string to object
3. Populate form fields using `document.getElementById(fieldName).value = savedValue`
4. Trigger recalculations to update dependent fields

**Export process:**
1. Serialize form data to JSON
2. Create Blob: `new Blob([jsonString], { type: "application/json" })`
3. Generate download link with `URL.createObjectURL(blob)`
4. Trigger download via hidden `<a>` element click

### B. Module Implementation Details

#### Risk Calculator Module (js/modules/riskCalculator.js)

**Key Functions:**

**`calculateOverallSeverity(hPhrases, signalWord)`**
- **Input validation:** Checks types and structure
- **H-phrase matching:** Uses `startsWith()` for variant matching (e.g., H360F matches H360)
- **Severity lookup:** Iterates through `hPhraseSeverityMap` to find highest severity
- **Signal word fallback:** If no H-phrases match, uses signal word (Danger=3, Warning=2, else=1)
- **Output range:** 1-5

**`calculateOverallLikelihood(procedureData, quantity, unit, frequency, duration)`**
- **Input validation:** Type checks and unit validation
- **Quantity normalization:** Converts all units to base units (mL for liquids, mg for solids)
  - `µL, µg` → divide by 1000
  - `L, kg` → multiply by 1000
  - `g` → multiply by 1000 (to mg)
  - `mL, mg` → no conversion (base units)
- **Scoring components:**
  - Procedure base: `exposureFactor × 3 + aerosol × 2`
  - Quantity: 0-3 based on thresholds (>500=3, >50=2, >1=1, else=0)
  - Frequency: multiple_daily=3, daily=2, weekly=1, else=0
  - Duration: very_long=3, long=2, medium=1, else=0
- **Output range:** 0-10 (capped with `Math.min(10, score)`)

**Testing Coverage:**
- 25 tests for severity calculation (edge cases, variants, defaults)
- 18 tests for likelihood calculation (quantity conversions, scoring logic)
- 18 tests for input validation (type errors, range errors)
- **Total:** 69 tests, 100% pass rate

#### DOM Helpers Module (js/modules/domHelpers.js)

**Purpose:** Prevent null reference errors when querying DOM elements

**Key Functions:**

**`safeGetElementById(id, warnIfMissing = true)`**
- Wraps `document.getElementById()`
- Logs `[DOM]` prefixed warning if element not found
- Returns `null` if missing (safe to check)
- Used ~40 times throughout codebase

**`safeSetTextContent(id, text)`**
- Sets `textContent` if element exists
- Returns boolean success indicator
- Prevents "Cannot read property 'textContent' of null" errors

**`safeAddEventListener(id, event, handler)`**
- Adds event listener if element exists
- Returns boolean success indicator
- Prevents event handler registration failures

**Pattern Usage:**
```javascript
// Before (unsafe):
document.getElementById('riskScore').textContent = score; // May throw error

// After (safe):
safeSetTextContent('riskScore', score); // Returns false if element missing
```

#### Inventory Manager Module (js/inventory-manager.js)

**Responsibilities:**
- Fetch chemical inventory from `data/inventory/chemical-inventory.json`
- Render inventory table with sortable columns
- Implement search filtering (by name, CAS number, location)
- Implement status filtering (needs_assessment, in_progress, complete, review_due)
- Display statistics (total chemicals, assessments complete, in progress, needs assessment)
- Handle "Create Assessment" button clicks (auto-fill form with inventory data)

**Key Functions:**

**`loadInventoryData()`**
- Fetches JSON file using `fetch()` API
- Parses response and stores in module-level variable
- Calls `renderInventoryTable()` with full dataset

**`renderInventoryTable(filteredData)`**
- Builds HTML table rows from inventory data
- Applies current search and filter criteria
- Adds event listeners to "Create Assessment" buttons
- Updates statistics based on filtered data

**`filterInventory()`**
- Applies search text filter (case-insensitive, matches name/CAS/location)
- Applies status filter (matches assessment status)
- Re-renders table with filtered results

**`createAssessmentFromInventory(chemicalData)`**
- Populates form fields with inventory data
- Switches to MSDS tab to begin assessment
- Pre-fills: chemical name, CAS number, hazards, supplier

**Data Source:** `data/inventory/chemical-inventory.json` (generated by admin scripts)

### C. Configuration Module Details

#### Procedures Configuration (js/config/procedures.js)

**Structure:**
```javascript
export const procedureData = {
  "pipetting": {
    name: "Pipetting",
    exposureFactor: 0.3,
    aerosol: 0,
    description: "Manual pipetting operations"
  },
  "weighing_powder": {
    name: "Weighing Powder",
    exposureFactor: 0.4,
    aerosol: 0.5,
    description: "Weighing powdered materials"
  },
  // ... more procedures
};
```

**Usage:** Imported by risk calculator to determine likelihood base score

**Customization:** Add new procedures by adding entries to `procedureData` object

#### Hazards Configuration (js/config/hazards.js)

**hPhraseSeverityMap:**
Maps H-phrase codes to severity scores (1-5)

```javascript
export const hPhraseSeverityMap = {
  // Carcinogenicity (highest severity)
  "H350": 5,  // May cause cancer
  "H351": 4,  // Suspected of causing cancer

  // Acute toxicity
  "H300": 5,  // Fatal if swallowed
  "H310": 5,  // Fatal in contact with skin
  "H330": 5,  // Fatal if inhaled

  // ... 100+ more H-phrases

  "default": 2  // Fallback for unrecognized H-phrases
};
```

**hPhraseToHazardGroup:**
Maps H-phrases to hazard groups (A-E, S) for control band determination

```javascript
export const hPhraseToHazardGroup = {
  "H350": "E",  // Carcinogen → Group E (highest controls)
  "H314": "C",  // Corrosive → Group C
  // ... mappings for all H-phrases
};
```

#### Controls Configuration (js/config/controls.js)

**controlBandData:**
Matrix of control recommendations based on hazard group and quantity

```javascript
export const controlBandData = {
  // Control Group 1 (Low hazard, small quantity)
  "1": {
    generalVentilation: true,
    enclosure: false,
    localExhaust: false,
    containment: false
  },
  // Control Group 4 (High hazard or large quantity)
  "4": {
    generalVentilation: true,
    enclosure: true,
    localExhaust: true,
    containment: true,
    specializedControls: ["Glovebox", "Fume hood", "Dedicated ventilation"]
  },
  // ... Groups 2, 3, S (sensitizers)
};
```

**PPE Recommendations:**
- Gloves: Always recommended for hazardous substances
- Lab coat: Standard for all lab work
- Eye protection: Required for corrosives, irritants
- Respiratory protection: Required for aerosols, volatile substances, high control groups

---

## Summary

The COSHH Helper architecture is designed for **progressive enhancement** - starting as a fully functional browser-based SPA and evolving toward a full-stack application with backend integration. The current focus is demonstrating frontend quality through automated testing, runtime safety, and comprehensive documentation to gain IT approval for the backend vision.

**Core Architectural Strengths:**
- Vanilla JavaScript for long-term maintainability
- Modular ES6 architecture for testability
- Pure functions for predictable calculations
- Client-side first for immediate value delivery
- Clear migration path to backend integration

**Next Steps:**
- Complete documentation excellence (Phase 3)
- Refactor for code quality (Phase 4)
- Implement mock user roles and workflows (Phases 5-6)
- Present to IT for backend approval
- Execute backend migration strategy

For detailed technical documentation, see `TECHNICAL.md`.
For project context and goals, see `.planning/PROJECT.md`.
