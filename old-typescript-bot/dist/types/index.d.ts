import { z } from 'zod';
export declare const EnvSchema: z.ZodObject<{
    TELEGRAM_BOT_TOKEN: z.ZodString;
    TELEGRAM_CHAT_ID: z.ZodString;
    AIRTABLE_API_KEY: z.ZodString;
    AIRTABLE_BASE_ID: z.ZodString;
    AIRTABLE_TABLE_ID: z.ZodString;
    AIRTABLE_VIEW_ID: z.ZodString;
    AIRTABLE_TABLE_NAME: z.ZodString;
    AIRTABLE_UPDATES_TABLE_NAME: z.ZodString;
    AIRTABLE_UPDATES_TABLE_ID: z.ZodString;
    AIRTABLE_UPDATES_VIEW_ID: z.ZodString;
    OPENAI_API_KEY: z.ZodString;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
}, "strip", z.ZodTypeAny, {
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHAT_ID: string;
    AIRTABLE_API_KEY: string;
    AIRTABLE_BASE_ID: string;
    AIRTABLE_TABLE_ID: string;
    AIRTABLE_VIEW_ID: string;
    AIRTABLE_TABLE_NAME: string;
    AIRTABLE_UPDATES_TABLE_NAME: string;
    AIRTABLE_UPDATES_TABLE_ID: string;
    AIRTABLE_UPDATES_VIEW_ID: string;
    OPENAI_API_KEY: string;
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
}, {
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHAT_ID: string;
    AIRTABLE_API_KEY: string;
    AIRTABLE_BASE_ID: string;
    AIRTABLE_TABLE_ID: string;
    AIRTABLE_VIEW_ID: string;
    AIRTABLE_TABLE_NAME: string;
    AIRTABLE_UPDATES_TABLE_NAME: string;
    AIRTABLE_UPDATES_TABLE_ID: string;
    AIRTABLE_UPDATES_VIEW_ID: string;
    OPENAI_API_KEY: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
}>;
export type EnvConfig = z.infer<typeof EnvSchema>;
export declare const EventSchema: z.ZodObject<{
    event_title: z.ZodString;
    description: z.ZodString;
    start_datetime: z.ZodString;
    end_datetime: z.ZodString;
    location: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    event_title: string;
    description: string;
    start_datetime: string;
    end_datetime: string;
    location: string;
    url: string;
}, {
    event_title: string;
    description: string;
    start_datetime: string;
    end_datetime: string;
    location: string;
    url: string;
}>;
export type EventData = z.infer<typeof EventSchema> & {
    id?: string;
    source_url?: string;
};
export declare const UpdateSchema: z.ZodObject<{
    content: z.ZodString;
    timestamp: z.ZodString;
    chat_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    timestamp: string;
    chat_id: string;
}, {
    content: string;
    timestamp: string;
    chat_id: string;
}>;
export type UpdateData = z.infer<typeof UpdateSchema> & {
    id?: string;
    source?: string;
    title?: string;
};
export declare const MarkdownerResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        description?: string | undefined;
        title?: string | undefined;
    }, {
        url: string;
        description?: string | undefined;
        title?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    data?: string | undefined;
    metadata?: {
        url: string;
        description?: string | undefined;
        title?: string | undefined;
    } | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    data?: string | undefined;
    metadata?: {
        url: string;
        description?: string | undefined;
        title?: string | undefined;
    } | undefined;
}>;
export type MarkdownerResponse = z.infer<typeof MarkdownerResponseSchema>;
export declare const ExtractionResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    event: z.ZodOptional<z.ZodObject<{
        event_title: z.ZodString;
        description: z.ZodString;
        start_datetime: z.ZodString;
        end_datetime: z.ZodString;
        location: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        event_title: string;
        description: string;
        start_datetime: string;
        end_datetime: string;
        location: string;
        url: string;
    }, {
        event_title: string;
        description: string;
        start_datetime: string;
        end_datetime: string;
        location: string;
        url: string;
    }>>;
    error: z.ZodOptional<z.ZodString>;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    event?: {
        event_title: string;
        description: string;
        start_datetime: string;
        end_datetime: string;
        location: string;
        url: string;
    } | undefined;
    confidence?: number | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    event?: {
        event_title: string;
        description: string;
        start_datetime: string;
        end_datetime: string;
        location: string;
        url: string;
    } | undefined;
    confidence?: number | undefined;
}>;
export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;
export interface AirtableEventRecord {
    id?: string;
    fields: {
        'Event Title': string;
        'Description': string;
        'Start DateTime': string;
        'End DateTime': string;
        'Location': string;
        'URL': string;
        'Created At': string;
        'Status': 'pending' | 'approved' | 'rejected';
    };
}
export interface AirtableUpdateRecord {
    id?: string;
    fields: {
        'Content': string;
        'Timestamp': string;
        'Chat ID': string;
        'Created At': string;
    };
}
export type BotCommand = 'start' | 'weeklyweave' | 'help';
export interface WeeklyReport {
    events: EventData[];
    updates: UpdateData[];
    reportDate: string;
    eventCount: number;
    updateCount: string;
}
export declare class ScrapingError extends Error {
    readonly url?: string | undefined;
    constructor(message: string, url?: string | undefined);
}
export declare class ExtractionError extends Error {
    readonly rawContent?: string | undefined;
    constructor(message: string, rawContent?: string | undefined);
}
export declare class AirtableError extends Error {
    readonly operation?: string | undefined;
    constructor(message: string, operation?: string | undefined);
}
export interface ProcessingResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map