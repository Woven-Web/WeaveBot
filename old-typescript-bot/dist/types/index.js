"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtableError = exports.ExtractionError = exports.ScrapingError = exports.ExtractionResponseSchema = exports.MarkdownerResponseSchema = exports.UpdateSchema = exports.EventSchema = exports.EnvSchema = void 0;
const zod_1 = require("zod");
// Environment configuration schema
exports.EnvSchema = zod_1.z.object({
    TELEGRAM_BOT_TOKEN: zod_1.z.string().min(1, 'Telegram bot token is required'),
    TELEGRAM_CHAT_ID: zod_1.z.string().min(1, 'Telegram chat ID is required'),
    AIRTABLE_API_KEY: zod_1.z.string().min(1, 'Airtable API key is required'),
    AIRTABLE_BASE_ID: zod_1.z.string().min(1, 'Airtable base ID is required'),
    AIRTABLE_TABLE_ID: zod_1.z.string().min(1, 'Airtable table ID is required'),
    AIRTABLE_VIEW_ID: zod_1.z.string().min(1, 'Airtable view ID is required'),
    AIRTABLE_TABLE_NAME: zod_1.z.string().min(1, 'Airtable table name is required'),
    AIRTABLE_UPDATES_TABLE_NAME: zod_1.z.string().min(1, 'Airtable updates table name is required'),
    AIRTABLE_UPDATES_TABLE_ID: zod_1.z.string().min(1, 'Airtable updates table ID is required'),
    AIRTABLE_UPDATES_VIEW_ID: zod_1.z.string().min(1, 'Airtable updates view ID is required'),
    OPENAI_API_KEY: zod_1.z.string().min(1, 'OpenAI API key is required'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
// Event data schema from OpenAI extraction
exports.EventSchema = zod_1.z.object({
    event_title: zod_1.z.string().min(1, 'Event title is required'),
    description: zod_1.z.string().min(1, 'Event description is required'),
    start_datetime: zod_1.z.string().datetime('Invalid start datetime format'),
    end_datetime: zod_1.z.string().datetime('Invalid end datetime format'),
    location: zod_1.z.string().min(1, 'Event location is required'),
    url: zod_1.z.string().url('Invalid URL format'),
});
// Update data schema
exports.UpdateSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Update content is required'),
    timestamp: zod_1.z.string().datetime('Invalid timestamp format'),
    chat_id: zod_1.z.string().min(1, 'Chat ID is required'),
});
// Markdowner API response
exports.MarkdownerResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
    metadata: zod_1.z.object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        url: zod_1.z.string().url(),
    }).optional(),
});
// OpenAI extraction response
exports.ExtractionResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    event: exports.EventSchema.optional(),
    error: zod_1.z.string().optional(),
    confidence: zod_1.z.number().min(0).max(1).optional(),
});
// Error types
class ScrapingError extends Error {
    url;
    constructor(message, url) {
        super(message);
        this.url = url;
        this.name = 'ScrapingError';
    }
}
exports.ScrapingError = ScrapingError;
class ExtractionError extends Error {
    rawContent;
    constructor(message, rawContent) {
        super(message);
        this.rawContent = rawContent;
        this.name = 'ExtractionError';
    }
}
exports.ExtractionError = ExtractionError;
class AirtableError extends Error {
    operation;
    constructor(message, operation) {
        super(message);
        this.operation = operation;
        this.name = 'AirtableError';
    }
}
exports.AirtableError = AirtableError;
//# sourceMappingURL=index.js.map