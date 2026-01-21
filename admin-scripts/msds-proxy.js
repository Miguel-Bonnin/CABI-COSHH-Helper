#!/usr/bin/env node

/**
 * MSDS Proxy Server
 *
 * Simple proxy server that allows the COSHH Helper to fetch MSDS files
 * from ChemInventory API without CORS issues.
 *
 * Usage: node msds-proxy.js
 * Then access at: http://localhost:3000
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Read API token
const tokenPath = path.join(__dirname, 'api-token.txt');
let API_TOKEN;

try {
    API_TOKEN = fs.readFileSync(tokenPath, 'utf8').trim();
} catch (error) {
    console.error('❌ Error: Could not read api-token.txt');
    console.error('   Make sure the file exists with your ChemInventory API token');
    process.exit(1);
}

/**
 * Make API request to ChemInventory
 */
function makeChemInventoryRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            authtoken: API_TOKEN,
            ...data,
        });

        const options = {
            hostname: 'app.cheminventory.net',
            path: `/api${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = https.request(options, res => {
            let body = '';
            res.on('data', chunk => (body += chunk));
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
 * HTTP Server
 */
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${req.method} ${req.url}`);

    // Parse URL
    const url = new URL(req.url, `http://localhost:${PORT}`);

    try {
        // Get linked files for a substance
        if (url.pathname === '/files' && req.method === 'GET') {
            const substanceId = url.searchParams.get('substanceId');

            if (!substanceId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing substanceId parameter' }));
                return;
            }

            const files = await makeChemInventoryRequest('/filestore/getlinkedfiles', {
                substanceid: parseInt(substanceId),
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(files));
        }
        // Get download URL for a file
        else if (url.pathname === '/download' && req.method === 'GET') {
            const fileId = url.searchParams.get('fileId');

            if (!fileId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing fileId parameter' }));
                return;
            }

            const downloadUrl = await makeChemInventoryRequest('/filestore/download', {
                fileid: parseInt(fileId),
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ url: downloadUrl }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
});

server.listen(PORT, () => {
    console.log('📡 MSDS Proxy Server');
    console.log('====================');
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('');
    console.log('Endpoints:');
    console.log('  GET /files?substanceId=123    - List files for substance');
    console.log('  GET /download?fileId=456      - Get download URL for file');
    console.log('');
    console.log('Press Ctrl+C to stop');
});
