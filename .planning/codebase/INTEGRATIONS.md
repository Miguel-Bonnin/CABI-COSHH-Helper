# External Integrations

**Analysis Date:** 2026-01-13

## APIs & External Services

**ChemInventory API:**
- CABI's chemical inventory management system
- Admin scripts fetch data: `admin-scripts/fetch-inventory.js`
- Generates `data/inventory/chemical-inventory.json`
- Used to populate inventory table with chemical locations and hazards
- Not integrated in main app (admin-managed workflow)

**MSDS Proxy Service:**
- Custom proxy for fetching MSDS documents
- Script: `admin-scripts/msds-proxy.js`
- Purpose: Bypass CORS restrictions when fetching external MSDS documents
- Not used in production deployment (manual MSDS upload only)

## Data Storage

**Databases:**
- None - all data stored client-side

**File Storage:**
- Browser LocalStorage - Saved assessments and form state
- Local filesystem - JSON export/import for assessment data
- Static JSON files:
  - `data/inventory/chemical-inventory.json` - Chemical inventory
  - `data/tracking/assessment-status.json` - Assessment completion tracking
  - `eh40_table.csv` - UK HSE Workplace Exposure Limits (EH40)

**Caching:**
- Browser cache only (no Redis, memcached, etc.)
- LocalStorage used for assessment draft saves

## Authentication & Identity

**Auth Provider:**
- None - no authentication system
- Open access web application
- No user accounts or sessions

**OAuth Integrations:**
- None detected

## Monitoring & Observability

**Error Tracking:**
- None - no Sentry, Rollbar, or error tracking service
- Browser console logging only

**Analytics:**
- None detected - no Google Analytics, Mixpanel, etc.

**Logs:**
- Browser console only - no external log aggregation

## CI/CD & Deployment

**Hosting:**
- GitHub Pages - Static site hosting
- Repository: https://github.com/miguel-bonnin/CABI-COSHH-Helper
- Deployment: Automatic on push to main branch (GitHub Pages)
- No custom domain detected

**CI Pipeline:**
- None detected - no GitHub Actions workflows
- Manual deployment via git push to GitHub

## Environment Configuration

**Development:**
- Required: Modern web browser
- Secrets location: N/A (no secrets required)
- Local testing: Any HTTP server (`python -m http.server`, VS Code Live Server, etc.)

**Staging:**
- Not applicable - direct production deployment

**Production:**
- Secrets management: None required
- All assets served statically from GitHub Pages
- No environment variables or configuration

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## External Resources (CDN)

**PDF.js Library:**
- URL: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js
- Purpose: Parse uploaded PDF MSDS files
- Fallback: None (required dependency)

**CABI Logo:**
- URL: https://www.cabi.org/wp-content/uploads/CABI-Logo_Accessible_RGB.png
- Purpose: Branding in report header
- Fallback: None (cosmetic only)

---

*Integration audit: 2026-01-13*
*Update when adding/removing external services*
