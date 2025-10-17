# Inventory Feature - Quick Start Guide

## For Administrators

### Initial Setup (One-time)

1. **Get Your ChemInventory API Token**
   - Log into ChemInventory with admin account
   - Go to Inventory Management → API Tokens
   - Generate new token
   - Save securely (never commit to Git!)

2. **Fetch Initial Inventory**
   ```bash
   cd admin-scripts
   node fetch-inventory.js --token YOUR_API_TOKEN
   ```

3. **Create Initial Status File**
   - Edit `data/tracking/assessment-status.json`
   - Add entries for each chemical
   - Set appropriate statuses

4. **Commit to GitHub**
   ```bash
   git add data/
   git commit -m "Add initial chemical inventory and tracking"
   git push origin main
   ```

### Regular Workflow

**Weekly/Monthly: Update Inventory**
```bash
# Fetch latest from ChemInventory
node admin-scripts/fetch-inventory.js --token YOUR_TOKEN

# Review changes
git diff data/inventory/chemical-inventory.json

# Commit if looks good
git add data/inventory/chemical-inventory.json
git commit -m "Update inventory - $(date +%Y-%m-%d)"
git push
```

**When Team Submits Assessment:**

1. Save received JSON to `data/assessments/assessment-CHEMNAME-2025.json`
2. Update `data/tracking/assessment-status.json`:
   ```json
   {
     "chemicalId": "chem-XXX",
     "status": "complete",
     "assessmentFile": "data/assessments/assessment-CHEMNAME-2025.json",
     "assessedBy": "Team Member",
     "assessmentDate": "2025-01-17",
     "reviewDueDate": "2026-01-17",
     "notes": "Complete assessment"
   }
   ```
3. Commit and push:
   ```bash
   git add data/assessments/ data/tracking/
   git commit -m "Add assessment for CHEMNAME"
   git push
   ```

## For Team Members

### View Inventory

1. Open COSHH Helper: `https://yourusername.github.io/CABI-COSHH-Helper/coshhgeneratorv5.html`
2. Click **"Inventory"** tab
3. See dashboard with statistics:
   - Total chemicals
   - Assessments complete
   - In progress
   - Needs assessment
   - Reviews due

### Find Chemicals

**Search:**
- Type in search box: chemical name, CAS number, or location
- Results filter in real-time

**Filter:**
- Use "Filter by Status" dropdown:
  - All Chemicals
  - Needs Assessment (⚠️ urgent)
  - In Progress (⏳)
  - Complete (✓)
  - Review Due (📅)

### Create New Assessment

1. **Find chemical** in inventory table
2. **Click "Create Assessment"** button
3. Tool automatically:
   - Switches to Personnel tab
   - Pre-fills chemical name, CAS, supplier
   - Adds inventory location to notes
4. **Complete assessment** through normal workflow (tabs 1-8)
5. **Download JSON** from Report tab
6. **Send to administrator** via email/Teams

### View Existing Assessment

1. Find chemical with "✓ Complete" status
2. Click **"View Assessment"** button
3. Assessment loads into tool
4. Can review, print, or modify

### Check Chemical Details

- Click **"Details"** button on any chemical
- See full information:
  - Name, CAS, molecular formula
  - Location and barcode
  - Hazard information
  - Assessment status

## Status Indicators

| Badge | Meaning |
|-------|---------|
| ✓ Complete | Assessment done, no action needed |
| ⏳ In Progress | Someone is working on it |
| ⚠ Needs Assessment | Urgent - requires COSHH assessment |
| - Not Required | Non-hazardous, no assessment needed |
| 📅 Review Due | Assessment exists but review overdue |

## Tips

### For Efficient Searching

- **By location:** Type cabinet/room name
- **By hazard:** Filter Complete, then search hazard code
- **Needs attention:** Filter "Needs Assessment" to prioritize

### For Creating Assessments

- Let the tool pre-fill data - saves time
- Check pre-filled CAS number is correct
- Review hazard statements in Hazards tab
- Add inventory location is auto-added to notes

### For Team Coordination

- Check "In Progress" filter to avoid duplicate work
- Add your name when starting an assessment
- Include notes about any issues found
- Send completed JSON promptly to admin

## Common Questions

**Q: Why isn't inventory updating?**
A: Click 🔄 Refresh Data button. If still not working, contact admin - they may need to update GitHub.

**Q: Can I edit the inventory?**
A: No - inventory comes from ChemInventory. Contact admin to make changes there.

**Q: Where do I find my completed assessment?**
A: Report tab → "Export Assessment (JSON)" button. Save file and send to admin.

**Q: What if chemical isn't in inventory?**
A: Use normal MSDS tab workflow to create assessment. Inform admin to add to ChemInventory.

**Q: How do I know what needs urgent attention?**
A: Use filter "Needs Assessment" or check the red "Needs Assessment" statistics card.

## Getting Help

- **Documentation:** See `docs/INVENTORY-FEATURE.md` for full details
- **Admin tasks:** See `admin-scripts/README.md`
- **Technical issues:** Check browser console (F12), contact admin
- **ChemInventory issues:** Contact your ChemInventory administrator

## Example Workflow

**Scenario: Create assessment for Acetone**

1. Open tool → Inventory tab
2. Search: "acetone"
3. Click "Create Assessment"
4. Notice pre-filled:
   - Substance Name: Acetone
   - CAS: 67-64-1
   - Supplier: Fisher Scientific
   - Location in notes
5. Complete tabs 1-8:
   - Add your name, department
   - Describe task
   - Review hazards (pre-filled from inventory!)
   - Select procedure
   - Evaluate risks
   - Add controls
   - Document actions
   - Acknowledge
6. Report tab → Export JSON
7. Save as "assessment-acetone-2025.json"
8. Email to admin with subject "COSHH Assessment - Acetone"

Done! ✓
