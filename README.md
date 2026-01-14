# CABI COSHH Helper

A web-based tool to streamline the creation of COSHH (Control of Substances Hazardous to Health) assessments for laboratory environments.

## Features

- **MSDS Parsing**: Automatically extract hazard information from Material Safety Data Sheets (PDF or text)
- **Dynamic Risk Assessment**: Intelligent calculation of risk levels based on hazards, quantities, and procedures
- **Control Suggestions**: Automated recommendations for Personal Protective Equipment (PPE) and control measures
- **Comprehensive Reporting**: Generate professional COSHH assessment reports ready for print or PDF export
- **Data Management**: Save, load, and export assessment data in JSON format
- **Lab Procedure Templates**: Pre-configured common laboratory procedures with exposure factors

Your Admin Role:
Run a script that pulls from ChemInventory API → generates chemical-inventory.json
Collect completed COSHH assessments from team → store as individual JSON files
Push updates to GitHub → everyone sees latest data
Team Members:
Open tool on GitHub Pages (no API tokens needed!)
See up-to-date inventory with assessment status
Click "Create Assessment" → auto-fills chemical data
Complete assessment → download JSON → send to you
View what needs attention


## Quick Start

### Try the Live Demo
Visit the live application: **https://miguel-bonnin.github.io/CABI-COSHH-Helper/coshhgeneratorv5.html**

### Try the Example
Want to see how it works? Check out the example files in the `examples/` folder:
- **HiDi Formamide.pdf** - Example MSDS sheet to upload and parse
- **cabi_coshh_dynamic_2025-10-07.json** - Pre-filled assessment data to import
- **coshhform-hidi.pdf** - Completed COSHH report output

These example files are also linked directly in the application's MSDS tab.

### Using the Tool

1. **Open the Application**: Simply open `coshhgeneratorv5.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
2. **Upload MSDS**: Start by uploading a PDF MSDS or pasting text in the MSDS tab
3. **Review Parsed Data**: Check and edit the automatically extracted hazard information
4. **Complete the Form**: Follow the numbered tabs (1-8) to complete your assessment
5. **Generate Report**: Create your final COSHH assessment report ready for review and printing

## Development

### Prerequisites

- **Node.js 16+** (for running tests)
- **Modern web browser** (Chrome, Firefox, Edge, Safari)

### Setup

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd CABI-COSHH-Helper

# Install dependencies
npm install
```

### Running the Application

#### Option 1: Direct Browser Access

- Open `coshhgeneratorv5.html` directly in your web browser

#### Option 2: Local Server (recommended for development)

```bash
# Using Python's built-in server
python -m http.server 8000
# Then visit http://localhost:8000/coshhgeneratorv5.html
```

### Running Tests

```bash
# Run tests in console (default)
npm test

# Run tests with browser UI
npm run test:ui
```

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Usage

### MSDS Input (Tab 0)
- Upload PDF MSDS files for automatic parsing
- Paste MSDS text directly for extraction
- Import previously saved assessments (JSON format)

### Personnel & Assessment Details (Tab 1)
- Record assessor information
- Department and reference details

### Substance & Task Overview (Tab 2)
- Chemical name and CAS number (auto-filled from MSDS)
- Activity description
- Material type and exposure details

### Hazard Identification (Tab 3)
- GHS pictograms (auto-detected)
- H-phrases and P-phrases
- Workplace Exposure Limits (WEL)

### Procedure Details (Tab 4)
- Select common lab procedures (pipetting, weighing, mixing, etc.)
- Quantity, frequency, and duration
- Routes of exposure

### Risk Assessment Evaluation (Tab 5)
- Auto-calculated hazard groups
- Quantity and physical characteristic groups
- Control band determination

### Suitable Controls (Tab 6)
- Auto-suggested general controls (ventilation, LEV, containment)
- PPE recommendations
- First aid, spillage, storage, and disposal requirements

### Further Actions (Tab 7)
- Action items with responsibilities and timelines

### Acknowledgement & Review (Tab 8)
- Final sign-off and review dates

### Report Generation
- Generate comprehensive COSHH reports
- Print or save as PDF
- Export/import data for future edits

## System Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for pdf.js CDN and CABI logo)
- No server required - runs entirely client-side

## Data Privacy

All data processing happens locally in your browser. No information is sent to external servers except:
- Loading pdf.js library from CDN
- Loading CABI logo image
- Your assessment data stays on your device

## Technical Details

- **PDF Parsing**: Uses [PDF.js](https://mozilla.github.io/pdf.js/) library
- **Storage**: Browser LocalStorage for saved assessments
- **Export Format**: JSON for interoperability
- **Print Styling**: Optimized CSS for professional report output

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (Not supported)

## Important Disclaimer

This tool is intended as an aid and **does not replace the need for expert judgment**. All generated assessments and suggestions **must be thoroughly reviewed, verified, and approved by the responsible Lab Manager, COSHH Assessor, and/or other qualified safety personnel** before any work commences.

Users are responsible for ensuring compliance with all relevant safety regulations and local procedures.

## Development

This application was prototyped with assistance from AI (Gemini and Claude) to help automate and streamline parts of the COSHH assessment process.

### Developer Documentation

For detailed technical documentation including:
- **Risk Assessment Methodology** - How severity and likelihood are calculated
- **Code Structure** - Line-by-line guide to the codebase
- **Key Functions Reference** - All major functions explained
- **Customization Guide** - How to modify risk thresholds, add procedures, etc.
- **Future Modularization** - Roadmap for splitting the monolithic file

See [TECHNICAL.md](TECHNICAL.md)

### Future Improvements
- Separate HTML, CSS, and JavaScript files
- Enhanced input validation and sanitization
- Direct PDF export functionality
- Additional lab procedure templates
- Multi-language support

## License

Copyright © CABI (Centre for Agriculture and Bioscience International)

## Support

For issues, questions, or contributions, please contact your organization's Health & Safety department or the repository maintainer.

## Version

Current version: v5 - Enhanced MSDS Parsing

---

**Note**: GHS pictogram SVG files are referenced in the HTML. Ensure these files are present in the same directory:
- `ghs_exclam.svg`
- `ghs_environment.svg`
- `ghs_skull.svg`
- `ghs_corrosive.svg`
- `ghs_flammable.svg`
- `ghs_oxidising.svg`
- `ghs_explosive.svg`
- `ghs_health_hazard.svg`
- `ghs_gas_cylinder.svg`