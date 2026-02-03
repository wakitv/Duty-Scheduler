/**
 * Duty Schedule Maker - Main Application
 * Initializes all modules and starts the application
 */

(function() {
    'use strict';

    /**
     * Application initialization
     */
    function init() {
        console.log('🗓️ Duty Schedule Maker - Initializing...');
        
        // Initialize modules in order
        ScheduleManager.init();
        UIController.init();
        
        console.log('✅ Application initialized successfully!');
        
        // Show welcome message
        setTimeout(() => {
            UIController.showToast('Welcome to Duty Schedule Maker!', 'info');
        }, 500);
    }

    /**
     * Handle keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (ScheduleManager.getCurrentSchedule()) {
                    if (ScheduleManager.saveCurrentSchedule()) {
                        UIController.showToast('Schedule saved!', 'success');
                    }
                }
            }
            
            // Ctrl/Cmd + P to print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                if (ScheduleManager.getCurrentSchedule()) {
                    ExportManager.print();
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    UIController.closeModal(modal);
                });
            }
        });
    }

    /**
     * Handle visibility change (save on tab switch)
     */
    function setupAutoSave() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                const schedule = ScheduleManager.getCurrentSchedule();
                if (schedule) {
                    ScheduleManager.saveCurrentSchedule();
                }
            }
        });
        
        // Also save before page unload
        window.addEventListener('beforeunload', () => {
            const schedule = ScheduleManager.getCurrentSchedule();
            if (schedule) {
                ScheduleManager.saveCurrentSchedule();
            }
        });
    }

    /**
     * Check browser compatibility
     */
    function checkCompatibility() {
        const required = ['localStorage', 'addEventListener', 'querySelector'];
        const missing = required.filter(feature => {
            if (feature === 'localStorage') {
                return !Storage.isAvailable();
            }
            return !(feature in document || feature in window);
        });
        
        if (missing.length > 0) {
            console.warn('Missing browser features:', missing);
            UIController.showToast('Some features may not work in your browser', 'warning');
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkCompatibility();
            init();
            setupKeyboardShortcuts();
            setupAutoSave();
        });
    } else {
        checkCompatibility();
        init();
        setupKeyboardShortcuts();
        setupAutoSave();
    }

    // Make modules available globally for debugging
    window.DutyScheduler = {
        DateUtils,
        Storage,
        ScheduleManager,
        UIController,
        ExportManager
    };
})();
