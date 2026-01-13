# Coding Conventions

**Analysis Date:** 2026-01-13

## Naming Patterns

**Files:**
- kebab-case for all script and style files: `inventory-manager.js`, `floor-plan-viewer.js`, `print.css`
- UPPERCASE for important documentation: `README.md`, `TECHNICAL.md`, `CHANGELOG.md`
- Version suffix for main HTML: `coshhgeneratorv5.html`
- Asset naming: `ghs_exclam.svg` (lowercase with underscores for GHS codes)

**Functions:**
- camelCase for all functions: `calculateOverallSeverity()`, `openTab()`, `parseUploadedMSDS()`
- No special prefix for async functions: `parseUploadedMSDS()` (not `asyncParseUploadedMSDS()`)
- Event handlers: `handleProcedureChange()`, `handleInventoryFilter()` (handle prefix pattern)
- DOM manipulation: `updateSuitableControls()`, `displayRiskMatrix()`, `applyParsedDataToForm()` (verb-noun pattern)

**Variables:**
- camelCase for variables: `masterParsedMSDSData`, `procedureData`, `riskLevel`
- UPPER_SNAKE_CASE for constants: Not observed (uses const with camelCase)
- No underscore prefix for private members (no class-based code)

**Types:**
- No TypeScript - plain JavaScript
- No explicit type annotations
- JSDoc comments not consistently used

## Code Style

**Formatting:**
- Indentation: 4 spaces (JavaScript), 2 spaces (HTML)
- Quotes: Inconsistent (mix of single and double quotes)
- Semicolons: Inconsistent (some lines have semicolons, some omit them)
- Line length: No strict limit observed (~120-150 characters common)
- No Prettier configuration detected

**Linting:**
- No ESLint configuration detected (`.eslintrc` not found)
- No linting tool configured
- Code style enforced manually through code review

## Import Organization

**Order:**
- Not applicable - uses traditional `<script>` tags in HTML
- Script loading order in `coshhgeneratorv5.html`:
  1. External libraries (PDF.js from CDN)
  2. Configuration modules (`js/config/*.js`)
  3. Feature modules (`js/*.js`)
  4. Inline scripts in `<script>` tags

**Grouping:**
- No ES6 imports - uses global scope
- Modules export to global namespace via `window.` or direct assignment

**Path Aliases:**
- None - uses relative paths from HTML root

## Error Handling

**Patterns:**
- Minimal try/catch blocks in existing code
- Errors often logged to console: `console.log()`, `console.error()`
- User-facing errors displayed in status divs: `#parserStatus`, `#inventoryStatus`
- Alert dialogs for critical errors: `alert("Error message")`

**Error Types:**
- No custom error classes
- Standard JavaScript Error objects thrown
- Some validation returns early without throwing

**Async:**
- Uses async/await where appropriate (PDF parsing)
- Some callbacks for event handlers
- No .catch() chains observed (prefer try/catch)

## Logging

**Framework:**
- Browser console.log() only
- No structured logging library

**Patterns:**
- Debug logging: `console.log("Variable:", value)`
- Error logging: `console.error("Error:", error)`
- No log levels (debug, info, warn, error) - all use console.log()
- User-facing messages via DOM updates, not console

**When:**
- Debug messages during development (should be removed in production)
- Error messages when operations fail
- No production logging to external service

## Comments

**When to Comment:**
- Function purpose: Brief description above function definitions (not consistently applied)
- Complex calculations: Inline comments explaining risk assessment logic
- TODO items: Scattered throughout for future improvements
- Section markers: `// === Section Name ===` in long files

**JSDoc/TSDoc:**
- Not used consistently
- Some functions have brief comments, most do not
- No @param, @returns, @throws tags

**TODO Comments:**
- Format: `// TODO: description` (no username or issue number)
- Example from TECHNICAL.md: Phase 3 modularization planned

## Function Design

**Size:**
- Varies widely - some functions 5-10 lines, others 100+ lines
- Monolithic `coshhgeneratorv5.html` contains very long inline script section
- Extraction to modules ongoing (Phase 2 of modularization)

**Parameters:**
- Many functions read from DOM directly (no parameters)
- Example: `calculateOverallSeverity()` - reads from `document.getElementById()`
- Configuration functions use object parameters: `procedureData[key]`

**Return Values:**
- Calculation functions return primitive values: integers for severity/likelihood
- UI update functions return void (update DOM directly)
- Parser functions update global `masterParsedMSDSData` object (side effects)

## Module Design

**Exports:**
- Config modules: Assign to `window` object: `window.procedureData = { ... }`
- Feature modules: Functions assigned to global scope
- No ES6 export/import syntax (uses traditional script loading)

**Barrel Files:**
- Not applicable - no ES6 modules or index.js pattern

**Global Namespace:**
- All functions and variables in global scope
- Potential naming conflicts not addressed
- Future: Move to ES6 modules with proper imports/exports

---

*Convention analysis: 2026-01-13*
*Update when patterns change*
