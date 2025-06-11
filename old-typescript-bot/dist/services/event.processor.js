"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEvent = processEvent;
const logger_1 = require("../utils/logger");
const markdowner_service_1 = require("./markdowner.service");
const openai_service_1 = require("./openai.service");
const airtable_service_1 = require("./airtable.service");
// Create service instances
const markdownerService = new markdowner_service_1.MarkdownerService();
const openaiService = new openai_service_1.OpenAIService();
const airtableService = new airtable_service_1.AirtableService();
async function processEvent(url, userId) {
    const startTime = Date.now();
    try {
        logger_1.logger.info('Starting event processing', { url, userId });
        // Step 1: Convert webpage to markdown
        logger_1.logger.info('Converting webpage to markdown', { url });
        const markdownResult = await markdownerService.scrapeUrl(url);
        if (!markdownResult.success || !markdownResult.data) {
            logger_1.logger.error('Failed to convert webpage to markdown', {
                url,
                error: markdownResult.error
            });
            return {
                success: false,
                error: `Failed to fetch webpage content: ${markdownResult.error}`
            };
        }
        // Step 2: Extract event data using OpenAI
        logger_1.logger.info('Extracting event data from markdown', {
            url,
            contentLength: markdownResult.data.length
        });
        const extractionResult = await openaiService.extractEventData(markdownResult.data, url);
        if (!extractionResult.success || !extractionResult.event) {
            logger_1.logger.error('Failed to extract event data', {
                url,
                error: extractionResult.error
            });
            return {
                success: false,
                error: `Failed to extract event details: ${extractionResult.error}`
            };
        }
        // Step 3: Save to Airtable
        logger_1.logger.info('Saving event to Airtable', {
            url,
            eventTitle: extractionResult.event.event_title
        });
        try {
            const recordId = await airtableService.saveEvent(extractionResult.event);
            const processingTime = Date.now() - startTime;
            logger_1.logger.info('Event processing completed successfully', {
                url,
                userId,
                eventId: recordId,
                processingTimeMs: processingTime
            });
            return {
                success: true,
                data: {
                    ...extractionResult.event,
                    id: recordId,
                    source_url: url
                }
            };
        }
        catch (saveError) {
            logger_1.logger.error('Failed to save event to Airtable', {
                url,
                error: saveError instanceof Error ? saveError.message : String(saveError)
            });
            return {
                success: false,
                error: `Failed to save event: ${saveError instanceof Error ? saveError.message : String(saveError)}`
            };
        }
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        logger_1.logger.error('Unexpected error during event processing', {
            url,
            userId,
            processingTimeMs: processingTime,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return {
            success: false,
            error: 'An unexpected error occurred while processing the event'
        };
    }
}
//# sourceMappingURL=event.processor.js.map