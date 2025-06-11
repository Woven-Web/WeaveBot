import { z } from 'zod';

// Environment configuration schema
export const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'Telegram bot token is required'),
  TELEGRAM_CHAT_ID: z.string().min(1, 'Telegram chat ID is required'),
  AIRTABLE_API_KEY: z.string().min(1, 'Airtable API key is required'),
  AIRTABLE_BASE_ID: z.string().min(1, 'Airtable base ID is required'),
  AIRTABLE_TABLE_ID: z.string().min(1, 'Airtable table ID is required'),
  AIRTABLE_VIEW_ID: z.string().min(1, 'Airtable view ID is required'),
  AIRTABLE_TABLE_NAME: z.string().min(1, 'Airtable table name is required'),
  AIRTABLE_UPDATES_TABLE_NAME: z.string().min(1, 'Airtable updates table name is required'),
  AIRTABLE_UPDATES_TABLE_ID: z.string().min(1, 'Airtable updates table ID is required'),
  AIRTABLE_UPDATES_VIEW_ID: z.string().min(1, 'Airtable updates view ID is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

// Event data schema from OpenAI extraction
export const EventSchema = z.object({
  event_title: z.string().min(1, 'Event title is required'),
  description: z.string().min(1, 'Event description is required'),
  start_datetime: z.string().datetime('Invalid start datetime format'),
  end_datetime: z.string().datetime('Invalid end datetime format'),
  location: z.string().min(1, 'Event location is required'),
  url: z.string().url('Invalid URL format'),
});

// Extended event data type with optional processing fields
export type EventData = z.infer<typeof EventSchema> & {
  id?: string;
  source_url?: string;
};

// Update data schema
export const UpdateSchema = z.object({
  content: z.string().min(1, 'Update content is required'),
  timestamp: z.string().datetime('Invalid timestamp format'),
  chat_id: z.string().min(1, 'Chat ID is required'),
});

// Extended update data type with optional processing fields
export type UpdateData = z.infer<typeof UpdateSchema> & {
  id?: string;
  source?: string;
  title?: string;
};

// Markdowner API response
export const MarkdownerResponseSchema = z.object({
  success: z.boolean(),
  data: z.string().optional(),
  error: z.string().optional(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().url(),
  }).optional(),
});

export type MarkdownerResponse = z.infer<typeof MarkdownerResponseSchema>;

// OpenAI extraction response
export const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  event: EventSchema.optional(),
  error: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

// Airtable record types
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

// Bot command types
export type BotCommand = 'start' | 'weeklyweave' | 'help';

export interface WeeklyReport {
  events: EventData[];
  updates: UpdateData[];
  reportDate: string;
  eventCount: number;
  updateCount: string;
}

// Error types
export class ScrapingError extends Error {
  constructor(message: string, public readonly url?: string) {
    super(message);
    this.name = 'ScrapingError';
  }
}

export class ExtractionError extends Error {
  constructor(message: string, public readonly rawContent?: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

export class AirtableError extends Error {
  constructor(message: string, public readonly operation?: string) {
    super(message);
    this.name = 'AirtableError';
  }
}

// Generic processing result type
export interface ProcessingResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
} 