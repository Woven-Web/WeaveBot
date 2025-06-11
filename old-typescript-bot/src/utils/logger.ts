import winston from 'winston';
import { getConfig, isDevelopment } from './config';

const config = getConfig();

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston logger instance configured for the application
 */
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: isDevelopment() ? developmentFormat : productionFormat,
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: string): winston.Logger {
  return logger.child({ context });
}

/**
 * Log an error with full stack trace and context
 */
export function logError(error: Error, context?: string, metadata?: Record<string, unknown>): void {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    context,
    ...metadata,
  });
}

/**
 * Log a warning with context
 */
export function logWarning(message: string, context?: string, metadata?: Record<string, unknown>): void {
  logger.warn(message, {
    context,
    ...metadata,
  });
}

/**
 * Log info with context
 */
export function logInfo(message: string, context?: string, metadata?: Record<string, unknown>): void {
  logger.info(message, {
    context,
    ...metadata,
  });
}

/**
 * Log debug information
 */
export function logDebug(message: string, context?: string, metadata?: Record<string, unknown>): void {
  logger.debug(message, {
    context,
    ...metadata,
  });
} 