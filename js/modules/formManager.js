/**
 * @fileoverview Form data management functions for COSHH assessments
 * @module formManager
 *
 * Provides save/load/export/import functionality for form data persistence.
 * Uses localStorage for local persistence and JSON for portable data exchange.
 *
 * === EDGE CASES ===
 *
 * EDGE CASE 1: LocalStorage quota exceeded (typically 5-10MB per origin)
 * Behavior: Throws QuotaExceededError, caught and prompts user to export JSON
 * Trigger: Saving many large assessments or very long text fields
 * User action: Export to JSON file instead for unlimited storage
 * Status: HANDLED (try/catch in saveLocally function)
 *
 * EDGE CASE 2: Multiple checkboxes with same name (e.g., whoExposed[])
 * Behavior: FormData collects as array, saved correctly to localStorage
 * Import: Must handle both array and single values for compatibility
 * Example: whoExposed: ["lab_staff", "maintenance"] → saved as array
 * Status: HANDLED (collectFormData checks for RadioNodeList and checkbox type)
 *
 * EDGE CASE 3: Importing JSON with missing or extra fields
 * Behavior: populateFormWithData skips fields not in current form
 * Rationale: Form schema may have changed between versions
 * User impact: Some data may not populate if field names changed
 * Status: GRACEFUL DEGRADATION (ignores unknown fields)
 *
 * EDGE CASE 4: File input fields (e.g., MSDS PDF upload)
 * Behavior: Only filename is saved, not file content
 * Limitation: File must be re-uploaded after load/import
 * Rationale: Storing binary file data would exceed localStorage quota
 * Status: BY DESIGN (file inputs store filename only as reference)
 *
 * EDGE CASE 5: Corrupted localStorage data (invalid JSON)
 * Behavior: JSON.parse throws error, caught and alerts user
 * User action: Prompted to clear corrupted data manually
 * Recovery: Data is lost, user must re-enter or import from JSON file
 * Status: HANDLED (try/catch in loadLocally function)
 */

// Import user role module for ownership tracking (Phase 5: Plan 03)
import { getCurrentUser } from './userRoles.js';

/**
 * LocalStorage key for saving form data
 * @type {string}
 */
const LOCAL_STORAGE_KEY = 'cabiCoshhDynamic_v5_msdsParseFix';

/**
 * Collects all form data into a structured object
 * Handles checkboxes, radio buttons, and standard inputs appropriately
 * Also adds _meta object with ownership and assignment tracking (Phase 5: Plan 03)
 * @param {HTMLFormElement} form - The form element to collect data from
 * @param {Object} [existingMeta] - Optional existing _meta from loaded data (preserves createdAt, createdBy)
 * @returns {Object} Form data as key-value pairs with _meta tracking
 */
function collectFormData(form, existingMeta) {
    const data = {};
    new FormData(form).forEach((value, key) => {
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
        } else if (element && element.type === 'file') {
            data[key] = value.name || null;
        } else {
            data[key] = value;
        }
    });

    // Add assessment metadata for ownership tracking (Phase 5: Plan 03)
    const currentUser = getCurrentUser();
    data._meta = {
        createdBy: existingMeta?.createdBy || currentUser.id,
        createdByName: existingMeta?.createdByName || currentUser.name,
        createdAt: existingMeta?.createdAt || new Date().toISOString(),
        lastModifiedBy: currentUser.id,
        lastModifiedByName: currentUser.name,
        lastModifiedAt: new Date().toISOString(),
        assignedTo: data.assignedToAssessor || null,
        status: existingMeta?.status || 'draft', // draft, under_review, approved
        version: (existingMeta?.version || 0) + 1
    };

    return data;
}

/**
 * Module-level variable to store current assessment metadata
 * Preserved across save/load cycles to maintain createdAt and createdBy
 * @type {Object|null}
 */
let currentAssessmentMeta = null;

/**
 * Gets the current assessment metadata (for external access)
 * @returns {Object|null} Current _meta object or null if no assessment loaded
 */
export function getCurrentAssessmentMeta() {
    return currentAssessmentMeta;
}

/**
 * Sets the current assessment metadata (for external access)
 * @param {Object|null} meta - The _meta object to set
 */
export function setCurrentAssessmentMeta(meta) {
    currentAssessmentMeta = meta;
}

/**
 * Saves the current form data to localStorage
 * Collects all form field values and persists them for later recovery
 * Preserves original creator and creation timestamp on subsequent saves
 * @throws {Error} If localStorage quota is exceeded
 */
export function saveLocally() {
    console.log('saveLocally called');
    const form = document.getElementById('coshhFullForm');
    if (!form) {
        console.error('saveLocally: coshhFullForm not found!');
        alert('Error: Form not found. Cannot save.');
        return;
    }

    const data = collectFormData(form, currentAssessmentMeta);

    // Update the module-level meta for subsequent saves
    currentAssessmentMeta = data._meta;

    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        alert('Form data saved locally!');
        console.log('[formManager] Saved with _meta:', data._meta);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        if (e.name === 'QuotaExceededError') {
            alert('Storage quota exceeded. Please export to JSON file instead.');
        } else {
            alert('Error saving data: ' + e.message);
        }
    }
}

/**
 * Loads previously saved form data from localStorage
 * Restores all form field values from the last saved state
 * Preserves _meta for ownership tracking (Phase 5: Plan 03)
 * Triggers risk assessment recalculation after loading
 */
export function loadLocally() {
    console.log('loadLocally: Attempting to load data.');
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            populateFormWithData(data);

            // Store _meta for preservation on subsequent saves (Phase 5: Plan 03)
            if (data._meta) {
                currentAssessmentMeta = data._meta;
                console.log('[formManager] Loaded _meta:', currentAssessmentMeta);
            }

            alert('Form data loaded from local storage!');
            // Trigger recalculation if the function exists in global scope
            if (typeof window.runFullRiskAssessmentLogic === 'function') {
                window.runFullRiskAssessmentLogic();
            }

            // Trigger metadata display if function exists (Phase 5: Plan 03)
            if (typeof window.displayAssessmentMetadata === 'function') {
                window.displayAssessmentMetadata();
            }
        } catch (e) {
            console.error('Error during loadLocally execution:', e);
            alert(
                'Error loading saved data. Data might be corrupted or incompatible. See console for details.'
            );
        }
    } else {
        console.log('loadLocally: No saved data found.');
        alert('No saved data found in local storage.');
    }
}

/**
 * Exports the current form data as a downloadable JSON file
 * Creates a timestamped filename for easy identification
 * Includes _meta with ownership tracking (Phase 5: Plan 03)
 */
export function exportToJson() {
    console.log('exportToJson called');
    const form = document.getElementById('coshhFullForm');
    if (!form) {
        console.error('exportToJson: coshhFullForm not found!');
        alert('Error: Form not found. Cannot export.');
        return;
    }

    const data = collectFormData(form, currentAssessmentMeta);

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cabi_coshh_dynamic_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Imports form data from a selected JSON file
 * Validates file type and parses JSON content
 * Preserves _meta for ownership tracking (Phase 5: Plan 03)
 * @throws {Error} If file is not valid JSON or wrong type
 */
export function importFromJsonFile() {
    console.log('importFromJsonFile called');
    const fileInput = document.getElementById('importFile');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('Please select a JSON file to import.');
        return;
    }
    const file = fileInput.files[0];

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        alert('Invalid file type. Please select a .json file.');
        fileInput.value = ''; // Clear the file input
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const importedDataString = event.target.result;
            const importedData = JSON.parse(importedDataString);

            populateFormWithData(importedData);

            // Store _meta for preservation on subsequent saves (Phase 5: Plan 03)
            if (importedData._meta) {
                currentAssessmentMeta = importedData._meta;
                console.log('[formManager] Imported _meta:', currentAssessmentMeta);
            }

            alert('COSHH Assessment data imported successfully!');
            // Trigger recalculation and navigate to first tab
            if (typeof window.runFullRiskAssessmentLogic === 'function') {
                window.runFullRiskAssessmentLogic();
            }
            if (typeof window.openTab === 'function') {
                window.openTab(null, 'personnelTab');
            }

            // Trigger metadata display if function exists (Phase 5: Plan 03)
            if (typeof window.displayAssessmentMetadata === 'function') {
                window.displayAssessmentMetadata();
            }
        } catch (e) {
            console.error('Error parsing JSON file or populating form:', e);
            alert(
                "Error importing file. Ensure it's a valid COSHH JSON export from this tool. " +
                    e.message
            );
        } finally {
            fileInput.value = ''; // Clear the file input after processing
        }
    };

    reader.onerror = function () {
        alert('Error reading the file.');
        fileInput.value = ''; // Clear the file input
    };

    reader.readAsText(file);
}

/**
 * Populates form fields with data from an object
 * Handles various input types including checkboxes, radio buttons, selects, and textareas
 * @param {Object} data - Key-value pairs of form data
 */
export function populateFormWithData(data) {
    console.log('populateFormWithData called with data:', data);
    const form = document.getElementById('coshhFullForm');
    if (!form) {
        console.error('populateFormWithData: coshhFullForm not found!');
        return;
    }

    // Reset the form first to clear previous values
    Array.from(form.elements).forEach(element => {
        if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = false;
        } else if (
            element.type !== 'file' &&
            element.type !== 'button' &&
            element.type !== 'submit' &&
            element.type !== 'reset'
        ) {
            element.value = '';
        }
    });

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const formElementOrGroup = form.elements[key];

            if (formElementOrGroup) {
                if (formElementOrGroup instanceof RadioNodeList) {
                    // Radio buttons or named checkbox groups
                    const elements = Array.from(formElementOrGroup);
                    if (elements.length > 0 && elements[0].type === 'radio') {
                        elements.forEach(radio => {
                            radio.checked = radio.value === data[key];
                        });
                    } else if (elements.length > 0 && elements[0].type === 'checkbox') {
                        // Checkbox group
                        const groupValues = Array.isArray(data[key])
                            ? data[key]
                            : data[key]
                              ? [data[key]]
                              : [];
                        elements.forEach(checkbox => {
                            checkbox.checked = groupValues.includes(checkbox.value);
                        });
                    }
                } else if (formElementOrGroup instanceof HTMLInputElement) {
                    if (formElementOrGroup.type === 'checkbox') {
                        // Single checkbox
                        formElementOrGroup.checked =
                            data[key] === formElementOrGroup.value ||
                            data[key] === true ||
                            String(data[key]).toLowerCase() === 'on';
                    } else if (formElementOrGroup.type === 'file') {
                        // Cannot set file input value programmatically for security reasons
                    } else {
                        formElementOrGroup.value = data[key] || '';
                    }
                } else if (formElementOrGroup instanceof HTMLSelectElement) {
                    formElementOrGroup.value = data[key] || '';
                } else if (formElementOrGroup instanceof HTMLTextAreaElement) {
                    formElementOrGroup.value = data[key] || '';
                }
            }
        }
    }

    // Special handling for parsedRawPictograms as it's a hidden field driving visible checkboxes
    if (data.parsedRawPictograms) {
        const pictogramCodes = String(data.parsedRawPictograms)
            .split(',')
            .map(s => s.trim().toUpperCase());
        document.querySelectorAll('input[name="ghsPictogram"]').forEach(cb => {
            cb.checked = pictogramCodes.includes(cb.value.split('_')[0].toUpperCase());
        });
        const parsedRawPictogramsEl = document.getElementById('parsedRawPictograms');
        if (parsedRawPictogramsEl) parsedRawPictogramsEl.value = data.parsedRawPictograms;
    }
    console.log('Form population complete.');
}

// Export to window for backward compatibility with onclick handlers
window.formManager = {
    saveLocally,
    loadLocally,
    exportToJson,
    importFromJsonFile,
    populateFormWithData,
    getCurrentAssessmentMeta,
    setCurrentAssessmentMeta,
};

// Also export individual functions to window for direct access
window.saveLocally = saveLocally;
window.loadLocally = loadLocally;
window.exportToJson = exportToJson;
window.importFromJsonFile = importFromJsonFile;
window.populateFormWithData = populateFormWithData;
window.getCurrentAssessmentMeta = getCurrentAssessmentMeta;
window.setCurrentAssessmentMeta = setCurrentAssessmentMeta;
