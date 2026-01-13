# CABI COSHH Helper

## What This Is

A browser-based COSHH (Control of Substances Hazardous to Health) assessment generator that helps lab personnel create compliant safety assessments. It parses MSDS PDFs, auto-calculates risk scores, and generates professional reports - currently working as a client-side application with plans to integrate with ChemInventory backend for automated workflow management.

## Core Value

Make it demonstrably maintainable and reliable enough to convince IT to support backend integration.

## Requirements

### Validated

- ✓ MSDS PDF parsing with data extraction - existing
- ✓ Auto-calculation of risk scores (severity × likelihood) - existing
- ✓ Control band recommendations based on hazard data - existing
- ✓ Chemical inventory integration and lookup - existing
- ✓ Floor plan visualization for chemical locations - existing
- ✓ Multi-tab workflow (11 tabs) for assessment creation - existing
- ✓ Report generation with print styling - existing
- ✓ LocalStorage persistence for draft assessments - existing
- ✓ JSON export/import functionality - existing
- ✓ Modular JavaScript architecture (recently refactored from monolithic HTML) - existing

### Active

- [ ] Automated test suite to prevent regressions when adding features
- [ ] Runtime validation checks to catch issues early
- [ ] Enhanced developer documentation (architecture, contribution guides, setup instructions)
- [ ] Code quality improvements for easier understanding and debugging
- [ ] Mock user role system (COSH assessors, lab managers, admin) in frontend
- [ ] Mock approval workflow UI (draft → review → approve → publish)

### Out of Scope

- Complete rewrite - Preserve existing architecture, improve incrementally
- Production backend implementation - Waits for IT approval after frontend demonstration
- Non-COSHH features - Stay focused on chemical assessment workflow
- Framework migration - Keep vanilla JavaScript approach

## Context

**Current State:**
- Semi-working state, prone to breaking when new features are added
- Recently underwent modularization from monolithic HTML to separate modules
- Successfully uses modern JavaScript module pattern with separated config files
- Client-side only (browser-based SPA with no backend server)
- Currently deployed to GitHub Pages: https://miguel-bonnin.github.io/CABI-COSHH-Helper/

**Strategic Goal:**
This is a "vibe coded" project that needs to prove itself professionally maintainable to gain IT department support for backend integration. The frontend quality directly determines whether the backend vision (database integration, user authentication, automated publishing to ChemInventory) will be greenlit.

**Ultimate Vision (Post-IT Approval):**
- Backend database for storing assessments
- User authentication with role-based access (assessors, lab managers, admin)
- Workflow: Lab manager drafts → COSH assessor reviews/approves → Auto-publish to ChemInventory API
- Automated dashboard updates via API integration
- Eliminates duplicate COSHH assessments

## Constraints

- **Integration**: Must maintain compatibility with ChemInventory API for future backend
- **Browser-based**: Currently pure client-side, must continue to work without backend
- **Deployment**: GitHub Pages static hosting (for now)
- **Dependencies**: Minimal - currently only PDF.js from CDN

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Frontend-first approach | Demonstrate maintainability and stability before requesting backend support from IT | — Pending |
| Mock user roles in UI | Show IT the complete workflow vision without requiring backend infrastructure | — Pending |
| Automated testing + runtime validation | Prevent breakage when adding features; catch issues early in development and production | — Pending |
| Keep vanilla JavaScript | No framework overhead; already working pattern; easier for IT to maintain | ✓ Good |
| Modular architecture via ES6 modules | Moved from monolithic HTML to separate files for better maintainability | ✓ Good |

---
*Last updated: 2026-01-13 after initialization*
