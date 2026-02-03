/**
 * Storage Module
 * Handles saving and loading schedules from localStorage
 */

const Storage = (function() {
    const STORAGE_KEY = 'dutyScheduler_schedules';
    const EMPLOYEES_KEY = 'dutyScheduler_employees';
    const SETTINGS_KEY = 'dutyScheduler_settings';

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    function isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get all saved schedules
     * @returns {Array}
     */
    function getSchedules() {
        if (!isAvailable()) return [];
        
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading schedules:', e);
            return [];
        }
    }

    /**
     * Save a schedule
     * @param {Object} schedule - Schedule object to save
     * @returns {boolean} Success status
     */
    function saveSchedule(schedule) {
        if (!isAvailable()) return false;
        
        try {
            const schedules = getSchedules();
            
            // Generate unique ID if not present
            if (!schedule.id) {
                schedule.id = generateId();
            }
            
            // Add timestamp
            schedule.savedAt = new Date().toISOString();
            
            // Check if schedule with same ID exists
            const existingIndex = schedules.findIndex(s => s.id === schedule.id);
            
            if (existingIndex !== -1) {
                // Update existing
                schedules[existingIndex] = schedule;
            } else {
                // Add new
                schedules.unshift(schedule);
            }
            
            // Keep only last 50 schedules
            const trimmed = schedules.slice(0, 50);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
            return true;
        } catch (e) {
            console.error('Error saving schedule:', e);
            return false;
        }
    }

    /**
     * Delete a schedule by ID
     * @param {string} id - Schedule ID
     * @returns {boolean} Success status
     */
    function deleteSchedule(id) {
        if (!isAvailable()) return false;
        
        try {
            const schedules = getSchedules();
            const filtered = schedules.filter(s => s.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (e) {
            console.error('Error deleting schedule:', e);
            return false;
        }
    }

    /**
     * Get a schedule by ID
     * @param {string} id - Schedule ID
     * @returns {Object|null}
     */
    function getScheduleById(id) {
        const schedules = getSchedules();
        return schedules.find(s => s.id === id) || null;
    }

    /**
     * Save employee list
     * @param {Array} employees - Array of employee names
     * @returns {boolean} Success status
     */
    function saveEmployees(employees) {
        if (!isAvailable()) return false;
        
        try {
            localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
            return true;
        } catch (e) {
            console.error('Error saving employees:', e);
            return false;
        }
    }

    /**
     * Get saved employees
     * @returns {Array}
     */
    function getEmployees() {
        if (!isAvailable()) return [];
        
        try {
            const data = localStorage.getItem(EMPLOYEES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading employees:', e);
            return [];
        }
    }

    /**
     * Save settings
     * @param {Object} settings - Settings object
     * @returns {boolean} Success status
     */
    function saveSettings(settings) {
        if (!isAvailable()) return false;
        
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    }

    /**
     * Get saved settings
     * @returns {Object}
     */
    function getSettings() {
        if (!isAvailable()) return getDefaultSettings();
        
        try {
            const data = localStorage.getItem(SETTINGS_KEY);
            return data ? { ...getDefaultSettings(), ...JSON.parse(data) } : getDefaultSettings();
        } catch (e) {
            console.error('Error loading settings:', e);
            return getDefaultSettings();
        }
    }

    /**
     * Get default settings
     * @returns {Object}
     */
    function getDefaultSettings() {
        return {
            shifts: {
                shift1: { start: '12:00', end: '20:00', label: 'Day Shift' },
                shift2: { start: '20:00', end: '04:00', label: 'Night Shift' },
                shift3: { start: '04:00', end: '12:00', label: 'Morning Shift' }
            }
        };
    }

    /**
     * Generate unique ID
     * @returns {string}
     */
    function generateId() {
        return 'sch_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Clear all stored data
     * @returns {boolean}
     */
    function clearAll() {
        if (!isAvailable()) return false;
        
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(EMPLOYEES_KEY);
            localStorage.removeItem(SETTINGS_KEY);
            return true;
        } catch (e) {
            console.error('Error clearing storage:', e);
            return false;
        }
    }

    /**
     * Export all data as JSON
     * @returns {string}
     */
    function exportData() {
        return JSON.stringify({
            schedules: getSchedules(),
            employees: getEmployees(),
            settings: getSettings(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Import data from JSON
     * @param {string} jsonString - JSON data string
     * @returns {boolean} Success status
     */
    function importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.schedules) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.schedules));
            }
            if (data.employees) {
                localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(data.employees));
            }
            if (data.settings) {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
            }
            
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }

    // Public API
    return {
        isAvailable,
        getSchedules,
        saveSchedule,
        deleteSchedule,
        getScheduleById,
        saveEmployees,
        getEmployees,
        saveSettings,
        getSettings,
        getDefaultSettings,
        generateId,
        clearAll,
        exportData,
        importData
    };
})();
