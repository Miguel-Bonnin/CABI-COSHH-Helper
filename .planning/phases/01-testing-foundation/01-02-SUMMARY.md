# Phase 1 Plan 2: Risk Severity Calculator TDD Summary

**Extracted and tested calculateOverallSeverity() with TDD approach**

## Accomplishments

- **RED**: Wrote 11 test cases covering severity calculation logic
  - H-phrase severity mapping (H350=5, H314=4, etc.)
  - Signal word fallback (Danger=3, Warning=2, none=1)
  - Edge cases: empty arrays, multiple H-phrases, case insensitivity
  - Partial H-phrase matching (H360F matches H360 pattern)

- **GREEN**: Implemented calculateOverallSeverity() as pure function
  - Accepts hPhrases array and signalWord parameters
  - Case-insensitive matching for both H-phrases and signal words
  - Pattern matching using startsWith() for H-phrase variants
  - Signal word only applies if it increases severity

- **REFACTOR**: Simplified code structure with helper functions
  - Extracted getMaxHPhraseSeverity() for cleaner iteration
  - Extracted getSignalWordSeverity() for centralized logic
  - Improved readability and separation of concerns

## Files Created/Modified

### Created
- `js/modules/riskCalculator.js` - Pure risk calculation functions (65 lines)
- `tests/riskCalculator.test.js` - Comprehensive TDD test suite (62 lines)

### Modified
- `js/config/hazards.js` - Added ES6 module exports for hPhraseSeverityMap and hPhraseToHazardGroup

## Commits

1. **RED** (7a3591f): `test(01-02): add failing tests for calculateOverallSeverity`
   - 11 test cases written, all failing as expected (module didn't exist)

2. **GREEN** (856ae28): `feat(01-02): extract calculateOverallSeverity to riskCalculator module`
   - Implementation complete, all 11 tests passing
   - Created modular structure with ES6 imports

3. **REFACTOR** (6525507): `refactor(01-02): simplify calculateOverallSeverity with helper functions`
   - Improved code quality while maintaining all tests passing
   - Better separation of concerns with helper functions

## Test Coverage

All 12 tests passing (11 for calculateOverallSeverity + 1 setup test):

1. H350 (carcinogen) → severity 5 ✓
2. H314 (severe skin burns) → severity 4 ✓
3. Signal Word 'Danger' with no H-phrases → severity 3 ✓
4. Signal Word 'Warning' with no H-phrases → severity 2 ✓
5. No hazards → severity 1 ✓
6. Multiple H-phrases → highest severity wins ✓
7. Case insensitive H-phrase matching ✓
8. Case insensitive signal word matching ✓
9. H-phrase severity prioritized over signal word ✓
10. Unrecognized H-phrases default to severity 1 ✓
11. Partial H-phrase matching (H360F matches H360) ✓

## Decisions Made

1. **Pure Function Design**: Function accepts parameters instead of reading from DOM
   - Enables unit testing without DOM dependencies
   - Improves reusability across different contexts
   - Maintains identical logic to original implementation

2. **Named Exports**: Used named exports for tree-shaking compatibility
   - Future-proof for when more functions are added to module

3. **Pattern Matching**: Used startsWith() for H-phrase variants
   - Handles cases like H360F, H360D (reproductive toxicity variants)
   - Matches original implementation behavior

4. **Signal Word Logic**: Signal word acts as minimum severity floor
   - Only applied when it would increase severity
   - Preserves original behavior: Danger=3, Warning=2

5. **Helper Functions**: Extracted for clarity (REFACTOR phase)
   - getMaxHPhraseSeverity() - isolates H-phrase lookup logic
   - getSignalWordSeverity() - centralizes signal word mapping
   - Improves maintainability without changing behavior

## Issues Encountered

None. TDD process was smooth:
- Tests failed correctly in RED phase (module didn't exist)
- Tests passed correctly in GREEN phase (implementation complete)
- Tests remained passing in REFACTOR phase (structure improved)

## Technical Notes

### Original Implementation Location
- Source: `coshhgeneratorv5.html` line 1067-1080
- Embedded inline in HTML script tag
- Used global variables and DOM reads

### Refactored Implementation
- Location: `js/modules/riskCalculator.js`
- Pure function with explicit parameters
- Unit tested with 100% path coverage
- Ready for integration back into HTML

### Next Integration Step
The HTML file still uses the original inline function. A future task will:
1. Import the module in coshhgeneratorv5.html
2. Replace inline implementation with module call
3. Verify the application still works identically

## Next Step

Ready for **01-03-PLAN.md**: Extract and test likelihood calculation function

This plan follows the same TDD approach:
- Extract `calculateOverallLikelihood()` from line 1081+
- Test factors: procedure type, quantity, material type, frequency, duration
- Maintain identical calculation logic
