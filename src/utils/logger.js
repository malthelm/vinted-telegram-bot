import chalk from 'chalk';

/**
 * Logger utility for consistent logging throughout the application.
 */
class Logger {
    static _getTimestamp() {
        return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    }

    /**
     * Log an info message.
     * @param {string} message - The message to log.
     */
    static info(message) {
        console.log(`${chalk.blue('[INFO]')} ${chalk.gray(this._getTimestamp())} ${message}`);
    }

    /**
     * Log a success message.
     * @param {string} message - The message to log.
     */
    static success(message) {
        console.log(`${chalk.green('[SUCCESS]')} ${chalk.gray(this._getTimestamp())} ${message}`);
    }

    /**
     * Log a warning message.
     * @param {string} message - The message to log.
     */
    static warn(message) {
        console.log(`${chalk.yellow('[WARNING]')} ${chalk.gray(this._getTimestamp())} ${message}`);
    }

    /**
     * Log an error message.
     * @param {string} message - The message to log.
     */
    static error(message) {
        console.log(`${chalk.red('[ERROR]')} ${chalk.gray(this._getTimestamp())} ${message}`);
    }

    /**
     * Log a debug message (only in development mode).
     * @param {string} message - The message to log.
     */
    static debug(message) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`${chalk.magenta('[DEBUG]')} ${chalk.gray(this._getTimestamp())} ${message}`);
        }
    }
}

export default Logger; 