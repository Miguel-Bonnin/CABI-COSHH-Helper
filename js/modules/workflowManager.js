/**
 * @fileoverview Workflow state management for COSHH assessments
 * @module workflowManager
 *
 * Provides status transition logic for the assessment approval workflow.
 * Implements a three-state workflow: draft -> under_review -> approved
 * with role-based permissions for each transition.
 *
 * Status transitions:
 * - draft -> under_review: Lab manager submits for review (requires assignedTo)
 * - under_review -> approved: Assessor approves the assessment
 * - under_review -> draft: Assessor requests changes (sends back to author)
 */

import {
    getCurrentUser,
    getUserById,
    hasPermission,
} from './userRoles.js';
import {
    getCurrentAssessmentMeta,
    setCurrentAssessmentMeta,
    saveLocally,
} from './formManager.js';

/**
 * Valid status transition map
 * Maps current status to array of allowed target statuses with required permissions
 * @constant {Object}
 */
const VALID_TRANSITIONS = {
    draft: [
        { target: 'under_review', permission: 'draft_assessment', requiresAssignment: true },
    ],
    under_review: [
        { target: 'approved', permission: 'approve', requiresAssignment: false },
        { target: 'draft', permission: 'approve', requiresAssignment: false },
    ],
    approved: [],
};

/**
 * Checks if a status transition is valid
 * @param {string} currentStatus - Current assessment status
 * @param {string} targetStatus - Target status to transition to
 * @returns {boolean} True if transition is allowed for current user
 */
export function canTransition(currentStatus, targetStatus) {
    const meta = getCurrentAssessmentMeta();
    const transitions = VALID_TRANSITIONS[currentStatus];

    if (!transitions || transitions.length === 0) {
        return false;
    }

    const transition = transitions.find(t => t.target === targetStatus);
    if (!transition) {
        return false;
    }

    // Check permission
    if (!hasPermission(transition.permission)) {
        return false;
    }

    // Check if assignment is required
    if (transition.requiresAssignment) {
        const assignedTo = meta?.assignedTo || document.getElementById('assignedToAssessor')?.value;
        if (!assignedTo) {
            return false;
        }
    }

    return true;
}

/**
 * Performs a status transition
 * @param {string} targetStatus - Target status to transition to
 * @returns {{success: boolean, error?: string}} Result of the transition
 */
export function transitionStatus(targetStatus) {
    const meta = getCurrentAssessmentMeta();
    const currentStatus = meta?.status || 'draft';
    const currentUser = getCurrentUser();

    // Validate transition
    if (!canTransition(currentStatus, targetStatus)) {
        let errorMessage = `Cannot transition from "${currentStatus}" to "${targetStatus}".`;

        // Provide more specific error message
        const transitions = VALID_TRANSITIONS[currentStatus];
        if (!transitions || transitions.length === 0) {
            errorMessage = `No transitions available from "${currentStatus}" status.`;
        } else {
            const transition = transitions.find(t => t.target === targetStatus);
            if (!transition) {
                errorMessage = `Invalid target status "${targetStatus}" from "${currentStatus}".`;
            } else if (!hasPermission(transition.permission)) {
                errorMessage = `You don't have permission to perform this action.`;
            } else if (transition.requiresAssignment) {
                errorMessage = `Please assign an assessor before submitting for review.`;
            }
        }

        console.warn(`[workflowManager] Transition blocked: ${errorMessage}`);
        return { success: false, error: errorMessage };
    }

    // Initialize statusHistory if needed
    if (!meta.statusHistory) {
        meta.statusHistory = [];
    }

    // Add history entry
    meta.statusHistory.push({
        from: currentStatus,
        to: targetStatus,
        by: currentUser.id,
        byName: currentUser.name,
        at: new Date().toISOString(),
    });

    // Update status
    meta.status = targetStatus;
    meta.lastModifiedBy = currentUser.id;
    meta.lastModifiedByName = currentUser.name;
    meta.lastModifiedAt = new Date().toISOString();

    // Update module state
    setCurrentAssessmentMeta(meta);

    // Persist changes
    saveLocally();

    console.log(`[workflowManager] Status transitioned: ${currentStatus} -> ${targetStatus} by ${currentUser.name}`);

    return { success: true };
}

/**
 * Gets available workflow actions for current status and user
 * @param {string} [status] - Status to check (defaults to current assessment status)
 * @returns {string[]} Array of available action identifiers
 */
export function getAvailableActions(status) {
    const meta = getCurrentAssessmentMeta();
    const currentStatus = status || meta?.status || 'draft';
    const actions = [];

    switch (currentStatus) {
        case 'draft':
            // Check if user can submit for review
            if (hasPermission('draft_assessment')) {
                const assignedTo = meta?.assignedTo || document.getElementById('assignedToAssessor')?.value;
                if (assignedTo) {
                    actions.push('submit_for_review');
                }
            }
            break;

        case 'under_review':
            // Check if user can approve or request changes
            if (hasPermission('approve')) {
                actions.push('approve');
                actions.push('request_changes');
            }
            break;

        case 'approved':
            // No actions available for approved assessments
            break;
    }

    return actions;
}

/**
 * Checks if the current assessment is read-only
 * Approved assessments cannot be edited
 * @returns {boolean} True if assessment is approved (read-only)
 */
export function isReadOnly() {
    const meta = getCurrentAssessmentMeta();
    return meta?.status === 'approved';
}

/**
 * Gets the status history for the current assessment
 * @returns {Array} Array of status history entries
 */
export function getStatusHistory() {
    const meta = getCurrentAssessmentMeta();
    return meta?.statusHistory || [];
}

/**
 * Gets display information for a status
 * @param {string} status - Status to get info for
 * @returns {{label: string, color: string, description: string}} Status display info
 */
export function getStatusInfo(status) {
    const statusMap = {
        draft: {
            label: 'Draft',
            color: '#ffc107',
            description: 'Assessment is being drafted. Complete all sections and submit for review.',
        },
        under_review: {
            label: 'Under Review',
            color: '#17a2b8',
            description: 'Awaiting review by COSHH Assessor.',
        },
        approved: {
            label: 'Approved',
            color: '#28a745',
            description: 'Assessment has been approved and is ready for use.',
        },
    };

    return statusMap[status] || { label: status, color: '#6c757d', description: '' };
}

// Export to window for backward compatibility with onclick handlers
window.workflowManager = {
    canTransition,
    transitionStatus,
    getAvailableActions,
    isReadOnly,
    getStatusHistory,
    getStatusInfo,
    VALID_TRANSITIONS,
};

// Also export individual functions to window for direct access
window.canTransition = canTransition;
window.transitionStatus = transitionStatus;
window.getAvailableActions = getAvailableActions;
window.isReadOnly = isReadOnly;
