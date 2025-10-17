# Chemical Inventory & Assessment Tracking Feature

## Overview

The CABI COSHH Helper now includes an integrated chemical inventory management and COSHH assessment tracking system. This feature allows teams to:

- View all chemicals from ChemInventory in one place
- Track which chemicals have COSHH assessments
- Identify which chemicals need assessments
- Monitor assessment review dates
- Create assessments pre-filled with inventory data

## Architecture

### Hybrid Static Approach

This feature uses a hybrid architecture that works with GitHub Pages:

```
┌─────────────────────────────────────────────────────────────┐
│                    ChemInventory API                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ (Admin only)
                           ↓
                ┌──────────────────────┐
                │  fetch-inventory.js  │
                │   (Node.js script)   │
                └──────────┬───────────┘
                           │
                           ↓
                ┌──────────────────────┐
                │   Static JSON Files  │
                │  - inventory.json    │
                │  - status.json       │
                └──────────┬───────────┘
                           │
                           ↓
                ┌──────────────────────┐
                │   GitHub Repository  │
                └──────────┬───────────┘
                           │
                           ↓
                ┌──────────────────────┐
                │    GitHub Pages      │
                └──────────┬───────────┘
                           │
                           ↓
              ┌────────────────────────┐
              │   Team Members View    │
              │  - Browse inventory    │
              │  - Create assessments  │
              │  - Download JSON       │
              └────────────────────────┘
```

## File Structure

```
CABI-COSHH-Helper/
├── admin-scripts/
│   ├── fetch-inventory.js       # Admin tool to fetch from ChemInventory
│   └── README.md                # Admin instructions
│
├── data/
│   ├── inventory/
│   │   └── chemical-inventory.json  # Master chemical list
│   ├── tracking/
│   │   └── assessment-status.json   # Assessment tracking
│   └── assessments/
│       ├── assessment-formamide-2024.json
│       └── ...                      # Individual assessments
│
├── js/
│   └── inventory-manager.js     # Frontend inventory display logic
│
└── css/
    └── inventory.css            # Inventory page styling
```

## Data Formats

### Chemical Inventory (`data/inventory/chemical-inventory.json`)

```json
{
  "lastUpdated": "2025-01-17T12:00:00.000Z",
  "totalChemicals": 150,
  "inventory": [
    {
      "id": "chem-001",
      "name": "Formamide",
      "casNumber": "75-12-7",
      "supplier": "Sigma-Aldrich",
      "location": "Main Lab",
      "sublocation": "Cabinet A3",
      "barcode": "CABI-FORM-001",
      "size": 500,
      "units": "mL",
      "acquisitionDate": "2024-06-15",
      "hazards": ["GHS07", "GHS08"],
      "hazardStatements": ["H360D", "H302"],
      "molecularFormula": "CH3NO",
      "molecularWeight": 45.04,
      "structure": "C(=O)N",
      "comments": "Store at room temperature",
      "customFields": {}
    }
  ]
}
```

### Assessment Status (`data/tracking/assessment-status.json`)

```json
{
  "lastUpdated": "2025-01-17T12:00:00.000Z",
  "assessments": [
    {
      "chemicalId": "chem-001",
      "chemicalName": "Formamide",
      "status": "complete",
      "assessmentFile": "data/assessments/assessment-formamide-2024.json",
      "assessedBy": "J. Bonnin",
      "assessmentDate": "2024-10-07",
      "reviewDueDate": "2025-10-07",
      "notes": "Complete assessment with all controls documented"
    }
  ]
}
```

**Status Values:**
- `complete` - Assessment completed and up-to-date
- `in_progress` - Someone is working on assessment
- `needs_assessment` - Requires COSHH assessment
- `not_required` - Non-hazardous, no assessment needed
- `review_due` - Automatically calculated if reviewDueDate is past

## User Workflows

### For Team Members (End Users)

1. **Browse Inventory**
   - Open COSHH Helper tool
   - Click "Inventory" tab
   - See all chemicals with status indicators
   - Use search/filter to find specific chemicals

2. **Create New Assessment**
   - Find chemical in inventory
   - Click "Create Assessment" button
   - Substance information auto-fills
   - Complete assessment through normal workflow
   - Download completed JSON
   - Send to admin

3. **View Existing Assessment**
   - Find chemical in inventory with "Complete" status
   - Click "View Assessment" button
   - Assessment loads into tool
   - Can print or modify as needed

### For Administrators

1. **Update Inventory** (Weekly/Monthly)
   ```bash
   cd admin-scripts
   node fetch-inventory.js --token YOUR_API_TOKEN
   ```
   - Reviews generated JSON file
   - Commits and pushes to GitHub

2. **Process Completed Assessments**
   - Receive assessment JSON files from team
   - Save to `data/assessments/`
   - Update `assessment-status.json`:
     ```json
     {
       "chemicalId": "chem-XXX",
       "status": "complete",
       "assessmentFile": "data/assessments/assessment-XXX.json",
       "assessedBy": "Team Member Name",
       "assessmentDate": "2025-01-17",
       "reviewDueDate": "2026-01-17",
       "notes": "..."
     }
     ```
   - Commit and push changes

3. **Monitor Status**
   - Review inventory dashboard statistics
   - Identify chemicals needing attention
   - Follow up with team members

## ChemInventory API Integration

### Setup (Admin Only)

1. **Get API Token**
   - Log into ChemInventory
   - Navigate to Inventory Management
   - Find "API Tokens" section
   - Generate new token (requires Group Administrator privileges)
   - **Keep token secure - do not commit to repository**

2. **Configure Script**
   - Token can be passed as argument or environment variable
   - Script uses HTTPS POST to ChemInventory endpoints

### API Endpoints Used

The `fetch-inventory.js` script uses:

- `/api/inventorymanagement/export` - Bulk container export
  - Retrieves all container information
  - Includes locations, hazards, and custom fields

### Data Mapping

ChemInventory fields → Tool fields:
- `containerid` → `id`
- `name` → `name`
- `cas` → `casNumber`
- `ghspictograms` → `hazards`
- `hazardstatements` → `hazardStatements`
- `location` + `sublocation` → `location`, `sublocation`
- Plus: supplier, barcode, size, units, molecular data

## Security Considerations

### API Token Security

**CRITICAL:**
- API tokens must NEVER be committed to the repository
- Use environment variables or secure argument passing
- Only administrators need API access
- Rotate tokens periodically

### Data Privacy

- Chemical inventory is public to anyone with GitHub Pages access
- Assessment files may contain sensitive information
- Consider making repository private if needed
- Use `.gitignore` for sensitive local files

### Authentication Options

Current: None (public GitHub Pages)

Future options if needed:
- GitHub authentication for write access
- Password-protected pages
- Move to private hosting

## Maintenance

### Regular Tasks

**Weekly:**
- Update inventory from ChemInventory
- Process completed assessments from team
- Update assessment-status.json

**Monthly:**
- Review chemicals needing assessments
- Check for overdue reviews
- Generate status reports

**Annually:**
- Review all assessments
- Update review due dates
- Archive old assessments

### Git Workflow

```bash
# Update inventory
node admin-scripts/fetch-inventory.js --token TOKEN
git add data/inventory/chemical-inventory.json
git commit -m "Update chemical inventory - $(date +%Y-%m-%d)"

# Add completed assessment
git add data/assessments/assessment-newchem-2025.json
git add data/tracking/assessment-status.json
git commit -m "Add COSHH assessment for NewChemical"

# Push to GitHub Pages
git push origin main
```

## Future Enhancements

Potential improvements:

1. **Automatic Assessment Status Updates**
   - Script to scan assessments folder and auto-update status.json
   - Reduces manual tracking work

2. **Email Notifications**
   - Alert when reviews are due
   - Notify admin of new submissions

3. **Export Features**
   - Export inventory to Excel/CSV
   - Generate compliance reports
   - Bulk print assessments

4. **Assignment System**
   - Assign specific chemicals to team members
   - Track who's responsible for each assessment

5. **Backend Integration** (requires hosting change)
   - Move to Vercel/Netlify with serverless functions
   - Real-time updates without manual commits
   - User authentication and roles

## Troubleshooting

### Inventory Not Loading

**Symptom:** "Failed to load inventory data" message

**Solutions:**
1. Check browser console for errors
2. Verify JSON files exist in `data/` folders
3. Check JSON syntax is valid
4. Ensure file paths are correct (case-sensitive on Linux/Mac)
5. Clear browser cache and refresh

### API Script Fails

**Symptom:** fetch-inventory.js reports errors

**Solutions:**
1. Verify API token is valid
2. Check network connectivity
3. Confirm ChemInventory API is accessible
4. Review ChemInventory permissions
5. Check Node.js is installed

### Assessment Not Pre-Filling

**Symptom:** "Create Assessment" doesn't populate data

**Solutions:**
1. Check chemical ID matches between inventory and status files
2. Verify JavaScript console for errors
3. Ensure inventory-manager.js is loaded
4. Test with browser DevTools

## Support

For issues or questions:
1. Check browser console for error messages
2. Review this documentation
3. Check `admin-scripts/README.md` for admin tasks
4. Contact system administrator

## Version History

- **v1.0** (2025-01-17) - Initial release
  - ChemInventory integration
  - Static JSON-based tracking
  - Dashboard with statistics
  - Search and filter functionality
  - Pre-fill assessments from inventory
