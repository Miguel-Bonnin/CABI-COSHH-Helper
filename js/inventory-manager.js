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
                throw new Error(`Client error ${response.status} for ${url}: ${response.statusText}`);
            }

            // Retry on 5xx errors (server errors - transient)
            if (response.status >= 500) {
                throw new Error(`Server error ${response.status} for ${url}: ${response.statusText}`);
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
    throw new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts. Last error: ${lastError.message}`);
}

/**
 * Load inventory and assessment data from JSON files
 */
async function loadInventoryData() {
    try {
        // Load chemical inventory with retry logic
        const invResponse = await fetchWithRetry('data/inventory/chemical-inventory.json');
        inventoryData = await invResponse.json();
        window.inventoryData = inventoryData; // Make globally accessible for floor-plan-viewer.js

        // Load assessment status with retry logic
        const statusResponse = await fetchWithRetry('data/tracking/assessment-status.json');
        assessmentStatus = await statusResponse.json();
        window.assessmentStatus = assessmentStatus; // Make globally accessible for floor-plan-viewer.js

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
    // Show hazard statements (H-codes) if available
    if (!statements || statements.length === 0) {
        return '<span style="color: #999;">Non-hazardous</span>';
    }

    // Display hazard statements as badges
    const badges = statements.slice(0, 5).map(h => `<span class="hazard-badge">${h}</span>`).join(' ');
    const more = statements.length > 5 ? `<br><small>+${statements.length - 5} more</small>` : '';

    return badges + more;
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

    // MSDS Download button (if substance has ID)
    if (item.substanceId) {
        buttons.push(`<button type="button" class="secondary-button small">📄 MSDS</button>`);
    }

    // View Details button
    buttons.push(`<button type="button" class="secondary-button small">Details</button>`);

    return buttons.join(' ');
}

/**
 * Create new assessment pre-filled with chemical data
 */
function createAssessmentFromInventory(chemicalId) {
    const chemical = inventoryData.inventory.find(c => c.id == chemicalId);
    if (!chemical) {
        console.error('Chemical not found:', chemicalId);
        return;
    }

    console.log('Creating assessment for:', chemical.name);

    // Switch to Substance & Task tab first
    const tabs = document.querySelectorAll('.tab-button');
    const substanceTab = Array.from(tabs).find(t => t.textContent.includes('Substance'));
    if (substanceTab) {
        substanceTab.click();
    }

    // Wait a tiny bit for tab to load, then pre-fill
    setTimeout(() => {
        // Pre-fill substance information
        const chemicalNameField = document.getElementById('chemicalName');
        const casNumberField = document.getElementById('casNumber');
        const supplierField = document.getElementById('supplier');
        const taskField = document.getElementById('taskDescriptionTextarea');

        if (chemicalNameField) chemicalNameField.value = chemical.name;
        if (casNumberField) casNumberField.value = chemical.casNumber || '';
        if (supplierField) supplierField.value = chemical.supplier || '';

        // Add location info to task description
        if (taskField) {
            const locationNote = chemical.location ? `\n\nInventory Location: ${chemical.location}` : '';
            const currentTask = taskField.value;
            if (!currentTask.includes('Inventory Location:')) {
                taskField.value = (currentTask ? currentTask : `Using chemical: ${chemical.name}`) + locationNote;
            }
        }

        // Store hazard data for later use
        if (chemical.hazardStatements && chemical.hazardStatements.length > 0) {
            window.inventoryHazardData = {
                chemicalId: chemicalId,
                hazardStatements: chemical.hazardStatements,
                ghsPictograms: chemical.hazards || []
            };
        }

        alert(`Assessment started for ${chemical.name}\n\nPre-filled:\n- Chemical Name\n- CAS Number: ${chemical.casNumber || 'N/A'}\n- Supplier: ${chemical.supplier || 'N/A'}\n${chemical.hazardStatements && chemical.hazardStatements.length > 0 ? '\n' + chemical.hazardStatements.length + ' hazard codes available' : ''}`);
    }, 100);
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

    // Set up event delegation for dynamically created buttons
    const tableBody = document.getElementById('inventoryTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', function(e) {
            const target = e.target;

            // Handle button clicks
            if (target.tagName === 'BUTTON') {
                const row = target.closest('tr');
                const chemicalId = row ? row.getAttribute('data-chemical-id') : null;

                if (!chemicalId) return;

                // Convert string ID to number if needed
                const id = isNaN(chemicalId) ? chemicalId : parseInt(chemicalId);

                if (target.textContent.includes('Create Assessment')) {
                    createAssessmentFromInventory(id);
                } else if (target.textContent.includes('View Assessment')) {
                    const chemical = filteredInventory.find(c => c.id == id);
                    if (chemical && chemical.assessmentStatus.assessmentFile) {
                        loadAssessmentFromInventory(chemical.assessmentStatus.assessmentFile);
                    }
                } else if (target.textContent.includes('MSDS') || target.textContent.includes('📄')) {
                    showMSDSFiles(id);
                } else if (target.textContent.includes('Details')) {
                    showChemicalDetails(id);
                }
            }
        });
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

/**
 * MSDS File Management
 */

// Configuration for MSDS proxy server
const MSDS_PROXY_URL = 'http://localhost:3000';

/**
 * Show available MSDS files for a chemical
 */
async function showMSDSFiles(chemicalId) {
    const chemical = inventoryData.inventory.find(c => c.id == chemicalId);
    if (!chemical || !chemical.substanceId) {
        alert('No substance ID found for this chemical. Cannot fetch MSDS files.');
        return;
    }

    try {
        // Show loading message
        const loadingMsg = `Fetching MSDS files for ${chemical.name}...\n\nNote: Make sure the MSDS proxy server is running:\nnode admin-scripts/msds-proxy.js`;
        console.log(loadingMsg);

        // Fetch linked files from proxy
        const response = await fetch(`${MSDS_PROXY_URL}/files?substanceId=${chemical.substanceId}`);

        if (!response.ok) {
            throw new Error(`Proxy server returned ${response.status}. Make sure it's running!`);
        }

        const files = await response.json();

        if (!files || files.length === 0) {
            alert(`No MSDS files found for ${chemical.name}\n\nThis chemical may not have any uploaded documents in ChemInventory.`);
            return;
        }

        // Show file selection dialog
        showMSDSFileDialog(chemical, files);

    } catch (error) {
        console.error('Error fetching MSDS files:', error);
        alert(`Failed to fetch MSDS files.\n\nError: ${error.message}\n\nMake sure the MSDS proxy server is running:\n  cd admin-scripts\n  node msds-proxy.js`);
    }
}

/**
 * Show MSDS file selection dialog
 */
function showMSDSFileDialog(chemical, files) {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = 'background: white; padding: 30px; border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';

    // Build file list
    const fileListHTML = files.map(file => `
        <div style="padding: 12px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${escapeHtml(file.name)}</strong><br>
                <small style="color: #666;">
                    Size: ${(file.size / 1024).toFixed(1)} KB |
                    Uploaded: ${file.dateuploaded}
                </small>
            </div>
            <button class="action-button small" onclick="downloadMSDSFile(${file.id}, '${escapeHtml(file.name).replace(/'/g, "\\'")}')">
                Download
            </button>
        </div>
    `).join('');

    dialog.innerHTML = `
        <h2 style="margin-top: 0;">MSDS Files for ${escapeHtml(chemical.name)}</h2>
        <p style="color: #666;">Found ${files.length} file(s) linked to this chemical:</p>
        <div style="margin: 20px 0;">
            ${fileListHTML}
        </div>
        <button class="secondary-button" onclick="this.closest('.msds-dialog-backdrop').remove()" style="margin-top: 20px;">
            Close
        </button>
    `;

    backdrop.className = 'msds-dialog-backdrop';
    backdrop.appendChild(dialog);
    backdrop.onclick = (e) => {
        if (e.target === backdrop) backdrop.remove();
    };

    document.body.appendChild(backdrop);
}

/**
 * Download MSDS file
 */
async function downloadMSDSFile(fileId, fileName) {
    try {
        console.log(`Downloading file ${fileId}: ${fileName}`);

        // Get download URL from proxy
        const response = await fetch(`${MSDS_PROXY_URL}/download?fileId=${fileId}`);

        if (!response.ok) {
            throw new Error(`Failed to get download URL`);
        }

        const data = await response.json();
        const downloadUrl = data.url;

        // Open in new tab
        window.open(downloadUrl, '_blank');

        alert(`MSDS file opened in new tab!\n\nFile: ${fileName}\n\nNote: The download link expires after 30 minutes.`);

    } catch (error) {
        console.error('Error downloading MSDS:', error);
        alert(`Failed to download MSDS file.\n\nError: ${error.message}`);
    }
}

// Make functions globally accessible for onclick handlers
window.downloadMSDSFile = downloadMSDSFile;
window.showMSDSFiles = showMSDSFiles;

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
