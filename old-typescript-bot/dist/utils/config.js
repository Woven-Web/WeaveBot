"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.getEnvVar = getEnvVar;
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;
exports.isTest = isTest;
const dotenv_1 = require("dotenv");
const types_1 = require("../types");
// Load environment variables
(0, dotenv_1.config)();
/**
 * Validates and returns the environment configuration
 * @throws {Error} If required environment variables are missing or invalid
 */
function getConfig() {
    try {
        return types_1.EnvSchema.parse(process.env);
    }
    catch (error) {
        console.error('❌ Environment configuration validation failed:');
        if (error instanceof Error) {
            console.error(error.message);
        }
        process.exit(1);
    }
}
/**
 * Gets a specific environment variable with validation
 */
function getEnvVar(key) {
    const config = getConfig();
    return config[key];
}
/**
 * Checks if we're in development mode
 */
function isDevelopment() {
    return getConfig().NODE_ENV === 'development';
}
/**
 * Checks if we're in production mode
 */
function isProduction() {
    return getConfig().NODE_ENV === 'production';
}
/**
 * Checks if we're in test mode
 */
function isTest() {
    return getConfig().NODE_ENV === 'test';
}
//# sourceMappingURL=config.js.map