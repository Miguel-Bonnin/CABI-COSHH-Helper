---
phase: 04-code-quality
plan: 04
subsystem: logging, error-handling, debugging
tags: [logging, error-messages, debugging, user-experience, developer-experience]

# Dependency graph
requires:
  - phase: 04-code-quality
    provides: Module structure from 04-01, Prettier/ESLint from 04-02, function decomposition from 04-03
  - phase: 02-runtime-safety
    provides: Error handling patterns, DOM helpers
provides:
  - Structured logging module with 4 levels (DEBUG, INFO, WARN, ERROR)
  - Improved user-facing error messages with actionable guidance
  - Debug logging in MSDS parsing, risk calculation, and EH40 loading
  - Better debugging experience for developers
  - Better error recovery experience for users
affects: [future-debugging, user-support, error-handling, troubleshooting]

# Tech tracking
tech-stack:
  added: []
  patterns: [structured-logging, log-levels, error-message-patterns, debug-diagnostics]

key-files:
  created:
    - js/modules/logger.js
  modified:
    - js/modules/msdsParser.js
    - js/modules/riskCalculator.js
    - js/eh40-loader.js
    - js/modules/domHelpers.js
    - css/forms.css
    - coshhgeneratorv5.html
    - CONTRIBUTING.md

key-decisions:
  - "Default log level to INFO to keep production console clean"
  - "Use console.log with [LEVEL] prefixes for consistent formatting"
  - "Expose logger globally via window.logger for non-module scripts"
  - "Error messages follow pattern: what, why, what to do"
  - "Visual styling with CSS classes and emoji icons for error/warning/success"
  - "Debug logs include contextual data objects for diagnostic information"

patterns-established:
  - "Structured logging: setLogLevel() to control verbosity"
  - "Log level filtering: only logs at or above current level are shown"
  - "Error message pattern: clear statement + why + actionable steps + recovery option"
  - "Visual feedback: .error-message, .warning-message, .success-message CSS classes"
  - "Debug logging at key milestones with relevant context data"

issues-created: []

# Metrics
duration: 40min
completed: 2026-01-21
---

# Phase 4 Plan 4: Error Messages & Logging Summary

**Added structured logging with 4 levels, improved error messages with actionable guidance, debug logging to critical paths for better troubleshooting**

## Performance

- **Duration:** 40 min
- **Started:** 2026-01-21T12:07:00Z
- **Completed:** 2026-01-21T12:47:00Z
- **Tasks:** 3
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments

- Created logger.js module with DEBUG, INFO, WARN, ERROR levels and setLogLevel() control
- Improved user-facing error messages in 3 modules with specific recovery guidance
- Added debug logging to MSDS parsing (12+ debug statements with file info, extraction results)
- Added debug logging to risk calculation (8+ debug statements with calculation breakdowns)
- Added debug logging to EH40 loading (7+ debug statements with fetch progress, match types)
- Enhanced error display styling with CSS classes and emoji icons
- Documented debug logging usage in CONTRIBUTING.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Create structured logging module** - `abf8b57` (feat)
2. **Task 2: Improve user-facing error messages** - `1595e70` (refactor)
3. **Task 3: Add debug logging to critical paths** - `fdaf1f4` (feat)

## Files Created/Modified

- `js/modules/logger.js` - NEW: Structured logging with 4 levels
  - LOG_LEVELS constant with DEBUG=0, INFO=1, WARN=2, ERROR=3
  - setLogLevel(level) to control minimum log level
  - debug(), info(), warn(), error() functions with level filtering
  - Global exposure via window.logger for non-module scripts

- `js/modules/msdsParser.js` - Improved error messages, added debug logging
  - Import logger functions (debug, info, error)
  - Debug log at parse start (file size, file name)
  - Debug log after PDF text extraction (page count, text length)
  - Debug logs for extracted data (H-phrases, pictograms, chemical name, CAS)
  - Info log for successful parsing with field counts
  - Error message changed to helpful multi-step guidance with alternatives

- `js/modules/riskCalculator.js` - Added debug logging
  - Import logger functions (debug, info)
  - Debug log at calculation start with inputs
  - Debug logs for intermediate calculations (severity components, likelihood steps)
  - Debug log at completion with final results and breakdown

- `js/eh40-loader.js` - Improved error messages, added debug logging
  - Import logger functions (debug, info, warn, error)
  - Debug log at fetch start with URL
  - Warn log on retry attempts with backoff delay
  - Debug log after successful fetch with record count
  - Info log for successful WEL data load
  - Error log when loading fails after all retries
  - Debug logs for search results (match type, substance found)
  - Differentiated error messages for client errors vs network errors

- `js/modules/domHelpers.js` - Enhanced error messages
  - Include element ID/selector in warning messages
  - Add "likely a bug - please report it" guidance
  - More specific error messages for debugging

- `css/forms.css` - Added status message styling
  - .error-message class (red with red left border)
  - .warning-message class (orange with orange left border)
  - .success-message class (green with green left border)
  - All include padding, background color, border-radius

- `coshhgeneratorv5.html` - Added logger script tag
  - Imported logger.js module before other modules
  - Positioned as first module to load so other modules can import it

- `CONTRIBUTING.md` - Documented debug logging
  - Added section 3a: Enable Debug Logging
  - Documented logger.setLogLevel('DEBUG') command
  - Listed what debug logs show for each module
  - Explained how to return to INFO level

## Decisions Made

**Log Level Defaults:**
- Default to INFO level in production to keep console clean
- DEBUG level only enabled on-demand by developers
- This prevents overwhelming production console while still allowing detailed troubleshooting when needed

**Error Message Pattern:**
- Follow pattern: (1) What went wrong, (2) Why it happened (if known), (3) What user can do, (4) Recovery options
- Example: "Could not parse PDF file. Please try: (1) Check file isn't corrupted, (2) Try pasting text, (3) Manually enter data"
- This turns failures into guided experiences rather than dead ends

**Debug Log Placement:**
- Log at function entry with inputs
- Log at key milestones (PDF loaded, text extracted, calculations complete)
- Log final results with metrics (field counts, scores, match types)
- Include contextual data objects for diagnostic value

**Visual Styling:**
- Use CSS classes instead of inline styles for maintainability
- Include emoji icons (❌, ⚠️, ✅) for quick visual scanning
- Colored backgrounds and left borders for clear visual distinction

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered

None

## Verification Results

- **Syntax checks:** All JavaScript files pass Node.js syntax validation ✓
- **Logger module:** Created and imported in HTML ✓
- **Import statements:** All logger imports added to modified modules ✓
- **Error messages:** Updated with actionable guidance and CSS classes ✓
- **CSS classes:** Added to forms.css for error/warning/success styling ✓
- **Documentation:** CONTRIBUTING.md updated with debug logging instructions ✓
- **Production console:** Remains clean with INFO level default ✓

## Debug Logging Coverage

**MSDS Parser (msdsParser.js):**
- File upload start (file size, name)
- PDF loading success (page count)
- Text extraction complete (page count, text length)
- H-phrases extracted
- Pictograms extracted
- Chemical name extraction (value, confidence)
- CAS number extraction (value, confidence)
- Parsing complete (fields extracted count)

**Risk Calculator (riskCalculator.js):**
- Severity calculation start (H-phrases, signal word)
- No H-phrases fallback (using signal word only)
- Severity calculation complete (max severity, signal word severity, final, dominant hazard)
- Likelihood calculation start (quantity, unit, frequency, duration, procedure)
- Base score from procedure (exposure factor, aerosol)
- Default base score (no procedure data)
- Quantity factor added (normalized quantity, score, running total)
- Frequency factor added (frequency, score, running total)
- Duration factor added (duration, score, running total)
- Likelihood calculation complete (uncapped score, final likelihood)

**EH40 Loader (eh40-loader.js):**
- Fetch start (URL)
- Fetch retry attempt (attempt number, delay)
- Fetch complete (record count)
- WEL data loaded (chemical count)
- Loading failed (after all retries)
- Auto-fill called (chemical name, CAS, data loaded status)
- Match found by CAS (CAS, substance)
- Match found by exact name (name, substance)
- Match found by partial name (search name, substance)
- No match found (substance name, CAS)

## Next Phase Readiness

- Logging infrastructure complete and ready for use across all modules
- Error messages provide clear guidance reducing user support burden
- Debug logging enables quick troubleshooting without code changes
- Pattern established for future modules to follow
- Ready for 04-05-PLAN.md (if it exists) or next phase in ROADMAP

---
*Phase: 04-code-quality*
*Completed: 2026-01-21*
