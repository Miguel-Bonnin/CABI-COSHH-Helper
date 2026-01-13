# Testing Patterns

**Analysis Date:** 2026-01-13

## Test Framework

**Runner:**
- None detected - no test framework configured
- No jest.config.js, vitest.config.ts, or similar configuration

**Assertion Library:**
- None - no testing library installed

**Run Commands:**
```bash
# No test commands available
# No package.json with test scripts
```

## Test File Organization

**Location:**
- No test files detected
- No `test/`, `__tests__/`, or `*.test.js` files found
- No test directory structure

**Naming:**
- N/A - no tests exist

**Structure:**
```
# No test structure - testing not implemented
```

## Test Structure

**Suite Organization:**
- Not applicable - no tests exist

**Patterns:**
- Manual testing only
- No automated test suite
- TECHNICAL.md documents "Phase 5: Add Testing" as future improvement

## Mocking

**Framework:**
- None

**Patterns:**
- N/A

**What to Mock:**
- Would need to mock: PDF.js library, File API, LocalStorage, FormData
- Would need to mock: DOM (JSDOM for Node.js testing)

**What NOT to Mock:**
- Pure calculation functions (calculateOverallSeverity, calculateOverallLikelihood)
- Configuration data (procedureData, hPhraseSeverityMap)

## Fixtures and Factories

**Test Data:**
- Example files in `examples/` directory serve as manual test fixtures:
  - `examples/HiDi Formamide.pdf` - Sample MSDS for testing parser
  - `examples/cabi_coshh_dynamic_2025-10-07.json` - Pre-filled assessment
  - `examples/coshhform-hidi.pdf` - Expected output
- No test fixtures for automated testing

**Location:**
- `examples/` - Manual testing examples (not automated test fixtures)

## Coverage

**Requirements:**
- No coverage requirements defined
- No coverage tooling configured

**Configuration:**
- N/A - no coverage tools

**View Coverage:**
```bash
# No coverage available
```

## Test Types

**Unit Tests:**
- Not implemented
- Candidates for unit testing:
  - `calculateOverallSeverity(hPhrases, signalWord)` - Risk severity calculation
  - `calculateOverallLikelihood(...)` - Risk likelihood calculation
  - `determineHazardGroup(hPhrases)` - Hazard classification
  - `extractSection(text, keywords, stopKeywords)` - MSDS text parsing
  - `normalizeQuantity(value, unit)` - Unit conversion

**Integration Tests:**
- Not implemented
- Candidates:
  - Full PDF parsing flow: Upload → Extract → Parse → Apply to form
  - Risk assessment pipeline: Hazards + Procedure → Severity + Likelihood → Risk Level
  - Report generation: Form data → HTML report → Print

**E2E Tests:**
- Not implemented
- Manual E2E testing workflow documented in examples:
  1. Upload `HiDi Formamide.pdf`
  2. Parse MSDS
  3. Complete assessment form
  4. Generate report
  5. Compare with `coshhform-hidi.pdf`

## Common Patterns

**Async Testing:**
- Would need to test: `parseUploadedMSDS(file)`, PDF.js integration
- Pattern not yet established

**Error Testing:**
- Would need to test: Invalid PDF upload, malformed MSDS text, missing required fields
- Pattern not yet established

**File System Mocking:**
- Would need to mock: File upload, Blob creation, LocalStorage operations
- Pattern not yet established

**Snapshot Testing:**
- Not applicable - no React or component-based framework
- Could use for HTML report generation output

## Testing Recommendations

Based on codebase analysis, recommended testing approach:

**Phase 1: Unit Tests for Risk Calculations (High Value)**
```javascript
// Proposed: tests/risk-calculator.test.js
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

    it('should return 1 for no hazards', () => {
        const result = calculateOverallSeverity([], '');
        expect(result).toBe(1);
    });
});
```

**Phase 2: Integration Tests for PDF Parsing**
- Test with real MSDS PDFs from `examples/`
- Verify extracted data matches expected values
- Test confidence scoring

**Phase 3: E2E Tests with Playwright**
- Test full assessment workflow
- Verify report generation
- Test export/import functionality

**Current Status:**
- Testing: ❌ Not implemented
- Manual testing: ✅ Example files provided
- Documentation: ✅ TECHNICAL.md describes testing approach
- Future plan: ✅ Phase 5 roadmap documented

---

*Testing analysis: 2026-01-13*
*Update when test patterns change*
