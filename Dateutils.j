/**
 * Date Utilities Module
 * Handles all date-related operations for the schedule maker
 */

const DateUtils = (function() {
    // Day names array
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Month names array
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
    const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /**
     * Parse date string to Date object
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {Date}
     */
    function parseDate(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    /**
     * Format date to YYYY-MM-DD string
     * @param {Date} date
     * @returns {string}
     */
    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Format date for display (e.g., "Feb 2, 2026")
     * @param {Date} date
     * @returns {string}
     */
    function formatDateDisplay(date) {
        const month = MONTH_NAMES_SHORT[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
    }

    /**
     * Get day name from date
     * @param {Date} date
     * @param {boolean} short - Return short name (3 letters)
     * @returns {string}
     */
    function getDayName(date, short = false) {
        const dayIndex = date.getDay();
        return short ? DAY_NAMES_SHORT[dayIndex] : DAY_NAMES[dayIndex];
    }

    /**
     * Get month name from date
     * @param {Date} date
     * @param {boolean} short - Return short name (3 letters)
     * @returns {string}
     */
    function getMonthName(date, short = false) {
        const monthIndex = date.getMonth();
        return short ? MONTH_NAMES_SHORT[monthIndex] : MONTH_NAMES[monthIndex];
    }

    /**
     * Check if a date is Monday
     * @param {Date} date
     * @returns {boolean}
     */
    function isMonday(date) {
        return date.getDay() === 1;
    }

    /**
     * Get the nearest Monday (current or previous)
     * @param {Date} date
     * @returns {Date}
     */
    function getNearestMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Adjust for Sunday
        d.setDate(d.getDate() + diff);
        return d;
    }

    /**
     * Add days to a date
     * @param {Date} date
     * @param {number} days
     * @returns {Date}
     */
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Generate a week of dates starting from a given date
     * @param {Date|string} startDate - Start date (should be Monday)
     * @returns {Array<Object>} Array of date objects with day info
     */
    function generateWeekDates(startDate) {
        let start = typeof startDate === 'string' ? parseDate(startDate) : new Date(startDate);
        
        // Ensure we start from Monday
        if (!isMonday(start)) {
            start = getNearestMonday(start);
        }

        const weekDates = [];
        
        for (let i = 0; i < 7; i++) {
            const currentDate = addDays(start, i);
            weekDates.push({
                date: currentDate,
                dateISO: formatDateISO(currentDate),
                dayNumber: currentDate.getDate(),
                dayName: getDayName(currentDate),
                dayNameShort: getDayName(currentDate, true),
                monthName: getMonthName(currentDate),
                monthNameShort: getMonthName(currentDate, true),
                year: currentDate.getFullYear(),
                isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
            });
        }

        return weekDates;
    }

    /**
     * Format time string (24h to 12h format)
     * @param {string} time24 - Time in HH:MM format
     * @returns {string} Time in 12h format (e.g., "12:00 PM")
     */
    function formatTime12h(time24) {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
    }

    /**
     * Format time range for display
     * @param {string} startTime - Start time in HH:MM format
     * @param {string} endTime - End time in HH:MM format
     * @returns {string}
     */
    function formatTimeRange(startTime, endTime) {
        return `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
    }

    /**
     * Get today's date
     * @returns {Date}
     */
    function getToday() {
        return new Date();
    }

    /**
     * Get today's date as ISO string
     * @returns {string}
     */
    function getTodayISO() {
        return formatDateISO(getToday());
    }

    /**
     * Get the Monday of the current week
     * @returns {Date}
     */
    function getCurrentWeekMonday() {
        return getNearestMonday(getToday());
    }

    /**
     * Get week number of the year
     * @param {Date} date
     * @returns {number}
     */
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Format week range for display
     * @param {Date} startDate
     * @returns {string}
     */
    function formatWeekRange(startDate) {
        const endDate = addDays(startDate, 6);
        const startMonth = getMonthName(startDate, true);
        const endMonth = getMonthName(endDate, true);
        
        if (startMonth === endMonth) {
            return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`;
        } else {
            return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${endDate.getFullYear()}`;
        }
    }

    // Public API
    return {
        parseDate,
        formatDateISO,
        formatDateDisplay,
        getDayName,
        getMonthName,
        isMonday,
        getNearestMonday,
        addDays,
        generateWeekDates,
        formatTime12h,
        formatTimeRange,
        getToday,
        getTodayISO,
        getCurrentWeekMonday,
        getWeekNumber,
        formatWeekRange,
        DAY_NAMES,
        DAY_NAMES_SHORT,
        MONTH_NAMES,
        MONTH_NAMES_SHORT
    };
})();
