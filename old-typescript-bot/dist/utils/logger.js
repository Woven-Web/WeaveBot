"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createChildLogger = createChildLogger;
exports.logError = logError;
exports.logWarning = logWarning;
exports.logInfo = logInfo;
exports.logDebug = logDebug;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("./config");
const config = (0, config_1.getConfig)();
// Custom format for development
const developmentFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
}));
// Custom format for production
const productionFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
/**
 * Winston logger instance configured for the application
 */
exports.logger = winston_1.default.createLogger({
    level: config.LOG_LEVEL,
    format: (0, config_1.isDevelopment)() ? developmentFormat : productionFormat,
    transports: [
        new winston_1.default.transports.Console({
            handleExceptions: true,
            handleRejections: true,
        }),
    ],
    exitOnError: false,
});
/**
 * Create a child logger with additional context
 */
function createChildLogger(context) {
    return exports.logger.child({ context });
}
/**
 * Log an error with full stack trace and context
 */
function logError(error, context, metadata) {
    exports.logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        context,
        ...metadata,
    });
}
/**
 * Log a warning with context
 */
function logWarning(message, context, metadata) {
    exports.logger.warn(message, {
        context,
        ...metadata,
    });
}
/**
 * Log info with context
 */
function logInfo(message, context, metadata) {
    exports.logger.info(message, {
        context,
        ...metadata,
    });
}
/**
 * Log debug information
 */
function logDebug(message, context, metadata) {
    exports.logger.debug(message, {
        context,
        ...metadata,
    });
}
//# sourceMappingURL=logger.js.map