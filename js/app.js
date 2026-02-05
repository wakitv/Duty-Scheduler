/**
 * Duty Schedule Maker - Complete PWA Application
 * All modules combined for better offline caching
 * Version 2.0 - Blue/White Theme
 */

(function() {
    'use strict';

    // ============================================
    // DATE UTILITIES
    // ============================================
    const DateUtils = {
        DAY_NAMES: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        DAY_NAMES_SHORT: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        MONTH_NAMES: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        MONTH_NAMES_SHORT: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

        parseDate(dateString) {
            if (!dateString) return new Date();
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day);
        },

        formatDateISO(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        getDayName(date, short = false) {
            return short ? this.DAY_NAMES_SHORT[date.getDay()] : this.DAY_NAMES[date.getDay()];
        },

        getMonthName(date, short = false) {
            return short ? this.MONTH_NAMES_SHORT[date.getMonth()] : this.MONTH_NAMES[date.getMonth()];
        },

        isMonday(date) {
            return date.getDay() === 1;
        },

        getNearestMonday(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            d.setDate(d.getDate() + diff);
            return d;
        },

        addDays(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        },

        generateWeekDates(startDate) {
            let start = typeof startDate === 'string' ? this.parseDate(startDate) : new Date(startDate);
            if (!this.isMonday(start)) start = this.getNearestMonday(start);

            const weekDates = [];
            for (let i = 0; i < 7; i++) {
                const currentDate = this.addDays(start, i);
                weekDates.push({
                    date: currentDate,
                    dateISO: this.formatDateISO(currentDate),
                    dayNumber: currentDate.getDate(),
                    dayName: this.getDayName(currentDate),
                    dayNameShort: this.getDayName(currentDate, true),
                    monthName: this.getMonthName(currentDate),
                    monthNameShort: this.getMonthName(currentDate, true),
                    year: currentDate.getFullYear(),
                    isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
                    dayIndex: i
                });
            }
            return weekDates;
        },

        formatTime12h(time24) {
            if (!time24) return '';
            const [hours, minutes] = time24.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12;
            return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
        },

        getCurrentWeekMonday() {
            return this.getNearestMonday(new Date());
        },

        getWeekNumber(date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        },

        formatWeekRange(startDate) {
            const endDate = this.addDays(startDate, 6);
            const startMonth = this.getMonthName(startDate, true);
            const endMonth = this.getMonthName(endDate, true);
            if (startMonth === endMonth) {
                return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`;
            }
            return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${endDate.getFullYear()}`;
        }
    };

    // ============================================
    // STORAGE MODULE
    // ============================================
    const Storage = {
        KEYS: {
            SCHEDULES: 'dutyScheduler_schedules',
            EMPLOYEES: 'dutyScheduler_employees',
            SETTINGS: 'dutyScheduler_settings'
        },

        isAvailable() {
            try {
                const test = '__test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },

        get(key, defaultValue = null) {
            if (!this.isAvailable()) return defaultValue;
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },

        set(key, value) {
            if (!this.isAvailable()) return false;
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },

        getSchedules() {
            return this.get(this.KEYS.SCHEDULES, []);
        },

        saveSchedule(schedule) {
            const schedules = this.getSchedules();
            if (!schedule.id) schedule.id = this.generateId();
            schedule.savedAt = new Date().toISOString();
            
            const idx = schedules.findIndex(s => s.id === schedule.id);
            if (idx !== -1) schedules[idx] = schedule;
            else schedules.unshift(schedule);
            
            return this.set(this.KEYS.SCHEDULES, schedules.slice(0, 50));
        },

        deleteSchedule(id) {
            const schedules = this.getSchedules().filter(s => s.id !== id);
            return this.set(this.KEYS.SCHEDULES, schedules);
        },

        getScheduleById(id) {
            return this.getSchedules().find(s => s.id === id) || null;
        },

        getEmployees() {
            return this.get(this.KEYS.EMPLOYEES, []);
        },

        saveEmployees(employees) {
            return this.set(this.KEYS.EMPLOYEES, employees);
        },

        getSettings() {
            const defaults = {
                shifts: {
                    shift1: { start: '12:00', end: '20:00' },
                    shift2: { start: '20:00', end: '04:00' },
                    shift3: { start: '04:00', end: '12:00' }
                }
            };
            return { ...defaults, ...this.get(this.KEYS.SETTINGS, {}) };
        },

        saveSettings(settings) {
            return this.set(this.KEYS.SETTINGS, settings);
        },

        generateId() {
            return 'sch_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        }
    };

    // ============================================
    // SCHEDULE MANAGER
    // ============================================
    const ScheduleManager = {
        currentSchedule: null,
        employees: [],
        shiftConfig: {
            shift1: { start: '12:00', end: '20:00' },
            shift2: { start: '20:00', end: '04:00' },
            shift3: { start: '04:00', end: '12:00' }
        },

        init() {
            this.employees = Storage.getEmployees();
            const settings = Storage.getSettings();
            if (settings.shifts) this.shiftConfig = settings.shifts;
        },

        createSchedule(startDate, name = '') {
            const weekDates = DateUtils.generateWeekDates(startDate);
            const adjustedStart = DateUtils.getNearestMonday(DateUtils.parseDate(startDate));
            
            if (!name) {
                name = `Week ${DateUtils.getWeekNumber(adjustedStart)} - ${DateUtils.formatWeekRange(adjustedStart)}`;
            }

            const schedule = {
                id: Storage.generateId(),
                name: name,
                startDate: weekDates[0].dateISO,
                endDate: weekDates[6].dateISO,
                createdAt: new Date().toISOString(),
                daysOrder: weekDates.map(d => d.dateISO),
                days: {}
            };

            weekDates.forEach(dayInfo => {
                schedule.days[dayInfo.dateISO] = {
                    ...dayInfo,
                    shifts: {
                        shift1: { employee: null, ...this.shiftConfig.shift1 },
                        shift2: { employee: null, ...this.shiftConfig.shift2 },
                        shift3: { employee: null, ...this.shiftConfig.shift3 }
                    }
                };
            });

            this.currentSchedule = schedule;
            return schedule;
        },

        getCurrentSchedule() { return this.currentSchedule; },
        setCurrentSchedule(schedule) { this.currentSchedule = schedule; },

        getOrderedDays() {
            if (!this.currentSchedule) return [];
            if (this.currentSchedule.daysOrder?.length > 0) {
                return this.currentSchedule.daysOrder.map(dateKey => this.currentSchedule.days[dateKey]);
            }
            return Object.values(this.currentSchedule.days).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
        },

        assignEmployee(date, shiftId, employeeName) {
            if (!this.currentSchedule?.days[date]) return false;
            this.currentSchedule.days[date].shifts[shiftId].employee = employeeName;
            return true;
        },

        removeEmployee(date, shiftId) {
            return this.assignEmployee(date, shiftId, null);
        },

        addEmployee(name) {
            const trimmed = name.trim();
            if (!trimmed) return false;
            if (this.employees.some(e => e.toLowerCase() === trimmed.toLowerCase())) return false;
            this.employees.push(trimmed);
            Storage.saveEmployees(this.employees);
            return true;
        },

        removeEmployeeFromList(name) {
            const idx = this.employees.indexOf(name);
            if (idx === -1) return false;
            this.employees.splice(idx, 1);
            Storage.saveEmployees(this.employees);
            return true;
        },

        getEmployees() { return [...this.employees]; },

        updateShiftConfig(shiftId, config) {
            if (!this.shiftConfig[shiftId]) return;
            this.shiftConfig[shiftId] = { ...this.shiftConfig[shiftId], ...config };
            Storage.saveSettings({ shifts: this.shiftConfig });
            
            if (this.currentSchedule) {
                this.getOrderedDays().forEach(day => {
                    if (this.currentSchedule.days[day.dateISO]) {
                        const shift = this.currentSchedule.days[day.dateISO].shifts[shiftId];
                        shift.start = config.start || shift.start;
                        shift.end = config.end || shift.end;
                    }
                });
            }
        },

        getShiftConfig() { return { ...this.shiftConfig }; },

        saveCurrentSchedule() {
            return this.currentSchedule ? Storage.saveSchedule(this.currentSchedule) : false;
        },

        loadSchedule(id) {
            const schedule = Storage.getScheduleById(id);
            if (schedule) this.currentSchedule = schedule;
            return schedule;
        },

        getSavedSchedules() { return Storage.getSchedules(); },

        deleteSchedule(id) {
            const result = Storage.deleteSchedule(id);
            if (result && this.currentSchedule?.id === id) this.currentSchedule = null;
            return result;
        },

        getScheduleStats() {
            if (!this.currentSchedule) return null;
            const stats = { totalShifts: 21, assignedShifts: 0, unassignedShifts: 0 };
            this.getOrderedDays().forEach(day => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    if (day.shifts[shiftId].employee) stats.assignedShifts++;
                    else stats.unassignedShifts++;
                });
            });
            return stats;
        },

        autoFillSchedule() {
            if (!this.currentSchedule || this.employees.length === 0) return false;
            let idx = 0;
            this.getOrderedDays().forEach(day => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    this.currentSchedule.days[day.dateISO].shifts[shiftId].employee = this.employees[idx];
                    idx = (idx + 1) % this.employees.length;
                });
            });
            return true;
        },

        clearAssignments() {
            if (!this.currentSchedule) return false;
            this.getOrderedDays().forEach(day => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    this.currentSchedule.days[day.dateISO].shifts[shiftId].employee = null;
                });
            });
            return true;
        }
    };

    // ============================================
    // UI CONTROLLER
    // ============================================
    const UI = {
        elements: {},

        init() {
            this.cacheElements();
            this.bindEvents();
            this.initDate();
            this.loadEmployees();
            this.loadShiftConfig();
            this.setupTabs();
            this.updateEmployeeEmptyState();
        },

        cacheElements() {
            const ids = [
                'startDate', 'scheduleName', 'generateBtn', 'saveScheduleBtn', 'loadScheduleBtn',
                'exportBtn', 'employeeName', 'addEmployeeBtn', 'employeeList', 'employeeEmpty',
                'scheduleContainer', 'scheduleGrid', 'emptyState', 'scheduleTitle', 'toastContainer',
                'shift1Start', 'shift1End', 'shift2Start', 'shift2End', 'shift3Start', 'shift3End',
                'autoFillBtn', 'clearAllBtn', 'statsPanel', 'assignedShifts', 'unassignedShifts',
                'exportModal', 'loadModal', 'closeExportModal', 'closeLoadModal', 'savedSchedulesList',
                'downloadImageBtn', 'copyTextBtn', 'configPanel', 'scheduleSection',
                'offlineIndicator', 'installPrompt', 'installAccept', 'installDismiss'
            ];
            ids.forEach(id => this.elements[id] = document.getElementById(id));
            this.elements.tabBtns = document.querySelectorAll('.tab-btn');
            this.elements.modalOverlays = document.querySelectorAll('.modal-overlay');
        },

        bindEvents() {
            const e = this.elements;
            
            e.generateBtn?.addEventListener('click', () => this.handleGenerate());
            e.addEmployeeBtn?.addEventListener('click', () => this.handleAddEmployee());
            e.employeeName?.addEventListener('keypress', (ev) => { if (ev.key === 'Enter') this.handleAddEmployee(); });
            e.autoFillBtn?.addEventListener('click', () => this.handleAutoFill());
            e.clearAllBtn?.addEventListener('click', () => this.handleClearAll());
            e.saveScheduleBtn?.addEventListener('click', () => this.handleSave());
            e.loadScheduleBtn?.addEventListener('click', () => this.openLoadModal());
            e.exportBtn?.addEventListener('click', () => this.openExportModal());
            e.closeExportModal?.addEventListener('click', () => this.closeModal(e.exportModal));
            e.closeLoadModal?.addEventListener('click', () => this.closeModal(e.loadModal));
            e.downloadImageBtn?.addEventListener('click', () => { this.closeModal(e.exportModal); ExportManager.downloadImage(); });
            e.copyTextBtn?.addEventListener('click', () => { this.closeModal(e.exportModal); ExportManager.copyToClipboard(); });
            
            e.modalOverlays?.forEach(overlay => {
                overlay.addEventListener('click', () => {
                    this.closeModal(overlay.closest('.modal'));
                });
            });

            [e.shift1Start, e.shift1End, e.shift2Start, e.shift2End, e.shift3Start, e.shift3End].forEach(input => {
                input?.addEventListener('change', () => this.handleShiftConfigChange());
            });

            e.startDate?.addEventListener('change', () => this.handleDateChange());
        },

        setupTabs() {
            this.elements.tabBtns?.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.dataset.tab;
                    this.elements.tabBtns.forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-selected', 'false');
                    });
                    btn.classList.add('active');
                    btn.setAttribute('aria-selected', 'true');
                    
                    if (tab === 'config') {
                        this.elements.configPanel?.classList.add('active');
                        this.elements.scheduleSection?.classList.remove('active');
                    } else {
                        this.elements.configPanel?.classList.remove('active');
                        this.elements.scheduleSection?.classList.add('active');
                    }
                });
            });
            
            if (window.innerWidth < 768) {
                this.elements.configPanel?.classList.add('active');
                this.elements.scheduleSection?.classList.remove('active');
            }
        },

        initDate() {
            const monday = DateUtils.getCurrentWeekMonday();
            if (this.elements.startDate) {
                this.elements.startDate.value = DateUtils.formatDateISO(monday);
            }
        },

        loadEmployees() {
            ScheduleManager.getEmployees().forEach(name => this.renderEmployee(name));
        },

        loadShiftConfig() {
            const config = ScheduleManager.getShiftConfig();
            const e = this.elements;
            if (e.shift1Start) e.shift1Start.value = config.shift1.start;
            if (e.shift1End) e.shift1End.value = config.shift1.end;
            if (e.shift2Start) e.shift2Start.value = config.shift2.start;
            if (e.shift2End) e.shift2End.value = config.shift2.end;
            if (e.shift3Start) e.shift3Start.value = config.shift3.start;
            if (e.shift3End) e.shift3End.value = config.shift3.end;
        },

        handleDateChange() {
            const date = DateUtils.parseDate(this.elements.startDate.value);
            if (!DateUtils.isMonday(date)) {
                const monday = DateUtils.getNearestMonday(date);
                this.elements.startDate.value = DateUtils.formatDateISO(monday);
                this.showToast('Adjusted to Monday', 'info');
            }
        },

        handleGenerate() {
            const startDate = this.elements.startDate?.value;
            if (!startDate) { this.showToast('Select a start date', 'error'); return; }
            
            const schedule = ScheduleManager.createSchedule(startDate, this.elements.scheduleName?.value?.trim());
            this.renderSchedule(schedule);
            this.updateStats();
            this.showToast('Schedule created!', 'success');
            
            if (window.innerWidth < 768) {
                this.switchToTab('schedule');
            }
        },

        switchToTab(tabName) {
            this.elements.tabBtns?.forEach(btn => {
                const isTarget = btn.dataset.tab === tabName;
                btn.classList.toggle('active', isTarget);
                btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
            });
            this.elements.configPanel?.classList.toggle('active', tabName === 'config');
            this.elements.scheduleSection?.classList.toggle('active', tabName === 'schedule');
        },

        handleAddEmployee() {
            const name = this.elements.employeeName?.value?.trim();
            if (!name) { this.showToast('Enter a name', 'error'); return; }
            
            if (ScheduleManager.addEmployee(name)) {
                this.renderEmployee(name);
                this.elements.employeeName.value = '';
                this.updateScheduleDropdowns();
                this.updateEmployeeEmptyState();
                this.showToast(`${name} added`, 'success');
            } else {
                this.showToast('Already exists', 'warning');
            }
        },

        handleRemoveEmployee(name) {
            if (ScheduleManager.removeEmployeeFromList(name)) {
                const item = this.elements.employeeList?.querySelector(`[data-employee="${CSS.escape(name)}"]`);
                if (item) item.remove();
                this.updateScheduleDropdowns();
                this.updateEmployeeEmptyState();
                this.showToast(`${name} removed`, 'info');
            }
        },

        updateEmployeeEmptyState() {
            const isEmpty = ScheduleManager.getEmployees().length === 0;
            this.elements.employeeEmpty?.classList.toggle('hidden', !isEmpty);
        },

        handleAutoFill() {
            if (!ScheduleManager.getCurrentSchedule()) { this.showToast('Create schedule first', 'warning'); return; }
            if (ScheduleManager.getEmployees().length === 0) { this.showToast('Add team members first', 'warning'); return; }
            
            if (ScheduleManager.autoFillSchedule()) {
                this.renderSchedule(ScheduleManager.getCurrentSchedule());
                this.updateStats();
                this.showToast('Auto-filled!', 'success');
            }
        },

        handleClearAll() {
            if (!ScheduleManager.getCurrentSchedule()) { this.showToast('No schedule', 'warning'); return; }
            if (ScheduleManager.clearAssignments()) {
                this.renderSchedule(ScheduleManager.getCurrentSchedule());
                this.updateStats();
                this.showToast('Cleared', 'info');
            }
        },

        handleShiftConfigChange() {
            const e = this.elements;
            ScheduleManager.updateShiftConfig('shift1', { start: e.shift1Start?.value, end: e.shift1End?.value });
            ScheduleManager.updateShiftConfig('shift2', { start: e.shift2Start?.value, end: e.shift2End?.value });
            ScheduleManager.updateShiftConfig('shift3', { start: e.shift3Start?.value, end: e.shift3End?.value });
            
            if (ScheduleManager.getCurrentSchedule()) {
                this.renderSchedule(ScheduleManager.getCurrentSchedule());
            }
        },

        handleSave() {
            if (!ScheduleManager.getCurrentSchedule()) { this.showToast('No schedule to save', 'warning'); return; }
            if (ScheduleManager.saveCurrentSchedule()) this.showToast('Saved!', 'success');
            else this.showToast('Save failed', 'error');
        },

        renderEmployee(name) {
            const item = document.createElement('div');
            item.className = 'employee-item';
            item.setAttribute('data-employee', name);
            item.setAttribute('role', 'listitem');
            item.innerHTML = `
                <span class="employee-name">${this.escapeHtml(name)}</span>
                <button class="employee-delete" aria-label="Remove ${this.escapeHtml(name)}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            item.querySelector('.employee-delete').addEventListener('click', () => this.handleRemoveEmployee(name));
            this.elements.employeeList?.appendChild(item);
        },

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        renderSchedule(schedule) {
            this.elements.emptyState?.classList.add('hidden');
            this.elements.scheduleGrid?.classList.add('active');
            if (this.elements.scheduleGrid) this.elements.scheduleGrid.innerHTML = '';
            if (this.elements.scheduleTitle) this.elements.scheduleTitle.textContent = schedule.name;
            
            ScheduleManager.getOrderedDays().forEach(day => {
                this.elements.scheduleGrid?.appendChild(this.createDayColumn(day));
            });
        },

        createDayColumn(day) {
            const col = document.createElement('div');
            col.className = 'day-column' + (day.isWeekend ? ' weekend' : '');
            col.innerHTML = `
                <div class="day-header">
                    <div class="day-name">${day.dayNameShort}</div>
                    <div class="day-date">${day.dayNumber}</div>
                    <div class="day-month">${day.monthNameShort}</div>
                </div>
                <div class="day-shifts">
                    ${this.createShiftSlot(day.dateISO, 'shift1', day.shifts.shift1)}
                    ${this.createShiftSlot(day.dateISO, 'shift2', day.shifts.shift2)}
                    ${this.createShiftSlot(day.dateISO, 'shift3', day.shifts.shift3)}
                </div>
            `;
            col.querySelectorAll('.shift-slot').forEach(slot => this.setupSlotEvents(slot));
            return col;
        },

        createShiftSlot(dateKey, shiftId, shift) {
            const time = `${DateUtils.formatTime12h(shift.start)} - ${DateUtils.formatTime12h(shift.end)}`;
            const num = shiftId.replace('shift', '');
            const employees = ScheduleManager.getEmployees();
            
            let content = '';
            if (shift.employee) {
                content = `<div class="assigned-employee">
                    <span>${this.escapeHtml(shift.employee)}</span>
                    <button class="remove-btn" aria-label="Remove assignment"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>`;
            } else {
                content = `<select class="employee-select" aria-label="Assign employee"><option value="">Select...</option>${employees.map(e => `<option value="${this.escapeHtml(e)}">${this.escapeHtml(e)}</option>`).join('')}</select>`;
            }
            
            return `<div class="shift-slot ${shiftId}-slot" data-date="${dateKey}" data-shift="${shiftId}">
                <div class="slot-header"><span class="slot-time">${time}</span><span class="slot-number">S${num}</span></div>
                ${content}
            </div>`;
        },

        setupSlotEvents(slot) {
            const dateKey = slot.dataset.date;
            const shiftId = slot.dataset.shift;
            
            const select = slot.querySelector('.employee-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    if (e.target.value) {
                        ScheduleManager.assignEmployee(dateKey, shiftId, e.target.value);
                        this.refreshSlot(slot);
                        this.updateStats();
                    }
                });
            }
            
            const removeBtn = slot.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    ScheduleManager.removeEmployee(dateKey, shiftId);
                    this.refreshSlot(slot);
                    this.updateStats();
                });
            }
        },

        refreshSlot(slot) {
            const dateKey = slot.dataset.date;
            const shiftId = slot.dataset.shift;
            const schedule = ScheduleManager.getCurrentSchedule();
            if (!schedule?.days[dateKey]) return;
            
            const shift = schedule.days[dateKey].shifts[shiftId];
            const time = `${DateUtils.formatTime12h(shift.start)} - ${DateUtils.formatTime12h(shift.end)}`;
            const num = shiftId.replace('shift', '');
            const employees = ScheduleManager.getEmployees();
            
            let content = '';
            if (shift.employee) {
                content = `<div class="assigned-employee">
                    <span>${this.escapeHtml(shift.employee)}</span>
                    <button class="remove-btn" aria-label="Remove assignment"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>`;
            } else {
                content = `<select class="employee-select" aria-label="Assign employee"><option value="">Select...</option>${employees.map(e => `<option value="${this.escapeHtml(e)}">${this.escapeHtml(e)}</option>`).join('')}</select>`;
            }
            
            slot.innerHTML = `<div class="slot-header"><span class="slot-time">${time}</span><span class="slot-number">S${num}</span></div>${content}`;
            this.setupSlotEvents(slot);
        },

        updateScheduleDropdowns() {
            if (!ScheduleManager.getCurrentSchedule()) return;
            this.elements.scheduleGrid?.querySelectorAll('.shift-slot').forEach(slot => this.refreshSlot(slot));
        },

        updateStats() {
            const stats = ScheduleManager.getScheduleStats();
            if (!stats) return;
            if (this.elements.assignedShifts) this.elements.assignedShifts.textContent = stats.assignedShifts;
            if (this.elements.unassignedShifts) this.elements.unassignedShifts.textContent = stats.unassignedShifts;
        },

        openLoadModal() {
            const schedules = ScheduleManager.getSavedSchedules();
            const list = this.elements.savedSchedulesList;
            if (!list) return;
            
            if (schedules.length === 0) {
                list.innerHTML = '<div class="no-saved-schedules"><p>No saved schedules</p></div>';
            } else {
                list.innerHTML = schedules.map(s => `
                    <div class="saved-schedule-item" data-id="${s.id}">
                        <div class="saved-schedule-info">
                            <h4>${this.escapeHtml(s.name)}</h4>
                            <p>${new Date(s.savedAt).toLocaleDateString()}</p>
                        </div>
                        <div class="saved-schedule-actions">
                            <button class="btn btn-secondary load-btn" type="button">Load</button>
                            <button class="btn btn-secondary delete-btn" type="button" style="color:var(--error)">Delete</button>
                        </div>
                    </div>
                `).join('');
                
                list.querySelectorAll('.saved-schedule-item').forEach(item => {
                    const id = item.dataset.id;
                    item.querySelector('.load-btn')?.addEventListener('click', () => {
                        const schedule = ScheduleManager.loadSchedule(id);
                        if (schedule) {
                            this.renderSchedule(schedule);
                            this.updateStats();
                            this.closeModal(this.elements.loadModal);
                            this.showToast('Loaded!', 'success');
                        }
                    });
                    item.querySelector('.delete-btn')?.addEventListener('click', () => {
                        if (ScheduleManager.deleteSchedule(id)) {
                            item.remove();
                            this.showToast('Deleted', 'info');
                            if (!list.querySelector('.saved-schedule-item')) {
                                list.innerHTML = '<div class="no-saved-schedules"><p>No saved schedules</p></div>';
                            }
                        }
                    });
                });
            }
            this.openModal(this.elements.loadModal);
        },

        openExportModal() {
            if (!ScheduleManager.getCurrentSchedule()) { this.showToast('Create schedule first', 'warning'); return; }
            this.openModal(this.elements.exportModal);
        },

        openModal(modal) {
            modal?.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closeModal(modal) {
            modal?.classList.remove('active');
            document.body.style.overflow = '';
        },

        showToast(message, type = 'info') {
            const icons = {
                success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
                error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
                warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
                info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
            };
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[type]}</svg>
                <span class="toast-message">${this.escapeHtml(message)}</span>
                <button class="toast-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            `;
            
            this.elements.toastContainer?.appendChild(toast);
            toast.querySelector('.toast-close')?.addEventListener('click', () => this.removeToast(toast));
            setTimeout(() => this.removeToast(toast), 3000);
        },

        removeToast(toast) {
            if (toast?.parentElement) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }
        }
    };

    // ============================================
    // EXPORT MANAGER
    // ============================================
    const ExportManager = {
        async downloadImage() {
            const schedule = ScheduleManager.getCurrentSchedule();
            if (!schedule) { UI.showToast('No schedule', 'warning'); return; }
            
            if (typeof html2canvas === 'undefined') {
                UI.showToast('Image export requires internet', 'error');
                return;
            }
            
            UI.showToast('Generating image...', 'info');
            
            try {
                const container = this.createExportContainer(schedule);
                document.body.appendChild(container);
                await new Promise(r => setTimeout(r, 200));
                
                const canvas = await html2canvas(container, {
                    backgroundColor: '#0a0a14',
                    scale: 2,
                    useCORS: true,
                    logging: false
                });
                
                document.body.removeChild(container);
                
                const filename = `${this.sanitize(schedule.name)}.jpg`;
                
                // Convert canvas to blob for sharing
                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/jpeg', 0.95);
                });
                
                // Check if on mobile/tablet and Web Share API is available
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                    || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
                
                if (isMobile && navigator.share && navigator.canShare) {
                    // Use Web Share API for mobile - saves directly to gallery
                    const file = new File([blob], filename, { type: 'image/jpeg' });
                    
                    if (navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: schedule.name,
                                text: 'Duty Schedule'
                            });
                            UI.showToast('Image ready to save!', 'success');
                            return;
                        } catch (shareErr) {
                            // User cancelled or share failed, fall back to download
                            if (shareErr.name !== 'AbortError') {
                                console.log('Share failed, falling back to download');
                            }
                        }
                    }
                }
                
                // Fallback: Direct download (for desktop or if share fails)
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                
                // For iOS Safari fallback - open in new tab
                if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !navigator.share) {
                    // Open image in new tab for manual save
                    const imgWindow = window.open('', '_blank');
                    if (imgWindow) {
                        imgWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta name="viewport" content="width=device-width, initial-scale=1">
                                <title>${this.escapeHtml(schedule.name)}</title>
                                <style>
                                    body { margin: 0; padding: 20px; background: #0a0a14; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
                                    img { max-width: 100%; height: auto; border-radius: 8px; }
                                    p { color: #fff; font-family: -apple-system, sans-serif; text-align: center; margin-top: 20px; font-size: 14px; }
                                    .hint { color: #a855f7; font-weight: 600; }
                                </style>
                            </head>
                            <body>
                                <img src="${canvas.toDataURL('image/jpeg', 0.95)}" alt="Schedule">
                                <p><span class="hint">Press and hold</span> the image, then tap <span class="hint">"Add to Photos"</span> to save to your gallery.</p>
                            </body>
                            </html>
                        `);
                        imgWindow.document.close();
                        UI.showToast('Long press image to save', 'info');
                    }
                    URL.revokeObjectURL(url);
                    return;
                }
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                UI.showToast('Image saved!', 'success');
            } catch (err) {
                console.error('Export error:', err);
                UI.showToast('Export failed', 'error');
            }
        },

        createExportContainer(schedule) {
            const days = ScheduleManager.getOrderedDays();
            const container = document.createElement('div');
            container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1100px;padding:30px;background:linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#f0f0f5;';
            
            container.innerHTML = `
                <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #7c3aed;">
                    <img src="logo.png" style="width:50px;height:50px;border-radius:10px;box-shadow:0 0 20px rgba(168,85,247,0.3);" alt="Logo">
                    <div>
                        <h1 style="font-size:22px;font-weight:700;margin:0;background:linear-gradient(135deg, #00d4ff, #a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${this.escapeHtml(schedule.name)}</h1>
                        <p style="font-size:13px;color:#a0a0b8;margin:4px 0 0 0;">Duty Schedule • ${DateUtils.formatWeekRange(DateUtils.parseDate(schedule.startDate))}</p>
                    </div>
                </div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                    <thead>
                        <tr>
                            <th style="background:linear-gradient(135deg, #7c3aed, #0891b2);color:#fff;padding:12px 10px;text-align:left;font-size:12px;border:1px solid #252538;">Day / Date</th>
                            <th style="background:#22c55e;color:#fff;padding:12px 10px;text-align:center;font-size:12px;border:1px solid #252538;">Shift 1 (Day)</th>
                            <th style="background:#a855f7;color:#fff;padding:12px 10px;text-align:center;font-size:12px;border:1px solid #252538;">Shift 2 (Night)</th>
                            <th style="background:#00d4ff;color:#0a0a14;padding:12px 10px;text-align:center;font-size:12px;border:1px solid #252538;">Shift 3 (Morning)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${days.map((day, i) => {
                            const bg = i % 2 === 0 ? '#151525' : '#1a1a2e';
                            const s1 = day.shifts.shift1, s2 = day.shifts.shift2, s3 = day.shifts.shift3;
                            return `<tr>
                                <td style="background:#12121f;padding:14px 10px;border:1px solid #252538;"><strong style="color:#00d4ff;">${day.dayName}</strong><br><span style="font-size:12px;color:#6b6b80;">${day.monthNameShort} ${day.dayNumber}, ${day.year}</span></td>
                                <td style="background:${bg};padding:14px 10px;text-align:center;border:1px solid #252538;border-left:3px solid #22c55e;"><div style="font-size:10px;color:#6b6b80;">${DateUtils.formatTime12h(s1.start)} - ${DateUtils.formatTime12h(s1.end)}</div><div style="font-size:14px;font-weight:600;color:${s1.employee ? '#f0f0f5' : '#6b6b80'};">${s1.employee || '—'}</div></td>
                                <td style="background:${bg};padding:14px 10px;text-align:center;border:1px solid #252538;border-left:3px solid #a855f7;"><div style="font-size:10px;color:#6b6b80;">${DateUtils.formatTime12h(s2.start)} - ${DateUtils.formatTime12h(s2.end)}</div><div style="font-size:14px;font-weight:600;color:${s2.employee ? '#f0f0f5' : '#6b6b80'};">${s2.employee || '—'}</div></td>
                                <td style="background:${bg};padding:14px 10px;text-align:center;border:1px solid #252538;border-left:3px solid #00d4ff;"><div style="font-size:10px;color:#6b6b80;">${DateUtils.formatTime12h(s3.start)} - ${DateUtils.formatTime12h(s3.end)}</div><div style="font-size:14px;font-weight:600;color:${s3.employee ? '#f0f0f5' : '#6b6b80'};">${s3.employee || '—'}</div></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                <div style="text-align:center;font-size:11px;color:#6b6b80;padding-top:12px;border-top:1px solid #252538;">Generated ${new Date().toLocaleDateString()} • Duty Schedule Maker</div>
            `;
            return container;
        },

        copyToClipboard() {
            const schedule = ScheduleManager.getCurrentSchedule();
            if (!schedule) { UI.showToast('No schedule', 'warning'); return; }
            
            let text = `📅 ${schedule.name}\n${'━'.repeat(24)}\n\n`;
            ScheduleManager.getOrderedDays().forEach(day => {
                text += `📆 ${day.dayName}, ${day.monthNameShort} ${day.dayNumber}\n`;
                [
                    { label: 'Day', data: day.shifts.shift1 },
                    { label: 'Night', data: day.shifts.shift2 },
                    { label: 'Morning', data: day.shifts.shift3 }
                ].forEach(s => {
                    text += `  • ${s.label}: ${s.data.employee || 'Unassigned'}\n`;
                    text += `    ${DateUtils.formatTime12h(s.data.start)} - ${DateUtils.formatTime12h(s.data.end)}\n`;
                });
                text += '\n';
            });
            
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => UI.showToast('Copied!', 'success'))
                    .catch(() => this.fallbackCopy(text));
            } else {
                this.fallbackCopy(text);
            }
        },

        fallbackCopy(text) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                UI.showToast('Copied!', 'success');
            } catch (e) {
                UI.showToast('Copy failed', 'error');
            }
            document.body.removeChild(ta);
        },

        sanitize(name) {
            return name.replace(/[^a-z0-9\s\-_]/gi, '').replace(/\s+/g, '_');
        },

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    // ============================================
    // PWA FEATURES
    // ============================================
    const PWA = {
        deferredPrompt: null,

        init() {
            this.setupOffline();
            this.setupInstall();
            this.setupAutoSave();
            this.setupKeyboard();
        },

        setupOffline() {
            const indicator = document.getElementById('offlineIndicator');
            const update = () => indicator?.classList.toggle('visible', !navigator.onLine);
            window.addEventListener('online', update);
            window.addEventListener('offline', update);
            update();
        },

        setupInstall() {
            const prompt = document.getElementById('installPrompt');
            const accept = document.getElementById('installAccept');
            const dismiss = document.getElementById('installDismiss');
            
            if (window.matchMedia('(display-mode: standalone)').matches) return;
            if (localStorage.getItem('installDismissed')) return;
            
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                setTimeout(() => prompt?.classList.add('visible'), 3000);
            });
            
            accept?.addEventListener('click', async () => {
                if (!this.deferredPrompt) return;
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') UI.showToast('App installed!', 'success');
                this.deferredPrompt = null;
                prompt?.classList.remove('visible');
            });
            
            dismiss?.addEventListener('click', () => {
                prompt?.classList.remove('visible');
                localStorage.setItem('installDismissed', 'true');
            });
            
            window.addEventListener('appinstalled', () => {
                prompt?.classList.remove('visible');
                this.deferredPrompt = null;
            });
        },

        setupAutoSave() {
            const save = () => {
                if (ScheduleManager.getCurrentSchedule()) {
                    ScheduleManager.saveCurrentSchedule();
                }
            };
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') save();
            });
            window.addEventListener('beforeunload', save);
        },

        setupKeyboard() {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    if (ScheduleManager.getCurrentSchedule()) {
                        if (ScheduleManager.saveCurrentSchedule()) UI.showToast('Saved!', 'success');
                    }
                }
                if (e.key === 'Escape') {
                    document.querySelectorAll('.modal.active').forEach(m => UI.closeModal(m));
                }
            });
        }
    };

    // ============================================
    // INITIALIZE APP
    // ============================================
    function init() {
        ScheduleManager.init();
        UI.init();
        PWA.init();
        console.log('✅ Duty Schedule Maker v2.0 initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Global access for debugging
    window.DutyScheduler = { DateUtils, Storage, ScheduleManager, UI, ExportManager, PWA };
})();
