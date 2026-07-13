/**
 * ErrorLogger.js
 * Sistema de captura automática de errores para Xanezu Catch.
 * Intercepta errores globales y de consola, permitiendo su descarga automática.
 */

class ErrorLogger {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.init();
    }

    init() {
        // Capturar errores no controlados
        window.onerror = (message, source, lineno, colno, error) => {
            this.logError('GLOBAL_ERROR', {
                message,
                source,
                lineno,
                colno,
                stack: error ? error.stack : null,
                timestamp: new Date().toISOString()
            });
            return false; // Permitir que el error se muestre en consola también
        };

        // Capturar promesas rechazadas no controladas
        window.onunhandledrejection = (event) => {
            this.logError('PROMISE_REJECTION', {
                reason: event.reason,
                timestamp: new Date().toISOString()
            });
        };

        // Interceptar console.error
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.logError('CONSOLE_ERROR', {
                args: args.map(arg => arg instanceof Error ? arg.stack : arg),
                timestamp: new Date().toISOString()
            });
            originalConsoleError.apply(console, args);
        };

        console.log("ErrorLogger: Sistema de captura activado.");
    }

    logError(type, data) {
        const errorEntry = { type, ...data };
        this.errors.push(errorEntry);
        
        // Limitar el número de errores en memoria
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Guardar en localStorage como respaldo
        this.saveToLocalStorage();

        // Si es un error crítico (Global o Rejection), intentar descarga automática
        if (type === 'GLOBAL_ERROR' || type === 'PROMISE_REJECTION') {
            // this.autoDownloadReport();
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('mx_error_logs', JSON.stringify(this.errors));
        } catch (e) {
            // Ignorar si localStorage está lleno
        }
    }

    autoDownloadReport() {
        // Evitar descargas múltiples en ráfaga (debounce de 2 segundos)
        if (this._downloadTimeout) clearTimeout(this._downloadTimeout);
        
        this._downloadTimeout = setTimeout(() => {
            this.downloadReport();
        }, 2000);
    }

    downloadReport() {
        if (this.errors.length === 0) return;

        const report = {
            game: "XANEZU CATCH",
            version: "ALPHA v0.1.3-026",
            platform: navigator.userAgent,
            timestamp: new Date().toISOString(),
            errorCount: this.errors.length,
            logs: this.errors
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        a.href = url;
        a.download = `xanezu-error-report-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log("ErrorLogger: Reporte de errores descargado automáticamente.");
    }
}

// Instanciar y exponer globalmente
window.errorLogger = new ErrorLogger();
