"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const types_1 = require("../types");
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
class OpenAIService {
    openai;
    constructor() {
        const config = (0, config_1.getConfig)();
        this.openai = new openai_1.default({
            apiKey: config.OPENAI_API_KEY,
        });
    }
    /**
     * Extracts event data from markdown content using GPT-4o
     * @param markdownContent - The markdown content to analyze
     * @param originalUrl - The original URL for context
     * @returns Promise containing extracted event data
     */
    async extractEventData(markdownContent, originalUrl) {
        (0, logger_1.logInfo)(`Starting event extraction for URL: ${originalUrl}`, 'OpenAIService');
        try {
            (0, logger_1.logDebug)(`Processing markdown content (${markdownContent.length} characters)`, 'OpenAIService');
            const systemPrompt = this.buildSystemPrompt();
            const userPrompt = this.buildUserPrompt(markdownContent, originalUrl);
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.1, // Low temperature for consistent extraction
                max_tokens: 1000,
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new types_1.ExtractionError('Empty response from OpenAI', markdownContent);
            }
            (0, logger_1.logDebug)(`OpenAI response received: ${content.substring(0, 200)}...`, 'OpenAIService');
            // Parse the JSON response
            let extractedData;
            try {
                extractedData = JSON.parse(content);
            }
            catch (parseError) {
                throw new types_1.ExtractionError(`Failed to parse OpenAI response as JSON: ${content}`, markdownContent);
            }
            // Check if extraction was successful
            if (extractedData && typeof extractedData === 'object' && 'success' in extractedData) {
                const result = extractedData;
                if (!result.success) {
                    (0, logger_1.logInfo)(`Event extraction failed: ${result.error || 'Unknown reason'}`, 'OpenAIService');
                    return {
                        success: false,
                        error: result.error || 'Could not extract event data from the content',
                    };
                }
                if (!result.event) {
                    return {
                        success: false,
                        error: 'No event data found in the response',
                    };
                }
                // Validate the extracted event data
                try {
                    const eventData = types_1.EventSchema.parse({
                        ...result.event,
                        url: originalUrl, // Ensure URL is included
                    });
                    (0, logger_1.logInfo)(`Successfully extracted event: ${eventData.event_title}`, 'OpenAIService');
                    return {
                        success: true,
                        event: eventData,
                        confidence: result.confidence || 0.8,
                    };
                }
                catch (validationError) {
                    const errorMessage = validationError instanceof Error ? validationError.message : 'Unknown validation error';
                    (0, logger_1.logError)(new Error(`Event data validation failed: ${errorMessage}`), 'OpenAIService', {
                        extractedData: result.event,
                    });
                    return {
                        success: false,
                        error: `Extracted data is invalid: ${errorMessage}`,
                    };
                }
            }
            throw new types_1.ExtractionError('Unexpected response format from OpenAI', markdownContent);
        }
        catch (error) {
            if (error instanceof types_1.ExtractionError) {
                throw error;
            }
            const errorMessage = this.getErrorMessage(error);
            (0, logger_1.logError)(new Error(`Event extraction failed: ${errorMessage}`), 'OpenAIService', { originalUrl });
            return {
                success: false,
                error: `Failed to extract event data: ${errorMessage}`,
            };
        }
    }
    /**
     * Builds the system prompt for event extraction
     */
    buildSystemPrompt() {
        return `You are an expert event information extractor. Your task is to analyze web page content and extract event details.

INSTRUCTIONS:
1. Look for event information such as conferences, meetups, workshops, webinars, concerts, etc.
2. Extract the following fields EXACTLY as specified:
   - event_title: The main title/name of the event
   - description: A comprehensive description (200-500 characters)
   - start_datetime: ISO 8601 format (e.g., "2024-01-15T19:00:00Z")
   - end_datetime: ISO 8601 format (e.g., "2024-01-15T21:00:00Z")
   - location: Full location including venue name, address, or "Online" for virtual events

RESPONSE FORMAT:
Always respond with valid JSON in this exact structure:
{
  "success": true/false,
  "event": {
    "event_title": "string",
    "description": "string", 
    "start_datetime": "ISO 8601 string",
    "end_datetime": "ISO 8601 string",
    "location": "string"
  },
  "confidence": 0.0-1.0,
  "error": "string (only if success is false)"
}

IMPORTANT RULES:
- If you cannot find clear event information, set success to false and explain why
- All datetime fields must be in valid ISO 8601 format
- If timezone is unclear, assume the local timezone of the event location
- If end time is not specified, estimate a reasonable duration
- Be thorough but concise in descriptions
- If it's a recurring event, extract the next upcoming instance`;
    }
    /**
     * Builds the user prompt with the markdown content
     */
    buildUserPrompt(markdownContent, originalUrl) {
        return `Please extract event information from the following web page content:

URL: ${originalUrl}

CONTENT:
${markdownContent}

Extract the event details according to the instructions and respond with the specified JSON format.`;
    }
    /**
     * Extracts a clean error message from various error types
     */
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'Unknown error occurred';
    }
}
exports.OpenAIService = OpenAIService;
//# sourceMappingURL=openai.service.js.map