---
phase: 05-user-role-simulation
plan: 01
subsystem: ui, auth
tags: [localStorage, user-roles, mock-auth, role-switcher]

# Dependency graph
requires:
  - phase: 04-code-quality
    provides: Module patterns (ES6 + window export), formManager.js localStorage pattern
provides:
  - userRoles.js module with ROLES, mockUsers, getCurrentUser, setCurrentUser, hasPermission
  - Role switcher UI component in header
  - localStorage persistence for current user (cabiCoshh_currentUser key)
affects: [05-02-plan, 05-03-plan, future-workflow-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - User role mock system pattern with localStorage persistence
    - Role badge color coding pattern (CSS class per role)

key-files:
  created:
    - js/modules/userRoles.js
  modified:
    - coshhgeneratorv5.html
    - css/layout.css

key-decisions:
  - "Used localStorage key 'cabiCoshh_currentUser' to store current user ID"
  - "Mock users include id, name, email, role, department for realistic demo"
  - "Role switcher always visible in header for clear demonstration"
  - "Three roles (lab_manager, coshh_assessor, admin) sufficient for workflow demo"
  - "Permission model: role-based with 5 permissions (draft_assessment, edit_own, review_any, approve, admin)"

patterns-established:
  - "Role module pattern: ES6 exports + window.userRoles for backward compatibility"
  - "Badge color coding: CSS class matches role ID (lab_manager/coshh_assessor/admin)"
  - "Role switcher init pattern: populate dropdown, set current, add change listener"

issues-created: []

# Metrics
duration: 12min
completed: 2025-01-22
---

# Phase 5 Plan 1: User Role Data Model & Storage Summary

**Mock user role system with 5 users across 3 roles, role switcher UI in header with color-coded badges and localStorage persistence**

## Performance

- **Duration:** 12 min
- **Started:** 2025-01-22T10:30:00Z
- **Completed:** 2025-01-22T10:42:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created userRoles.js module with ROLES constant (lab_manager, coshh_assessor, admin)
- Defined 5 mock user profiles across departments (Molecular Biology, Plant Pathology, Health & Safety, Operations)
- Implemented localStorage persistence for current user state
- Added role switcher dropdown to application header with change event handling
- Added role badge with color-coding (blue/green/red) for visual role identification
- Implemented hasPermission() helper for role-based permission checking

## Task Commits

Each task was committed atomically:

1. **Task 1: Create userRoles.js module** - `8a0cded` (feat)
2. **Task 2: Add role switcher UI** - `8a0971e` (feat)

## Files Created/Modified
- `js/modules/userRoles.js` - Role data model, mock users, storage functions, permission checking
- `coshhgeneratorv5.html` - Added role switcher HTML, imported userRoles module, added initialization code
- `css/layout.css` - Added role-switcher styles and role badge color classes

## Decisions Made
- Used localStorage key 'cabiCoshh_currentUser' for current user persistence (consistent with existing formManager pattern)
- Mock users include id, name, email, role, department for realistic demonstration
- Role switcher always visible in header (no hiding) for clear demonstration to IT
- Permission model simplified to role-based (5 permissions mapped to 3 roles)
- Three roles sufficient to demonstrate workflow: drafter (lab_manager) -> reviewer (coshh_assessor) -> admin
- Badge colors: blue (#1565c0) for lab_manager, green (#2e7d32) for coshh_assessor, red (#c62828) for admin

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered

None

## Next Phase Readiness
- userRoles module ready for use by 05-02-PLAN.md (Role-Based UI Visibility)
- getCurrentUser(), hasPermission() available for conditional UI rendering
- Mock users established for testing role-based features
- Role switcher functional for demonstrating user switching

---
*Phase: 05-user-role-simulation*
*Completed: 2025-01-22*
