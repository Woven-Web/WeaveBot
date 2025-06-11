"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const logger_js_1 = require("./utils/logger.js");
const config_js_1 = require("./utils/config.js");
const telegram_handlers_js_1 = require("./handlers/telegram.handlers.js");
async function main() {
    try {
        // Get validated configuration
        const config = (0, config_js_1.getConfig)();
        logger_js_1.logger.info('Starting WeaveBot', {
            nodeEnv: config.NODE_ENV,
            logLevel: config.LOG_LEVEL
        });
        // Initialize Telegram bot
        const bot = new telegraf_1.Telegraf(config.TELEGRAM_BOT_TOKEN);
        // Set up command handlers
        bot.command('start', telegram_handlers_js_1.startHandler);
        bot.command('weeklyweave', telegram_handlers_js_1.weeklyWeaveHandler);
        // Set up message handlers for event: and update: patterns
        bot.hears(/^event:\s*(.+)/i, telegram_handlers_js_1.eventHandler);
        bot.hears(/^update:\s*(.+)/i, telegram_handlers_js_1.updateHandler);
        // Handle all other text messages
        bot.on('text', telegram_handlers_js_1.unknownCommandHandler);
        // Error handling
        bot.catch((err, ctx) => {
            logger_js_1.logger.error('Bot error occurred', {
                error: err instanceof Error ? err.message : String(err),
                updateType: ctx.updateType,
                userId: ctx.from?.id,
                username: ctx.from?.username,
                stack: err instanceof Error ? err.stack : undefined
            });
        });
        // Start the bot
        logger_js_1.logger.info('Starting bot polling...');
        await bot.launch();
        logger_js_1.logger.info('WeaveBot is now running! 🚀');
        // Graceful shutdown handling
        process.once('SIGINT', () => {
            logger_js_1.logger.info('Received SIGINT, stopping bot...');
            bot.stop('SIGINT');
        });
        process.once('SIGTERM', () => {
            logger_js_1.logger.info('Received SIGTERM, stopping bot...');
            bot.stop('SIGTERM');
        });
    }
    catch (error) {
        logger_js_1.logger.error('Failed to start WeaveBot', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        process.exit(1);
    }
}
// Run the bot if this file is executed directly
main().catch((error) => {
    logger_js_1.logger.error('Unhandled error in main', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
});
//# sourceMappingURL=index.js.map