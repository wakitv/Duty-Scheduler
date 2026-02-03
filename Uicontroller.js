/**
 * UI Controller Module
 * Handles all DOM interactions and user interface updates
 */

const UIController = (function() {
    // DOM Element references
    const elements = {};

    /**
     * Initialize UI Controller
     */
    function init() {
        cacheElements();
        bindEvents();
        initializeDateInput();
        loadSavedEmployees();
        loadShiftConfig();
    }

    /**
     * Cache DOM elements for faster access
     */
    function cacheElements() {
        elements.startDate = document.getElementById('startDate');
        elements.scheduleName = document.getElementById('scheduleName');
        elements.generateBtn = document.getElementById('generateBtn');
        elements.saveBtn = document.getElementById('saveScheduleBtn');
        elements.loadBtn = document.getElementById('loadScheduleBtn');
        elements.exportBtn = document.getElementById('exportBtn');
        
        elements.employeeName = document.getElementById('employeeName');
        elements.addEmployeeBtn = document.getElementById('addEmployeeBtn');
        elements.employeeList = document.getElementById('employeeList');
        
        elements.scheduleContainer = document.getElementById('scheduleContainer');
        elements.scheduleGrid = document.getElementById('scheduleGrid');
        elements.emptyState = document.getElementById('emptyState');
        elements.scheduleTitle = document.getElementById('scheduleTitle');
        
        elements.toastContainer = document.getElementById('toastContainer');
        
        // Shift time inputs
        elements.shift1Start = document.getElementById('shift1Start');
        elements.shift1End = document.getElementById('shift1End');
        elements.shift2Start = document.getElementById('shift2Start');
        elements.shift2End = document.getElementById('shift2End');
        elements.shift3Start = document.getElementById('shift3Start');
        elements.shift3End = document.getElementById('shift3End');
        
        // Modals
        elements.exportModal = document.getElementById('exportModal');
        elements.loadModal = document.getElementById('loadModal');
        elements.closeExportModal = document.getElementById('closeExportModal');
        elements.closeLoadModal = document.getElementById('closeLoadModal');
        elements.savedSchedulesList = document.getElementById('savedSchedulesList');
        
        // Export options
        elements.printBtn = document.getElementById('printBtn');
        elements.downloadPdfBtn = document.getElementById('downloadPdfBtn');
        elements.downloadCsvBtn = document.getElementById('downloadCsvBtn');
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Generate schedule
        elements.generateBtn.addEventListener('click', handleGenerateSchedule);
        
        // Employee management
        elements.addEmployeeBtn.addEventListener('click', handleAddEmployee);
        elements.employeeName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddEmployee();
        });
        
        // Save/Load buttons
        elements.saveBtn.addEventListener('click', handleSaveSchedule);
        elements.loadBtn.addEventListener('click', handleOpenLoadModal);
        elements.exportBtn.addEventListener('click', handleOpenExportModal);
        
        // Modal close buttons
        elements.closeExportModal.addEventListener('click', () => closeModal(elements.exportModal));
        elements.closeLoadModal.addEventListener('click', () => closeModal(elements.loadModal));
        
        // Modal overlays
        elements.exportModal.querySelector('.modal-overlay').addEventListener('click', () => closeModal(elements.exportModal));
        elements.loadModal.querySelector('.modal-overlay').addEventListener('click', () => closeModal(elements.loadModal));
        
        // Export options
        elements.printBtn.addEventListener('click', () => {
            closeModal(elements.exportModal);
            ExportManager.print();
        });
        elements.downloadPdfBtn.addEventListener('click', () => {
            closeModal(elements.exportModal);
            ExportManager.downloadPDF();
        });
        elements.downloadCsvBtn.addEventListener('click', () => {
            closeModal(elements.exportModal);
            ExportManager.downloadCSV();
        });
        
        // Shift time changes
        const shiftInputs = [
            elements.shift1Start, elements.shift1End,
            elements.shift2Start, elements.shift2End,
            elements.shift3Start, elements.shift3End
        ];
        shiftInputs.forEach(input => {
            input.addEventListener('change', handleShiftConfigChange);
        });

        // Date input change
        elements.startDate.addEventListener('change', handleDateChange);
    }

    /**
     * Initialize date input with default value
     */
    function initializeDateInput() {
        const monday = DateUtils.getCurrentWeekMonday();
        elements.startDate.value = DateUtils.formatDateISO(monday);
    }

    /**
     * Load saved employees into UI
     */
    function loadSavedEmployees() {
        const employees = ScheduleManager.getEmployees();
        employees.forEach(name => renderEmployee(name));
    }

    /**
     * Load shift configuration
     */
    function loadShiftConfig() {
        const config = ScheduleManager.getShiftConfig();
        
        elements.shift1Start.value = config.shift1.start;
        elements.shift1End.value = config.shift1.end;
        elements.shift2Start.value = config.shift2.start;
        elements.shift2End.value = config.shift2.end;
        elements.shift3Start.value = config.shift3.start;
        elements.shift3End.value = config.shift3.end;
    }

    /**
     * Handle date change - adjust to Monday if needed
     */
    function handleDateChange() {
        const selectedDate = DateUtils.parseDate(elements.startDate.value);
        
        if (!DateUtils.isMonday(selectedDate)) {
            const monday = DateUtils.getNearestMonday(selectedDate);
            elements.startDate.value = DateUtils.formatDateISO(monday);
            showToast('Date adjusted to Monday', 'info');
        }
    }

    /**
     * Handle generate schedule button click
     */
    function handleGenerateSchedule() {
        const startDate = elements.startDate.value;
        const name = elements.scheduleName.value.trim();
        
        if (!startDate) {
            showToast('Please select a start date', 'error');
            return;
        }
        
        const schedule = ScheduleManager.createSchedule(startDate, name);
        renderSchedule(schedule);
        showToast('Schedule generated successfully!', 'success');
    }

    /**
     * Handle add employee button click
     */
    function handleAddEmployee() {
        const name = elements.employeeName.value.trim();
        
        if (!name) {
            showToast('Please enter an employee name', 'error');
            return;
        }
        
        if (ScheduleManager.addEmployee(name)) {
            renderEmployee(name);
            elements.employeeName.value = '';
            updateScheduleDropdowns();
            showToast(`${name} added to team`, 'success');
        } else {
            showToast('Employee already exists', 'warning');
        }
    }

    /**
     * Handle remove employee
     * @param {string} name - Employee name
     */
    function handleRemoveEmployee(name) {
        if (ScheduleManager.removeEmployeeFromList(name)) {
            const item = elements.employeeList.querySelector(`[data-employee="${name}"]`);
            if (item) {
                item.remove();
            }
            updateScheduleDropdowns();
            showToast(`${name} removed from team`, 'info');
        }
    }

    /**
     * Render employee item
     * @param {string} name - Employee name
     */
    function renderEmployee(name) {
        const item = document.createElement('div');
        item.className = 'employee-item';
        item.setAttribute('data-employee', name);
        item.draggable = true;
        
        item.innerHTML = `
            <span class="employee-name">${name}</span>
            <button class="employee-delete" title="Remove employee">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        // Delete button
        item.querySelector('.employee-delete').addEventListener('click', () => {
            handleRemoveEmployee(name);
        });
        
        // Drag events
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', name);
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
        
        elements.employeeList.appendChild(item);
    }

    /**
     * Render schedule grid
     * @param {Object} schedule - Schedule object
     */
    function renderSchedule(schedule) {
        elements.emptyState.style.display = 'none';
        elements.scheduleGrid.style.display = 'grid';
        elements.scheduleGrid.innerHTML = '';
        
        // Update title
        elements.scheduleTitle.textContent = schedule.name;
        
        // Render each day
        Object.keys(schedule.days).forEach(dateKey => {
            const day = schedule.days[dateKey];
            const dayColumn = createDayColumn(day, dateKey);
            elements.scheduleGrid.appendChild(dayColumn);
        });
    }

    /**
     * Create day column element
     * @param {Object} day - Day object
     * @param {string} dateKey - Date key
     * @returns {HTMLElement}
     */
    function createDayColumn(day, dateKey) {
        const column = document.createElement('div');
        column.className = 'day-column';
        if (day.isWeekend) {
            column.classList.add('weekend');
        }
        
        column.innerHTML = `
            <div class="day-header">
                <div class="day-name">${day.dayNameShort}</div>
                <div class="day-date">${day.dayNumber}</div>
                <div class="day-month">${day.monthNameShort}</div>
            </div>
            <div class="day-shifts">
                ${createShiftSlot(dateKey, 'shift1', day.shifts.shift1)}
                ${createShiftSlot(dateKey, 'shift2', day.shifts.shift2)}
                ${createShiftSlot(dateKey, 'shift3', day.shifts.shift3)}
            </div>
        `;
        
        // Add drag and drop to shift slots
        column.querySelectorAll('.shift-slot').forEach(slot => {
            setupShiftSlotEvents(slot);
        });
        
        return column;
    }

    /**
     * Create shift slot HTML
     * @param {string} dateKey - Date key
     * @param {string} shiftId - Shift ID
     * @param {Object} shift - Shift data
     * @returns {string} HTML string
     */
    function createShiftSlot(dateKey, shiftId, shift) {
        const timeRange = `${DateUtils.formatTime12h(shift.start)} - ${DateUtils.formatTime12h(shift.end)}`;
        const shiftNumber = shiftId.replace('shift', '');
        const employees = ScheduleManager.getEmployees();
        
        let contentHTML = '';
        
        if (shift.employee) {
            contentHTML = `
                <div class="assigned-employee" draggable="true" data-employee="${shift.employee}">
                    <span>${shift.employee}</span>
                    <button class="remove-assignment" title="Remove assignment">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            // Create dropdown
            const options = employees.map(emp => `<option value="${emp}">${emp}</option>`).join('');
            contentHTML = `
                <select class="employee-select">
                    <option value="">Select...</option>
                    ${options}
                </select>
            `;
        }
        
        return `
            <div class="shift-slot ${shiftId}-slot" data-date="${dateKey}" data-shift="${shiftId}">
                <div class="slot-header">
                    <span class="slot-time">${timeRange}</span>
                    <span class="slot-number">S${shiftNumber}</span>
                </div>
                ${contentHTML}
            </div>
        `;
    }

    /**
     * Setup shift slot events
     * @param {HTMLElement} slot - Shift slot element
     */
    function setupShiftSlotEvents(slot) {
        const dateKey = slot.dataset.date;
        const shiftId = slot.dataset.shift;
        
        // Dropdown change
        const select = slot.querySelector('.employee-select');
        if (select) {
            select.addEventListener('change', (e) => {
                const employeeName = e.target.value;
                if (employeeName) {
                    ScheduleManager.assignEmployee(dateKey, shiftId, employeeName);
                    refreshShiftSlot(slot);
                }
            });
        }
        
        // Remove button
        const removeBtn = slot.querySelector('.remove-assignment');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                ScheduleManager.removeEmployee(dateKey, shiftId);
                refreshShiftSlot(slot);
            });
        }
        
        // Drag and drop
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.classList.add('drag-over');
        });
        
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            
            const employeeName = e.dataTransfer.getData('text/plain');
            if (employeeName) {
                ScheduleManager.assignEmployee(dateKey, shiftId, employeeName);
                refreshShiftSlot(slot);
            }
        });
        
        // Make assigned employee draggable
        const assignedEmployee = slot.querySelector('.assigned-employee');
        if (assignedEmployee) {
            assignedEmployee.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', assignedEmployee.dataset.employee);
            });
        }
    }

    /**
     * Refresh a single shift slot
     * @param {HTMLElement} slot - Shift slot element
     */
    function refreshShiftSlot(slot) {
        const dateKey = slot.dataset.date;
        const shiftId = slot.dataset.shift;
        const schedule = ScheduleManager.getCurrentSchedule();
        
        if (!schedule || !schedule.days[dateKey]) return;
        
        const shift = schedule.days[dateKey].shifts[shiftId];
        const timeRange = `${DateUtils.formatTime12h(shift.start)} - ${DateUtils.formatTime12h(shift.end)}`;
        const shiftNumber = shiftId.replace('shift', '');
        const employees = ScheduleManager.getEmployees();
        
        let contentHTML = '';
        
        if (shift.employee) {
            contentHTML = `
                <div class="assigned-employee" draggable="true" data-employee="${shift.employee}">
                    <span>${shift.employee}</span>
                    <button class="remove-assignment" title="Remove assignment">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            const options = employees.map(emp => `<option value="${emp}">${emp}</option>`).join('');
            contentHTML = `
                <select class="employee-select">
                    <option value="">Select...</option>
                    ${options}
                </select>
            `;
        }
        
        slot.innerHTML = `
            <div class="slot-header">
                <span class="slot-time">${timeRange}</span>
                <span class="slot-number">S${shiftNumber}</span>
            </div>
            ${contentHTML}
        `;
        
        setupShiftSlotEvents(slot);
    }

    /**
     * Update all schedule dropdowns with current employees
     */
    function updateScheduleDropdowns() {
        const schedule = ScheduleManager.getCurrentSchedule();
        if (!schedule) return;
        
        const slots = elements.scheduleGrid.querySelectorAll('.shift-slot');
        slots.forEach(slot => {
            refreshShiftSlot(slot);
        });
    }

    /**
     * Handle shift config change
     */
    function handleShiftConfigChange() {
        ScheduleManager.updateShiftConfig('shift1', {
            start: elements.shift1Start.value,
            end: elements.shift1End.value
        });
        
        ScheduleManager.updateShiftConfig('shift2', {
            start: elements.shift2Start.value,
            end: elements.shift2End.value
        });
        
        ScheduleManager.updateShiftConfig('shift3', {
            start: elements.shift3Start.value,
            end: elements.shift3End.value
        });
        
        // Re-render schedule if exists
        const schedule = ScheduleManager.getCurrentSchedule();
        if (schedule) {
            renderSchedule(schedule);
        }
    }

    /**
     * Handle save schedule
     */
    function handleSaveSchedule() {
        const schedule = ScheduleManager.getCurrentSchedule();
        if (!schedule) {
            showToast('No schedule to save. Generate one first.', 'warning');
            return;
        }
        
        if (ScheduleManager.saveCurrentSchedule()) {
            showToast('Schedule saved successfully!', 'success');
        } else {
            showToast('Error saving schedule', 'error');
        }
    }

    /**
     * Handle open load modal
     */
    function handleOpenLoadModal() {
        const schedules = ScheduleManager.getSavedSchedules();
        
        if (schedules.length === 0) {
            elements.savedSchedulesList.innerHTML = `
                <div class="no-saved-schedules">
                    <p>No saved schedules found</p>
                </div>
            `;
        } else {
            elements.savedSchedulesList.innerHTML = schedules.map(schedule => `
                <div class="saved-schedule-item" data-id="${schedule.id}">
                    <div class="saved-schedule-info">
                        <h4>${schedule.name}</h4>
                        <p>Saved: ${new Date(schedule.savedAt).toLocaleDateString()}</p>
                    </div>
                    <div class="saved-schedule-actions">
                        <button class="btn btn-secondary load-btn">Load</button>
                        <button class="btn btn-secondary delete-btn" style="color: var(--error);">Delete</button>
                    </div>
                </div>
            `).join('');
            
            // Bind events
            elements.savedSchedulesList.querySelectorAll('.saved-schedule-item').forEach(item => {
                const id = item.dataset.id;
                
                item.querySelector('.load-btn').addEventListener('click', () => {
                    const schedule = ScheduleManager.loadSchedule(id);
                    if (schedule) {
                        renderSchedule(schedule);
                        closeModal(elements.loadModal);
                        showToast('Schedule loaded successfully!', 'success');
                    }
                });
                
                item.querySelector('.delete-btn').addEventListener('click', () => {
                    if (ScheduleManager.deleteSchedule(id)) {
                        item.remove();
                        showToast('Schedule deleted', 'info');
                        
                        // Check if list is empty
                        if (elements.savedSchedulesList.children.length === 0) {
                            elements.savedSchedulesList.innerHTML = `
                                <div class="no-saved-schedules">
                                    <p>No saved schedules found</p>
                                </div>
                            `;
                        }
                    }
                });
            });
        }
        
        openModal(elements.loadModal);
    }

    /**
     * Handle open export modal
     */
    function handleOpenExportModal() {
        const schedule = ScheduleManager.getCurrentSchedule();
        if (!schedule) {
            showToast('No schedule to export. Generate one first.', 'warning');
            return;
        }
        
        openModal(elements.exportModal);
    }

    /**
     * Open modal
     * @param {HTMLElement} modal
     */
    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     * @param {HTMLElement} modal
     */
    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
            error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
            warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
            info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
        };
        
        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${icons[type]}
            </svg>
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        elements.toastContainer.appendChild(toast);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'toastSlideOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    /**
     * Get schedule grid element (for export)
     * @returns {HTMLElement}
     */
    function getScheduleGrid() {
        return elements.scheduleGrid;
    }

    // Public API
    return {
        init,
        showToast,
        renderSchedule,
        getScheduleGrid,
        openModal,
        closeModal
    };
})();
