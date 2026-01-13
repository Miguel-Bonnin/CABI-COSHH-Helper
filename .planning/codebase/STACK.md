# Technology Stack

**Analysis Date:** 2026-01-13

## Languages

**Primary:**
- JavaScript ES6+ - All application code (`js/**/*.js`, embedded in `coshhgeneratorv5.html`)
- HTML5 - Application structure (`coshhgeneratorv5.html`)
- CSS3 - Styling (`css/**/*.css`)

**Secondary:**
- Markdown - Documentation (`README.md`, `TECHNICAL.md`, `CHANGELOG.md`)
- JSON - Data files (`data/**/*.json`, example files)
- SVG - GHS pictogram assets (`ghs_*.svg`)

## Runtime

**Environment:**
- Browser-based (client-side only)
- No Node.js backend required
- Runs in modern web browsers (Chrome, Firefox, Edge, Safari)

**Package Manager:**
- None detected - no `package.json` found
- Pure client-side web application
- No build step or npm dependencies

## Frameworks

**Core:**
- Vanilla JavaScript (no frontend framework)
- Pure HTML/CSS/JS implementation

**Testing:**
- Not detected - no test framework configuration found

**Build/Dev:**
- None - static HTML/CSS/JS served directly
- No bundler (Vite, Webpack, etc.)
- Manual modularization via `<script>` tags

## Key Dependencies

**Critical:**
- PDF.js 2.10.377 (CDN) - MSDS PDF parsing - `<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js"></script>`

**Infrastructure:**
- Browser built-ins - File API, Blob, LocalStorage, FormData
- No backend API calls (except CDN for PDF.js and CABI logo)

## Configuration

**Environment:**
- No environment variables
- Configuration embedded in JavaScript modules (`js/config/*.js`)
- Data files in `data/` directory (inventory, tracking, WEL limits)

**Build:**
- No build configuration
- Static file serving only
- Assets referenced via relative paths

## Platform Requirements

**Development:**
- Any OS with modern web browser
- Text editor or IDE
- HTTP server for local testing (e.g., `python -m http.server`)
- No external dependencies or tools required

**Production:**
- Static web hosting (GitHub Pages currently used)
- HTTPS recommended (for file upload security)
- No server-side processing required
- Deployment URL: https://miguel-bonnin.github.io/CABI-COSHH-Helper/coshhgeneratorv5.html

---

*Stack analysis: 2026-01-13*
*Update after major dependency changes*
