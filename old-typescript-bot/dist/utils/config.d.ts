import { type EnvConfig } from '../types';
/**
 * Validates and returns the environment configuration
 * @throws {Error} If required environment variables are missing or invalid
 */
export declare function getConfig(): EnvConfig;
/**
 * Gets a specific environment variable with validation
 */
export declare function getEnvVar(key: keyof EnvConfig): string;
/**
 * Checks if we're in development mode
 */
export declare function isDevelopment(): boolean;
/**
 * Checks if we're in production mode
 */
export declare function isProduction(): boolean;
/**
 * Checks if we're in test mode
 */
export declare function isTest(): boolean;
//# sourceMappingURL=config.d.ts.map