import Logger from '../../src/utils/logger.js';

describe('Logger', () => {
    let consoleLogSpy;
    
    beforeEach(() => {
        // Mock console.log
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
        // Restore console.log
        consoleLogSpy.mockRestore();
    });
    
    test('info logs a message with the correct format', () => {
        Logger.info('Test info message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls[0][0];
        expect(logCall).toContain('[INFO]');
        expect(logCall).toContain('Test info message');
    });
    
    test('success logs a message with the correct format', () => {
        Logger.success('Test success message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls[0][0];
        expect(logCall).toContain('[SUCCESS]');
        expect(logCall).toContain('Test success message');
    });
    
    test('warn logs a message with the correct format', () => {
        Logger.warn('Test warning message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls[0][0];
        expect(logCall).toContain('[WARNING]');
        expect(logCall).toContain('Test warning message');
    });
    
    test('error logs a message with the correct format', () => {
        Logger.error('Test error message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls[0][0];
        expect(logCall).toContain('[ERROR]');
        expect(logCall).toContain('Test error message');
    });
    
    test('debug logs a message only in development mode', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        
        // Test in development mode
        process.env.NODE_ENV = 'development';
        Logger.debug('Test debug message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const devLogCall = consoleLogSpy.mock.calls[0][0];
        expect(devLogCall).toContain('[DEBUG]');
        expect(devLogCall).toContain('Test debug message');
        
        // Reset spy
        consoleLogSpy.mockClear();
        
        // Test in production mode
        process.env.NODE_ENV = 'production';
        Logger.debug('Test debug message');
        expect(consoleLogSpy).not.toHaveBeenCalled();
        
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
    });
}); 