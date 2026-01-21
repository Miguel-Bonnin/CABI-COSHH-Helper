#!/usr/bin/env node

/**
 * Simple ChemInventory API Test
 * Tests basic connectivity and authentication
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read token
const tokenPath = path.join(__dirname, 'api-token.txt');
const API_TOKEN = fs.readFileSync(tokenPath, 'utf8').trim();

console.log('🧪 ChemInventory API Test');
console.log('=========================');
console.log(`Token length: ${API_TOKEN.length} characters`);
console.log(
    `Token preview: ${API_TOKEN.substring(0, 5)}...${API_TOKEN.substring(API_TOKEN.length - 5)}`
);
console.log('');

// Test 1: Simple endpoint test with getdetails
console.log('Test 1: Calling /api/general/getdetails');
console.log('This endpoint should return basic account info');
console.log('');

const postData = JSON.stringify({
    authtoken: API_TOKEN,
});

const options = {
    hostname: 'app.cheminventory.net',
    path: '/api/general/getdetails',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
    },
};

console.log(`Request URL: https://${options.hostname}${options.path}`);
console.log(`Request Method: ${options.method}`);
console.log('Request Headers:', options.headers);
console.log(`Request Body: ${postData.substring(0, 100)}...`);
console.log('');

const req = https.request(options, res => {
    console.log(`Response Status: ${res.statusCode}`);
    console.log('Response Headers:', res.headers);
    console.log('');

    let body = '';
    res.on('data', chunk => (body += chunk));
    res.on('end', () => {
        console.log('Response Body:');
        try {
            const parsed = JSON.parse(body);
            console.log(JSON.stringify(parsed, null, 2));

            if (parsed.status === 'success') {
                console.log('');
                console.log('✅ SUCCESS! Authentication works!');
                console.log('Your token is valid and you have access to the API.');
            } else {
                console.log('');
                console.log('❌ FAILED! API returned error status.');
                console.log('Possible issues:');
                console.log('  - Token is invalid or expired');
                console.log("  - Token doesn't have required permissions");
                console.log('  - Account is not a Group Administrator');
            }
        } catch (e) {
            console.log(body);
            console.log('');
            console.log('❌ FAILED! Response is not valid JSON');
        }
    });
});

req.on('error', error => {
    console.error('❌ Request Error:', error.message);
    console.log('');
    console.log('Possible issues:');
    console.log('  - Network connectivity problem');
    console.log('  - Wrong hostname (not app.cheminventory.net)');
    console.log('  - Firewall blocking HTTPS requests');
});

req.write(postData);
req.end();
