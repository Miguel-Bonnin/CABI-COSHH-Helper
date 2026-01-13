# Codebase Concerns

**Analysis Date:** 2026-01-13

## Tech Debt

**Monolithic HTML file:**
- Issue: Main application code embedded in `coshhgeneratorv5.html` (1400+ lines of HTML + embedded JavaScript)
- Files: `coshhgeneratorv5.html`
- Why: Initial rapid prototyping with AI assistance (Gemini and Claude)
- Impact: Difficult to navigate, test, and maintain; merge conflicts likely with multiple developers
- Fix approach: Phase 3 modularization documented in `TECHNICAL.md` - extract remaining JavaScript to `js/modules/` directory

**Global namespace pollution:**
- Issue: All functions and variables in global scope, no module encapsulation
- Files: `coshhgeneratorv5.html` (inline scripts), `js/**/*.js`
- Why: Uses traditional `<script>` tags instead of ES6 modules
- Impact: Potential naming conflicts, difficult to track dependencies, no tree-shaking
- Fix approach: Migrate to ES6 modules with import/export, use build tool (Vite recommended in TECHNICAL.md)

**No input validation:**
- Issue: Minimal validation on form inputs, no sanitization of user input
- Files: `coshhgeneratorv5.html` (form processing code)
- Why: Focus on MVP functionality over security
- Impact: Could allow XSS if user input reflected in report without escaping; data quality issues
- Fix approach: Add Zod schemas for validation, sanitize HTML output in report generation

**Mixed code style:**
- Issue: Inconsistent semicolons, quotes, indentation (no Prettier/ESLint)
- Files: All JavaScript files
- Why: Multiple contributors, no enforced linting
- Impact: Harder to read, merge conflicts more likely
- Fix approach: Add `.prettierrc` and `.eslintrc`, run `npm run lint --fix`

## Known Bugs

**PDF parsing confidence indicators not always accurate:**
- Symptoms: Extracted MSDS data shows "high confidence" but values are incorrect
- Trigger: MSDS PDFs with non-standard formatting (especially Section 3 composition tables)
- Files: `coshhgeneratorv5.html` (PDF parsing logic in embedded scripts)
- Workaround: User can manually edit extracted data in preview table
- Root cause: Regex patterns assume specific MSDS format; multi-tier extraction with varying quality
- Fix: Enhance parsing logic with more robust patterns, add fallback extraction methods

**LocalStorage quota exceeded not handled:**
- Symptoms: "Save Locally" feature silently fails when LocalStorage full (typically 5-10MB limit)
- Trigger: Saving many large assessments with embedded images or long text fields
- Files: `coshhgeneratorv5.html` (LocalStorage save/load functions)
- Workaround: Clear browser LocalStorage manually or use JSON export instead
- Root cause: No try/catch around `localStorage.setItem()`, no quota check
- Fix: Add try/catch, prompt user to export to JSON if quota exceeded

## Security Considerations

**Client-side only - no authentication:**
- Risk: Anyone with URL can access application and data
- Files: Entire application (no auth layer)
- Current mitigation: None - designed for internal use only
- Recommendations: If sensitive data is involved, add authentication layer or move to internal intranet

**Unvalidated form input in report generation:**
- Risk: User could enter HTML/JavaScript in text fields, reflected in generated report
- Files: `coshhgeneratorv5.html` (report generation: `generateFullReport()` function)
- Current mitigation: Minimal - relies on browser's innerHTML parsing
- Recommendations: Sanitize all user input before inserting into DOM, use textContent instead of innerHTML where possible, add Content Security Policy

**PDF.js loaded from CDN:**
- Risk: CDN compromise could inject malicious code
- Files: `coshhgeneratorv5.html` (line 15)
- Current mitigation: Uses specific version (2.10.377) to avoid auto-updates
- Recommendations: Download and self-host PDF.js library, add Subresource Integrity (SRI) hash

**No HTTPS enforcement:**
- Risk: Man-in-the-middle attacks, credential interception (if auth added)
- Files: N/A (deployment configuration)
- Current mitigation: GitHub Pages uses HTTPS by default
- Recommendations: Add HSTS header if self-hosting, redirect HTTP to HTTPS

## Performance Bottlenecks

**PDF parsing blocking UI:**
- Problem: Large PDF files (>5MB) freeze browser during parsing
- Files: `coshhgeneratorv5.html` (PDF parsing logic)
- Measurement: Not quantified - user reports only
- Cause: Synchronous PDF.js text extraction on main thread
- Improvement path: Move PDF parsing to Web Worker, show progress indicator

**Large inventory table rendering:**
- Problem: Rendering 500+ chemical inventory rows causes lag
- Files: `js/inventory-manager.js`
- Measurement: Not quantified - estimated based on typical inventory size
- Cause: Rendering all rows at once, no virtualization
- Improvement path: Implement pagination or virtual scrolling (e.g., `react-window` or similar)

## Fragile Areas

**H-phrase to hazard group mapping:**
- Files: `js/config/hazards.js` (hPhraseToHazardGroup object)
- Why fragile: Control band determination depends on accurate mapping; GHS classifications updated periodically
- Common failures: New H-phrases not in mapping fall back to default, potentially underestimating risk
- Safe modification: Add new H-phrases conservatively (higher hazard group when uncertain), test with real MSDS examples
- Test coverage: None - no automated tests for mapping logic

**Risk calculation thresholds:**
- Files: `coshhgeneratorv5.html` (risk matrix thresholds in embedded scripts)
- Why fragile: Changing thresholds affects all historical assessments retroactively
- Common failures: Tweaking thresholds without considering edge cases, inconsistent with HSE guidance
- Safe modification: Document rationale for threshold changes, review against HSE COSHH Essentials methodology
- Test coverage: None

## Scaling Limits

**Browser memory for large PDFs:**
- Current capacity: Untested, but large PDFs (>10MB) likely to cause issues
- Limit: Browser memory limits (varies by browser, typically 1-2GB for a tab)
- Symptoms at limit: Browser tab crashes or becomes unresponsive
- Scaling path: Implement PDF size check before parsing, suggest text paste for large files

**LocalStorage size limit:**
- Current capacity: ~5-10MB per origin (browser-dependent)
- Limit: Storing ~50-100 completed assessments before quota exceeded
- Symptoms at limit: Silent save failures
- Scaling path: Migrate to IndexedDB (larger quota) or server-side storage

## Dependencies at Risk

**PDF.js version pinned to 2.10.377:**
- Risk: Version from 2021, potentially missing security fixes and features
- Files: `coshhgeneratorv5.html` (line 15)
- Impact: PDF parsing may fail on newer PDF formats, security vulnerabilities
- Migration plan: Test with latest PDF.js (currently 3.x or 4.x), update CDN link, verify parsing still works

**No package.json - no dependency management:**
- Risk: Cannot track or update dependencies easily
- Files: N/A - entire project
- Impact: Unclear what dependencies exist, no automated security vulnerability scanning
- Migration plan: Create `package.json`, add dependencies (even if just for development tools), use `npm audit`

## Missing Critical Features

**Undo/Redo functionality:**
- Problem: No way to undo form changes or revert to previous version
- Current workaround: User manually re-enters data or re-imports from saved JSON
- Blocks: Accidental data loss, difficult to experiment with different control measures
- Implementation complexity: Medium (implement history stack, ~200 lines)

**Assessment comparison/diff:**
- Problem: Cannot compare two versions of an assessment or track changes over time
- Current workaround: Manual side-by-side comparison of JSON exports
- Blocks: Change tracking, review workflow, version history
- Implementation complexity: High (UI for diff display, JSON diff logic, ~500 lines)

**Batch assessment creation:**
- Problem: Must create assessments one at a time, even for similar chemicals
- Current workaround: Create one, export, manually modify JSON, import
- Blocks: Efficient assessment of chemical families (e.g., all solvents)
- Implementation complexity: Medium (template system + batch processing UI, ~300 lines)

## Test Coverage Gaps

**Risk calculation logic:**
- What's not tested: `calculateOverallSeverity()`, `calculateOverallLikelihood()`, control band determination
- Files: `coshhgeneratorv5.html` (core business logic)
- Risk: Changes could incorrectly classify hazards, leading to inadequate controls
- Priority: High (safety-critical functionality)
- Difficulty to test: Low - pure functions, well-documented in TECHNICAL.md

**PDF parsing edge cases:**
- What's not tested: Multi-page MSDS, non-standard formats, corrupted PDFs, non-English MSDS
- Files: `coshhgeneratorv5.html` (PDF parsing logic)
- Risk: Parser failures lead to incorrect hazard classification
- Priority: High
- Difficulty to test: Medium (need diverse MSDS corpus)

**Report generation HTML output:**
- What's not tested: Generated report HTML structure, print styles, data completeness
- Files: `coshhgeneratorv5.html` (`generateFullReport()` function)
- Risk: Malformed reports, missing data in output, print layout broken
- Priority: Medium
- Difficulty to test: Medium (snapshot testing or visual regression testing needed)

## Documentation Gaps

**Admin scripts usage:**
- Issue: No documentation for running `admin-scripts/*.js` files
- Files: `admin-scripts/` directory
- Impact: New admins cannot generate inventory data without asking original developer
- Fix: Add `ADMIN-GUIDE.md` with setup instructions, API credentials requirements, run commands

**Configuration object schemas:**
- Issue: `procedureData`, `hPhraseSeverityMap`, etc. have no formal schema documentation
- Files: `js/config/*.js`
- Impact: Developers unsure how to add new procedures or modify hazard mappings
- Fix: Add JSDoc comments with @typedef annotations or TypeScript interfaces

---

*Concerns audit: 2026-01-13*
*Update as issues are fixed or new ones discovered*
