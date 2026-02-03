/**
 * Schedule Manager Module
 * Handles all schedule-related operations
 */

const ScheduleManager = (function() {
    // Current schedule state
    let currentSchedule = null;
    let employees = [];
    let shiftConfig = {
        shift1: { start: '12:00', end: '20:00', label: 'Day Shift' },
        shift2: { start: '20:00', end: '04:00', label: 'Night Shift' },
        shift3: { start: '04:00', end: '12:00', label: 'Morning Shift' }
    };

    /**
     * Initialize the schedule manager
     */
    function init() {
        // Load saved employees
        const savedEmployees = Storage.getEmployees();
        if (savedEmployees.length > 0) {
            employees = savedEmployees;
        }

        // Load saved settings
        const savedSettings = Storage.getSettings();
        if (savedSettings.shifts) {
            shiftConfig = savedSettings.shifts;
        }
    }

    /**
     * Create a new schedule
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} name - Schedule name
     * @returns {Object} New schedule object
     */
    function createSchedule(startDate, name = '') {
        const weekDates = DateUtils.generateWeekDates(startDate);
        const startDateObj = DateUtils.parseDate(startDate);
        
        // Auto-generate name if not provided
        if (!name) {
            name = `Week ${DateUtils.getWeekNumber(startDateObj)} - ${DateUtils.formatWeekRange(startDateObj)}`;
        }

        const schedule = {
            id: Storage.generateId(),
            name: name,
            startDate: weekDates[0].dateISO,
            endDate: weekDates[6].dateISO,
            createdAt: new Date().toISOString(),
            days: {}
        };

        // Initialize each day with empty shifts
        weekDates.forEach(dayInfo => {
            schedule.days[dayInfo.dateISO] = {
                ...dayInfo,
                shifts: {
                    shift1: { employee: null, ...shiftConfig.shift1 },
                    shift2: { employee: null, ...shiftConfig.shift2 },
                    shift3: { employee: null, ...shiftConfig.shift3 }
                }
            };
        });

        currentSchedule = schedule;
        return schedule;
    }

    /**
     * Get current schedule
     * @returns {Object|null}
     */
    function getCurrentSchedule() {
        return currentSchedule;
    }

    /**
     * Set current schedule
     * @param {Object} schedule
     */
    function setCurrentSchedule(schedule) {
        currentSchedule = schedule;
    }

    /**
     * Assign employee to a shift
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} shiftId - Shift ID (shift1, shift2, shift3)
     * @param {string} employeeName - Employee name
     * @returns {boolean} Success status
     */
    function assignEmployee(date, shiftId, employeeName) {
        if (!currentSchedule || !currentSchedule.days[date]) {
            return false;
        }

        currentSchedule.days[date].shifts[shiftId].employee = employeeName;
        return true;
    }

    /**
     * Remove employee from a shift
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} shiftId - Shift ID
     * @returns {boolean} Success status
     */
    function removeEmployee(date, shiftId) {
        return assignEmployee(date, shiftId, null);
    }

    /**
     * Get shift assignment
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} shiftId - Shift ID
     * @returns {string|null} Employee name or null
     */
    function getAssignment(date, shiftId) {
        if (!currentSchedule || !currentSchedule.days[date]) {
            return null;
        }
        return currentSchedule.days[date].shifts[shiftId].employee;
    }

    /**
     * Add employee to the list
     * @param {string} name - Employee name
     * @returns {boolean} Success status
     */
    function addEmployee(name) {
        const trimmedName = name.trim();
        if (!trimmedName) return false;
        
        // Check for duplicates (case-insensitive)
        const exists = employees.some(e => e.toLowerCase() === trimmedName.toLowerCase());
        if (exists) return false;

        employees.push(trimmedName);
        Storage.saveEmployees(employees);
        return true;
    }

    /**
     * Remove employee from the list
     * @param {string} name - Employee name
     * @returns {boolean} Success status
     */
    function removeEmployeeFromList(name) {
        const index = employees.indexOf(name);
        if (index === -1) return false;

        employees.splice(index, 1);
        Storage.saveEmployees(employees);
        return true;
    }

    /**
     * Get all employees
     * @returns {Array}
     */
    function getEmployees() {
        return [...employees];
    }

    /**
     * Set employees list
     * @param {Array} newEmployees
     */
    function setEmployees(newEmployees) {
        employees = [...newEmployees];
        Storage.saveEmployees(employees);
    }

    /**
     * Update shift configuration
     * @param {string} shiftId - Shift ID
     * @param {Object} config - Shift configuration { start, end, label }
     */
    function updateShiftConfig(shiftId, config) {
        if (shiftConfig[shiftId]) {
            shiftConfig[shiftId] = { ...shiftConfig[shiftId], ...config };
            Storage.saveSettings({ shifts: shiftConfig });
            
            // Update current schedule if exists
            if (currentSchedule) {
                Object.keys(currentSchedule.days).forEach(date => {
                    currentSchedule.days[date].shifts[shiftId] = {
                        ...currentSchedule.days[date].shifts[shiftId],
                        ...config
                    };
                });
            }
        }
    }

    /**
     * Get shift configuration
     * @returns {Object}
     */
    function getShiftConfig() {
        return { ...shiftConfig };
    }

    /**
     * Save current schedule
     * @returns {boolean} Success status
     */
    function saveCurrentSchedule() {
        if (!currentSchedule) return false;
        return Storage.saveSchedule(currentSchedule);
    }

    /**
     * Load schedule by ID
     * @param {string} id - Schedule ID
     * @returns {Object|null}
     */
    function loadSchedule(id) {
        const schedule = Storage.getScheduleById(id);
        if (schedule) {
            currentSchedule = schedule;
        }
        return schedule;
    }

    /**
     * Get all saved schedules
     * @returns {Array}
     */
    function getSavedSchedules() {
        return Storage.getSchedules();
    }

    /**
     * Delete schedule by ID
     * @param {string} id - Schedule ID
     * @returns {boolean} Success status
     */
    function deleteSchedule(id) {
        const result = Storage.deleteSchedule(id);
        if (result && currentSchedule && currentSchedule.id === id) {
            currentSchedule = null;
        }
        return result;
    }

    /**
     * Get schedule statistics
     * @returns {Object}
     */
    function getScheduleStats() {
        if (!currentSchedule) return null;

        const stats = {
            totalShifts: 21, // 7 days × 3 shifts
            assignedShifts: 0,
            unassignedShifts: 0,
            employeeShiftCount: {}
        };

        Object.keys(currentSchedule.days).forEach(date => {
            const day = currentSchedule.days[date];
            Object.keys(day.shifts).forEach(shiftId => {
                const employee = day.shifts[shiftId].employee;
                if (employee) {
                    stats.assignedShifts++;
                    stats.employeeShiftCount[employee] = (stats.employeeShiftCount[employee] || 0) + 1;
                } else {
                    stats.unassignedShifts++;
                }
            });
        });

        return stats;
    }

    /**
     * Auto-fill schedule with employees (round-robin)
     * @returns {boolean} Success status
     */
    function autoFillSchedule() {
        if (!currentSchedule || employees.length === 0) return false;

        let employeeIndex = 0;
        
        Object.keys(currentSchedule.days).forEach(date => {
            ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                currentSchedule.days[date].shifts[shiftId].employee = employees[employeeIndex];
                employeeIndex = (employeeIndex + 1) % employees.length;
            });
        });

        return true;
    }

    /**
     * Clear all assignments
     * @returns {boolean} Success status
     */
    function clearAssignments() {
        if (!currentSchedule) return false;

        Object.keys(currentSchedule.days).forEach(date => {
            ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                currentSchedule.days[date].shifts[shiftId].employee = null;
            });
        });

        return true;
    }

    /**
     * Export schedule data for external use
     * @returns {Object}
     */
    function exportScheduleData() {
        if (!currentSchedule) return null;

        const exportData = {
            name: currentSchedule.name,
            startDate: currentSchedule.startDate,
            endDate: currentSchedule.endDate,
            schedule: []
        };

        Object.keys(currentSchedule.days).forEach(date => {
            const day = currentSchedule.days[date];
            exportData.schedule.push({
                date: date,
                dayName: day.dayName,
                shifts: [
                    {
                        shift: 'Shift 1',
                        time: `${DateUtils.formatTime12h(day.shifts.shift1.start)} - ${DateUtils.formatTime12h(day.shifts.shift1.end)}`,
                        employee: day.shifts.shift1.employee || 'Unassigned'
                    },
                    {
                        shift: 'Shift 2',
                        time: `${DateUtils.formatTime12h(day.shifts.shift2.start)} - ${DateUtils.formatTime12h(day.shifts.shift2.end)}`,
                        employee: day.shifts.shift2.employee || 'Unassigned'
                    },
                    {
                        shift: 'Shift 3',
                        time: `${DateUtils.formatTime12h(day.shifts.shift3.start)} - ${DateUtils.formatTime12h(day.shifts.shift3.end)}`,
                        employee: day.shifts.shift3.employee || 'Unassigned'
                    }
                ]
            });
        });

        return exportData;
    }

    // Public API
    return {
        init,
        createSchedule,
        getCurrentSchedule,
        setCurrentSchedule,
        assignEmployee,
        removeEmployee,
        getAssignment,
        addEmployee,
        removeEmployeeFromList,
        getEmployees,
        setEmployees,
        updateShiftConfig,
        getShiftConfig,
        saveCurrentSchedule,
        loadSchedule,
        getSavedSchedules,
        deleteSchedule,
        getScheduleStats,
        autoFillSchedule,
        clearAssignments,
        exportScheduleData
    };
})();
