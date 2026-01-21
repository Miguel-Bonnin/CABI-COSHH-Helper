/**
 * @fileoverview Structured logging with log levels and formatting
 * @module logger
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

let currentLogLevel = LOG_LEVELS.INFO; // Default to INFO in production

/**
 * Set the minimum log level
 * @param {string} level - 'DEBUG', 'INFO', 'WARN', or 'ERROR'
 */
function setLogLevel(level) {
    currentLogLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
}

/**
 * Debug-level logging (detailed diagnostic info)
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
function debug(message, data) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        console.log(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
}

/**
 * Info-level logging (general informational messages)
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
function info(message, data) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
        console.log(`[INFO] ${message}`, data !== undefined ? data : '');
    }
}

/**
 * Warning-level logging (potential issues)
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
function warn(message, data) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
        console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
    }
}

/**
 * Error-level logging (serious problems)
 * @param {string} message - Log message
 * @param {Error|*} error - Error object or data
 */
function error(message, error) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
        console.error(`[ERROR] ${message}`, error || '');
    }
}

export { setLogLevel, debug, info, warn, error };

// Expose globally for non-module scripts
window.logger = { setLogLevel, debug, info, warn, error };
