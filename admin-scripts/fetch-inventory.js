#!/usr/bin/env node

/**
 * ChemInventory Fetch Script (Admin Only)
 *
 * This script pulls chemical inventory data from ChemInventory API
 * and generates a static JSON file for the COSHH Helper tool.
 *
 * Usage:
 *   node fetch-inventory.js --token YOUR_API_TOKEN
 *
 * Or set environment variable:
 *   CHEMINVENTORY_TOKEN=your_token node fetch-inventory.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'app.cheminventory.net';
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'inventory');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'chemical-inventory.json');

// Get API token from command line, file, or environment
const args = process.argv.slice(2);
const tokenIndex = args.indexOf('--token');
let API_TOKEN = tokenIndex >= 0 ? args[tokenIndex + 1] : process.env.CHEMINVENTORY_TOKEN;

// If token looks like a file path, try to read from file
if (API_TOKEN && (API_TOKEN.endsWith('.txt') || API_TOKEN.includes('/'))) {
    try {
        const tokenPath = path.isAbsolute(API_TOKEN) ? API_TOKEN : path.join(__dirname, API_TOKEN);
        API_TOKEN = fs.readFileSync(tokenPath, 'utf8').trim();
        console.log(`📄 Token read from file: ${path.basename(tokenPath)}`);
    } catch (error) {
        console.error(`❌ Error reading token file: ${error.message}`);
        process.exit(1);
    }
}

if (!API_TOKEN) {
    console.error('❌ Error: API token required');
    console.error('Usage:');
    console.error('  node fetch-inventory.js --token YOUR_API_TOKEN');
    console.error('  node fetch-inventory.js --token path/to/token-file.txt');
    console.error('  CHEMINVENTORY_TOKEN=your_token node fetch-inventory.js');
    process.exit(1);
}

/**
 * Make API request to ChemInventory
 */
function makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            authtoken: API_TOKEN,
            ...data
        });

        const options = {
            hostname: API_BASE_URL,
            path: `/api${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.status === 'success') {
                        resolve(response.data);
                    } else {
                        reject(new Error(`API Error: ${JSON.stringify(response)}`));
                    }
                } catch (e) {
                    reject(new Error(`Parse Error: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Fetch full inventory from ChemInventory
 */
async function fetchInventory() {
    console.log('🔄 Fetching inventory from ChemInventory...');

    try {
        // Get inventory export
        const containers = await makeRequest('/inventorymanagement/export', {
            includeEmptyContainers: false,
            includeSublocations: true
        });

        console.log(`✅ Fetched ${containers.length} containers`);

        // Transform to simplified format for COSHH tool
        const inventory = containers.map(container => ({
            id: container.containerid,
            name: container.name || 'Unknown',
            casNumber: container.cas || null,
            supplier: container.supplier || null,
            location: container.location || null,
            sublocation: container.sublocation || null,
            barcode: container.barcode || null,
            size: container.size || null,
            units: container.units || null,
            acquisitionDate: container.acquisitiondate || null,
            // GHS hazards if available
            hazards: container.ghspictograms || [],
            hazardStatements: container.hazardstatements || [],
            // Additional useful fields
            molecularFormula: container.molecularformula || null,
            molecularWeight: container.molecularweight || null,
            structure: container.structure || null, // SMILES notation
            comments: container.comments || null,
            customFields: container.customfields || {}
        }));

        return {
            lastUpdated: new Date().toISOString(),
            totalChemicals: inventory.length,
            inventory: inventory
        };

    } catch (error) {
        throw new Error(`Failed to fetch inventory: ${error.message}`);
    }
}

/**
 * Save inventory to JSON file
 */
function saveInventory(data) {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 Saved inventory to: ${OUTPUT_FILE}`);
}

/**
 * Main execution
 */
async function main() {
    try {
        console.log('🚀 ChemInventory Fetch Script');
        console.log('================================');

        const inventory = await fetchInventory();
        saveInventory(inventory);

        console.log('✅ Complete!');
        console.log(`   Total chemicals: ${inventory.totalChemicals}`);
        console.log(`   Last updated: ${inventory.lastUpdated}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { fetchInventory, makeRequest };
