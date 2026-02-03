/**
 * Export Manager Module
 * Handles printing and exporting schedules
 */

const ExportManager = (function() {
    
    /**
     * Print the current schedule
     */
    function print() {
        const schedule = ScheduleManager.getCurrentSchedule();
        if (!schedule) {
            UIController.showToast('No schedule to print', 'warning');
            return;
        }
        
        // Create print-friendly content
        const printContent = createPrintContent(schedule);
        
        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    /**
     * Create print-friendly HTML content
     * @param {Object} schedule
     * @returns {string}
     */
    function createPrintContent(schedule) {
        const days = Object.values(schedule.days);
        
        let tableRows = '';
        days.forEach(day => {
            const shift1 = day.shifts.shift1;
            const shift2 = day.shifts.shift2;
            const shift3 = day.shifts.shift3;
            
            tableRows += `
                <tr>
                    <td class="day-cell">
                        <strong>${day.dayName}</strong><br>
                        <span class="date">${day.monthNameShort} ${day.dayNumber}, ${day.year}</span>
                    </td>
                    <td class="shift-cell shift-1">
                        <div class="shift-time">${DateUtils.formatTime12h(shift1.start)} - ${DateUtils.formatTime12h(shift1.end)}</div>
                        <div class="shift-employee">${shift1.employee || '—'}</div>
                    </td>
                    <td class="shift-cell shift-2">
                        <div class="shift-time">${DateUtils.formatTime12h(shift2.start)} - ${DateUtils.formatTime12h(shift2.end)}</div>
                        <div class="shift-employee">${shift2.employee || '—'}</div>
                    </td>
                    <td class="shift-cell shift-3">
                        <div class="shift-time">${DateUtils.formatTime12h(shift3.start)} - ${DateUtils.formatTime12h(shift3.end)}</div>
                        <div class="shift-employee">${shift3.employee || '—'}</div>
                    </td>
                </tr>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${schedule.name} - Duty Schedule</title>
                <style>
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 20px;
                        color: #1a1a1a;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #333;
                    }
                    
                    .header h1 {
                        font-size: 24px;
                        margin-bottom: 5px;
                    }
                    
                    .header p {
                        font-size: 14px;
                        color: #666;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    
                    th, td {
                        border: 1px solid #ddd;
                        padding: 12px 8px;
                        text-align: center;
                    }
                    
                    th {
                        background: #333;
                        color: white;
                        font-weight: 600;
                        font-size: 12px;
                        text-transform: uppercase;
                    }
                    
                    th.shift-1-header { background: #16a34a; }
                    th.shift-2-header { background: #7c3aed; }
                    th.shift-3-header { background: #2563eb; }
                    
                    .day-cell {
                        background: #f5f5f5;
                        text-align: left;
                        width: 20%;
                    }
                    
                    .day-cell .date {
                        font-size: 12px;
                        color: #666;
                    }
                    
                    .shift-cell {
                        width: 26.66%;
                    }
                    
                    .shift-time {
                        font-size: 11px;
                        color: #666;
                        margin-bottom: 4px;
                    }
                    
                    .shift-employee {
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .shift-1 { background: rgba(34, 197, 94, 0.1); }
                    .shift-2 { background: rgba(139, 92, 246, 0.1); }
                    .shift-3 { background: rgba(59, 130, 246, 0.1); }
                    
                    .footer {
                        text-align: center;
                        font-size: 11px;
                        color: #999;
                        margin-top: 20px;
                        padding-top: 10px;
                        border-top: 1px solid #ddd;
                    }
                    
                    @media print {
                        body { padding: 0; }
                        .header { page-break-after: avoid; }
                        tr { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📅 ${schedule.name}</h1>
                    <p>Duty Schedule • ${DateUtils.formatWeekRange(DateUtils.parseDate(schedule.startDate))}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Day / Date</th>
                            <th class="shift-1-header">Shift 1 (Day)</th>
                            <th class="shift-2-header">Shift 2 (Night)</th>
                            <th class="shift-3-header">Shift 3 (Morning)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                
                <div class="footer">
                    Generated on ${new Date().toLocaleDateString()} • Duty Schedule Maker
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Download schedule as PDF
     * Uses print-to-PDF functionality
     */
    function downloadPDF() {
        UIController.showToast('Opening print dialog for PDF save', 'info');
        print();
    }

    /**
     * Download schedule as CSV
     */
    function downloadCSV() {
        const schedule = ScheduleManager.getCurrentSchedule();
        if (!schedule) {
            UIController.showToast('No schedule to export', 'warning');
            return;
        }
        
        const csvContent = createCSVContent(schedule);
        downloadFile(csvContent, `${sanitizeFilename(schedule.name)}.csv`, 'text/csv');
        UIController.showToast('CSV downloaded successfully!', 'success');
    }

    /**
     * Create CSV content from schedule
     * @param {Object} schedule
     * @returns {string}
     */
    function createCSVContent(schedule) {
        const headers = ['Day', 'Date', 'Shift 1 Time', 'Shift 1 Employee', 'Shift 2 Time', 'Shift 2 Employee', 'Shift 3 Time', 'Shift 3 Employee'];
        const rows = [headers.join(',')];
        
        Object.values(schedule.days).forEach(day => {
            const shift1 = day.shifts.shift1;
            const shift2 = day.shifts.shift2;
            const shift3 = day.shifts.shift3;
            
            const row = [
                day.dayName,
                `${day.monthNameShort} ${day.dayNumber} ${day.year}`,
                `${DateUtils.formatTime12h(shift1.start)} - ${DateUtils.formatTime12h(shift1.end)}`,
                shift1.employee || 'Unassigned',
                `${DateUtils.formatTime12h(shift2.start)} - ${DateUtils.formatTime12h(shift2.end)}`,
                shift2.employee || 'Unassigned',
                `${DateUtils.formatTime12h(shift3.start)} - ${DateUtils.formatTime12h(shift3.end)}`,
                shift3.employee || 'Unassigned'
            ];
            
            // Escape quotes and wrap in quotes
            const escapedRow = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`);
            rows.push(escapedRow.join(','));
        });
        
        return rows.join('\n');
    }

    /**
     * Download file
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Sanitize filename
     * @param {string} name
     * @returns {string}
     */
    function sanitizeFilename(name) {
        return name.replace(/[^a-z0-9\s\-_]/gi, '').replace(/\s+/g, '_');
    }

    /**
     * Export schedule as JSON
     */
    function downloadJSON() {
        const schedule = ScheduleManager.getCurrentSchedule();
        if (!schedule) {
            UIController.showToast('No schedule to export', 'warning');
            return;
        }
        
        const jsonContent = JSON.stringify(schedule, null, 2);
        downloadFile(jsonContent, `${sanitizeFilename(schedule.name)}.json`, 'application/json');
        UIController.showToast('JSON downloaded successfully!', 'success');
    }

    /**
     * Export all data (schedules + employees + settings)
     */
    function exportAllData() {
        const data = Storage.exportData();
        downloadFile(data, 'duty_scheduler_backup.json', 'application/json');
        UIController.showToast('Backup downloaded successfully!', 'success');
    }

    /**
     * Generate shareable text
     * @returns {string}
     */
    function generateShareableText() {
        const schedule = ScheduleManager.getCurrentSchedule();
        if (!schedule) return '';
        
        let text = `📅 ${schedule.name}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        Object.values(schedule.days).forEach(day => {
            text += `📆 ${day.dayName}, ${day.monthNameShort} ${day.dayNumber}\n`;
            
            const shifts = [
                { label: 'Shift 1', data: day.shifts.shift1 },
                { label: 'Shift 2', data: day.shifts.shift2 },
                { label: 'Shift 3', data: day.shifts.shift3 }
            ];
            
            shifts.forEach(shift => {
                const time = `${DateUtils.formatTime12h(shift.data.start)} - ${DateUtils.formatTime12h(shift.data.end)}`;
                const employee = shift.data.employee || 'Unassigned';
                text += `  • ${shift.label} (${time}): ${employee}\n`;
            });
            
            text += '\n';
        });
        
        return text;
    }

    /**
     * Copy schedule to clipboard as text
     */
    function copyToClipboard() {
        const text = generateShareableText();
        if (!text) {
            UIController.showToast('No schedule to copy', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(text).then(() => {
            UIController.showToast('Schedule copied to clipboard!', 'success');
        }).catch(() => {
            UIController.showToast('Failed to copy to clipboard', 'error');
        });
    }

    // Public API
    return {
        print,
        downloadPDF,
        downloadCSV,
        downloadJSON,
        exportAllData,
        generateShareableText,
        copyToClipboard
    };
})();
