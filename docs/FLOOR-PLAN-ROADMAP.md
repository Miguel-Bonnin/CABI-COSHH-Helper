# Interactive Floor Plan Feature - Roadmap

## Overview

Create an interactive SVG floor plan viewer that allows users to visually locate chemicals and see which rooms need COSHH assessments.

## Status: In Progress

- ✅ Floor plan SVGs uploaded (floor1.svg, floor2.svg)
- ✅ ChemInventory data includes location information
- ⏳ Interactive viewer - TO BE IMPLEMENTED

## Planned Features

### 1. Floor Plan Viewer Modal

**Trigger:**
- Click "View Floor Plan" button in inventory tab
- Or click location name in chemical details

**Display:**
- Full-screen modal with SVG floor plan
- Zoom/pan controls
- Toggle between Floor 1 and Floor 2

### 2. Room Highlighting

**Interactive Features:**
- Hover over room → Highlight + show tooltip
- Tooltip shows:
  - Room name (e.g., "E1.6 Media prep")
  - Number of chemicals in room
  - Assessment status summary

**Visual Feedback:**
- Different colors based on status:
  - 🟢 Green: All assessments complete
  - 🟡 Yellow: Some assessments in progress
  - 🔴 Red: Assessments needed
  - ⚪ Gray: No hazardous chemicals

### 3. Click to View Room Chemicals

**Action:**
- Click room → Show list of chemicals in that location
- Popup/sidebar with:
  - Chemical names
  - Hazard codes
  - Assessment status
  - Quick action buttons (Create Assessment, View Details)

### 4. Reverse Lookup

**From Chemical → To Floor Plan:**
- When viewing a chemical in the inventory
- Click "Show on Floor Plan" button
- Opens floor plan with that room highlighted
- Tooltip shows "You are here"

### 5. Location-Based Filtering

**Enhanced Filter:**
- Current: Filter dropdown shows status
- New: Add "Location" filter
  - Select floor (Floor 1, Floor 2)
  - Select room (dropdown populated from inventory)
  - Optionally: Click room on map to filter

### 6. Assessment Heatmap

**Visual Overview:**
- Color-code entire floor plan by assessment status
- Quickly identify problem areas
- Legend showing what colors mean

## Technical Implementation

### Phase 1: SVG Parsing (First Priority)

```javascript
// Load SVG and parse structure
- Identify room boundaries (paths/rectangles)
- Map text labels (E1.6, E2.2) to room shapes
- Create clickable overlay
```

### Phase 2: Chemical Mapping

```javascript
// Parse location strings from inventory
"CABI UK Laboratory > E1.6 Media prep > Ambient"
↓
Extract: "E1.6 Media prep"
↓
Match to SVG room label: "E1.6"
```

### Phase 3: Interactive UI

```javascript
// Event handlers
- mouseover: highlight room + tooltip
- click: show chemicals in room
- zoom/pan: allow navigation of large floor plans
```

### Phase 4: Integration

```javascript
// Connect to existing features
- "Show on Floor Plan" button in inventory table
- Location filter dropdown updates map
- Map click updates inventory filter
```

## File Structure

```
assets/
  floorplans/
    floor1.svg              ✅ Uploaded
    floor2.svg              ✅ Uploaded

js/
  floor-plan-viewer.js      ⏳ To create

css/
  floor-plan.css            ⏳ To create

docs/
  FLOOR-PLAN-ROADMAP.md     ✅ This file
```

## Room Location Mapping

Based on inventory data, we have these locations:

**Floor 1 (Ground Floor):**
- E1.5 Pouring room
- E1.6 Media prep (Ambient, Fridge)
- E1.8 Chemical store
- Collection lab
- Culture collection
- Ecology lab
- Liquid nitrogen room
- Prop lab

**Floor 2 (First Floor):**
- E2.0 PCR
- E2.1 Sanger & MALDI
- E2.2 Pathology - Plants - Main (Ambient, Fridge)
- E2.3 Pathology - Plants - Annex
- E2.4 Dirty Microbiology - Parcel reception
- E2.5 Chemical lab (screening)
- E2.6 Pathology - Insects
- E2.7 Overflow
- E2.8 Clean Microbiology - Annex
- E2.9 Clean Microbiology - Main
- E2.10 Molecular
- E3.07 Powder room

**Other Buildings:**
- H207 Water treatment
- H208 Hamilton lab - corridor
- H209 Hamilton lab
- H211 Hamilton parcel reception
- H2CT1 Licensed plant path lab

## User Stories

### Story 1: Find Chemicals by Location
**As a** lab technician
**I want** to see which chemicals are in a specific room
**So that** I can plan my work efficiently

**Acceptance Criteria:**
- Click room on floor plan
- See list of chemicals in that room
- Filter by assessment status

### Story 2: Locate a Chemical
**As a** researcher
**I want** to find where a chemical is stored
**So that** I can retrieve it quickly

**Acceptance Criteria:**
- Search for chemical name
- Click "Show on Floor Plan"
- See highlighted room on map

### Story 3: Assessment Overview
**As a** lab manager
**I want** to see which rooms need COSHH assessments
**So that** I can prioritize work

**Acceptance Criteria:**
- View floor plan with color-coded rooms
- Red rooms need assessments
- Green rooms are complete
- Click room to see details

## Implementation Order

1. **Basic viewer** (1-2 hours)
   - Load SVG in modal
   - Parse room labels
   - Basic highlighting on hover

2. **Chemical integration** (1 hour)
   - Map inventory locations to rooms
   - Count chemicals per room
   - Show tooltip with counts

3. **Click interaction** (1 hour)
   - Click room → show chemical list
   - Link back to inventory

4. **Reverse lookup** (30 min)
   - "Show on Floor Plan" button
   - Open map with room highlighted

5. **Polish** (1 hour)
   - Zoom/pan controls
   - Color-coding by status
   - Legend
   - Responsive design

**Total estimated time: 5-6 hours**

## Future Enhancements

- 3D building view
- Real-time updates when assessments completed
- Print floor plan with chemical labels
- Export room inventory to PDF
- Mobile-friendly touch controls
- Keyboard navigation (arrow keys to move between rooms)

## Notes

- SVGs are already created - no conversion needed ✅
- Room labels use standard format (E1.6, E2.2, etc.) ✅
- Inventory data includes detailed location strings ✅
- All data structures are in place ✅

**Next step:** Implement Phase 1 - SVG Parsing and basic viewer!

---

**Created:** 2025-01-17
**Last Updated:** 2025-01-17
**Status:** Planning Complete, Ready for Implementation
