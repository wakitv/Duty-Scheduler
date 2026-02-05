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
            const start = typeof startDate === 'string' ? this.parseDate(startDate) : new Date(startDate);
            const monday = this.isMonday(start) ? start : this.getNearestMonday(start);
            const sunday = this.addDays(monday, 6);
            const weekNum = this.getWeekNumber(monday);
            return `Week ${weekNum} - ${this.getMonthName(monday, true)} ${monday.getDate()} - ${sunday.getDate()}, ${monday.getFullYear()}`;
        }
    };

    // ============================================
    // STORAGE MANAGER
    // ============================================
    const Storage = {
        KEYS: {
            EMPLOYEES: 'dutyScheduler_employees',
            CURRENT: 'dutyScheduler_current',
            SAVED: 'dutyScheduler_saved',
            SHIFT_CONFIG: 'dutyScheduler_shiftConfig'
        },

        get(key) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error('Storage get error:', e);
                return null;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
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
            this.employees = Storage.get(Storage.KEYS.EMPLOYEES) || [];
            this.currentSchedule = Storage.get(Storage.KEYS.CURRENT);
            const savedConfig = Storage.get(Storage.KEYS.SHIFT_CONFIG);
            if (savedConfig) this.shiftConfig = savedConfig;
        },

        getEmployees() {
            return [...this.employees];
        },

        addEmployee(name) {
            const trimmed = name.trim();
            if (!trimmed || this.employees.includes(trimmed)) return false;
            this.employees.push(trimmed);
            Storage.set(Storage.KEYS.EMPLOYEES, this.employees);
            return true;
        },

        removeEmployee(name) {
            const index = this.employees.indexOf(name);
            if (index === -1) return false;
            this.employees.splice(index, 1);
            Storage.set(Storage.KEYS.EMPLOYEES, this.employees);
            return true;
        },

        setShiftConfig(config) {
            this.shiftConfig = { ...this.shiftConfig, ...config };
            Storage.set(Storage.KEYS.SHIFT_CONFIG, this.shiftConfig);
        },

        getShiftConfig() {
            return { ...this.shiftConfig };
        },

        createSchedule(startDate, customName = '') {
            const weekDates = DateUtils.generateWeekDates(startDate);
            const name = customName || DateUtils.formatWeekRange(startDate);

            const days = {};
            weekDates.forEach(day => {
                days[day.dateISO] = {
                    ...day,
                    shifts: {
                        shift1: { ...this.shiftConfig.shift1, employee: null },
                        shift2: { ...this.shiftConfig.shift2, employee: null },
                        shift3: { ...this.shiftConfig.shift3, employee: null }
                    }
                };
            });

            this.currentSchedule = {
                id: Date.now().toString(),
                name,
                startDate: weekDates[0].dateISO,
                endDate: weekDates[6].dateISO,
                createdAt: new Date().toISOString(),
                days
            };

            Storage.set(Storage.KEYS.CURRENT, this.currentSchedule);
            return this.currentSchedule;
        },

        getCurrentSchedule() {
            return this.currentSchedule;
        },

        getOrderedDays() {
            if (!this.currentSchedule) return [];
            return Object.values(this.currentSchedule.days).sort((a, b) => a.dayIndex - b.dayIndex);
        },

        assignEmployee(dateKey, shiftId, employee) {
            if (!this.currentSchedule || !this.currentSchedule.days[dateKey]) return false;
            this.currentSchedule.days[dateKey].shifts[shiftId].employee = employee;
            Storage.set(Storage.KEYS.CURRENT, this.currentSchedule);
            return true;
        },

        removeEmployee(dateKey, shiftId) {
            return this.assignEmployee(dateKey, shiftId, null);
        },

        autoFill() {
            if (!this.currentSchedule || this.employees.length === 0) return false;

            const days = this.getOrderedDays();
            let empIndex = 0;

            days.forEach(day => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    if (!day.shifts[shiftId].employee) {
                        day.shifts[shiftId].employee = this.employees[empIndex % this.employees.length];
                        empIndex++;
                    }
                });
            });

            Storage.set(Storage.KEYS.CURRENT, this.currentSchedule);
            return true;
        },

        clearAllAssignments() {
            if (!this.currentSchedule) return false;

            Object.values(this.currentSchedule.days).forEach(day => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    day.shifts[shiftId].employee = null;
                });
            });

            Storage.set(Storage.KEYS.CURRENT, this.currentSchedule);
            return true;
        },

        saveCurrentSchedule() {
            if (!this.currentSchedule) return false;
            const saved = Storage.get(Storage.KEYS.SAVED) || [];
            const existingIndex = saved.findIndex(s => s.id === this.currentSchedule.id);

            if (existingIndex >= 0) {
                saved[existingIndex] = { ...this.currentSchedule };
            } else {
                saved.unshift({ ...this.currentSchedule });
            }

            Storage.set(Storage.KEYS.SAVED, saved);
            return true;
        },

        getSavedSchedules() {
            return Storage.get(Storage.KEYS.SAVED) || [];
        },

        loadSchedule(id) {
            const saved = this.getSavedSchedules();
            const schedule = saved.find(s => s.id === id);
            if (!schedule) return false;

            this.currentSchedule = { ...schedule };
            Storage.set(Storage.KEYS.CURRENT, this.currentSchedule);
            return true;
        },

        deleteSchedule(id) {
            const saved = this.getSavedSchedules();
            const filtered = saved.filter(s => s.id !== id);
            Storage.set(Storage.KEYS.SAVED, filtered);
            return true;
        },

        getStats() {
            if (!this.currentSchedule) return { assigned: 0, unassigned: 21 };
            let assigned = 0;
            Object.values(this.currentSchedule.days).forEach(day => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    if (day.shifts[shiftId]?.employee) assigned++;
                });
            });
            return { assigned, unassigned: 21 - assigned };
        }
    };

    // ============================================
    // UI MANAGER
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
            this.setupScrollDetection();
        },

        setupScrollDetection() {
            const container = this.elements.scheduleContainer;
            if (!container) return;
            
            const checkScrollEnd = () => {
                const threshold = 10;
                const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - threshold;
                container.classList.toggle('scrolled-end', isAtEnd);
            };
            
            container.addEventListener('scroll', checkScrollEnd, { passive: true });
            window.addEventListener('resize', checkScrollEnd, { passive: true });
            setTimeout(checkScrollEnd, 100);
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
                'offlineIndicator', 'installPrompt', 'installAccept', 'installDismiss',
                'dutyCountsPanel', 'dutyCountsList'
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
        },

        initDate() {
            const monday = DateUtils.getCurrentWeekMonday();
            if (this.elements.startDate) {
                this.elements.startDate.value = DateUtils.formatDateISO(monday);
            }

            if (ScheduleManager.getCurrentSchedule()) {
                this.renderSchedule(ScheduleManager.getCurrentSchedule());
                this.updateStats();
            }
        },

        loadEmployees() {
            this.renderEmployees();
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
            const dateStr = this.elements.startDate?.value;
            if (!dateStr) return;

            const selectedDate = DateUtils.parseDate(dateStr);
            if (!DateUtils.isMonday(selectedDate)) {
                const monday = DateUtils.getNearestMonday(selectedDate);
                this.elements.startDate.value = DateUtils.formatDateISO(monday);
                this.showToast('Adjusted to Monday', 'info');
            }
        },

        handleShiftConfigChange() {
            const e = this.elements;
            ScheduleManager.setShiftConfig({
                shift1: { start: e.shift1Start?.value || '12:00', end: e.shift1End?.value || '20:00' },
                shift2: { start: e.shift2Start?.value || '20:00', end: e.shift2End?.value || '04:00' },
                shift3: { start: e.shift3Start?.value || '04:00', end: e.shift3End?.value || '12:00' }
            });
        },

        handleGenerate() {
            const startDate = this.elements.startDate?.value;
            const customName = this.elements.scheduleName?.value?.trim();

            if (!startDate) {
                this.showToast('Please select a date', 'error');
                return;
            }

            const schedule = ScheduleManager.createSchedule(startDate, customName);
            this.renderSchedule(schedule);
            this.updateStats();
            this.showToast('Schedule created!', 'success');

            // Switch to schedule tab on mobile
            const scheduleTab = document.querySelector('[data-tab="schedule"]');
            if (scheduleTab && window.innerWidth < 768) {
                scheduleTab.click();
            }
        },

        handleAddEmployee() {
            const name = this.elements.employeeName?.value?.trim();
            if (!name) {
                this.showToast('Enter employee name', 'warning');
                return;
            }

            if (ScheduleManager.addEmployee(name)) {
                this.elements.employeeName.value = '';
                this.renderEmployees();
                this.updateEmployeeEmptyState();
                this.showToast(`${name} added!`, 'success');
            } else {
                this.showToast('Employee exists', 'error');
            }
        },

        handleAutoFill() {
            if (ScheduleManager.autoFill()) {
                this.renderSchedule(ScheduleManager.getCurrentSchedule());
                this.updateStats();
                this.showToast('Auto-filled!', 'success');
            } else {
                this.showToast('Add employees first', 'warning');
            }
        },

        handleClearAll() {
            if (ScheduleManager.clearAllAssignments()) {
                this.renderSchedule(ScheduleManager.getCurrentSchedule());
                this.updateStats();
                this.showToast('Cleared all', 'info');
            }
        },

        handleSave() {
            if (ScheduleManager.saveCurrentSchedule()) {
                this.showToast('Schedule saved!', 'success');
            } else {
                this.showToast('Generate schedule first', 'warning');
            }
        },

        updateEmployeeEmptyState() {
            const hasEmployees = ScheduleManager.getEmployees().length > 0;
            this.elements.employeeEmpty?.classList.toggle('visible', !hasEmployees);
        },

        renderEmployees() {
            const employees = ScheduleManager.getEmployees();
            if (!this.elements.employeeList) return;
            this.elements.employeeList.innerHTML = employees.map(emp => `
                <div class="employee-tag">
                    <span>${this.escapeHtml(emp)}</span>
                    <button class="tag-remove" data-employee="${this.escapeHtml(emp)}" aria-label="Remove ${this.escapeHtml(emp)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `).join('');
            
            this.elements.employeeList.querySelectorAll('.tag-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    ScheduleManager.removeEmployee(btn.dataset.employee);
                    this.renderEmployees();
                    this.updateEmployeeEmptyState();
                    this.updateDutyCounts();
                });
            });
            
            this.updateDutyCounts();
        },

        renderSchedule(schedule) {
            this.elements.emptyState?.classList.add('hidden');
            this.elements.scheduleGrid?.classList.add('active');
            if (this.elements.scheduleGrid) this.elements.scheduleGrid.innerHTML = '';
            if (this.elements.scheduleTitle) this.elements.scheduleTitle.textContent = schedule.name;
            
            ScheduleManager.getOrderedDays().forEach(day => {
                this.elements.scheduleGrid?.appendChild(this.createDayColumn(day));
            });

            setTimeout(() => {
                const container = this.elements.scheduleContainer;
                if (container) {
                    const threshold = 10;
                    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - threshold;
                    container.classList.toggle('scrolled-end', isAtEnd);
                }
            }, 50);
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
            const day = schedule.days[dateKey];
            const shift = day.shifts[shiftId];
            
            const newHTML = this.createShiftSlot(dateKey, shiftId, shift);
            const temp = document.createElement('div');
            temp.innerHTML = newHTML;
            const newSlot = temp.firstElementChild;
            
            slot.replaceWith(newSlot);
            this.setupSlotEvents(newSlot);
        },

        updateStats() {
            const schedule = ScheduleManager.getCurrentSchedule();
            if (!schedule) return;
            let assigned = 0, total = 0;
            Object.values(schedule.days).forEach(day => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    total++;
                    if (day.shifts[shiftId]?.employee) assigned++;
                });
            });
            if (this.elements.assignedShifts) this.elements.assignedShifts.textContent = assigned;
            if (this.elements.unassignedShifts) this.elements.unassignedShifts.textContent = total - assigned;
            this.updateDutyCounts();
        },

updateDutyCounts() {
            const panel = this.elements.dutyCountsPanel;
            const list = this.elements.dutyCountsList;
            if (!panel || !list) return;
            
            const schedule = ScheduleManager.getCurrentSchedule();
            const employees = ScheduleManager.getEmployees();
            
            if (!schedule || employees.length === 0) {
                panel.classList.remove('active');
                return;
            }
            
            const counts = {};
            employees.forEach(emp => counts[emp] = 0);
            
            Object.values(schedule.days).forEach(day => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    const employee = day.shifts[shiftId]?.employee;
                    if (employee && counts.hasOwnProperty(employee)) {
                        counts[employee]++;
                    }
                });
            });
            
            const sorted = Object.entries(counts).sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1];
                return a[0].localeCompare(b[0]);
            });
            
            list.innerHTML = sorted.map(([name, count]) => `
                <div class="duty-count-item ${count === 0 ? 'zero' : ''}" data-employee="${this.escapeHtml(name)}">
                    <span class="duty-count-name" title="${this.escapeHtml(name)}">${this.escapeHtml(name)}</span>
                    <span class="duty-count-value">${count}</span>
                    <button class="duty-count-remove" title="Remove ${this.escapeHtml(name)}" aria-label="Remove ${this.escapeHtml(name)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `).join('');
            
            // Add remove event listeners
            list.querySelectorAll('.duty-count-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const item = btn.closest('.duty-count-item');
                    const empName = item.dataset.employee;
                    
                    // Remove employee from schedule assignments first
                    this.removeEmployeeFromAllShifts(empName);
                    
                    // Remove from employees list
                    ScheduleManager.removeEmployee(empName);
                    
                    // Update UI
                    this.renderEmployees();
                    this.updateEmployeeEmptyState();
                    this.renderSchedule(ScheduleManager.getCurrentSchedule());
                    this.updateStats();
                    this.showToast(`${empName} removed`, 'info');
                });
            });
            
            panel.classList.add('active');
        },

        removeEmployeeFromAllShifts(employeeName) {
            const schedule = ScheduleManager.getCurrentSchedule();
            if (!schedule) return;
            
            Object.keys(schedule.days).forEach(dateKey => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    if (schedule.days[dateKey].shifts[shiftId].employee === employeeName) {
                        ScheduleManager.removeEmployee(dateKey, shiftId);
                    }
                });
            });
        },

        removeEmployeeFromAllShifts(employeeName) {
            const schedule = ScheduleManager.getCurrentSchedule();
            if (!schedule) return;
            
            Object.keys(schedule.days).forEach(dateKey => {
                ['shift1', 'shift2', 'shift3'].forEach(shiftId => {
                    if (schedule.days[dateKey].shifts[shiftId].employee === employeeName) {
                        ScheduleManager.removeEmployee(dateKey, shiftId);
                    }
                });
            });
        },

        openExportModal() {
            if (!ScheduleManager.getCurrentSchedule()) {
                this.showToast('Generate schedule first', 'warning');
                return;
            }
            this.openModal(this.elements.exportModal);
        },

        openLoadModal() {
            this.renderSavedSchedules();
            this.openModal(this.elements.loadModal);
        },

        renderSavedSchedules() {
            const saved = ScheduleManager.getSavedSchedules();
            if (!this.elements.savedSchedulesList) return;

            if (saved.length === 0) {
                this.elements.savedSchedulesList.innerHTML = '<div class="no-saved-schedules">No saved schedules</div>';
                return;
            }

            this.elements.savedSchedulesList.innerHTML = saved.map(s => `
                <div class="saved-schedule-item" data-id="${s.id}">
                    <div class="saved-schedule-info">
                        <div class="saved-schedule-name">${this.escapeHtml(s.name)}</div>
                        <div class="saved-schedule-date">${new Date(s.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button class="saved-schedule-delete" data-id="${s.id}" aria-label="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `).join('');

            this.elements.savedSchedulesList.querySelectorAll('.saved-schedule-info').forEach(info => {
                info.addEventListener('click', () => {
                    const id = info.closest('.saved-schedule-item').dataset.id;
                    if (ScheduleManager.loadSchedule(id)) {
                        this.renderSchedule(ScheduleManager.getCurrentSchedule());
                        this.updateStats();
                        this.closeModal(this.elements.loadModal);
                        this.showToast('Schedule loaded!', 'success');
                    }
                });
            });

            this.elements.savedSchedulesList.querySelectorAll('.saved-schedule-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ScheduleManager.deleteSchedule(btn.dataset.id);
                    this.renderSavedSchedules();
                    this.showToast('Schedule deleted', 'info');
                });
            });
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
            const container = this.elements.toastContainer;
            if (!container) return;

            const icons = {
                success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
                error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
                warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
                info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
            };

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <span class="toast-icon">${icons[type]}</span>
                <span class="toast-message">${this.escapeHtml(message)}</span>
                <button class="toast-close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;

            toast.querySelector('.toast-close').addEventListener('click', () => this.removeToast(toast));
            container.appendChild(toast);

            setTimeout(() => this.removeToast(toast), 3000);
        },

        removeToast(toast) {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // ============================================
    // EXPORT MANAGER
    // ============================================
    const ExportManager = {
        async downloadImage() {
            const schedule = ScheduleManager.getCurrentSchedule();
            if (!schedule) {
                UI.showToast('No schedule to export', 'warning');
                return;
            }

            UI.showToast('Creating image...', 'info');

            try {
                const container = document.getElementById('scheduleContainer');
                if (!container || !window.html2canvas) {
                    UI.showToast('Export not available', 'error');
                    return;
                }

                const canvas = await html2canvas(container, {
                    backgroundColor: '#151525',
                    scale: 2,
                    logging: false,
                    useCORS: true
                });

                const link = document.createElement('a');
                link.download = `schedule-${schedule.startDate}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();

                UI.showToast('Image saved!', 'success');
            } catch (error) {
                console.error('Export error:', error);
                UI.showToast('Export failed', 'error');
            }
        },

        async copyToClipboard() {
            const schedule = ScheduleManager.getCurrentSchedule();
            if (!schedule) {
                UI.showToast('No schedule to copy', 'warning');
                return;
            }

            const text = this.generateTextSchedule(schedule);
            
            try {
                await navigator.clipboard.writeText(text);
                UI.showToast('Copied to clipboard!', 'success');
            } catch (error) {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
                UI.showToast('Copied to clipboard!', 'success');
            }
        },

        generateTextSchedule(schedule) {
            let text = `📅 ${schedule.name}\n${'═'.repeat(40)}\n\n`;

            const days = ScheduleManager.getOrderedDays();
            days.forEach(day => {
                const emoji = day.isWeekend ? '🟣' : '🔵';
                text += `${emoji} ${day.dayName}, ${day.monthNameShort} ${day.dayNumber}\n`;
                text += `${'─'.repeat(30)}\n`;

                ['shift1', 'shift2', 'shift3'].forEach((shiftId, idx) => {
                    const shift = day.shifts[shiftId];
                    const time = `${DateUtils.formatTime12h(shift.start)} - ${DateUtils.formatTime12h(shift.end)}`;
                    const employee = shift.employee || '(Open)';
                    const shiftNames = ['Day', 'Night', 'Morning'];
                    text += `  Shift ${idx + 1} (${shiftNames[idx]}): ${employee}\n`;
                    text += `    ⏰ ${time}\n`;
                });
                text += '\n';
            });

            const stats = ScheduleManager.getStats();
            text += `${'═'.repeat(40)}\n`;
            text += `✅ Assigned: ${stats.assigned} | ⏳ Open: ${stats.unassigned}\n`;

            return text;
        }
    };

    // ============================================
    // PWA MANAGER
    // ============================================
    const PWA = {
        deferredPrompt: null,

        init() {
            this.setupInstallPrompt();
            this.setupOfflineDetection();
            this.setupKeyboardShortcuts();
        },

        setupInstallPrompt() {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                this.showInstallPrompt();
            });

            document.getElementById('installAccept')?.addEventListener('click', () => {
                this.installApp();
            });

            document.getElementById('installDismiss')?.addEventListener('click', () => {
                this.hideInstallPrompt();
            });
        },

        showInstallPrompt() {
            document.getElementById('installPrompt')?.classList.add('visible');
        },

        hideInstallPrompt() {
            document.getElementById('installPrompt')?.classList.remove('visible');
        },

        async installApp() {
            if (!this.deferredPrompt) return;

            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                UI.showToast('App installed!', 'success');
            }
            
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        },

        setupOfflineDetection() {
            const updateOnlineStatus = () => {
                const indicator = document.getElementById('offlineIndicator');
                if (navigator.onLine) {
                    indicator?.classList.remove('visible');
                } else {
                    indicator?.classList.add('visible');
                }
            };

            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
            updateOnlineStatus();
        },

        setupKeyboardShortcuts() {
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
