/**
 * @fileoverview User role management for COSHH assessment simulation
 * @module userRoles
 *
 * Provides mock user roles and permissions for demonstrating role-based
 * workflow simulation. This is a frontend-only implementation using
 * localStorage for persistence - not a real authentication system.
 *
 * Role types:
 * - lab_manager: Can draft assessments, view own assessments
 * - coshh_assessor: Can review/edit all assessments, approve assessments
 * - admin: Full access to all features, manage users (mock)
 */

/**
 * Role definitions with display names and descriptions
 * @constant {Object}
 */
export const ROLES = {
    lab_manager: {
        id: 'lab_manager',
        displayName: 'Lab Manager',
        description: 'Can draft assessments and view own assessments',
        permissions: ['draft_assessment', 'edit_own']
    },
    coshh_assessor: {
        id: 'coshh_assessor',
        displayName: 'COSHH Assessor',
        description: 'Can review/edit all assessments and approve them',
        permissions: ['draft_assessment', 'edit_own', 'review_any', 'approve']
    },
    admin: {
        id: 'admin',
        displayName: 'Administrator',
        description: 'Full access to all features including user management',
        permissions: ['draft_assessment', 'edit_own', 'review_any', 'approve', 'admin']
    }
};

/**
 * Mock user profiles for demonstration
 * @constant {Array<Object>}
 */
export const mockUsers = [
    {
        id: 'u1',
        name: 'Sarah Johnson',
        email: 'sarah.j@cabi.org',
        role: 'lab_manager',
        department: 'Molecular Biology'
    },
    {
        id: 'u2',
        name: 'James Chen',
        email: 'james.c@cabi.org',
        role: 'lab_manager',
        department: 'Plant Pathology'
    },
    {
        id: 'u3',
        name: 'Dr. Emily Roberts',
        email: 'emily.r@cabi.org',
        role: 'coshh_assessor',
        department: 'Health & Safety'
    },
    {
        id: 'u4',
        name: 'Michael Thompson',
        email: 'michael.t@cabi.org',
        role: 'coshh_assessor',
        department: 'Health & Safety'
    },
    {
        id: 'u5',
        name: 'Dr. Amanda Lewis',
        email: 'amanda.l@cabi.org',
        role: 'admin',
        department: 'Operations'
    }
];

/**
 * LocalStorage key for current user persistence
 * @constant {string}
 */
const CURRENT_USER_KEY = 'cabiCoshh_currentUser';

/**
 * Gets the default user (first lab manager)
 * @returns {Object} Default user profile
 */
export function getDefaultUser() {
    const labManager = mockUsers.find(u => u.role === 'lab_manager');
    return labManager || mockUsers[0];
}

/**
 * Gets a user profile by ID
 * @param {string} userId - The user ID to look up
 * @returns {Object|null} User profile if found, null otherwise
 */
export function getUserById(userId) {
    return mockUsers.find(u => u.id === userId) || null;
}

/**
 * Gets the current user from localStorage
 * Falls back to default user if no user is stored
 * @returns {Object} Current user profile
 */
export function getCurrentUser() {
    const storedUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUserId) {
        const user = getUserById(storedUserId);
        if (user) {
            return user;
        }
    }
    // Initialize with default user if none stored or invalid
    const defaultUser = getDefaultUser();
    localStorage.setItem(CURRENT_USER_KEY, defaultUser.id);
    return defaultUser;
}

/**
 * Sets the current user and persists to localStorage
 * @param {string} userId - The user ID to set as current
 * @returns {Object|null} The new current user, or null if user not found
 */
export function setCurrentUser(userId) {
    const user = getUserById(userId);
    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, userId);
        console.log(`[userRoles] User switched to: ${user.name} (${user.role})`);
        return user;
    }
    console.warn(`[userRoles] User ID not found: ${userId}`);
    return null;
}

/**
 * Checks if the current user has a specific permission
 * @param {string} permission - Permission to check ('draft_assessment', 'edit_own', 'review_any', 'approve', 'admin')
 * @returns {boolean} True if user has the permission
 */
export function hasPermission(permission) {
    const currentUser = getCurrentUser();
    const role = ROLES[currentUser.role];
    if (!role) {
        console.warn(`[userRoles] Unknown role: ${currentUser.role}`);
        return false;
    }
    return role.permissions.includes(permission);
}

/**
 * Gets the role definition for a given role ID
 * @param {string} roleId - The role ID to look up
 * @returns {Object|null} Role definition if found, null otherwise
 */
export function getRoleById(roleId) {
    return ROLES[roleId] || null;
}

/**
 * Gets all available permissions for a role
 * @param {string} roleId - The role ID to get permissions for
 * @returns {Array<string>} Array of permission strings
 */
export function getRolePermissions(roleId) {
    const role = ROLES[roleId];
    return role ? [...role.permissions] : [];
}

// Export to window for backward compatibility with onclick handlers
window.userRoles = {
    ROLES,
    mockUsers,
    getCurrentUser,
    setCurrentUser,
    getUserById,
    getDefaultUser,
    hasPermission,
    getRoleById,
    getRolePermissions
};

// Also export individual items to window for direct access
window.ROLES = ROLES;
window.mockUsers = mockUsers;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.getUserById = getUserById;
window.getDefaultUser = getDefaultUser;
window.hasPermission = hasPermission;
