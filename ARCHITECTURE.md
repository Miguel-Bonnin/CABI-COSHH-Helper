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
