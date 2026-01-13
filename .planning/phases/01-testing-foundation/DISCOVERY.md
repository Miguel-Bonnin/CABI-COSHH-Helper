# Discovery: Testing Foundation

**Phase:** 1 - Testing Foundation
**Date:** 2026-01-13
**Depth:** Standard Research

## Problem Statement

The CABI COSHH Helper currently has **no automated testing infrastructure**. This creates risk when adding new features or refactoring code - changes can break existing functionality without detection until manual testing or production use.

**Goal:** Establish a testing framework that works with vanilla JavaScript, can test DOM manipulation, and integrates with the existing codebase structure.

## Context

**Current State:**
- Pure client-side vanilla JavaScript application
- No package.json or Node.js tooling
- No existing test files or test framework
- Functions embedded in `coshhgeneratorv5.html` (inline scripts)
- Some modular JavaScript in `js/` directory
- Deployed to GitHub Pages as static site

**Testing Candidates** (from TESTING.md analysis):
- Unit tests: `calculateOverallSeverity()`, `calculateOverallLikelihood()`, `determineHazardGroup()`, `extractSection()`, `normalizeQuantity()`
- Integration tests: PDF parsing flow, risk assessment pipeline, report generation
- DOM tests: Form field updates, tab navigation, auto-fill behavior

## Research Questions

1. Which test framework works best with vanilla JavaScript (no build step)?
2. How to test functions embedded in HTML `<script>` tags?
3. How to mock browser APIs (File, Blob, LocalStorage)?
4. How to test DOM manipulation without a full browser?
5. How to integrate testing with GitHub Pages deployment?

## Options Evaluated

### Option 1: Vitest

**Pros:**
- Modern, fast ESM-native test runner
- Built-in DOM mocking via happy-dom/jsdom
- Excellent DX with watch mode and UI
- TypeScript support (future-proof if needed)
- Native ES modules support
- Compatible with vanilla JS

**Cons:**
- Requires package.json and build tooling
- Would need to refactor to ES modules (away from inline scripts)
- Heavier setup than pure browser-based testing
- Learning curve for team unfamiliar with Vite

**Setup Effort:** Medium
**Ongoing Maintenance:** Low
**Best For:** Projects willing to adopt modern tooling

### Option 2: Jest

**Pros:**
- Industry standard, mature ecosystem
- Good documentation and community support
- jsdom built-in for DOM testing
- Works with vanilla JavaScript
- Familiar to most developers

**Cons:**
- Slower than Vitest
- ESM support requires configuration
- Requires package.json and Node.js
- Configuration can be complex
- May have CommonJS/ESM issues

**Setup Effort:** Medium
**Ongoing Maintenance:** Medium
**Best For:** Conservative choice, team familiarity important

### Option 3: Browser-Native Testing (Web Test Runner)

**Pros:**
- Runs tests in real browser (no DOM mocking needed)
- Works with vanilla JavaScript as-is
- No transpilation or bundling required
- Tests actual browser behavior
- Lightweight setup

**Cons:**
- Slower than Node.js-based runners
- Requires package.json for test runner
- Less mature ecosystem than Jest/Vitest
- Harder to mock browser APIs
- CI/CD requires headless browser

**Setup Effort:** Medium-Low
**Ongoing Maintenance:** Low
**Best For:** Testing browser-specific behavior without mocking

## Decision Criteria

| Criterion | Weight | Vitest | Jest | Web Test Runner |
|-----------|--------|--------|------|-----------------|
| Works with vanilla JS | High | ✓ | ✓ | ✓✓ |
| Minimal refactoring needed | High | ✗ | ✗ | ✓ |
| Fast test execution | Medium | ✓✓ | ✗ | ✗ |
| Easy DOM testing | High | ✓ | ✓ | ✓✓ |
| Modern tooling | Low | ✓✓ | ✗ | ✓ |
| Future-proof | Medium | ✓✓ | ✓ | ✓ |

## Recommendation: Vitest

**Rationale:**

1. **Modern and Fast:** Vitest is the most performant option with excellent DX
2. **Good Migration Path:** Forces healthy refactoring (extract functions from HTML to modules)
3. **Built-in Mocking:** happy-dom provides accurate DOM simulation
4. **Future-Proof:** ESM-native aligns with JavaScript ecosystem direction
5. **Developer Experience:** Watch mode, UI, and fast feedback loop improve productivity

**Trade-off Accepted:**
- Requires creating `package.json` and extracting functions from inline scripts to modules
- This refactoring is **beneficial** for maintainability (aligns with project goal)
- One-time migration cost pays dividends in test speed and developer experience

## Implementation Strategy

**Phase 1A: Test Infrastructure Setup**
1. Create `package.json` with Vitest and happy-dom
2. Create `vitest.config.js` with DOM environment
3. Set up test directory structure: `tests/`
4. Verify setup with a simple passing test

**Phase 1B: Extract and Test Core Functions**
1. Extract `calculateOverallSeverity()` from HTML to `js/modules/riskCalculator.js`
2. Create `tests/riskCalculator.test.js` with TDD approach
3. Extract `calculateOverallLikelihood()` to same module
4. Add tests for edge cases and boundary conditions
5. Extract `determineHazardGroup()` and test

**Phase 1C: Integration Tests**
1. Test PDF parsing with sample MSDS files
2. Test risk assessment pipeline end-to-end
3. Test form auto-fill behavior with mocked DOM

**Deferred to Later Phases:**
- E2E tests with Playwright (Phase 2 or later)
- Visual regression testing (out of scope for now)
- Coverage thresholds (establish baseline first)

## Key Files to Create

```
CABI-COSHH-Helper/
├── package.json                    # New - Node.js dependencies
├── vitest.config.js                # New - Test configuration
├── tests/                          # New - Test directory
│   ├── riskCalculator.test.js     # New - Unit tests for risk calculations
│   ├── msdsParser.test.js         # New - Unit tests for PDF parsing
│   └── fixtures/                   # New - Sample MSDS PDFs for testing
│       └── sample-formamide.pdf
└── js/modules/                     # New - Extracted modules
    ├── riskCalculator.js          # New - Risk calculation functions
    └── msdsParser.js              # New - MSDS parsing functions
```

## Risks and Mitigations

**Risk:** Breaking existing functionality during refactoring
**Mitigation:** Extract and test one function at a time, keep HTML version until all tests pass

**Risk:** Team unfamiliar with Vitest
**Mitigation:** Document setup and provide example tests, Vitest docs are excellent

**Risk:** GitHub Pages deployment complexity
**Mitigation:** Tests run separately from deployment, no build step needed for production

## Success Metrics

- [ ] Vitest installed and running
- [ ] First passing test for `calculateOverallSeverity()`
- [ ] Core risk calculation functions covered (>80% coverage)
- [ ] CI/CD runs tests on every push
- [ ] Developers can run tests locally with `npm test`

## References

- Vitest docs: https://vitest.dev/
- happy-dom: https://github.com/capricorn86/happy-dom
- TESTING.md codebase analysis (already completed)

---

**Decision:** Proceed with Vitest for testing foundation
**Next Step:** Create Phase 1 PLAN.md files for implementation
