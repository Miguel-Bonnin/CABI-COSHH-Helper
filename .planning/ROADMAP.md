# Roadmap: CABI COSHH Helper

## Overview

Transform a "vibe coded" COSHH assessment generator into a demonstrably maintainable and reliable application that convinces IT to support backend integration. The journey moves from establishing testing and validation infrastructure, through documentation and code quality improvements, to implementing mock user roles and approval workflows that demonstrate the complete vision.

## Domain Expertise

None

## Phases

- [x] **Phase 1: Testing Foundation** - Establish automated testing infrastructure
- [x] **Phase 2: Runtime Safety** - Add validation checks and error handling
- [ ] **Phase 3: Documentation Excellence** - Create comprehensive developer documentation
- [ ] **Phase 4: Code Quality** - Refactor for clarity and maintainability
- [ ] **Phase 5: User Role Simulation** - Implement mock user role system
- [ ] **Phase 6: Approval Workflow UI** - Build mock approval workflow interface

## Phase Details

### Phase 1: Testing Foundation
**Goal**: Establish automated testing infrastructure with unit and integration tests for core functionality to prevent regressions when adding features
**Depends on**: Nothing (first phase)
**Research**: Completed (chose Vitest + happy-dom)
**Status**: ✅ Complete
**Completed**: 2026-01-13

Plans:
- [x] 01-01: Test Infrastructure Setup
- [x] 01-02: Risk Severity Calculator TDD
- [x] 01-03: Risk Likelihood Calculator TDD

**Accomplishments:**
- Vitest test framework installed and configured with happy-dom for DOM simulation
- 25 comprehensive tests covering core risk calculation logic (100% pass rate)
- Extracted `calculateOverallSeverity()` and `calculateOverallLikelihood()` from inline HTML to tested modules
- Established TDD workflow (RED-GREEN-REFACTOR) with 10 atomic commits
- ES6 module architecture implemented for better code organization

### Phase 2: Runtime Safety
**Goal**: Add validation checks and error handling throughout the application to catch issues during development and production
**Depends on**: Phase 1
**Research**: Unlikely (standard validation patterns, error handling conventions)
**Status**: ✅ Complete
**Completed**: 2026-01-13

Plans:
- [x] 02-01: Risk Calculator Input Validation (TDD)
- [x] 02-02: Data Loading Error Handling
- [x] 02-03: DOM Safety Guards

**Accomplishments:**
- Input validation guards prevent runtime errors from invalid data (18 validation tests)
- Retry logic with exponential backoff for data loading (3 retries max)
- User-facing error messages with recovery buttons for graceful failure handling
- Safe DOM query helpers eliminate null reference errors (~70 usages)
- 69 tests passing (100% pass rate) with 27 new DOM helper tests
- 7 atomic commits following feat/test/refactor convention

### Phase 3: Documentation Excellence
**Goal**: Create comprehensive developer documentation including architecture guide, contribution guidelines, and setup instructions
**Depends on**: Phase 2
**Research**: Unlikely (documentation writing, established patterns)
**Status**: ✅ Complete
**Completed**: 2026-01-14

Plans:
- [x] 03-01: Create CONTRIBUTING.md
- [x] 03-02: Create ARCHITECTURE.md
- [x] 03-03: Update README.md
- [x] 03-04: Update TECHNICAL.md
- [x] 03-05: Add JSDoc comments

**Accomplishments:**
- Created CONTRIBUTING.md (300 lines) with setup, testing, and commit conventions
- Created ARCHITECTURE.md documenting system design, data flow, and future vision
- Enhanced README.md with dev setup, project status, and documentation links
- Updated TECHNICAL.md with Phase 1-2 module documentation and validation patterns
- Added JSDoc comments to 15+ exported functions across 5 modules
- 13 atomic commits via parallel execution (5 agents, 3 concurrent, ~22 min wall clock)
- First successful parallel phase execution with 71% time savings

### Phase 4: Code Quality
**Goal**: Refactor for clarity, add meaningful comments, improve error messages, and enhance debugging capabilities
**Depends on**: Phase 3
**Research**: Unlikely (refactoring existing code, internal patterns)
**Status**: In progress

Plans:

- [x] 04-01: Extract Inline JavaScript
- [x] 04-02: Code Formatting & Style
- [ ] 04-03: Refactor Long Functions
- [ ] 04-04: Improve Error Messages
- [ ] 04-05: Add Debug Logging

### Phase 5: User Role Simulation
**Goal**: Implement mock user role system in frontend (COSH assessors, lab managers, admin) to demonstrate workflow vision
**Depends on**: Phase 4
**Research**: Unlikely (frontend-only mock implementation, no external dependencies)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 6: Approval Workflow UI
**Goal**: Build mock approval workflow interface (draft → review → approve → publish) to show complete system vision
**Depends on**: Phase 5
**Research**: Unlikely (UI implementation following existing patterns)
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Testing Foundation | 3/3 | Complete | 2026-01-13 |
| 2. Runtime Safety | 3/3 | Complete | 2026-01-13 |
| 3. Documentation Excellence | 5/5 | Complete | 2026-01-14 |
| 4. Code Quality | 2/5 | In progress | - |
| 5. User Role Simulation | 0/TBD | Not started | - |
| 6. Approval Workflow UI | 0/TBD | Not started | - |
