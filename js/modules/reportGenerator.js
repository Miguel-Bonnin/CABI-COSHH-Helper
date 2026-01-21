/**
 * Report Generator Module
 * Generates COSHH assessment reports with modular section builders
 * @module reportGenerator
 */

/**
 * Builds the smart summary section showing key assessment details
 * @param {Object} data - Form data object
 * @param {string} data.activityDescription - Activity description
 * @param {string} data.chemicalName - Chemical name
 * @param {string} data.hPhrasesForm - H-phrases from form
 * @param {string} data.ppeSpecifyType - PPE specifications
 * @param {string} data.controlGroup - Control group/band
 * @returns {string} HTML string for smart summary section
 */
function buildSmartSummary(data) {
    const taskSummary = data.activityDescription || 'N/A';
    const chemicalSummary = data.chemicalName || 'N/A';

    // Determine hazard class summary from H-phrases
    let hazardClassSummary = 'N/A';
    const hPhrasesReport =
        data.hPhrasesForm ||
        window.masterParsedMSDSData?.hPhrases?.value ||
        '';

    if (hPhrasesReport) {
        const mainHPhrases = hPhrasesReport
            .toUpperCase()
            .split(/[,;\s]+/)
            .filter(Boolean);
        let classes = new Set();

        if (mainHPhrases.some((p) => p.startsWith('H22')))
            classes.add('Flammable');
        if (
            mainHPhrases.some(
                (p) =>
                    p.startsWith('H300') ||
                    p.startsWith('H310') ||
                    p.startsWith('H330')
            )
        )
            classes.add('Acutely Toxic (Fatal)');
        else if (
            mainHPhrases.some(
                (p) =>
                    p.startsWith('H301') ||
                    p.startsWith('H311') ||
                    p.startsWith('H331')
            )
        )
            classes.add('Acutely Toxic');
        if (
            mainHPhrases.some(
                (p) => p.startsWith('H314') || p.startsWith('H318')
            )
        )
            classes.add('Corrosive/Serious Eye Damage');
        else if (
            mainHPhrases.some(
                (p) => p.startsWith('H315') || p.startsWith('H319')
            )
        )
            classes.add('Irritant (Skin/Eye)');
        if (
            mainHPhrases.some(
                (p) => p.startsWith('H317') || p.startsWith('H334')
            )
        )
            classes.add('Sensitiser');
        if (
            mainHPhrases.some(
                (p) => p.startsWith('H350') || p.startsWith('H351')
            )
        )
            classes.add('Carcinogen');
        if (
            mainHPhrases.some(
                (p) => p.startsWith('H340') || p.startsWith('H341')
            )
        )
            classes.add('Mutagen');
        if (
            mainHPhrases.some(
                (p) => p.startsWith('H360') || p.startsWith('H361')
            )
        )
            classes.add('Reproductive Toxin');

        if (classes.size > 0) hazardClassSummary = [...classes].join(', ');
        else if (hPhrasesReport) hazardClassSummary = 'See H-Phrases';
    }

    // Build key controls summary
    let keyControlsSummary = [];
    const generalControls = Array.isArray(data.generalControl)
        ? data.generalControl
        : data.generalControl
          ? [data.generalControl]
          : [];
    const ppeControls = Array.isArray(data.ppeControl)
        ? data.ppeControl
        : data.ppeControl
          ? [data.ppeControl]
          : [];

    if (generalControls.length > 0) {
        generalControls.forEach((gcValue) => {
            const gcLabelEl = document.querySelector(
                `input[name="generalControl"][value="${gcValue}"]`
            );
            const gcLabel = gcLabelEl
                ? gcLabelEl.parentElement.textContent.trim().split('(')[0].trim()
                : gcValue;
            if (gcLabel) keyControlsSummary.push(gcLabel);
        });
    }
    if (ppeControls.length > 0) {
        ppeControls.forEach((ppeValue) => {
            const ppeLabelEl = document.querySelector(
                `input[name="ppeControl"][value="${ppeValue}"]`
            );
            const ppeLabel = ppeLabelEl
                ? ppeLabelEl.parentElement.textContent
                      .trim()
                      .split('(')[0]
                      .trim()
                : ppeValue;
            if (ppeLabel) keyControlsSummary.push(ppeLabel);
        });
    }
    if (
        data.ppeSpecifyType &&
        data.ppeSpecifyType.toLowerCase().includes('glove')
    )
        keyControlsSummary.push('Specific Gloves');
    if (
        data.ppeSpecifyType &&
        data.ppeSpecifyType.toLowerCase().includes('respiratory')
    )
        keyControlsSummary.push('Specific RPE');

    const controlGroupDet = data.controlGroup || 'N/A';
    const residualRiskSummary = `Control Approach ${controlGroupDet} (implies risk managed if controls implemented)`;

    return `<div class="smart-summary"><h4>Smart Summary</h4><p><strong>Task:</strong> ${taskSummary}</p><p><strong>Chemical:</strong> ${chemicalSummary}</p><p><strong>Interpreted Hazard Class(es):</strong> ${hazardClassSummary}</p><p><strong>Key Controls Required:</strong> ${keyControlsSummary.length > 0 ? keyControlsSummary.join(', ') : 'General lab precautions, specific PPE as per detailed assessment.'}</p><p><strong>Required Control Approach / Residual Risk Level:</strong> ${residualRiskSummary}</p></div>`;
}

/**
 * Builds the report header with logo and personnel information
 * @param {Object} data - Form data object
 * @returns {string} HTML string for report header
 */
function buildReportHeader(data) {
    return (
        `<div style="text-align:center; margin-bottom:10px;"><img src="https://www.cabi.org/wp-content/uploads/CABI-Logo_Accessible_RGB.png" alt="CABI Logo" class="report-logo"><h2 style="margin:0;">COSHH Assessment</h2></div>` +
        `<table class="report-table"><tr><td><strong>Carried Out By (Step 1):</strong> ${data.carriedOutBy || ''}</td><td><strong>Department:</strong> ${data.department || ''}</td><td><strong>Ref:</strong> ${data.ref || ''}</td></tr><tr><td><strong>Reviewed By (Steps 2 & 3):</strong> ${data.reviewedBy || ''}</td><td><strong>Signature:</strong> ${data.signatureReviewedBy || ''}</td><td><strong>Date:</strong> ${data.dateReviewedBy || ''}</td></tr></table>`
    );
}

/**
 * Builds Step 1 section: Process, Products & Hazards
 * @param {Object} data - Form data object
 * @returns {string} HTML string for Step 1 section
 */
function buildProcessHazardsSection(data) {
    // Build GHS pictogram display
    const ghsPictogramHTML =
        data.ghsPictogramForm && data.ghsPictogramForm.length > 0
            ? data.ghsPictogramForm
                  .map((pVal) => {
                      const parts = pVal.split('_');
                      const ghsCode = parts[0];
                      const text =
                          parts.length > 1 ? parts.slice(1).join(' ') : ghsCode;
                      let imgSrc = '';

                      // Map GHS codes to image sources
                      const ghsImageMap = {
                          GHS07: './ghs_exclam.svg',
                          GHS09: './ghs_environment.svg',
                          GHS06: './ghs_skull.svg',
                          GHS05: './ghs_corrosive.svg',
                          GHS02: './ghs_flammable.svg',
                          GHS03: './ghs_oxidising.svg',
                          GHS01: './ghs_explosive.svg',
                          GHS08: './ghs_health_hazard.svg',
                          GHS04: './ghs_gas_cylinder.svg'
                      };
                      imgSrc = ghsImageMap[ghsCode] || '';

                      return `<span style="border:1px solid #ccc; padding:2px; display:inline-flex; align-items:center; margin:2px;"><img src="${imgSrc}" alt="${ghsCode}" style="height:20px; margin-right:3px;"> ${text}</span>`;
                  })
                  .join(' ')
            : data.parsedRawPictograms
              ? `Parsed: ${data.parsedRawPictograms}`
              : 'None selected';

    // Get material type display text
    const materialTypeEl = document.getElementById('materialTypeForm');
    const materialTypeText = data.materialTypeForm
        ? materialTypeEl?.options[materialTypeEl.selectedIndex]?.text ||
          data.materialTypeForm
        : 'N/A';

    // Get frequency and duration display text
    const frequencyEl = document.getElementById('taskFrequency');
    const frequencyText = data.taskFrequency
        ? frequencyEl?.options[frequencyEl.selectedIndex]?.text ||
          data.taskFrequency
        : '';

    const durationEl = document.getElementById('taskDuration');
    const durationText = data.taskDuration
        ? durationEl?.options[durationEl.selectedIndex]?.text ||
          data.taskDuration
        : '';

    return (
        `<div class="report-section-title">Step 1 The Process, Product(s) & Hazards</div>` +
        `<table class="report-table"><tr><td colspan="3"><strong>Activity/Work Process, Product(s), Location:</strong><br>${data.activityDescription || ''}</td></tr>` +
        `<tr><td colspan="3"><strong>Who is exposed:</strong> ${data.whoExposed && data.whoExposed.includes('Employees') ? '☑ Employees' : '☐ Employees'} &nbsp; ${data.whoExposed && data.whoExposed.includes('Contractors') ? '☑ Contractors' : '☐ Contractors'} &nbsp; ${data.whoExposed && data.whoExposed.includes('Others') ? '☑ Others' : '☐ Others'}</td></tr>` +
        `<tr><td colspan="3"><strong>Material Type:</strong> ${materialTypeText}</td></tr>` +
        `<tr><td colspan="3"><strong>Hazards (New Symbols):</strong><br><div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:5px;">${ghsPictogramHTML}</div></td></tr>` +
        `<tr><td colspan="3"><strong>H-Statements (from MSDS):</strong><br>${data.hPhrasesForm || 'N/A'}</td></tr>` +
        `<tr><td><strong>WEL Assigned?</strong></td><td>STEL: ${data.stelPPM || ''} ppm / ${data.stelMgM3 || ''} mg/m³</td><td>TWA: ${data.twaPPM || ''} ppm / ${data.twaMgM3 || ''} mg/m³</td></tr>` +
        `<tr><td><strong>MSDS Attached?</strong> ${data.msdsAttached === 'on' ? '☑ Yes' : '☐ No'}</td><td colspan="2"><strong>Quantity/Duration/Frequency Summary:</strong><br>Qty: ${data.quantityValue || ''} ${data.quantityUnit || ''}; Freq: ${frequencyText}; Dur: ${durationText}</td></tr></table>`
    );
}

/**
 * Builds Step 2 section: Risk Assessment Evaluation
 * @param {Object} data - Form data object
 * @returns {string} HTML string for Step 2 section
 */
function buildRiskEvaluationSection(data) {
    return (
        `<div class="report-section-title">Step 2 The Risk Assessment Evaluation</div>` +
        `<table class="report-table">` +
        `<tr><th>Factor</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>S (Specialist)</th></tr>` +
        `<tr><td>Hazard Group</td><td>${data.hazardGroup === 'A' ? '☑' : '☐'}</td><td>${data.hazardGroup === 'B' ? '☑' : '☐'}</td><td>${data.hazardGroup === 'C' ? '☑' : '☐'}</td><td>${data.hazardGroup === 'D' ? '☑' : '☐'}</td><td>${data.hazardGroup === 'E' ? '☑' : '☐'}</td><td>${data.hazardGroup === 'S' ? '☑' : '☐'}</td></tr>` +
        `<tr><td>Quantity / Volume Group</td><td colspan="2" style="text-align:center;">Small ${data.quantityGroup === 'Small' ? '☑' : '☐'}</td><td colspan="2" style="text-align:center;">Medium ${data.quantityGroup === 'Medium' ? '☑' : '☐'}</td><td colspan="2" style="text-align:center;">Large ${data.quantityGroup === 'Large' ? '☑' : '☐'}</td></tr>` +
        `<tr><td>Physical Characteristics Group</td><td colspan="2" style="text-align:center;">Low ${data.physCharGroup === 'Low' ? '☑' : '☐'}</td><td colspan="2" style="text-align:center;">Medium ${data.physCharGroup === 'Medium' ? '☑' : '☐'}</td><td colspan="2" style="text-align:center;">High ${data.physCharGroup === 'High' ? '☑' : '☐'}</td></tr>` +
        `<tr><td><strong>Control Group Determined</strong></td><td>${data.controlGroup === '1' ? '☑' : '☐'} 1</td><td>${data.controlGroup === '2' ? '☑' : '☐'} 2</td><td>${data.controlGroup === '3' ? '☑' : '☐'} 3</td><td>${data.controlGroup === '4' ? '☑' : '☐'} 4</td><td colspan="2" style="text-align:center;">S ${data.controlGroup === 'S' ? '☑' : '☐'}</td></tr>` +
        `</table>`
    );
}

/**
 * Builds Step 3 section: Suitable Controls
 * @param {Object} data - Form data object
 * @returns {string} HTML string for Step 3 section
 */
function buildControlsSection(data) {
    const generalControls = Array.isArray(data.generalControl)
        ? data.generalControl
        : data.generalControl
          ? [data.generalControl]
          : [];
    const ppeControls = Array.isArray(data.ppeControl)
        ? data.ppeControl
        : data.ppeControl
          ? [data.ppeControl]
          : [];

    const gcGuidanceNo =
        document.getElementById('gcGuidanceSheetNo')?.textContent || 'N/A';
    const ppeGuidanceNo =
        document.getElementById('ppeGuidanceSheetNo')?.textContent || 'N/A';

    return (
        `<div class="report-section-title">Step 3 The Suitable Controls</div>` +
        `<table class="report-table"><tr><td><strong>Approval for use confirmed by:</strong> ${data.approvalConfirmedBy || ''}</td><td><strong>Date:</strong> ${data.approvalDate || ''}</td></tr></table>` +
        `<table class="report-table">` +
        `<tr><td colspan="2"><strong>General control measures (HSE Control Guidance Sheet No: ${gcGuidanceNo}):</strong></td></tr>` +
        `<tr><td colspan="2">${generalControls.includes('Ventilation100') ? '☑ General Ventilation' : '☐ General Ventilation'} &nbsp; ${generalControls.includes('LEV200_201') ? '☑ LEV' : '☐ LEV'} &nbsp; ${generalControls.includes('Containment300_301') ? '☑ Containment' : '☐ Containment'} &nbsp; ${generalControls.includes('Specialist400') ? '☑ Specialist' : '☐ Specialist'} &nbsp; ${generalControls.includes('AdditionalS100_S200') ? '☑ Additional' : '☐ Additional'}</td></tr>` +
        `<tr><td colspan="2"><strong>Personal Protective Equipment (HSE Control Guidance Sheet No: ${ppeGuidanceNo}):</strong></td></tr>` +
        `<tr><td colspan="2">${ppeControls.includes('Clothing100') ? '☑ Clothing' : '☐ Clothing'} &nbsp; ${ppeControls.includes('Gloves200_201') ? '☑ Gloves/Footwear' : '☐ Gloves/Footwear'} &nbsp; ${ppeControls.includes('Eye300_301') ? '☑ Eye Protection' : '☐ Eye Protection'} &nbsp; ${ppeControls.includes('Respiratory400') ? '☑ Respiratory' : '☐ Respiratory'} &nbsp; ${ppeControls.includes('OtherS100_S200') ? '☑ Other' : '☐ Other'}</td></tr>` +
        `<tr><td colspan="2"><strong>Specify type (PPE):</strong> <pre style="white-space: pre-wrap;">${data.ppeSpecifyType || ''}</pre></td></tr>` +
        `<tr><td><strong>Specific First Aid requirements?</strong></td><td><pre style="white-space: pre-wrap;">${data.firstAidReqs || ''}</pre></td></tr>` +
        `<tr><td><strong>Particular fire extinguisher requirements?</strong></td><td><pre style="white-space: pre-wrap;">${data.fireExtinguisherReqs || ''}</pre></td></tr>` +
        `<tr><td><strong>Accidental Release / Spillage requirements e.g. spill kit</strong></td><td><pre style="white-space: pre-wrap;">${data.spillReqs || ''}</pre></td></tr>` +
        `<tr><td><strong>Handling and storage requirements? Note any incompatibilities.</strong></td><td><pre style="white-space: pre-wrap;">${data.storageReqs || ''}</pre></td></tr>` +
        `<tr><td><strong>Disposal precautions? Note any incompatibilities.</strong></td><td><pre style="white-space: pre-wrap;">${data.disposalPrecautions || ''}</pre></td></tr>` +
        `<tr><td><strong>Particular Instruction and training needed on use?</strong></td><td><pre style="white-space: pre-wrap;">${data.trainingNeeded || ''}</pre></td></tr>` +
        `<tr><td><strong>Any specific symptoms to be aware of and to report?</strong></td><td><pre style="white-space: pre-wrap;">${data.symptomsToReport || ''}</pre></td></tr>` +
        `<tr><td><strong>Health Surveillance requirements?</strong></td><td><pre style="white-space: pre-wrap;">${data.healthSurveillance || ''}</pre></td></tr>` +
        `<tr><td><strong>Workplace and Personal Monitoring requirements?</strong></td><td><pre style="white-space: pre-wrap;">${data.workplaceMonitoring || ''}</pre></td></tr>` +
        `<tr><td><strong>Emergency Plans required or not?</strong></td><td><pre style="white-space: pre-wrap;">${data.emergencyPlans || ''}</pre></td></tr>` +
        `</table>`
    );
}

/**
 * Builds Step 4 section: Further Actions
 * @param {Object} data - Form data object
 * @returns {string} HTML string for Step 4 section
 */
function buildActionsSection(data) {
    return (
        `<div class="report-section-title">Step 4 Further Actions or Additional Measures Required</div>` +
        `<table class="report-table"><thead><tr><th>Actions / Measures Required</th><th>Who</th><th>When</th><th>Check</th></tr></thead><tbody>` +
        `<tr><td>${data.action_1_measure || ''}</td><td>${data.action_1_who || ''}</td><td>${data.action_1_when || ''}</td><td>${data.action_1_check || ''}</td></tr>` +
        `<tr><td>${data.action_2_measure || ''}</td><td>${data.action_2_who || ''}</td><td>${data.action_2_when || ''}</td><td>${data.action_2_check || ''}</td></tr>` +
        `<tr><td>${data.action_3_measure || ''}</td><td>${data.action_3_who || ''}</td><td>${data.action_3_when || ''}</td><td>${data.action_3_check || ''}</td></tr>` +
        `</tbody></table>`
    );
}

/**
 * Builds Step 5 section: Acknowledgement and Review
 * @param {Object} data - Form data object
 * @returns {string} HTML string for Step 5 section
 */
function buildAcknowledgementSection(data) {
    return (
        `<div class="report-section-title">Step 5 Acknowledgement and Review</div>` +
        `<table class="report-table">` +
        `<tr><td colspan="3">I declare that I have read, understood and been instructed in the measures to be applied and agree to abide by the findings.</td></tr>` +
        `<tr><td><strong>Name:</strong> ${data.finalReviewerName || ''}</td><td><strong>Signature:</strong> ${data.finalSignature || ''}</td><td><strong>Date:</strong> ${data.finalDateSigned || ''}</td></tr>` +
        `<tr><td colspan="3"><strong>Next Review Date:</strong> ${data.finalReviewDate || ''}</td></tr>` +
        `</table>` +
        `<div class="app-footer" style="font-size:0.8em; color:#333; background:none; border-top:1px solid #ccc; padding-top:10px; margin-top:20px;"><p>This assessment was generated using the CABI COSHH Helper (developed by J. Miguel Bonnin with AI assistance). This tool automates PDF parsing and provides an initial cautious risk assessment. <strong>Final checks and adjustments must be made by the Lab Manager and COSHH Assessor.</strong></p></div>`
    );
}

/**
 * Collects all form data into a structured object
 * @returns {Object} Form data object with all assessment fields
 */
function collectFormData() {
    const form = document.getElementById('coshhFullForm');
    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
        const element = form.elements[key];
        // Handle RadioNodeList (multiple elements with same name)
        if (element instanceof RadioNodeList) {
            const firstElement = element[0];
            if (firstElement && firstElement.type === 'checkbox') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else if (firstElement && firstElement.type === 'radio') {
                data[key] = value; // Radio buttons - only store checked value
            }
        } else if (element && element.type === 'checkbox') {
            if (!data[key]) data[key] = [];
            data[key].push(value);
        } else if (element && element.type === 'radio') {
            if (element.checked) data[key] = value;
        } else {
            data[key] = value;
        }
    });

    // Ensure radio button groups have values
    ['hazardGroup', 'quantityGroup', 'physCharGroup', 'controlGroup'].forEach(
        (groupName) => {
            if (!data[groupName])
                data[groupName] =
                    document.querySelector(
                        `input[name="${groupName}"]:checked`
                    )?.value || 'N/A';
        }
    );

    // Collect GHS pictograms
    data.ghsPictogramForm = Array.from(
        document.querySelectorAll('input[name="ghsPictogram"]:checked')
    ).map((cb) => cb.value);

    return data;
}

/**
 * Main report generation function
 * Orchestrates all section builders to create the complete report
 */
function generateFullReport() {
    console.log('generateFullReport called');

    // Step 1: Collect form data
    const data = collectFormData();

    // Step 2: Build all report sections
    const smartSummaryHTML = buildSmartSummary(data);
    const headerHTML = buildReportHeader(data);
    const processHazardsHTML = buildProcessHazardsSection(data);
    const riskEvaluationHTML = buildRiskEvaluationSection(data);
    const controlsHTML = buildControlsSection(data);
    const actionsHTML = buildActionsSection(data);
    const acknowledgementHTML = buildAcknowledgementSection(data);

    // Step 3: Assemble complete report
    const reportHTML =
        smartSummaryHTML +
        headerHTML +
        processHazardsHTML +
        riskEvaluationHTML +
        controlsHTML +
        actionsHTML +
        acknowledgementHTML;

    // Step 4: Display report
    const reportContentEl = document.getElementById('reportContent');
    if (reportContentEl) reportContentEl.innerHTML = reportHTML;

    const fullReportOutputEl = document.getElementById('fullReportOutput');
    if (fullReportOutputEl) fullReportOutputEl.style.display = 'block';

    // Navigate to output tab
    if (typeof openTab === 'function') {
        openTab(null, 'outputTab');
    }

    if (fullReportOutputEl)
        fullReportOutputEl.scrollIntoView({ behavior: 'smooth' });
}

// Export functions for use in HTML
window.reportGenerator = {
    generateFullReport,
    buildSmartSummary,
    buildReportHeader,
    buildProcessHazardsSection,
    buildRiskEvaluationSection,
    buildControlsSection,
    buildActionsSection,
    buildAcknowledgementSection,
    collectFormData
};

// Also export generateFullReport directly for backward compatibility
window.generateFullReport = generateFullReport;

export {
    generateFullReport,
    buildSmartSummary,
    buildReportHeader,
    buildProcessHazardsSection,
    buildRiskEvaluationSection,
    buildControlsSection,
    buildActionsSection,
    buildAcknowledgementSection,
    collectFormData
};
