import winston from 'winston';
/**
 * Winston logger instance configured for the application
 */
export declare const logger: winston.Logger;
/**
 * Create a child logger with additional context
 */
export declare function createChildLogger(context: string): winston.Logger;
/**
 * Log an error with full stack trace and context
 */
export declare function logError(error: Error, context?: string, metadata?: Record<string, unknown>): void;
/**
 * Log a warning with context
 */
export declare function logWarning(message: string, context?: string, metadata?: Record<string, unknown>): void;
/**
 * Log info with context
 */
export declare function logInfo(message: string, context?: string, metadata?: Record<string, unknown>): void;
/**
 * Log debug information
 */
export declare function logDebug(message: string, context?: string, metadata?: Record<string, unknown>): void;
//# sourceMappingURL=logger.d.ts.map