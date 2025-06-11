# WeaveBot TypeScript 🚀

A modern TypeScript rewrite of WeaveBot - an intelligent Telegram bot for event extraction and data management.

## Overview

WeaveBot processes event information from web pages and stores them in Airtable. This TypeScript version offers significant improvements over the original Python implementation:

- **⚡ 3x faster processing** - Under 10 seconds vs 30+ seconds
- **🏗️ Zero browser dependencies** - Uses hosted Markdowner API instead of Playwright  
- **🔒 Full type safety** - Comprehensive TypeScript with Zod validation
- **📊 Structured logging** - Winston-based logging with production optimizations
- **🐳 Simple deployment** - Standard Node.js container, no complex browser setup

## Features

### Commands
- `/start` - Welcome message and bot introduction
- `/weeklyweave` - Generate weekly summary of recent events and updates

### Message Handlers
- `event: <URL>` - Extract event data from webpage and save to Airtable
- `update: <URL>` - Save webpage content as an update to Airtable

## Architecture

```
src/
├── types/           # TypeScript types and Zod schemas
├── utils/           # Configuration and logging utilities  
├── services/        # Core business logic services
├── handlers/        # Telegram bot message handlers
└── test/           # Test files
```

### Core Services

- **MarkdownerService** - Converts web pages to clean markdown using hosted API
- **OpenAIService** - Extracts structured event data using GPT-4
- **AirtableService** - Manages event and update storage
- **Event/Update Processors** - Orchestrate the full processing workflows

## Installation

### Prerequisites
- Node.js 20+
- npm or yarn
- Environment variables (see Configuration)

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the bot
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

## Configuration

Create a `.env` file with the following variables:

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_key

# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_ID=your_table_id
AIRTABLE_VIEW_ID=your_view_id
AIRTABLE_TABLE_NAME=Events
AIRTABLE_UPDATES_TABLE_NAME=Updates
AIRTABLE_UPDATES_TABLE_ID=your_updates_table_id
AIRTABLE_UPDATES_VIEW_ID=your_updates_view_id

# Optional Configuration
NODE_ENV=production
LOG_LEVEL=info
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | ✅ |
| `TELEGRAM_CHAT_ID` | Default chat ID for messages | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | ✅ |
| `AIRTABLE_API_KEY` | Airtable API key | ✅ |
| `AIRTABLE_BASE_ID` | Airtable base ID | ✅ |
| `AIRTABLE_TABLE_ID` | Events table ID | ✅ |
| `AIRTABLE_VIEW_ID` | Events view ID | ✅ |
| `AIRTABLE_TABLE_NAME` | Events table name | ✅ |
| `AIRTABLE_UPDATES_TABLE_NAME` | Updates table name | ✅ |
| `AIRTABLE_UPDATES_TABLE_ID` | Updates table ID | ✅ |
| `AIRTABLE_UPDATES_VIEW_ID` | Updates view ID | ✅ |
| `NODE_ENV` | Environment (development/production) | ❌ |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | ❌ |

## Deployment

### Docker

```bash
# Build the image
docker build -t weavebot .

# Run the container
docker run -d --env-file .env weavebot
```

### Render

1. Connect your GitHub repository to Render
2. Set the environment variables in Render dashboard
3. Deploy using the included `render.yaml` configuration

The bot will automatically build and deploy on Render using:
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Runtime**: Node.js

## Usage Examples

### Processing an Event

Send a message to the bot:
```
event: https://example.com/conference-2024
```

The bot will:
1. Extract the webpage content as markdown
2. Use OpenAI to identify event details (title, date, location, etc.)
3. Save the structured event data to Airtable
4. Respond with confirmation and processing time

### Adding an Update

Send a message to the bot:
```
update: https://example.com/important-announcement
```

The bot will:
1. Extract the webpage content
2. Save it as an update entry in Airtable
3. Respond with confirmation

### Weekly Summary

Send the command:
```
/weeklyweave
```

The bot will generate a summary of recent events and updates from the past week.

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

The test suite includes:
- Service health checks
- API integration tests  
- Configuration validation
- Type safety verification

## Error Handling

The bot includes comprehensive error handling:

- **Service failures** - Graceful degradation with user-friendly messages
- **Rate limiting** - Built-in retry logic for external APIs
- **Validation errors** - Clear feedback for invalid inputs
- **Network issues** - Automatic retries with exponential backoff

All errors are logged with structured data for debugging.

## Migration from Python Version

The original Python implementation has been moved to `old-python-bot/` for reference. Key improvements in the TypeScript version:

| Aspect | Python Version | TypeScript Version |
|--------|----------------|-------------------|
| **Performance** | 30+ seconds | <10 seconds |
| **Dependencies** | Playwright + browsers | Hosted API only |
| **Type Safety** | Limited | Full TypeScript + Zod |
| **Deployment** | Complex (browser install) | Simple (Node.js only) |
| **Error Handling** | Basic | Comprehensive |
| **Logging** | Print statements | Structured Winston |
| **Testing** | Manual | Automated Jest suite |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm test`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check the logs for detailed error information
2. Verify all environment variables are set correctly
3. Test individual services using the health check endpoints
4. Open an issue with relevant logs and configuration details 