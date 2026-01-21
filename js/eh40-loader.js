/**
 * @fileoverview UK HSE Workplace Exposure Limits (EH40) data loading and auto-fill
 * @module eh40-loader
 *
 * This module loads the HSE EH40 workplace exposure limits data from CSV
 * and provides functionality to match substances by name or CAS number,
 * automatically filling WEL (Workplace Exposure Limit) values.
 */

// Import safe DOM helpers (Phase 2: Runtime Safety)
import { safeGetElementById, safeSetTextContent } from './modules/domHelpers.js';

// Global variable to store EH40 data
let eh40Data = [];
let eh40DataLoaded = false;

/**
 * Fetch with automatic retry logic and exponential backoff
 * @param {string} url - URL to fetch
 * @param {number} maxRetries - Maximum number of retry attempts (default 3)
 * @param {number} delay - Initial delay in ms before first retry (default 1000)
 * @returns {Promise<Response>} - Fetch response
 */
async function fetchWithRetry(url, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Fetching ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);
            const response = await fetch(url);

            // Don't retry on 4xx errors (client errors - permanent)
            if (response.status >= 400 && response.status < 500) {
                throw new Error(
                    `Client error ${response.status} for ${url}: ${response.statusText}`
                );
            }

            // Retry on 5xx errors (server errors - transient)
            if (response.status >= 500) {
                throw new Error(
                    `Server error ${response.status} for ${url}: ${response.statusText}`
                );
            }

            // Success
            if (response.ok) {
                return response;
            }

            throw new Error(`HTTP ${response.status} for ${url}: ${response.statusText}`);
        } catch (error) {
            lastError = error;
            console.error(`Fetch attempt ${attempt + 1} failed for ${url}:`, error.message);

            // Don't retry on client errors (4xx)
            if (error.message.includes('Client error')) {
                throw error;
            }

            // If we haven't exhausted retries, wait and try again
            if (attempt < maxRetries) {
                const waitTime = delay * Math.pow(2, attempt); // Exponential backoff
                console.log(`Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    // All retries exhausted
    throw new Error(
        `Failed to fetch ${url} after ${maxRetries + 1} attempts. Last error: ${lastError.message}`
    );
}

/**
 * Load and parse the EH40 CSV data from UK HSE workplace exposure limits
 * Fetches eh40_table.csv with retry logic and parses into substance records
 * @returns {Promise<boolean>} True if data loaded successfully, false otherwise
 */
async function loadEH40Data() {
    try {
        const response = await fetchWithRetry('data/eh40_table.csv');
        const csvText = await response.text();

        // Parse CSV
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');

        eh40Data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line (handle quoted fields)
            const values = parseCSVLine(line);
            if (values.length >= 6) {
                eh40Data.push({
                    substance: values[0].trim(),
                    casNumber: values[1].trim(),
                    ltePPM: values[2].trim(),
                    lteMgM3: values[3].trim(),
                    stePPM: values[4].trim(),
                    steMgM3: values[5].trim(),
                });
            }
        }

        console.log(`Loaded ${eh40Data.length} substances from EH40 database`);
        eh40DataLoaded = true;

        // Update status message to show data is ready
        const statusEl = safeGetElementById('welMatchStatus', false);
        if (statusEl) {
            statusEl.textContent = `✓ ${eh40Data.length} substances loaded`;
            statusEl.style.color = '#28a745';
        }

        return true;
    } catch (error) {
        console.error('Error loading EH40 data:', error);
        eh40DataLoaded = false;
        const errorMessage = error.message.includes('Client error')
            ? '❌ Could not load workplace exposure limits (WEL) data file. The file may be missing. You can continue without WEL auto-fill or click Retry below.'
            : '❌ Network connection issue while loading WEL data. Click Retry or check your internet connection.';
        showEH40Error(errorMessage);
        return false;
    }
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue);

    return values;
}

/**
 * Normalize substance name for matching
 */
function normalizeSubstanceName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

/**
 * Normalize CAS number for matching
 */
function normalizeCASNumber(cas) {
    if (!cas) return '';
    return cas.replace(/\s+/g, '').trim();
}

/**
 * Search EH40 data by substance name or CAS number
 */
function searchEH40(substanceName, casNumber) {
    const normalizedName = normalizeSubstanceName(substanceName);
    const normalizedCAS = normalizeCASNumber(casNumber);

    // Try exact CAS match first (most reliable)
    if (normalizedCAS && normalizedCAS !== '-') {
        const casMatch = eh40Data.find(
            entry => normalizeCASNumber(entry.casNumber) === normalizedCAS
        );
        if (casMatch) {
            console.log(`EH40 match found by CAS: ${casMatch.substance}`);
            return { match: casMatch, matchType: 'CAS' };
        }
    }

    // Try exact substance name match
    if (normalizedName) {
        const exactMatch = eh40Data.find(
            entry => normalizeSubstanceName(entry.substance) === normalizedName
        );
        if (exactMatch) {
            console.log(`EH40 match found by exact name: ${exactMatch.substance}`);
            return { match: exactMatch, matchType: 'exact name' };
        }
    }

    // Try partial substance name match
    if (normalizedName && normalizedName.length > 3) {
        const partialMatch = eh40Data.find(entry => {
            const entryName = normalizeSubstanceName(entry.substance);
            return entryName.includes(normalizedName) || normalizedName.includes(entryName);
        });
        if (partialMatch) {
            console.log(`EH40 match found by partial name: ${partialMatch.substance}`);
            return { match: partialMatch, matchType: 'partial name' };
        }
    }

    return null;
}

/**
 * Show error message for EH40 data loading failure
 */
function showEH40Error(message) {
    const statusEl = safeGetElementById('welMatchStatus', false);
    if (statusEl) {
        statusEl.innerHTML = `
            <div class="error-message" style="margin-bottom: 10px;">${message}</div>
            <button type="button" class="secondary-button small" onclick="retryLoadEH40Data()" style="font-size: 12px;">
                🔄 Retry Loading EH40 Data
            </button>
        `;
    }
}

/**
 * Retry loading EH40 data (called from error UI)
 */
async function retryLoadEH40Data() {
    const statusEl = safeGetElementById('welMatchStatus', false);
    if (statusEl) {
        statusEl.textContent = 'Loading EH40 data...';
        statusEl.style.color = '#6c757d';
    }
    await loadEH40Data();
}

/**
 * Auto-fill WEL (Workplace Exposure Limit) values from EH40 data
 * Searches EH40 database by chemical name or CAS number and populates TWA/STEL fields
 * Updates status message to indicate match type or no match found
 * @returns {void}
 */
function autoFillWELValues() {
    const statusEl = safeGetElementById('welMatchStatus', false);

    // Check if data is loaded
    if (!eh40DataLoaded || eh40Data.length === 0) {
        console.warn('EH40 data not yet loaded');
        if (statusEl) {
            statusEl.textContent = 'Loading EH40 data...';
            statusEl.style.color = '#6c757d';
        }
        // Wait a bit and try again
        setTimeout(autoFillWELValues, 500);
        return;
    }

    const chemicalName = safeGetElementById('chemicalName', false)?.value || '';
    const casNumber = safeGetElementById('casNumber', false)?.value || '';

    console.log('autoFillWELValues called with:', {
        chemicalName,
        casNumber,
        dataLoaded: eh40Data.length,
    });

    if (!chemicalName && !casNumber) {
        console.log('No chemical name or CAS number to search');
        if (statusEl) {
            statusEl.textContent = 'Enter chemical name or CAS number';
            statusEl.style.color = '#6c757d';
        }
        return;
    }

    const result = searchEH40(chemicalName, casNumber);

    if (result && result.match) {
        const { match, matchType } = result;

        // Fill TWA values (LTE in EH40)
        const twaPPMEl = safeGetElementById('twaPPM', false);
        const twaMgM3El = safeGetElementById('twaMgM3', false);
        if (twaPPMEl && match.ltePPM && match.ltePPM !== '-') {
            twaPPMEl.value = match.ltePPM;
        }
        if (twaMgM3El && match.lteMgM3 && match.lteMgM3 !== '-') {
            twaMgM3El.value = match.lteMgM3;
        }

        // Fill STEL values (STE in EH40)
        const stelPPMEl = safeGetElementById('stelPPM', false);
        const stelMgM3El = safeGetElementById('stelMgM3', false);
        if (stelPPMEl && match.stePPM && match.stePPM !== '-') {
            stelPPMEl.value = match.stePPM;
        }
        if (stelMgM3El && match.steMgM3 && match.steMgM3 !== '-') {
            stelMgM3El.value = match.steMgM3;
        }

        // Update status message
        if (statusEl) {
            statusEl.textContent = `✓ Auto-filled from EH40 (matched by ${matchType}: ${match.substance})`;
            statusEl.style.color = '#28a745';
        }

        console.log('WEL values auto-filled from EH40 data');
    } else {
        // No match found
        if (statusEl) {
            statusEl.textContent = 'No match found in EH40 database';
            statusEl.style.color = '#6c757d';
        }
        console.log('No WEL match found in EH40 data');
    }
}
