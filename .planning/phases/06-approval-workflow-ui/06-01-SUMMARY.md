---
phase: 06-approval-workflow-ui
plan: 01
subsystem: workflow
tags: [status-transitions, workflow-ui, role-based-actions, progress-indicator]

# Dependency graph
requires:
  - phase: 05-user-role-simulation
    provides: userRoles.js, hasPermission(), _meta object, role-based UI patterns
provides:
  - workflowManager.js with status transition logic
  - Workflow action buttons (Submit, Request Changes, Approve)
  - Visual workflow progress indicator
  - Read-only mode for approved assessments
affects: [future-backend-integration, audit-trail]

# Tech tracking
tech-stack:
  added: []
  patterns: [status-state-machine, workflow-actions-pattern, progress-visualization]

key-files:
  created:
    - js/modules/workflowManager.js
  modified:
    - js/modules/formManager.js
    - coshhgeneratorv5.html
    - css/layout.css

key-decisions:
  - "Status transitions use permission-based validation (not hard-coded role names)"
  - "statusHistory array tracks all transitions with timestamps and user info"
  - "Progress indicator uses three-step visual tracker with completed/current/pending states"

patterns-established:
  - "Workflow state machine with VALID_TRANSITIONS map"
  - "Action buttons show/hide based on getAvailableActions() result"
  - "Read-only mode via CSS class on form element"

issues-created: []

# Metrics
duration: 6min
completed: 2026-01-22
---

# Phase 6 Plan 1: Approval Workflow UI Summary

**Mock approval workflow with status transitions (draft→under_review→approved), workflow action buttons, and visual progress tracking**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-22T17:12:48Z
- **Completed:** 2026-01-22T17:18:18Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created workflowManager.js with complete status transition logic and permission validation
- Added "Submit for Review" button for lab managers to submit draft assessments
- Added "Request Changes" button for assessors to send assessments back for revision
- Wired "Approve & Finalize" button to workflow transitions with read-only mode activation
- Implemented visual three-step workflow progress indicator (Draft → Under Review → Approved)
- Added status-specific messaging showing approver info and guidance text
- Enabled read-only mode that locks all form inputs when assessment is approved

## Task Commits

Each task was committed atomically:

1. **Task 1: Create workflow state transition logic** - `382a373` (feat)
2. **Task 2: Add workflow action buttons and wire handlers** - `a7feaf4` (feat)
3. **Task 3: Add workflow status visualization** - `d1851eb` (feat)

**Plan metadata:** (to be committed)

## Files Created/Modified

- `js/modules/workflowManager.js` - New module with canTransition(), transitionStatus(), getAvailableActions(), isReadOnly()
- `js/modules/formManager.js` - Added statusHistory preservation in _meta object
- `coshhgeneratorv5.html` - Added workflow buttons, handlers, progress indicator functions, workflowManager import
- `css/layout.css` - Workflow button styles, progress indicator styles, read-only mode styles

## Decisions Made

- **Permission-based transitions**: Used hasPermission() for workflow validation rather than checking role names directly, making the system more flexible for future role additions
- **Status history tracking**: Added statusHistory array to _meta to maintain audit trail of all status changes with timestamps and user info
- **Visual feedback pattern**: Progress indicator uses color-coded steps (gray=pending, blue=current, green=completed) for clear status visibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Phase 6 complete - Milestone 1 (v0.6.0) demonstration ready
- Full workflow demo available: lab manager drafts → assigns assessor → submits → assessor reviews → approves
- Visual progress indicator shows workflow state clearly
- Approved assessments are locked from editing
- Ready for milestone completion or additional refinements

---
*Phase: 06-approval-workflow-ui*
*Completed: 2026-01-22*
