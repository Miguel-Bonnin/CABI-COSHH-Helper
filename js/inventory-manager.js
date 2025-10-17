/**
 * Chemical Inventory & Assessment Tracking
 *
 * Manages display and interaction with chemical inventory data
 * and COSHH assessment status tracking.
 */

// Global inventory data
let inventoryData = null;
let assessmentStatus = null;
let filteredInventory = [];

/**
 * Load inventory and assessment data from JSON files
 */
async function loadInventoryData() {
    try {
        // Load chemical inventory
        const invResponse = await fetch('data/inventory/chemical-inventory.json');
        if (!invResponse.ok) throw new Error('Failed to load inventory');
        inventoryData = await invResponse.json();

        // Load assessment status
        const statusResponse = await fetch('data/tracking/assessment-status.json');
        if (!statusResponse.ok) throw new Error('Failed to load assessment status');
        assessmentStatus = await statusResponse.json();

        return true;
    } catch (error) {
        console.error('Error loading inventory data:', error);
        showInventoryError('Failed to load inventory data. Make sure data files are available.');
        return false;
    }
}

/**
 * Initialize inventory display when tab is opened
 */
async function initializeInventory() {
    const success = await loadInventoryData();
    if (success) {
        updateInventoryStats();
        renderInventoryTable();
        setupInventoryEventListeners();
    }
}

/**
 * Update statistics cards at top of inventory page
 */
function updateInventoryStats() {
    if (!assessmentStatus) return;

    const stats = {
        total: inventoryData.totalChemicals,
        complete: 0,
        inProgress: 0,
        needsAssessment: 0,
        reviewDue: 0,
        notRequired: 0
    };

    // Count by status
    assessmentStatus.assessments.forEach(assessment => {
        if (assessment.status === 'complete') {
            // Check if review is overdue
            if (assessment.reviewDueDate && new Date(assessment.reviewDueDate) < new Date()) {
                stats.reviewDue++;
            } else {
                stats.complete++;
            }
        } else if (assessment.status === 'in_progress') {
            stats.inProgress++;
        } else if (assessment.status === 'needs_assessment') {
            stats.needsAssessment++;
        } else if (assessment.status === 'not_required') {
            stats.notRequired++;
        }
    });

    // Update DOM
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statComplete').textContent = stats.complete;
    document.getElementById('statInProgress').textContent = stats.inProgress;
    document.getElementById('statNeedsAssessment').textContent = stats.needsAssessment;
    document.getElementById('statReviewDue').textContent = stats.reviewDue;
}

/**
 * Render the inventory table
 */
function renderInventoryTable() {
    if (!inventoryData || !assessmentStatus) return;

    const tbody = document.getElementById('inventoryTableBody');
    const searchTerm = document.getElementById('inventorySearch')?.value.toLowerCase() || '';
    const filterStatus = document.getElementById('inventoryFilter')?.value || 'all';

    // Merge inventory with assessment status
    const mergedData = inventoryData.inventory.map(chemical => {
        const status = assessmentStatus.assessments.find(a => a.chemicalId === chemical.id) || {
            chemicalId: chemical.id,
            chemicalName: chemical.name,
            status: 'needs_assessment',
            assessmentFile: null,
            assessedBy: null,
            assessmentDate: null,
            reviewDueDate: null,
            notes: ''
        };
        return { ...chemical, assessmentStatus: status };
    });

    // Apply filters
    filteredInventory = mergedData.filter(item => {
        // Search filter
        const matchesSearch = !searchTerm ||
            item.name.toLowerCase().includes(searchTerm) ||
            (item.casNumber && item.casNumber.includes(searchTerm)) ||
            (item.location && item.location.toLowerCase().includes(searchTerm)) ||
            (item.sublocation && item.sublocation.toLowerCase().includes(searchTerm));

        // Status filter
        let statusMatch = filterStatus === 'all';
        if (!statusMatch) {
            if (filterStatus === 'review_due' && item.assessmentStatus.reviewDueDate) {
                statusMatch = new Date(item.assessmentStatus.reviewDueDate) < new Date();
            } else {
                statusMatch = item.assessmentStatus.status === filterStatus;
            }
        }

        return matchesSearch && statusMatch;
    });

    // Render rows
    if (filteredInventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px;">No chemicals found matching filters.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredInventory.map(item => {
        const status = item.assessmentStatus;
        const isReviewDue = status.reviewDueDate && new Date(status.reviewDueDate) < new Date();
        const displayStatus = isReviewDue ? 'review_due' : status.status;

        return `
            <tr data-chemical-id="${item.id}">
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>${item.casNumber || '-'}</td>
                <td>${item.location || '-'}${item.sublocation ? '<br><small>' + item.sublocation + '</small>' : ''}</td>
                <td>${renderHazardBadges(item.hazards, item.hazardStatements)}</td>
                <td>${renderStatusBadge(displayStatus)}</td>
                <td>${status.assessedBy || '-'}</td>
                <td>${status.reviewDueDate ? formatDate(status.reviewDueDate) : '-'}</td>
                <td>${renderActionButtons(item)}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Render hazard badges
 */
function renderHazardBadges(hazards, statements) {
    if (!hazards || hazards.length === 0) {
        return '<span style="color: #999;">Non-hazardous</span>';
    }

    const badges = hazards.map(h => `<span class="hazard-badge">${h}</span>`).join(' ');
    const stmts = statements && statements.length > 0 ?
        `<br><small>${statements.slice(0, 3).join(', ')}${statements.length > 3 ? '...' : ''}</small>` : '';

    return badges + stmts;
}

/**
 * Render status badge
 */
function renderStatusBadge(status) {
    const badges = {
        'complete': '<span class="status-badge status-complete">✓ Complete</span>',
        'in_progress': '<span class="status-badge status-in-progress">⏳ In Progress</span>',
        'needs_assessment': '<span class="status-badge status-needs">⚠ Needs Assessment</span>',
        'not_required': '<span class="status-badge status-not-required">- Not Required</span>',
        'review_due': '<span class="status-badge status-review-due">📅 Review Due</span>'
    };
    return badges[status] || badges['needs_assessment'];
}

/**
 * Render action buttons for each chemical
 */
function renderActionButtons(item) {
    const status = item.assessmentStatus.status;
    const isReviewDue = item.assessmentStatus.reviewDueDate &&
                        new Date(item.assessmentStatus.reviewDueDate) < new Date();

    let buttons = [];

    // Create/Edit Assessment button
    if (status === 'needs_assessment' || status === 'in_progress' || isReviewDue) {
        buttons.push(`<button type="button" class="action-button small" onclick="createAssessmentFromInventory('${item.id}')">Create Assessment</button>`);
    }

    // View Assessment button
    if (status === 'complete' && item.assessmentStatus.assessmentFile) {
        buttons.push(`<button type="button" class="secondary-button small" onclick="loadAssessmentFromInventory('${item.assessmentStatus.assessmentFile}')">View Assessment</button>`);
    }

    // View Details button
    buttons.push(`<button type="button" class="secondary-button small" onclick="showChemicalDetails('${item.id}')">Details</button>`);

    return buttons.join(' ');
}

/**
 * Create new assessment pre-filled with chemical data
 */
function createAssessmentFromInventory(chemicalId) {
    const chemical = inventoryData.inventory.find(c => c.id === chemicalId);
    if (!chemical) return;

    // Pre-fill substance information
    document.getElementById('substanceName').value = chemical.name;
    document.getElementById('casNumber').value = chemical.casNumber || '';
    document.getElementById('supplier').value = chemical.supplier || '';

    if (chemical.molecularFormula) {
        document.getElementById('chemicalFormula').value = chemical.molecularFormula;
    }

    // Add note about inventory source
    const locationNote = chemical.location ? ` (Inventory location: ${chemical.location}${chemical.sublocation ? ' - ' + chemical.sublocation : ''})` : '';
    const currentTask = document.getElementById('taskDescription').value;
    if (!currentTask.includes('Inventory location:')) {
        document.getElementById('taskDescription').value =
            (currentTask ? currentTask + '\n\n' : '') +
            `Chemical from inventory: ${chemical.name}${locationNote}`;
    }

    // If hazard data is available, suggest pre-filling hazards
    if (chemical.hazardStatements && chemical.hazardStatements.length > 0) {
        alert(`This chemical has ${chemical.hazardStatements.length} hazard statement(s) from inventory. These will be available in the Hazards tab.`);

        // Store for use in hazards tab
        window.inventoryHazardData = {
            chemicalId: chemicalId,
            hazardStatements: chemical.hazardStatements,
            ghsPictograms: chemical.hazards
        };
    }

    // Switch to Personnel tab to start assessment
    const tabs = document.querySelectorAll('.tab-button');
    const personnelTab = Array.from(tabs).find(t => t.textContent.includes('Personnel'));
    if (personnelTab) {
        personnelTab.click();
    }

    alert(`Assessment started for ${chemical.name}. The substance information has been pre-filled from inventory.`);
}

/**
 * Load existing assessment
 */
async function loadAssessmentFromInventory(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Assessment file not found');

        const assessmentData = await response.json();

        // Use existing import functionality
        if (typeof importFromJsonData === 'function') {
            importFromJsonData(assessmentData);
            alert('Assessment loaded successfully!');
        } else {
            alert('Assessment data:\n' + JSON.stringify(assessmentData, null, 2));
        }
    } catch (error) {
        alert('Failed to load assessment: ' + error.message);
    }
}

/**
 * Show detailed chemical information in modal/alert
 */
function showChemicalDetails(chemicalId) {
    const chemical = inventoryData.inventory.find(c => c.id === chemicalId);
    if (!chemical) return;

    const status = assessmentStatus.assessments.find(a => a.chemicalId === chemicalId);

    const details = `
Chemical Details:

Name: ${chemical.name}
CAS Number: ${chemical.casNumber || 'N/A'}
Molecular Formula: ${chemical.molecularFormula || 'N/A'}
Molecular Weight: ${chemical.molecularWeight || 'N/A'}
Supplier: ${chemical.supplier || 'N/A'}

Location: ${chemical.location || 'N/A'}
Sublocation: ${chemical.sublocation || 'N/A'}
Barcode: ${chemical.barcode || 'N/A'}

Size: ${chemical.size || 'N/A'} ${chemical.units || ''}
Acquisition Date: ${chemical.acquisitionDate || 'N/A'}

Hazards: ${chemical.hazards && chemical.hazards.length > 0 ? chemical.hazards.join(', ') : 'None'}
Hazard Statements: ${chemical.hazardStatements && chemical.hazardStatements.length > 0 ? chemical.hazardStatements.join(', ') : 'None'}

Comments: ${chemical.comments || 'None'}

Assessment Status: ${status?.status || 'Unknown'}
${status?.assessedBy ? 'Assessed By: ' + status.assessedBy : ''}
${status?.assessmentDate ? 'Assessment Date: ' + status.assessmentDate : ''}
${status?.notes ? 'Notes: ' + status.notes : ''}
    `.trim();

    alert(details);
}

/**
 * Refresh inventory data from server
 */
async function refreshInventoryData() {
    const refreshBtn = event?.target;
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '⏳ Refreshing...';
    }

    await loadInventoryData();
    updateInventoryStats();
    renderInventoryTable();

    if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Refresh Data';
    }

    alert('Inventory data refreshed!');
}

/**
 * Setup event listeners for search and filter
 */
function setupInventoryEventListeners() {
    const searchInput = document.getElementById('inventorySearch');
    const filterSelect = document.getElementById('inventoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', renderInventoryTable);
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', renderInventoryTable);
    }
}

/**
 * Show error message in inventory table
 */
function showInventoryError(message) {
    const tbody = document.getElementById('inventoryTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: #d32f2f;">${escapeHtml(message)}</td></tr>`;
    }
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Utility: Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Initialize when inventory tab is first opened
document.addEventListener('DOMContentLoaded', function() {
    // Override openTab function to initialize inventory on first open
    const originalOpenTab = window.openTab;
    window.openTab = function(event, tabName) {
        if (tabName === 'inventoryTab' && !inventoryData) {
            initializeInventory();
        }
        if (originalOpenTab) {
            originalOpenTab(event, tabName);
        }
    };
});
