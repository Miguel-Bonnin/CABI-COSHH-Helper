#!/usr/bin/env node

/**
 * Debug ChemInventory API Response
 * Shows the exact structure of the data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read token
const tokenPath = path.join(__dirname, 'api-token.txt');
const API_TOKEN = fs.readFileSync(tokenPath, 'utf8').trim();

console.log('🔍 ChemInventory Response Debugger');
console.log('===================================\n');

const postData = JSON.stringify({
    authtoken: API_TOKEN,
    includeEmptyContainers: false,
    includeSublocations: true
});

const options = {
    hostname: 'app.cheminventory.net',
    path: '/api/inventorymanagement/export',
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
                const data = response.data;

                console.log('✅ Response Structure:');
                console.log('   Keys:', Object.keys(data));
                console.log('   Columns:', data.columns ? data.columns.length : 'N/A');
                console.log('   Rows:', data.rows ? data.rows.length : 'N/A');
                console.log('');

                if (data.columns) {
                    console.log('📋 Column Information:');
                    data.columns.forEach((col, i) => {
                        console.log(`   ${i}: ${col.key} (${col.header})`);
                    });
                    console.log('');
                }

                if (data.rows && data.rows.length > 0) {
                    console.log('📦 First Row Structure:');
                    const firstRow = data.rows[0];
                    console.log('   Type:', Array.isArray(firstRow) ? 'Array' : 'Object');
                    console.log('   Length/Keys:', Array.isArray(firstRow) ? firstRow.length : Object.keys(firstRow).length);
                    console.log('');

                    if (Array.isArray(firstRow)) {
                        console.log('   First Row (Array):');
                        firstRow.forEach((val, i) => {
                            const colName = data.columns[i] ? data.columns[i].key : `column-${i}`;
                            console.log(`     [${i}] ${colName}: ${JSON.stringify(val)}`);
                        });
                    } else {
                        console.log('   First Row (Object):');
                        console.log(JSON.stringify(firstRow, null, 2));
                    }
                    console.log('');

                    console.log('📦 Mapped First Container:');
                    const columnKeys = data.columns.map(col => col.key);
                    const mapped = {};
                    columnKeys.forEach((key, index) => {
                        mapped[key] = firstRow[index];
                    });
                    console.log(JSON.stringify(mapped, null, 2));
                }

            } else {
                console.log('❌ API Error:', response);
            }
        } catch (e) {
            console.error('❌ Parse Error:', e.message);
            console.log('Raw response:', body.substring(0, 1000));
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
});

req.write(postData);
req.end();
