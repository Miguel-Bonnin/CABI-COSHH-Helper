/**
 * @fileoverview MSDS (Material Safety Data Sheet) parsing and data extraction
 * @module msdsParser
 *
 * Provides functions to parse MSDS documents (PDF or text) and extract
 * relevant hazard information for COSHH assessments. Uses regex patterns
 * to identify chemical names, CAS numbers, H-phrases, GHS pictograms,
 * and safety information sections.
 */

import { safeGetElementById } from './domHelpers.js';

/**
 * Stores the most recently parsed MSDS data
 * @type {Object}
 */
let masterParsedMSDSData = {};

/**
 * Gets the current parsed MSDS data
 * @returns {Object} The parsed MSDS data object
 */
export function getMasterParsedMSDSData() {
    return masterParsedMSDSData;
}

/**
 * Sets the master parsed MSDS data (for external updates)
 * @param {Object} data - The new parsed data object
 */
export function setMasterParsedMSDSData(data) {
    masterParsedMSDSData = data;
}

/**
 * H-phrase to GHS pictogram mapping
 * Used to infer pictograms when not explicitly stated in MSDS
 * @type {Object.<string, string>}
 */
const hPhraseToGHS = {
    // GHS08 - Health Hazard
    H350: 'GHS08',
    H351: 'GHS08',
    H340: 'GHS08',
    H341: 'GHS08', // Carcinogen, Mutagen
    H360: 'GHS08',
    H361: 'GHS08',
    H362: 'GHS08', // Reproductive toxicity
    H370: 'GHS08',
    H371: 'GHS08',
    H372: 'GHS08',
    H373: 'GHS08', // Organ toxicity
    H334: 'GHS08',
    H317: 'GHS08', // Respiratory/skin sensitization

    // GHS07 - Harmful/Irritant
    H302: 'GHS07',
    H312: 'GHS07',
    H332: 'GHS07', // Harmful
    H315: 'GHS07',
    H319: 'GHS07',
    H320: 'GHS07', // Irritant
    H335: 'GHS07',
    H336: 'GHS07',

    // GHS06 - Toxic
    H300: 'GHS06',
    H301: 'GHS06',
    H310: 'GHS06',
    H311: 'GHS06',
    H330: 'GHS06',
    H331: 'GHS06',

    // GHS05 - Corrosive
    H314: 'GHS05',
    H318: 'GHS05',

    // GHS02 - Flammable
    H220: 'GHS02',
    H221: 'GHS02',
    H222: 'GHS02',
    H223: 'GHS02',
    H224: 'GHS02',
    H225: 'GHS02',
    H226: 'GHS02',
    H228: 'GHS02',

    // GHS03 - Oxidizing
    H270: 'GHS03',
    H271: 'GHS03',
    H272: 'GHS03',

    // GHS01 - Explosive
    H200: 'GHS01',
    H201: 'GHS01',
    H202: 'GHS01',
    H203: 'GHS01',
    H204: 'GHS01',
    H205: 'GHS01',
    H240: 'GHS01',
    H241: 'GHS01',

    // GHS04 - Gas under pressure
    H280: 'GHS04',
    H281: 'GHS04',
    H282: 'GHS04',
    H283: 'GHS04',

    // GHS09 - Environmental
    H400: 'GHS09',
    H410: 'GHS09',
    H411: 'GHS09',
    H412: 'GHS09',
    H413: 'GHS09',
    H420: 'GHS09',
    H429: 'GHS09',
};

/**
 * Extracts a specific section from MSDS text
 * @param {string} text - Full MSDS text
 * @param {string[]} sectionKeywords - Keywords to identify section start
 * @param {string[]} stopKeywords - Keywords to identify section end
 * @returns {{value: string, confidence: string}} Extracted section with confidence
 */
function extractSection(
    text,
    sectionKeywords,
    stopKeywords = ['SECTION', '\\d{1,2}\\.\\s*(?:[A-Z][a-z]+|[A-Z]+(?:\\s+[A-Z]+)*)']
) {
    let sectionText = '';
    let confidence = 'low';
    const escapedSectionKeywords = sectionKeywords.map(kw =>
        kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/(\d+\.)/g, '$1\\s*')
    );
    const sectionStartRegexStr = `(?:${escapedSectionKeywords.join('|')})`;
    const sectionStartRegex = new RegExp(sectionStartRegexStr, 'im');

    const escapedStopKeywords = stopKeywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const nextSectionRegex = new RegExp(`(?:${escapedStopKeywords.join('|')})`, 'im');

    let sectionMatchResult = text.match(sectionStartRegex);
    let startIndex = -1;
    if (sectionMatchResult) {
        startIndex = sectionMatchResult.index + sectionMatchResult[0].length;
        confidence = 'medium';
    }

    if (startIndex !== -1) {
        let remainingText = text.substring(startIndex);
        let endIndexMatch = remainingText.match(nextSectionRegex);
        if (endIndexMatch) {
            sectionText = remainingText.substring(0, endIndexMatch.index);
            confidence = 'high';
        } else {
            sectionText = remainingText.substring(0, Math.min(remainingText.length, 5000));
        }
        sectionText = sectionText
            .replace(/^\s*[:\-.\s\n\r]+/, '')
            .replace(/\s+$/, '')
            .trim();
    }
    return {
        value: sectionText || 'Not clearly found in MSDS.',
        confidence:
            sectionText && sectionText !== 'Not clearly found in MSDS.' ? confidence : 'low',
    };
}

/**
 * Parses an uploaded PDF file to extract MSDS data
 * Uses PDF.js library to extract text, then processes with processMSDSText
 * @throws {Error} If PDF.js is not loaded or PDF parsing fails
 */
export async function parseUploadedMSDS() {
    console.log('parseUploadedMSDS called');
    const fileInput = safeGetElementById('msdsFile');
    const statusDiv = safeGetElementById('parserStatus');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        if (statusDiv) statusDiv.textContent = 'Please select an MSDS PDF file.';
        return;
    }
    const file = fileInput.files[0];
    if (statusDiv) statusDiv.textContent = `Processing ${file.name}...`;
    try {
        const arrayBuffer = await file.arrayBuffer();
        if (typeof pdfjsLib === 'undefined') {
            console.error('pdf.js is not loaded.');
            if (statusDiv) statusDiv.textContent = 'PDF library not loaded.';
            return;
        }
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        if (statusDiv) statusDiv.textContent = 'PDF text extracted. Now parsing...';
        processMSDSText(fullText);
    } catch (error) {
        console.error('Error parsing PDF:', error);
        if (statusDiv) {
            statusDiv.innerHTML = `<span class="error-message">❌ Could not parse PDF file. Please try:<br>
                (1) Check the file isn't corrupted<br>
                (2) Try pasting MSDS text instead<br>
                (3) Manually enter hazard information in Step 3</span>`;
        }
    }
}

/**
 * Parses pasted MSDS text
 * Reads text from the msdsTextPaste textarea and processes it
 */
export function parsePastedMSDS() {
    console.log('parsePastedMSDS called');
    const textEl = safeGetElementById('msdsTextPaste');
    const statusDiv = safeGetElementById('parserStatus');
    if (!textEl || !textEl.value.trim()) {
        if (statusDiv) statusDiv.textContent = 'Please paste text from MSDS.';
        return;
    }
    if (statusDiv) statusDiv.textContent = 'Parsing pasted text...';
    processMSDSText(textEl.value);
}

/**
 * Main MSDS text processing function
 * Extracts chemical name, CAS number, H-phrases, pictograms, and safety sections
 * @param {string} text - Raw MSDS text to parse
 */
export function processMSDSText(text) {
    console.log('processMSDSText called');
    masterParsedMSDSData = {}; // Reset
    const data = {};

    // 1. Chemical Name / Product Name (Enhanced for more precision)
    let chemicalNameValue = '';
    let chemicalNameConfidence = 'low';

    // Try specific keywords first
    let nameMatch = text.match(
        /(?:Product name|Substance name|Trade name|Chemical Name|Product Identifier)\s*[:\s]+([^\n\r]+?)(?:\s*Product number|\s*Brand|\s*CAS No\.?|\s*EC No\.|\s*Index No\.|\s*Unique Formula|\s*REACH|\n\n|$)/im
    );

    if (nameMatch && nameMatch[1].trim()) {
        chemicalNameValue = nameMatch[1].trim();
        // Filter out obvious non-names (P-phrases, codes, etc.)
        if (!chemicalNameValue.match(/^[PH]\d{3}/) && !chemicalNameValue.match(/^\d{4,}$/)) {
            chemicalNameConfidence = 'high';
        } else {
            chemicalNameValue = ''; // Reset if it's a P-phrase or code
        }
    }

    // Try Section 3 table
    if (!chemicalNameValue) {
        const section3Match = text.match(
            /SECTION 3[^]*?Chemical Name[^]*?(\w[\w\s\-(),.']+?)(?:\s+\d{2,7}-\d{2}-\d|\s+\d{3}-\d{3}-\d|\s+CAS|\s+EC|98-100|$)/im
        );
        if (section3Match && section3Match[1].trim()) {
            chemicalNameValue = section3Match[1].trim();
            chemicalNameConfidence = 'high';
        }
    }

    if (!chemicalNameValue) {
        // Fallback: Try to get capitalized line(s)
        nameMatch = text.match(
            /^\s*([A-Z][A-Za-z0-9\s\-(,).]+?)[\n\r]+\s*(?:1\.\d|SECTION 1|CAS|EC Number|Synonyms|Product number)/m
        );
        if (nameMatch && nameMatch[1].trim()) {
            chemicalNameValue = nameMatch[1].trim().split(/[\n\r]/)[0];
            chemicalNameConfidence = 'medium';
        } else {
            nameMatch = text.match(/^\s*([A-Z][A-Za-z0-9\s\-(),]{5,})/m);
            if (nameMatch && nameMatch[1].trim()) {
                chemicalNameValue = nameMatch[1].trim();
                chemicalNameConfidence = 'low';
            }
        }
    }
    // Clean up common prefixes
    chemicalNameValue = chemicalNameValue
        .replace(
            /^(?:Product name|Substance name|Trade name|Chemical Name|Product Identifier)\s*:\s*/i,
            ''
        )
        .trim();
    chemicalNameValue = chemicalNameValue.replace(/\s+(Not Applicable|N\/A)$/i, '').trim();
    data.chemicalName = {
        value: chemicalNameValue || 'Not clearly found',
        confidence: chemicalNameValue ? chemicalNameConfidence : 'low',
    };

    // 2. CAS Number (Enhanced with Section 3 table parsing)
    let casValue = '';
    let casConfidence = 'low';

    // Pattern 1: Look in Section 3 composition table (most reliable)
    const section3CasMatch = text.match(/SECTION 3[^]*?CAS No[^]*?(\d{2,7}-\d{2}-\d)/i);
    if (section3CasMatch && section3CasMatch[1]) {
        casValue = section3CasMatch[1].trim();
        casConfidence = 'high';
    }

    // Pattern 2: Specifically look for "CAS-No." or "CAS No."
    if (!casValue) {
        let casMatchSpecific = text.match(/CAS\s*-?\s*No\.?\s*:?\s*(\d{2,7}-\d{2}-\d)/i);
        if (casMatchSpecific && casMatchSpecific[1]) {
            casValue = casMatchSpecific[1].trim();
            casConfidence = 'high';
        }
    }

    // Pattern 3: More general pattern
    if (!casValue) {
        let casMatchGeneral = text.match(
            /(?:CAS\s*(?:–\s*No\.|Number|No\.?|-num|RN| Number:?)\s*:?\s*|Chemical Abstracts Service number\s*:\s*)\s*([\d\s–-]{4,12}\d)/i
        );
        if (casMatchGeneral && casMatchGeneral[1]) {
            casValue = casMatchGeneral[1].replace(/\s*–\s*/g, '-').replace(/\s+/g, '');
            if (casValue.match(/^\d{2,7}-\d{2}-\d$/)) {
                casConfidence = 'medium';
            } else {
                casValue = '';
                casConfidence = 'low';
            }
        }
    }

    // Fallback 4: Simplest pattern
    if (!casValue) {
        const earlyText = text.substring(0, 1500);
        let casMatchSimple = earlyText.match(/\b(\d{2,7}-\d{2}-\d)\b/);
        if (casMatchSimple && casMatchSimple[1]) {
            casValue = casMatchSimple[1];
            casConfidence = 'medium';
        }
    }
    data.casNumber = { value: casValue, confidence: casValue ? casConfidence : 'low' };

    // 3. Signal Word
    let signalMatch = text.match(/Signal Word\s*[:-]?\s*(Danger|Warning)/i);
    data.signalWord = {
        value: signalMatch ? signalMatch[1] : 'None',
        confidence: signalMatch ? 'high' : 'medium',
    };

    // 4. Pictograms (GHS Codes - From explicit codes OR inferred from H-phrases)
    let pictograms = new Set();
    const ghsCodeRegex = /\b(GHS\d{2})\b/gi;
    let pictogramMatch;
    while ((pictogramMatch = ghsCodeRegex.exec(text)) !== null) {
        pictograms.add(pictogramMatch[1].toUpperCase());
    }

    // If no explicit GHS codes found, infer from H-phrases
    let pictogramConfidence = pictograms.size > 0 ? 'high' : 'medium';
    if (pictograms.size === 0) {
        const hPhraseRegex = /\b(H\d{3}[A-Za-z+]*(?:\s*\+\s*H\d{3}[A-Za-z+]*)*)\b/gi;
        let tempHPhrases = new Set();
        let tempMatch;
        while ((tempMatch = hPhraseRegex.exec(text)) !== null) {
            tempHPhrases.add(tempMatch[1].replace(/\s/g, '').toUpperCase());
        }

        tempHPhrases.forEach(hPhrase => {
            const basePhrase = hPhrase.substring(0, 4);
            if (hPhraseToGHS[basePhrase]) {
                pictograms.add(hPhraseToGHS[basePhrase]);
            }
        });

        if (pictograms.size > 0) {
            pictogramConfidence = 'medium'; // Inferred from H-phrases
        } else {
            pictogramConfidence = 'low';
        }
    }

    data.parsedRawPictograms = {
        value: [...pictograms].join(', '),
        confidence: pictogramConfidence,
    };

    // 5. Hazard Statements (H-phrases)
    const hPhraseRegex = /\b(H\d{3}[A-Za-z+]*(?:\s*\+\s*H\d{3}[A-Za-z+]*)*)\b/gi;
    let hPhrases = new Set();
    let match;
    while ((match = hPhraseRegex.exec(text)) !== null) {
        hPhrases.add(match[1].replace(/\s/g, '').toUpperCase());
    }
    data.hPhrases = {
        value: [...hPhrases].join(', '),
        confidence: hPhrases.size > 0 ? 'high' : 'medium',
    };

    // 6. Precautionary Statements (P-phrases)
    const pPhraseRegex = /\b(P\d{3}[A-Za-z+]*(?:\s*\+\s*P\d{3}[A-Za-z+]*)*)\b/gi;
    let pPhrasesSet = new Set();
    while ((match = pPhraseRegex.exec(text)) !== null) {
        pPhrasesSet.add(match[1].replace(/\s/g, '').toUpperCase());
    }
    data.pPhrases = {
        value: [...pPhrasesSet].join(', '),
        confidence: pPhrasesSet.size > 0 ? 'high' : 'medium',
    };

    // 7. First Aid Measures (Section 4)
    data.firstAid = extractSection(
        text,
        ['SECTION 4', '4\\.\\s*First-?aid measures', 'First-?Aid Measures'],
        ['SECTION 5', '5\\.\\s*Fire-?fighting measures']
    );

    // 8. Handling and Storage (Section 7)
    data.handlingAndStorage = extractSection(
        text,
        ['SECTION 7', '7\\.\\s*Handling and storage', 'Handling and Storage'],
        ['SECTION 8', '8\\.\\s*Exposure controls']
    );

    // 9. Spill Procedures (Section 6)
    data.spillage = extractSection(
        text,
        ['SECTION 6', '6\\.\\s*Accidental release measures', 'Accidental Release Measures'],
        ['SECTION 7', '7\\.\\s*Handling and storage']
    );

    // 10. Disposal Methods (Section 13) - Targeted
    let disposalSection = extractSection(
        text,
        ['SECTION 13', '13\\.\\s*Disposal considerations', 'Disposal Considerations'],
        ['SECTION 14', '14\\.\\s*Transport information']
    );
    let actionableDisposal = 'Refer to full Section 13 of MSDS.';
    if (disposalSection.value && disposalSection.value !== 'Not clearly found in MSDS.') {
        const lines = disposalSection.value
            .split(/[\n\r]+/)
            .map(l => l.trim())
            .filter(l => l.length > 10);
        let relevantLines = lines.filter(
            l =>
                l.match(
                    /\b(dispose|disposal|waste|container|regulation|accordance|local|national|authority)\b/i
                ) && !l.match(/^\d{1,2}\.\d{1,2}/)
        );
        if (relevantLines.length > 0) {
            let priorityLines = relevantLines.filter(l =>
                l.match(/must be disposed|in accordance with|handle .* like the product/i)
            );
            if (priorityLines.length > 0) {
                actionableDisposal = priorityLines.slice(0, 3).join(' ');
            } else {
                actionableDisposal = relevantLines.slice(0, 3).join(' ');
            }
            if (actionableDisposal.length > 300)
                actionableDisposal =
                    actionableDisposal.substring(0, 300) + '... (see full section)';
        } else if (lines.length > 0) {
            actionableDisposal = lines.slice(0, 2).join(' ');
            if (actionableDisposal.length > 300)
                actionableDisposal =
                    actionableDisposal.substring(0, 300) + '... (see full section)';
        }
    }
    data.disposal = { value: actionableDisposal, confidence: disposalSection.confidence };

    masterParsedMSDSData = data;
    const msdsPreviewPaneEl = document.getElementById('msdsPreviewPane');
    if (msdsPreviewPaneEl) msdsPreviewPaneEl.style.display = 'block';
    displayParsePreview(masterParsedMSDSData);
    const parserStatusEl = document.getElementById('parserStatus');
    if (parserStatusEl) {
        const fieldsExtracted = Object.keys(data).filter(k => data[k]?.value && data[k].value !== 'Not clearly found' && data[k].value !== 'Not clearly found in MSDS.').length;
        parserStatusEl.innerHTML = `<span class="success-message">✅ MSDS parsing complete. Extracted ${fieldsExtracted} fields successfully. Please review and manually complete missing information.</span>`;
    }
}

/**
 * Displays parsed MSDS data in the preview table
 * Creates editable input fields for each extracted value
 * @param {Object} parsedData - The parsed MSDS data object
 */
export function displayParsePreview(parsedData) {
    const tableBody = document.querySelector('#parsePreviewTable tbody');
    if (!tableBody) {
        console.error('Preview table body not found');
        return;
    }
    tableBody.innerHTML = '';
    const previewFields = [
        'chemicalName',
        'casNumber',
        'signalWord',
        'parsedRawPictograms',
        'hPhrases',
        'pPhrases',
        'firstAid',
        'handlingAndStorage',
        'spillage',
        'disposal',
    ];
    previewFields.forEach(key => {
        if (parsedData[key]) {
            const item = parsedData[key];
            const row = tableBody.insertRow();
            row.insertCell().textContent = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
            const valueCell = row.insertCell();
            const isTextArea =
                item.value.length > 70 ||
                [
                    'firstAid',
                    'handlingAndStorage',
                    'spillage',
                    'disposal',
                    'hPhrases',
                    'pPhrases',
                ].includes(key);
            const valueInput = document.createElement(isTextArea ? 'textarea' : 'input');
            valueInput.type = isTextArea ? undefined : 'text';
            valueInput.value = item.value;
            valueInput.id = `preview_${key}`;
            valueInput.style.width = '95%';
            if (isTextArea) valueInput.rows = 3;
            valueCell.appendChild(valueInput);
            const confidenceCell = row.insertCell();
            confidenceCell.innerHTML = `<span class="confidence-marker confidence-${item.confidence}">${item.confidence.toUpperCase()}</span>`;
        }
    });
}

/**
 * Updates a confidence marker element with appropriate icon
 * @param {string} elementId - ID of the confidence marker element
 * @param {string} confidence - Confidence level: 'high', 'medium', or 'low'
 */
export function updateConfidenceMarker(elementId, confidence) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = confidence === 'high' ? '✅' : confidence === 'medium' ? '⚠️' : '❓';
        el.className = `confidence-marker confidence-${confidence}`;
        el.title = `Extraction confidence: ${confidence}`;
    }
}

/**
 * Applies parsed MSDS data to the form fields
 * Reads edited values from preview table, updates form fields, and triggers WEL auto-fill
 */
export function applyParsedDataToForm() {
    console.log('applyParsedDataToForm called');
    // Read any edits from preview table
    for (const key in masterParsedMSDSData) {
        const inputElement = document.getElementById(`preview_${key}`);
        if (inputElement) masterParsedMSDSData[key].value = inputElement.value;
    }

    // Apply Chemical Name
    const chemicalNameEl = document.getElementById('chemicalName');
    if (chemicalNameEl && masterParsedMSDSData.chemicalName) {
        chemicalNameEl.value = masterParsedMSDSData.chemicalName.value;
        updateConfidenceMarker(
            'chemicalNameConfidence',
            masterParsedMSDSData.chemicalName.confidence
        );
    }
    const activityDescEl = document.getElementById('activityDescription');
    if (
        activityDescEl &&
        masterParsedMSDSData.chemicalName?.value &&
        !activityDescEl.value.includes(masterParsedMSDSData.chemicalName.value)
    ) {
        activityDescEl.value = `Working with ${masterParsedMSDSData.chemicalName.value}. (Auto-filled, please complete/select procedure)`;
    }

    // Apply CAS Number
    const casNumberEl = document.getElementById('casNumber');
    if (casNumberEl && masterParsedMSDSData.casNumber) {
        casNumberEl.value = masterParsedMSDSData.casNumber.value;
    }

    // Apply Pictograms
    document.querySelectorAll('input[name="ghsPictogram"]').forEach(cb => (cb.checked = false));
    if (
        masterParsedMSDSData.parsedRawPictograms &&
        masterParsedMSDSData.parsedRawPictograms.value
    ) {
        const pictogramCodes = masterParsedMSDSData.parsedRawPictograms.value
            .split(',')
            .map(s => s.trim().toUpperCase());
        document.querySelectorAll('input[name="ghsPictogram"]').forEach(cb => {
            if (pictogramCodes.includes(cb.value.split('_')[0].toUpperCase())) {
                cb.checked = true;
            }
        });
        const parsedRawPictogramsEl = document.getElementById('parsedRawPictograms');
        if (parsedRawPictogramsEl)
            parsedRawPictogramsEl.value = masterParsedMSDSData.parsedRawPictograms.value;
        updateConfidenceMarker(
            'pictogramsConfidence',
            masterParsedMSDSData.parsedRawPictograms.confidence
        );
    } else {
        updateConfidenceMarker('pictogramsConfidence', 'low');
        const parsedRawPictogramsEl = document.getElementById('parsedRawPictograms');
        if (parsedRawPictogramsEl) parsedRawPictogramsEl.value = '';
    }

    // Apply H-Phrases
    const hPhrasesFormEl = document.getElementById('hPhrasesForm');
    if (hPhrasesFormEl && masterParsedMSDSData.hPhrases) {
        hPhrasesFormEl.value = masterParsedMSDSData.hPhrases.value;
        updateConfidenceMarker('hPhrasesConfidence', masterParsedMSDSData.hPhrases.confidence);
    }

    // Apply First Aid, Spillage, Disposal
    const firstAidReqsEl = document.getElementById('firstAidReqs');
    if (firstAidReqsEl && masterParsedMSDSData.firstAid) {
        firstAidReqsEl.value = masterParsedMSDSData.firstAid.value;
        updateConfidenceMarker('firstAidConfidence', masterParsedMSDSData.firstAid.confidence);
    }

    const spillReqsEl = document.getElementById('spillReqs');
    if (spillReqsEl && masterParsedMSDSData.spillage) {
        spillReqsEl.value = masterParsedMSDSData.spillage.value;
        updateConfidenceMarker('spillageConfidence', masterParsedMSDSData.spillage.confidence);
    }

    const disposalPrecautionsEl = document.getElementById('disposalPrecautions');
    if (disposalPrecautionsEl && masterParsedMSDSData.disposal) {
        disposalPrecautionsEl.value = masterParsedMSDSData.disposal.value;
        updateConfidenceMarker('disposalConfidence', masterParsedMSDSData.disposal.confidence);
    }

    // Apply Handling and Storage
    const handlingStorageEl = document.getElementById('storageReqs');
    if (handlingStorageEl && masterParsedMSDSData.handlingAndStorage) {
        handlingStorageEl.value = masterParsedMSDSData.handlingAndStorage.value;
    }

    // Trigger WEL auto-fill with parsed chemical name and CAS
    setTimeout(() => {
        if (typeof window.autoFillWELValues === 'function') {
            window.autoFillWELValues();
        }
    }, 100);

    alert('Parsed MSDS data applied. Please review and complete the form.');
    if (typeof window.openTab === 'function') {
        window.openTab(null, 'personnelTab');
    }
    if (typeof window.runFullRiskAssessmentLogic === 'function') {
        window.runFullRiskAssessmentLogic();
    }
}

// Export to window for backward compatibility with onclick handlers and other scripts
window.msdsParser = {
    parseUploadedMSDS,
    parsePastedMSDS,
    processMSDSText,
    displayParsePreview,
    applyParsedDataToForm,
    updateConfidenceMarker,
    getMasterParsedMSDSData,
    setMasterParsedMSDSData,
};

// Also export individual functions to window for direct access
window.parseUploadedMSDS = parseUploadedMSDS;
window.parsePastedMSDS = parsePastedMSDS;
window.processMSDSText = processMSDSText;
window.displayParsePreview = displayParsePreview;
window.applyParsedDataToForm = applyParsedDataToForm;
window.updateConfidenceMarker = updateConfidenceMarker;

// Export masterParsedMSDSData accessor to window for other scripts that reference it
Object.defineProperty(window, 'masterParsedMSDSData', {
    get: function () {
        return masterParsedMSDSData;
    },
    set: function (data) {
        masterParsedMSDSData = data;
    },
});
