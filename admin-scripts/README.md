# Admin Scripts for CABI COSHH Helper

This folder contains administrative scripts for managing the chemical inventory and assessment tracking system.

## Scripts

### `fetch-inventory.js`

Pulls chemical inventory data from ChemInventory API and generates a static JSON file for the COSHH Helper tool.

**Prerequisites:**
- Node.js installed
- ChemInventory API token (requires Group Administrator privileges)

**Usage:**

```bash
# Option 1: Pass token as argument
node fetch-inventory.js --token YOUR_API_TOKEN

# Option 2: Use environment variable
CHEMINVENTORY_TOKEN=your_token node fetch-inventory.js
```

**Output:**
- Creates/updates `data/inventory/chemical-inventory.json`
- This file is committed to the repository and served via GitHub Pages

**Recommended Workflow:**
1. Run script when new chemicals are added to ChemInventory
2. Review the generated JSON file
3. Commit and push to GitHub
4. Team members will see updated inventory on next page load

## Data Structure

### Chemical Inventory (`data/inventory/chemical-inventory.json`)

Contains the master list of all chemicals from ChemInventory:
- Chemical identifiers (name, CAS, molecular formula)
- Location information
- Supplier and acquisition details
- GHS hazard information
- Physical properties

### Assessment Status (`data/tracking/assessment-status.json`)

Tracks which chemicals have COSHH assessments:
- `complete` - Assessment done, file available
- `in_progress` - Someone is working on it
- `needs_assessment` - Requires COSHH assessment
- `not_required` - Non-hazardous, no assessment needed
- `review_due` - Assessment exists but review is overdue

### Assessment Files (`data/assessments/`)

Individual COSHH assessment JSON files (exported from the tool).

## Security Notes

- **NEVER commit API tokens to the repository**
- Keep your ChemInventory API token secure
- The token should only be used by administrators running the fetch script
- End users do not need API access - they use the static JSON files

## Maintenance

**Weekly/Monthly:**
1. Run `fetch-inventory.js` to update chemical list
2. Collect completed assessments from team
3. Update `assessment-status.json` with new completions
4. Commit and push changes

**When receiving completed assessments:**
1. Save JSON file to `data/assessments/`
2. Update corresponding entry in `assessment-status.json`
3. Commit and push
