import { Telegraf } from 'telegraf';
import { logger } from './utils/logger.js';
import { getConfig } from './utils/config.js';
import { 
  startHandler, 
  weeklyWeaveHandler, 
  eventHandler, 
  updateHandler, 
  unknownCommandHandler 
} from './handlers/telegram.handlers.js';

async function main() {
  try {
    // Get validated configuration
    const config = getConfig();
    logger.info('Starting WeaveBot', { 
      nodeEnv: config.NODE_ENV,
      logLevel: config.LOG_LEVEL 
    });

    // Initialize Telegram bot
    const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

    // Set up command handlers
    bot.command('start', startHandler);
    bot.command('weeklyweave', weeklyWeaveHandler);

    // Set up message handlers for event: and update: patterns
    bot.hears(/^event:\s*(.+)/i, eventHandler);
    bot.hears(/^update:\s*(.+)/i, updateHandler);

    // Handle all other text messages
    bot.on('text', unknownCommandHandler);

    // Error handling
    bot.catch((err, ctx) => {
      logger.error('Bot error occurred', {
        error: err instanceof Error ? err.message : String(err),
        updateType: ctx.updateType,
        userId: ctx.from?.id,
        username: ctx.from?.username,
        stack: err instanceof Error ? err.stack : undefined
      });
    });

    // Start the bot
    logger.info('Starting bot polling...');
    await bot.launch();

    logger.info('WeaveBot is now running! 🚀');

    // Graceful shutdown handling
    process.once('SIGINT', () => {
      logger.info('Received SIGINT, stopping bot...');
      bot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
      logger.info('Received SIGTERM, stopping bot...');
      bot.stop('SIGTERM');
    });

  } catch (error) {
    logger.error('Failed to start WeaveBot', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Run the bot if this file is executed directly
main().catch((error) => {
  logger.error('Unhandled error in main', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
}); 