#!/usr/bin/env node

/**
 * Generate Assessment Status from Inventory
 *
 * Creates assessment-status.json based on the current inventory
 * and ChemInventory custom fields (COSHH required/completed)
 */

const fs = require('fs');
const path = require('path');

const INVENTORY_FILE = path.join(__dirname, '..', 'data', 'inventory', 'chemical-inventory.json');
const STATUS_FILE = path.join(__dirname, '..', 'data', 'tracking', 'assessment-status.json');

console.log('📋 Generating Assessment Status from Inventory');
console.log('==============================================\n');

try {
    // Read inventory
    const inventoryData = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf8'));
    console.log(`✅ Loaded ${inventoryData.totalChemicals} chemicals from inventory`);

    // Generate status entries
    const assessments = inventoryData.inventory.map(chemical => {
        // Determine status based on ChemInventory custom fields
        let status = 'needs_assessment'; // Default

        const coshhRequired = chemical.customFields?.coshhRequired;
        const coshhCompleted = chemical.customFields?.coshhCompleted;

        // Logic based on your custom fields
        if (coshhCompleted === 'Yes') {
            status = 'complete';
        } else if (coshhRequired === 'No') {
            status = 'not_required';
        } else if (coshhRequired === 'Yes') {
            status = 'needs_assessment';
        } else {
            // No custom field data - check if chemical has hazards
            if (chemical.hazardStatements && chemical.hazardStatements.length > 0) {
                status = 'needs_assessment';
            } else {
                status = 'not_required'; // Assume non-hazardous if no H-codes
            }
        }

        return {
            chemicalId: chemical.id,
            chemicalName: chemical.name,
            status: status,
            assessmentFile: null, // Will be filled in when assessment is uploaded
            assessedBy: null,
            assessmentDate: null,
            reviewDueDate: null, // Set to 1 year from assessment date when completed
            notes: coshhRequired === 'Yes' ? 'COSHH assessment required (from ChemInventory)' : ''
        };
    });

    // Count by status
    const stats = {
        complete: assessments.filter(a => a.status === 'complete').length,
        in_progress: assessments.filter(a => a.status === 'in_progress').length,
        needs_assessment: assessments.filter(a => a.status === 'needs_assessment').length,
        not_required: assessments.filter(a => a.status === 'not_required').length
    };

    console.log('\n📊 Status Breakdown:');
    console.log(`   ✓ Complete: ${stats.complete}`);
    console.log(`   ⏳ In Progress: ${stats.in_progress}`);
    console.log(`   ⚠ Needs Assessment: ${stats.needs_assessment}`);
    console.log(`   - Not Required: ${stats.not_required}`);

    // Create status file
    const statusData = {
        lastUpdated: new Date().toISOString(),
        assessments: assessments
    };

    // Ensure directory exists
    const statusDir = path.dirname(STATUS_FILE);
    if (!fs.existsSync(statusDir)) {
        fs.mkdirSync(statusDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
    console.log(`\n💾 Saved assessment status to: ${STATUS_FILE}`);

    console.log('\n✅ Complete! The assessment-status.json file has been generated.');
    console.log('   You can now view the inventory in the COSHH Helper tool.');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
