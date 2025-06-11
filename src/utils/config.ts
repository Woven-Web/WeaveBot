import { config } from 'dotenv';
import { EnvSchema, type EnvConfig } from '../types';

// Load environment variables
config();

/**
 * Validates and returns the environment configuration
 * @throws {Error} If required environment variables are missing or invalid
 */
export function getConfig(): EnvConfig {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
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
export function getEnvVar(key: keyof EnvConfig): string {
  const config = getConfig();
  return config[key];
}

/**
 * Checks if we're in development mode
 */
export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === 'development';
}

/**
 * Checks if we're in production mode
 */
export function isProduction(): boolean {
  return getConfig().NODE_ENV === 'production';
}

/**
 * Checks if we're in test mode
 */
export function isTest(): boolean {
  return getConfig().NODE_ENV === 'test';
} 