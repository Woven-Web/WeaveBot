"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUpdate = processUpdate;
const logger_1 = require("../utils/logger");
const markdowner_service_1 = require("./markdowner.service");
const airtable_service_1 = require("./airtable.service");
// Create service instances
const markdownerService = new markdowner_service_1.MarkdownerService();
const airtableService = new airtable_service_1.AirtableService();
async function processUpdate(url, userId) {
    const startTime = Date.now();
    try {
        logger_1.logger.info('Starting update processing', { url, userId });
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
        // Step 2: Create update data
        const updateData = {
            content: markdownResult.data,
            timestamp: new Date().toISOString(),
            chat_id: userId.toString(),
        };
        // Step 3: Save to Airtable
        logger_1.logger.info('Saving update to Airtable', {
            url,
            contentLength: markdownResult.data.length
        });
        try {
            const recordId = await airtableService.saveUpdate(updateData);
            const processingTime = Date.now() - startTime;
            logger_1.logger.info('Update processing completed successfully', {
                url,
                userId,
                updateId: recordId,
                processingTimeMs: processingTime
            });
            return {
                success: true,
                data: {
                    ...updateData,
                    id: recordId,
                    source: url,
                    title: markdownResult.metadata?.title || 'Update'
                }
            };
        }
        catch (saveError) {
            logger_1.logger.error('Failed to save update to Airtable', {
                url,
                error: saveError instanceof Error ? saveError.message : String(saveError)
            });
            return {
                success: false,
                error: `Failed to save update: ${saveError instanceof Error ? saveError.message : String(saveError)}`
            };
        }
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        logger_1.logger.error('Unexpected error during update processing', {
            url,
            userId,
            processingTimeMs: processingTime,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return {
            success: false,
            error: 'An unexpected error occurred while processing the update'
        };
    }
}
//# sourceMappingURL=update.processor.js.map