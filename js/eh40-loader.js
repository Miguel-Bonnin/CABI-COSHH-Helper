/**
 * EH40 Workplace Exposure Limits Loader
 *
 * This module loads the HSE EH40 workplace exposure limits data from CSV
 * and provides functionality to match substances by name or CAS number,
 * automatically filling WEL (Workplace Exposure Limit) values.
 */

// Global variable to store EH40 data
let eh40Data = [];

/**
 * Load and parse the EH40 CSV data
 */
async function loadEH40Data() {
    try {
        const response = await fetch('data/eh40_table.csv');
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
                    steMgM3: values[5].trim()
                });
            }
        }

        console.log(`Loaded ${eh40Data.length} substances from EH40 database`);
        return true;
    } catch (error) {
        console.error('Error loading EH40 data:', error);
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
    return name.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
        .replace(/\s+/g, ' ')      // Normalize whitespace
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
        const casMatch = eh40Data.find(entry =>
            normalizeCASNumber(entry.casNumber) === normalizedCAS
        );
        if (casMatch) {
            console.log(`EH40 match found by CAS: ${casMatch.substance}`);
            return { match: casMatch, matchType: 'CAS' };
        }
    }

    // Try exact substance name match
    if (normalizedName) {
        const exactMatch = eh40Data.find(entry =>
            normalizeSubstanceName(entry.substance) === normalizedName
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
 * Auto-fill WEL values from EH40 data
 */
function autoFillWELValues() {
    const chemicalName = document.getElementById('chemicalName')?.value || '';
    const casNumber = document.getElementById('casNumber')?.value || '';

    if (!chemicalName && !casNumber) {
        console.log('No chemical name or CAS number to search');
        return;
    }

    const result = searchEH40(chemicalName, casNumber);
    const statusEl = document.getElementById('welMatchStatus');

    if (result && result.match) {
        const { match, matchType } = result;

        // Fill TWA values (LTE in EH40)
        const twaPPMEl = document.getElementById('twaPPM');
        const twaMgM3El = document.getElementById('twaMgM3');
        if (twaPPMEl && match.ltePPM && match.ltePPM !== '-') {
            twaPPMEl.value = match.ltePPM;
        }
        if (twaMgM3El && match.lteMgM3 && match.lteMgM3 !== '-') {
            twaMgM3El.value = match.lteMgM3;
        }

        // Fill STEL values (STE in EH40)
        const stelPPMEl = document.getElementById('stelPPM');
        const stelMgM3El = document.getElementById('stelMgM3');
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
