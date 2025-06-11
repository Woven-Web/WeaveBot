"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unknownCommandHandler = exports.updateHandler = exports.eventHandler = exports.weeklyWeaveHandler = exports.startHandler = void 0;
const logger_js_1 = require("../utils/logger.js");
const event_processor_1 = require("../services/event.processor");
const update_processor_1 = require("../services/update.processor");
const startHandler = async (ctx) => {
    try {
        logger_js_1.logger.info('Start command received', {
            userId: ctx.from?.id,
            username: ctx.from?.username
        });
        const welcomeMessage = `🌟 *WeaveBot* 🌟

Welcome to WeaveBot - your intelligent event assistant!

*Commands:*
• \`/start\` - Show this welcome message
• \`/weeklyweave\` - Get recent events and updates

*Message Formats:*
• \`event: [URL]\` - Extract event details from a webpage
• \`update: [URL]\` - Process update information from a webpage

Simply send me a message in one of these formats and I'll extract the relevant information for you!

Built with TypeScript, powered by OpenAI GPT-4o 🚀`;
        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true }
        });
        logger_js_1.logger.info('Start message sent successfully', { userId: ctx.from?.id });
    }
    catch (error) {
        logger_js_1.logger.error('Error in start handler', {
            error: error instanceof Error ? error.message : String(error),
            userId: ctx.from?.id
        });
        await ctx.reply('Sorry, something went wrong. Please try again later.');
    }
};
exports.startHandler = startHandler;
const weeklyWeaveHandler = async (ctx) => {
    try {
        logger_js_1.logger.info('Weekly weave command received', {
            userId: ctx.from?.id,
            username: ctx.from?.username
        });
        await ctx.reply('📊 Generating your weekly summary...');
        // TODO: Implement weekly summary logic
        // This would fetch recent events and updates from Airtable
        // and format them into a nice summary
        const placeholderMessage = `📈 *Weekly Weave Summary* 📈

🎯 **Recent Events:**
• Coming soon...

📝 **Recent Updates:**  
• Coming soon...

_This feature is being developed. Check back soon!_`;
        await ctx.reply(placeholderMessage, {
            parse_mode: 'Markdown'
        });
        logger_js_1.logger.info('Weekly weave response sent', { userId: ctx.from?.id });
    }
    catch (error) {
        logger_js_1.logger.error('Error in weekly weave handler', {
            error: error instanceof Error ? error.message : String(error),
            userId: ctx.from?.id
        });
        await ctx.reply('Sorry, I couldn\'t generate your weekly summary. Please try again later.');
    }
};
exports.weeklyWeaveHandler = weeklyWeaveHandler;
const eventHandler = async (ctx) => {
    try {
        const messageText = ctx.message.text;
        const url = messageText.replace(/^event:\s*/i, '').trim();
        logger_js_1.logger.info('Event processing request received', {
            userId: ctx.from?.id,
            url,
            messageLength: messageText.length
        });
        if (!url || !isValidUrl(url)) {
            await ctx.reply('❌ Please provide a valid URL after "event:"');
            return;
        }
        await ctx.reply('🔄 Processing event... This may take a few seconds.');
        const result = await (0, event_processor_1.processEvent)(url, ctx.from?.id || 0);
        if (result.success) {
            const successMessage = `✅ *Event processed successfully!*

📅 **${result.data?.event_title || 'Event'}**
📍 ${result.data?.location || 'Location TBA'}
🗓️ ${result.data?.start_datetime || 'Date TBA'}

Event details have been saved to the database.`;
            await ctx.reply(successMessage, { parse_mode: 'Markdown' });
            logger_js_1.logger.info('Event processed successfully', {
                userId: ctx.from?.id,
                eventId: result.data?.id,
                url
            });
        }
        else {
            // Provide more helpful error messages for common issues
            let errorMessage = result.error || 'Unknown error occurred';
            if (errorMessage.includes('blocked our request') || errorMessage.includes('anti-bot protection')) {
                errorMessage += '\n\n💡 *Tip:* Try using a different event platform like Lu.ma, Meetup, or Facebook Events which are more bot-friendly.';
            }
            await ctx.reply(`❌ Failed to process event: ${errorMessage}`, {
                parse_mode: 'Markdown',
                link_preview_options: { is_disabled: true }
            });
            logger_js_1.logger.warn('Event processing failed', {
                userId: ctx.from?.id,
                url,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_js_1.logger.error('Error in event handler', {
            error: error instanceof Error ? error.message : String(error),
            userId: ctx.from?.id
        });
        await ctx.reply('❌ Sorry, I encountered an error processing the event. Please try again later.');
    }
};
exports.eventHandler = eventHandler;
const updateHandler = async (ctx) => {
    try {
        const messageText = ctx.message.text;
        const url = messageText.replace(/^update:\s*/i, '').trim();
        logger_js_1.logger.info('Update processing request received', {
            userId: ctx.from?.id,
            url,
            messageLength: messageText.length
        });
        if (!url || !isValidUrl(url)) {
            await ctx.reply('❌ Please provide a valid URL after "update:"');
            return;
        }
        await ctx.reply('🔄 Processing update... This may take a few seconds.');
        const result = await (0, update_processor_1.processUpdate)(url, ctx.from?.id || 0);
        if (result.success) {
            const successMessage = `✅ *Update processed successfully!*

📝 **${result.data?.title || 'Update'}**
🔗 ${result.data?.source || 'Source'}

Update details have been saved to the database.`;
            await ctx.reply(successMessage, { parse_mode: 'Markdown' });
            logger_js_1.logger.info('Update processed successfully', {
                userId: ctx.from?.id,
                updateId: result.data?.id,
                url
            });
        }
        else {
            // Provide more helpful error messages for common issues  
            let errorMessage = result.error || 'Unknown error occurred';
            if (errorMessage.includes('blocked our request') || errorMessage.includes('anti-bot protection')) {
                errorMessage += '\n\n💡 *Tip:* Some websites block automated access. Try using news sites, blogs, or official announcements which are typically more accessible.';
            }
            await ctx.reply(`❌ Failed to process update: ${errorMessage}`, {
                parse_mode: 'Markdown',
                link_preview_options: { is_disabled: true }
            });
            logger_js_1.logger.warn('Update processing failed', {
                userId: ctx.from?.id,
                url,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_js_1.logger.error('Error in update handler', {
            error: error instanceof Error ? error.message : String(error),
            userId: ctx.from?.id
        });
        await ctx.reply('❌ Sorry, I encountered an error processing the update. Please try again later.');
    }
};
exports.updateHandler = updateHandler;
const unknownCommandHandler = async (ctx) => {
    try {
        logger_js_1.logger.info('Unknown message received', {
            userId: ctx.from?.id,
            messageText: ctx.message.text.substring(0, 100)
        });
        const helpMessage = `🤔 I didn't understand that message.

*Here's what I can help you with:*

📋 **Commands:**
• \`/start\` - Show welcome message
• \`/weeklyweave\` - Get recent summary

📝 **Message Formats:**
• \`event: [URL]\` - Extract event details
• \`update: [URL]\` - Process update information

*Example:*
\`event: https://example.com/event-page\`
\`update: https://example.com/news-article\``;
        await ctx.reply(helpMessage, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true }
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error in unknown command handler', {
            error: error instanceof Error ? error.message : String(error),
            userId: ctx.from?.id
        });
    }
};
exports.unknownCommandHandler = unknownCommandHandler;
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=telegram.handlers.js.map