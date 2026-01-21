/**
 * @fileoverview Safe DOM query and manipulation helpers that prevent null reference errors
 * @module domHelpers
 *
 * Provides safe alternatives to direct DOM access that warn when elements are missing
 */

/**
 * Safely get element by ID with optional warning
 * @param {string} id - Element ID
 * @param {boolean} warnIfMissing - Log warning if element not found (default: true)
 * @returns {HTMLElement|null}
 */
export function safeGetElementById(id, warnIfMissing = true) {
    const element = document.getElementById(id);
    if (!element && warnIfMissing) {
        console.warn(`[DOM] Could not find form element with ID '${id}'. This is likely a bug - please report it.`);
    }
    return element;
}

/**
 * Safely query selector with optional warning
 * @param {string} selector - CSS selector
 * @param {boolean} warnIfMissing - Log warning if element not found (default: true)
 * @returns {Element|null}
 */
export function safeQuerySelector(selector, warnIfMissing = true) {
    const element = document.querySelector(selector);
    if (!element && warnIfMissing) {
        console.warn(`[DOM] Could not find element with selector '${selector}'. This is likely a bug - please report it.`);
    }
    return element;
}

/**
 * Safely set text content if element exists
 * @param {string} id - Element ID
 * @param {string} text - Text to set
 * @returns {boolean} - True if successful
 */
export function safeSetTextContent(id, text) {
    const element = safeGetElementById(id, true);
    if (element) {
        element.textContent = text;
        return true;
    }
    return false;
}

/**
 * Safely set inner HTML if element exists
 * @param {string} id - Element ID
 * @param {string} html - HTML to set
 * @returns {boolean} - True if successful
 */
export function safeSetInnerHTML(id, html) {
    const element = safeGetElementById(id, true);
    if (element) {
        element.innerHTML = html;
        return true;
    }
    return false;
}

/**
 * Safely add event listener if element exists
 * @param {string} id - Element ID
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {boolean} - True if successful
 */
export function safeAddEventListener(id, event, handler) {
    const element = safeGetElementById(id, true);
    if (element) {
        element.addEventListener(event, handler);
        return true;
    }
    return false;
}
