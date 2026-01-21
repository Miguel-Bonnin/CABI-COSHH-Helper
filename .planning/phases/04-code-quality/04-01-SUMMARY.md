---
phase: 04-code-quality
plan: 01
subsystem: ui, forms
tags: [javascript, modules, msds-parser, form-manager, code-extraction]

# Dependency graph
requires:
  - phase: 03-documentation-excellence
    provides: JSDoc documentation patterns, module structure conventions
provides:
  - formManager.js module for form data persistence (save/load/export/import)
  - msdsParser.js module for MSDS document parsing and data extraction
  - ~640 lines of inline JavaScript moved to external modules
  - Reduced HTML file from 1579 to 938 lines (40% reduction)
affects: [future-modularization, testing, maintenance]

# Tech tracking
tech-stack:
  added: []
  patterns: [module exports with window compatibility, getter/setter for shared state]

key-files:
  created:
    - js/modules/formManager.js
    - js/modules/msdsParser.js
  modified:
    - coshhgeneratorv5.html

key-decisions:
  - "Export functions to window object for backward compatibility with onclick handlers"
  - "Use Object.defineProperty for masterParsedMSDSData to maintain module encapsulation while allowing global access"
  - "Import getMasterParsedMSDSData in HTML for explicit dependency tracking"

patterns-established:
  - "Module pattern: Export to window alongside ES6 exports for gradual migration"
  - "State management: Use getter/setter exports for shared state between modules"
  - "Backward compatibility: Maintain onclick handler functionality during modularization"

issues-created: []

# Metrics
duration: 15min
completed: 2026-01-21
---

# Phase 4: Code Quality - Plan 01 Summary

**Extracted ~640 lines of inline JavaScript to formManager.js and msdsParser.js modules, reducing HTML from 1579 to 938 lines**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-01-21
- **Completed:** 2026-01-21
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extracted form handling functions (save/load/export/import) to formManager.js
- Extracted MSDS parsing logic (PDF text extraction, chemical name/CAS/H-phrase parsing) to msdsParser.js
- Reduced coshhgeneratorv5.html by ~640 lines (41% reduction in file size)
- Maintained full backward compatibility with existing onclick handlers

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract form handling functions** - `9b30122` (feat)
2. **Task 2: Extract MSDS parsing logic** - `a3edfc0` (feat)

## Files Created/Modified
- `js/modules/formManager.js` - Form data management: saveLocally, loadLocally, exportToJson, importFromJsonFile, populateFormWithData
- `js/modules/msdsParser.js` - MSDS parsing: parseUploadedMSDS, parsePastedMSDS, processMSDSText, displayParsePreview, applyParsedDataToForm, updateConfidenceMarker
- `coshhgeneratorv5.html` - Removed inline functions, added module imports

## Decisions Made
- **Window exports for compatibility:** All functions exported to window object to maintain onclick handler functionality without modifying HTML button elements
- **Module state management:** Used Object.defineProperty for masterParsedMSDSData to create a property on window that delegates to module-internal state, maintaining encapsulation while providing global access
- **Import tracking:** Added explicit import of getMasterParsedMSDSData in HTML module to track dependency, even though window.masterParsedMSDSData is used at runtime

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered
None

## Next Phase Readiness
- Module infrastructure extended with two new feature modules
- Pattern established for extracting remaining inline JavaScript
- Ready for additional code quality improvements (linting, more modularization)
- Tests continue to pass, no regressions

---
*Phase: 04-code-quality*
*Completed: 2026-01-21*
