---
phase: 04-code-quality
plan: 05
subsystem: documentation, code-comments, knowledge-transfer
tags: [documentation, comments, coshh-methodology, edge-cases, business-logic]

# Dependency graph
requires:
  - phase: 04-code-quality
    provides: Module structure from 04-01, logging from 04-04, refactored functions from 04-03
  - phase: 03-documentation-excellence
    provides: JSDoc documentation pattern established
provides:
  - Comprehensive inline comments explaining COSHH methodology
  - Hazard mapping rationale linked to HSE COSHH Essentials
  - Risk calculation algorithm documentation
  - Control banding logic with threshold explanations
  - Edge case documentation for 15+ scenarios across 4 modules
  - Assumptions documented for MSDS parsing patterns
affects: [future-maintenance, onboarding, knowledge-transfer, debugging]

# Tech tracking
tech-stack:
  added: []
  patterns: [explanatory-comments, edge-case-documentation, assumption-documentation, authoritative-sources]

key-files:
  created: []
  modified:
    - js/config/hazards.js
    - js/modules/riskCalculator.js
    - js/modules/msdsParser.js
    - js/modules/formManager.js
    - coshhgeneratorv5.html

key-decisions:
  - "Link all business logic to HSE COSHH Essentials as authoritative source"
  - "Document 'why' not just 'what' - explain rationale behind thresholds and mappings"
  - "Edge cases include behavior, rationale, and user action guidance"
  - "No TODO comments in code - all tracked in ISSUES.md or CONCERNS.md"
  - "Conservative approach documented: when uncertain, assume higher hazard"

patterns-established:
  - "Explanatory comments: methodology overview → specific mapping rationale"
  - "Edge case format: behavior + rationale + user action + status"
  - "Authoritative source citation: link to HSE guidance for COSHH methodology"
  - "Algorithm documentation: step-by-step breakdown with score interpretation"

issues-created: []

# Metrics
duration: 35min
completed: 2026-01-21
---

# Phase 4 Plan 5: Explanatory Comments Summary

**Added comprehensive inline comments documenting COSHH methodology, risk algorithms, and 15+ edge cases across 4 critical modules**

## Performance

- **Duration:** 35 min
- **Started:** 2026-01-21T16:16:00Z
- **Completed:** 2026-01-21T16:51:13Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Documented HSE COSHH Essentials methodology in hazard mapping (hazards.js)
- Explained risk calculation algorithms with threshold rationale (riskCalculator.js)
- Added MSDS parsing assumptions and confidence scoring logic (msdsParser.js)
- Documented 15+ edge cases with behavior, rationale, and user guidance
- Linked all business logic to authoritative HSE sources
- No TODO comments found in codebase - all issues tracked properly

## Task Commits

Each task was committed atomically:

1. **Task 1: Document complex business logic and algorithms** - `8222394` (docs)
2. **Task 2: Document assumptions, edge cases, and non-obvious patterns** - `8235d88` (docs)

## Files Created/Modified

- `js/config/hazards.js` - Added COSHH Essentials methodology overview, hazard group explanations, severity mapping rationale
  - File-level comment: 40 lines explaining hazard groups A-E, S
  - H-phrase mappings: Rationale for each severity level (5=Critical, 4=High, 3=Moderate, 2=Low, 1=Minimal)
  - Control banding context: How hazard groups drive control approaches
  - Conservative approach: Default to moderate hazard for unknown H-phrases

- `js/modules/riskCalculator.js` - Documented likelihood and severity algorithms with edge cases
  - Likelihood algorithm: 4 factors (procedure, quantity, frequency, duration) with scoring breakdown
  - Score interpretation: 0-2 very low, 3-5 low-moderate, 6-8 high, 9-10 very high
  - Severity edge cases: empty H-phrases, unknown codes, variants (H360FD), multiple phrases
  - Likelihood edge cases: null procedure, zero quantity, very large quantities, invalid inputs

- `js/modules/msdsParser.js` - Documented parsing assumptions, limitations, confidence scoring
  - Key assumptions: GHS 16-section format, H-phrase patterns, CAS format
  - Known limitations: non-standard formats, obsolete R-phrases, multi-component products
  - Confidence scoring: HIGH (standard location), MEDIUM (non-standard), LOW (fallback patterns)
  - 6 edge cases: multi-component, R-phrases, combined H-phrases, inferred pictograms, multiple CAS, non-standard headers

- `js/modules/formManager.js` - Documented form handling edge cases and localStorage limitations
  - 5 edge cases: quota exceeded (handled), multiple checkboxes (handled), schema changes (graceful), file inputs (by design), corrupted data (handled)
  - Each edge case includes status indicator: HANDLED, BY DESIGN, GRACEFUL DEGRADATION

- `coshhgeneratorv5.html` - Documented control banding algorithm and threshold rationale
  - Control bands 1-4, S with HSE guidance links
  - Threshold explanations: severity ≥4 + likelihood ≥5 → Band 3 (containment)
  - Legal context: CMR substances require specialist assessment (COSHH regulation 7)
  - Graduated control hierarchy: controls scale with severity × likelihood

## Decisions Made

**Comment Style:**
- Focus on "why" not "what" - explain rationale behind design decisions
- Link to authoritative sources (HSE COSHH Essentials) for methodology validation
- Use section headers (=== HEADING ===) to organize complex explanations

**Edge Case Format:**
- Standardized format: Behavior → Rationale → User Action → Status
- Status indicators: HANDLED (code handles it), BY DESIGN (intentional), GRACEFUL DEGRADATION (degrades safely)
- Include concrete examples for clarity

**TODO Cleanup:**
- Searched entire codebase for TODO comments - none found in active code
- All known issues tracked in `.planning/ISSUES.md` or `.planning/codebase/CONCERNS.md`
- No scattered TODOs to clean up - team already using centralized tracking

**Authoritative Sources:**
- All COSHH methodology linked to HSE COSHH Essentials: https://www.hse.gov.uk/coshh/essentials/
- Hazard classification linked to HSE GHS guidance
- Provides external validation for non-obvious business logic

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered

None

## Verification Results

- **Syntax checks:** All JavaScript files pass Node.js syntax validation ✓
- **Hazard mapping:** File-level methodology comment added ✓
- **H-phrase rationale:** Non-obvious mappings documented with reasoning ✓
- **Risk calculation:** Algorithm explanation with step-by-step breakdown ✓
- **Thresholds:** Rationale and HSE source referenced ✓
- **Control banding:** Methodology documented with band descriptions ✓
- **Edge cases:** 15+ scenarios documented with behavior + rationale ✓
- **Assumptions:** MSDS parsing assumptions documented ✓
- **TODO cleanup:** No TODO comments found in codebase ✓
- **Comments explain "why":** All complex logic has explanatory comments ✓

## Documentation Coverage Summary

**Complex Business Logic (Task 1):**
- Hazard mapping: 40-line methodology overview + rationale for each severity tier
- Risk calculation: Likelihood algorithm (4 factors) + severity algorithm
- Control banding: Band determination with threshold rationale

**Edge Cases (Task 2):**
- MSDS Parser: 6 edge cases (multi-component, R-phrases, combined codes, inferred pictograms, multiple CAS, non-standard headers)
- Risk Calculator: 9 edge cases (empty H-phrases, unknown codes, variants, multiple phrases, null procedure, zero quantity, large quantities, invalid units, negative values)
- Form Manager: 5 edge cases (quota exceeded, multiple checkboxes, schema changes, file inputs, corrupted data)

**Authoritative Sources:**
- HSE COSHH Essentials: https://www.hse.gov.uk/coshh/essentials/
- HSE GHS guidance: https://www.hse.gov.uk/chemical-classification/labelling-packaging/safety-data-sheets.htm
- COSHH regulation 7 referenced for CMR substances

## Next Phase Readiness

**Phase 4 Complete: Code Quality ✓**

Ready for Phase 5: User Role Simulation

**Code Quality Improvements Achieved (Phases 04-01 through 04-05):**
- ✅ JavaScript extracted to modules (04-01)
- ✅ Code formatting standardized with Prettier/ESLint (04-02)
- ✅ Long functions refactored into focused units (04-03)
- ✅ Error messages and logging enhanced (04-04)
- ✅ Complex logic fully documented (04-05)

**Benefits Delivered:**
- coshhgeneratorv5.html reduced from 1579 to 938 lines (40% reduction)
- Code is modular, testable, and maintainable
- Error messages guide users to solutions
- Debug logging aids troubleshooting
- **New developers can understand COSHH methodology from code comments**
- **Risk calculation algorithms documented with authoritative sources**
- **Edge cases prevent "fixes" that break intentional behavior**
- Ready to build user roles and approval workflows

**Knowledge Transfer Achieved:**
- Any developer can now understand why H-phrases map to severity/hazard groups
- Risk calculation thresholds justified with HSE COSHH Essentials methodology
- MSDS parsing limitations clearly documented - no surprises
- Form handling edge cases explained - prevents duplicate bug reports
- Conservative approach documented - explains "over-control vs under-control" design

---
*Phase: 04-code-quality*
*Completed: 2026-01-21*
