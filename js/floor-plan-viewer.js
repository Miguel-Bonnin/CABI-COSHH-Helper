/**
 * Interactive Floor Plan Viewer
 *
 * Displays chemical locations on building floor plans
 * with interactive room highlighting and click-to-view functionality.
 */

// Global state
let floorPlanModal = null;
let currentFloor = 1;
let roomData = {};
let selectedRoom = null;

/**
 * Initialize floor plan viewer
 */
function initFloorPlanViewer() {
    // Create modal structure (hidden by default)
    createFloorPlanModal();
}

/**
 * Create the floor plan modal structure
 */
function createFloorPlanModal() {
    const modal = document.createElement('div');
    modal.className = 'floor-plan-modal';
    modal.style.display = 'none';

    modal.innerHTML = `
        <div class="floor-plan-container">
            <div class="floor-plan-header">
                <h2>Building Floor Plans</h2>
                <div class="floor-plan-controls">
                    <button class="floor-selector active" data-floor="1">Ground Floor</button>
                    <button class="floor-selector" data-floor="2">First Floor</button>
                    <button class="close-floor-plan" aria-label="Close">&times;</button>
                </div>
            </div>

            <div class="floor-plan-viewer">
                <div class="floor-plan-legend">
                    <h4>Assessment Status</h4>
                    <div class="legend-item">
                        <div class="legend-color" style="background: rgba(46, 204, 113, 0.3); border-color: #2ecc71;"></div>
                        <span>All Complete</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: rgba(241, 196, 15, 0.3); border-color: #f1c40f;"></div>
                        <span>In Progress</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: rgba(231, 76, 60, 0.3); border-color: #e74c3c;"></div>
                        <span>Needs Assessment</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: rgba(149, 165, 166, 0.2); border-color: #95a5a6;"></div>
                        <span>No Hazards</span>
                    </div>
                </div>

                <div class="floor-plan-svg-container" id="floorPlanSvgContainer">
                    <div class="floor-plan-loading">Loading floor plan...</div>
                </div>

                <div class="zoom-controls">
                    <button class="zoom-btn" id="zoomIn" title="Zoom In">+</button>
                    <button class="zoom-btn" id="zoomReset" title="Reset Zoom">↺</button>
                    <button class="zoom-btn" id="zoomOut" title="Zoom Out">-</button>
                </div>
            </div>

            <div class="floor-plan-sidebar hidden" id="floorPlanSidebar">
                <div class="sidebar-header">
                    <h3 id="sidebarRoomName">Room Details</h3>
                </div>
                <div class="sidebar-content" id="sidebarContent">
                    <!-- Chemical list will be populated here -->
                </div>
            </div>
        </div>

        <div class="floor-plan-tooltip" id="floorPlanTooltip" style="display: none;"></div>
    `;

    document.body.appendChild(modal);
    floorPlanModal = modal;

    // Add event listeners
    setupFloorPlanEventListeners();
}

/**
 * Setup event listeners for floor plan
 */
function setupFloorPlanEventListeners() {
    // Close button
    floorPlanModal.querySelector('.close-floor-plan').addEventListener('click', closeFloorPlan);

    // Click outside to close
    floorPlanModal.addEventListener('click', (e) => {
        if (e.target === floorPlanModal) {
            closeFloorPlan();
        }
    });

    // Floor selector buttons
    floorPlanModal.querySelectorAll('.floor-selector').forEach(btn => {
        btn.addEventListener('click', () => {
            const floor = parseInt(btn.dataset.floor);
            switchFloor(floor);
        });
    });

    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => zoomFloorPlan(1.2));
    document.getElementById('zoomOut').addEventListener('click', () => zoomFloorPlan(0.8));
    document.getElementById('zoomReset').addEventListener('click', resetZoom);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (floorPlanModal.style.display === 'flex') {
            if (e.key === 'Escape') closeFloorPlan();
            if (e.key === '+' || e.key === '=') zoomFloorPlan(1.2);
            if (e.key === '-' || e.key === '_') zoomFloorPlan(0.8);
            if (e.key === '0') resetZoom();
        }
    });
}

/**
 * Open floor plan viewer
 */
async function openFloorPlan(floor = 1, highlightRoom = null) {
    floorPlanModal.style.display = 'flex';
    currentFloor = floor;

    // Update floor selector buttons
    floorPlanModal.querySelectorAll('.floor-selector').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.floor) === floor);
    });

    // Load the SVG
    await loadFloorPlanSVG(floor);

    // Process inventory data and map to rooms
    await processRoomData();

    // Make rooms interactive (after roomData is populated)
    const svg = document.querySelector('#floorPlanSvgContainer svg');
    if (svg) {
        makeRoomsInteractive(svg);
    }

    // Highlight specific room if requested
    if (highlightRoom) {
        selectRoom(highlightRoom);
    }
}

/**
 * Close floor plan viewer
 */
function closeFloorPlan() {
    floorPlanModal.style.display = 'none';
    selectedRoom = null;
}

/**
 * Switch between floors
 */
async function switchFloor(floor) {
    if (floor === currentFloor) return;

    currentFloor = floor;

    // Update buttons
    floorPlanModal.querySelectorAll('.floor-selector').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.floor) === floor);
    });

    // Load new floor
    await loadFloorPlanSVG(floor);
    await processRoomData();

    // Make rooms interactive (after roomData is populated)
    const svg = document.querySelector('#floorPlanSvgContainer svg');
    if (svg) {
        makeRoomsInteractive(svg);
    }
}

/**
 * Load SVG floor plan
 */
async function loadFloorPlanSVG(floor) {
    const container = document.getElementById('floorPlanSvgContainer');
    container.innerHTML = '<div class="floor-plan-loading">Loading floor plan...</div>';

    try {
        const response = await fetch(`assets/floorplans/floor${floor}.svg`);
        if (!response.ok) throw new Error(`Failed to load floor${floor}.svg`);

        const svgText = await response.text();
        container.innerHTML = svgText;

        const svg = container.querySelector('svg');
        if (svg) {
            // Enable pan functionality (do this first)
            enablePanning(svg);

            // Note: makeRoomsInteractive() will be called after processRoomData() completes
        }
    } catch (error) {
        console.error('Error loading floor plan:', error);
        container.innerHTML = `<div class="floor-plan-loading" style="color: #e74c3c;">Failed to load floor plan. ${error.message}</div>`;
    }
}

/**
 * Process inventory data and map to rooms
 */
async function processRoomData() {
    // Access global variables from inventory-manager.js
    const inventoryData = window.inventoryData;
    const assessmentStatus = window.assessmentStatus;

    console.log('DEBUG: inventoryData exists?', !!inventoryData);
    console.log('DEBUG: assessmentStatus exists?', !!assessmentStatus);
    if (inventoryData) {
        console.log('DEBUG: inventory has', inventoryData.inventory?.length, 'chemicals');
    }

    if (!inventoryData || !assessmentStatus) {
        console.warn('Inventory data not loaded - please visit the Inventory tab first!');
        return;
    }

    roomData = {};

    // Process each chemical's location
    inventoryData.inventory.forEach(chemical => {
        const roomCode = extractRoomCode(chemical.location);
        if (!roomCode) return;

        if (!roomData[roomCode]) {
            roomData[roomCode] = {
                name: chemical.location,
                chemicals: [],
                stats: {
                    total: 0,
                    complete: 0,
                    in_progress: 0,
                    needs_assessment: 0,
                    not_required: 0
                }
            };
        }

        // Get assessment status
        const status = assessmentStatus.assessments.find(a => a.chemicalId == chemical.id);
        const chemStatus = status ? status.status : 'needs_assessment';

        roomData[roomCode].chemicals.push({
            ...chemical,
            assessmentStatus: status || { status: 'needs_assessment' }
        });

        roomData[roomCode].stats.total++;
        roomData[roomCode].stats[chemStatus]++;
    });

    console.log('Room data processed:', roomData);
}

/**
 * Extract room code from location string
 * Examples:
 *   "CABI UK Laboratory > E1.6 Media prep > Ambient" → "E1.6"
 *   "CABI UK Laboratory > E2.2 Pathology- Plants- Main" → "E2.2"
 */
function extractRoomCode(location) {
    if (!location) return null;

    // Match patterns like E1.6, E2.2, H207, etc.
    const match = location.match(/([EH]\d+\.?\d*)/);
    return match ? match[1] : null;
}

/**
 * Make rooms interactive in SVG
 */
function makeRoomsInteractive(svg) {
    // Look for all rectangles
    const allRects = svg.querySelectorAll('rect');
    console.log(`Found ${allRects.length} total rectangles in SVG`);

    let roomRectsFound = 0;

    allRects.forEach(rect => {
        // Check for room code in multiple places:
        // 1. <title> element (Inkscape Label)
        // 2. id attribute
        // 3. inkscape:label attribute

        let label = null;
        let roomCode = null;

        // 1. Check <title> element (Inkscape Label)
        const titleEl = rect.querySelector('title');
        if (titleEl) {
            label = titleEl.textContent.trim();
        }

        // 2. Check inkscape:label attribute
        if (!label) {
            label = rect.getAttribute('inkscape:label');
        }

        // 3. Check id attribute
        if (!label) {
            label = rect.getAttribute('id');
        }

        // 4. Check aria-label
        if (!label) {
            label = rect.getAttribute('aria-label');
        }

        if (!label) return;

        console.log('Found rect with label:', label);

        // Extract room code from label
        // Supports formats like: "Room_E1.07", "E1.6", "room-E2.2", etc.
        const patterns = [
            /room[-_\s]?([EH]\d+\.?\d*)/i,  // Room_E1.07, room-E1.6
            /^([EH]\d+\.?\d*)$/i,            // E1.6
            /([EH]\d+\.?\d*)/i               // Any E1.6 in the string
        ];

        for (const pattern of patterns) {
            const match = label.match(pattern);
            if (match) {
                roomCode = match[1].toUpperCase();
                // Normalize: E1.07 → E1.7, E2.2 stays E2.2
                roomCode = roomCode.replace(/\.0(\d)$/, '.$1');
                break;
            }
        }

        if (roomCode) {
            console.log(`  Extracted room code: ${roomCode}`);
            roomRectsFound++;

            if (roomData[roomCode]) {
                console.log(`  ✓ Found matching room data for ${roomCode}`);
                makeRoomInteractive(svg, rect, roomCode);
            } else {
                console.log(`  ✗ No room data found for ${roomCode} (no chemicals in inventory for this room)`);
            }
        }
    });

    console.log(`Total room rectangles with valid labels: ${roomRectsFound}`);

    // If no rooms found, show debugging info
    if (roomRectsFound === 0) {
        console.warn('⚠ No room rectangles detected!');
        console.log('Showing first 10 rectangles for debugging:');

        Array.from(allRects).slice(0, 10).forEach((r, i) => {
            const titleEl = r.querySelector('title');
            const id = r.getAttribute('id');
            const inkscapeLabel = r.getAttribute('inkscape:label');

            console.log(`  Rect ${i + 1}:`);
            if (titleEl) console.log(`    <title>: "${titleEl.textContent}"`);
            if (id) console.log(`    id: "${id}"`);
            if (inkscapeLabel) console.log(`    inkscape:label: "${inkscapeLabel}"`);
        });

        console.log('\nAvailable room codes in inventory:');
        console.log(Object.keys(roomData).join(', '));
    }
}

/**
 * Make a single room rectangle interactive
 */
function makeRoomInteractive(svg, rect, roomCode) {
    const room = roomData[roomCode];
    if (!room) return;

    // Determine room status for color coding
    let status = 'not-required';
    if (room.stats.needs_assessment > 0) status = 'needs-assessment';
    else if (room.stats.in_progress > 0) status = 'in-progress';
    else if (room.stats.complete > 0) status = 'complete';

    // Get rectangle dimensions
    const bbox = rect.getBBox();

    // Create highlight overlay
    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    highlight.setAttribute('x', bbox.x);
    highlight.setAttribute('y', bbox.y);
    highlight.setAttribute('width', bbox.width);
    highlight.setAttribute('height', bbox.height);
    highlight.classList.add('room-highlight', `status-${status}`);
    highlight.dataset.roomCode = roomCode;

    // Insert highlight before the room rectangle
    rect.parentNode.insertBefore(highlight, rect);

    // Make original rectangle clickable (keep it transparent but interactive)
    rect.style.cursor = 'pointer';
    rect.style.fill = 'transparent';
    rect.style.stroke = 'none';
    rect.dataset.roomCode = roomCode;

    // Add event listeners to the rectangle
    rect.addEventListener('mouseenter', (e) => {
        showRoomTooltip(e, roomCode);
        highlight.classList.add('hover');
    });

    rect.addEventListener('mousemove', (e) => moveRoomTooltip(e));

    rect.addEventListener('mouseleave', () => {
        hideRoomTooltip();
        highlight.classList.remove('hover');
    });

    rect.addEventListener('click', () => selectRoom(roomCode));

    console.log(`  ✓ Added interactivity to ${roomCode}`);
}

/**
 * Show tooltip on room hover
 */
function showRoomTooltip(event, roomCode) {
    const room = roomData[roomCode];
    if (!room) return;

    const tooltip = document.getElementById('floorPlanTooltip');
    const stats = room.stats;

    tooltip.innerHTML = `
        <h4>${roomCode}</h4>
        <p><strong>${stats.total}</strong> chemical(s) in this room</p>
        ${stats.complete > 0 ? `<p><span class="status-indicator status-complete"></span>${stats.complete} Complete</p>` : ''}
        ${stats.in_progress > 0 ? `<p><span class="status-indicator status-in-progress"></span>${stats.in_progress} In Progress</p>` : ''}
        ${stats.needs_assessment > 0 ? `<p><span class="status-indicator status-needs-assessment"></span>${stats.needs_assessment} Needs Assessment</p>` : ''}
        <p style="margin-top: 8px; font-size: 0.85em; color: #bdc3c7;">Click to filter inventory table</p>
    `;

    tooltip.style.display = 'block';
    moveRoomTooltip(event);
}

/**
 * Move tooltip with mouse
 */
function moveRoomTooltip(event) {
    const tooltip = document.getElementById('floorPlanTooltip');
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
}

/**
 * Hide tooltip
 */
function hideRoomTooltip() {
    const tooltip = document.getElementById('floorPlanTooltip');
    tooltip.style.display = 'none';
}

/**
 * Select a room and filter inventory table
 */
function selectRoom(roomCode) {
    selectedRoom = roomCode;
    const room = roomData[roomCode];
    if (!room) return;

    console.log(`Room ${roomCode} clicked, filtering inventory...`);

    // Close the floor plan modal
    closeFloorPlan();

    // Switch to Inventory tab
    const tabs = document.querySelectorAll('.tab-button');
    const inventoryTab = Array.from(tabs).find(t => t.textContent.includes('Inventory'));
    if (inventoryTab) {
        inventoryTab.click();
    }

    // Wait for tab to load, then filter by room code
    setTimeout(() => {
        const searchInput = document.getElementById('inventorySearch');
        if (searchInput) {
            searchInput.value = roomCode;
            // Trigger the input event to apply the filter
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, 100);
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'complete': '<span style="color: #2ecc71;">✓ Complete</span>',
        'in_progress': '<span style="color: #f1c40f;">⏳ In Progress</span>',
        'needs_assessment': '<span style="color: #e74c3c;">⚠ Needs Assessment</span>',
        'not_required': '<span style="color: #95a5a6;">- Not Required</span>'
    };
    return badges[status] || badges['needs_assessment'];
}

/**
 * Zoom functionality
 */
let currentZoom = 1;

function zoomFloorPlan(factor) {
    currentZoom *= factor;
    currentZoom = Math.max(0.5, Math.min(currentZoom, 3)); // Limit zoom range

    const svg = document.querySelector('#floorPlanSvgContainer svg');
    if (svg) {
        svg.style.transform = `scale(${currentZoom})`;
    }
}

function resetZoom() {
    currentZoom = 1;
    const svg = document.querySelector('#floorPlanSvgContainer svg');
    if (svg) {
        svg.style.transform = 'scale(1)';
    }
}

/**
 * Enable panning (click and drag)
 */
function enablePanning(svg) {
    let isPanning = false;
    let startX, startY, scrollLeft, scrollTop;
    const container = svg.parentElement;

    svg.addEventListener('mousedown', (e) => {
        isPanning = true;
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
    });

    svg.addEventListener('mouseup', () => isPanning = false);
    svg.addEventListener('mouseleave', () => isPanning = false);

    svg.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initFloorPlanViewer);

// Make functions globally accessible
window.openFloorPlan = openFloorPlan;
window.closeFloorPlan = closeFloorPlan;
