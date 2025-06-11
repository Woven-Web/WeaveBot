# WeaveBot - Intelligent Event Assistant 🤖

[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://python.org)
[![Playwright](https://img.shields.io/badge/playwright-1.43+-green.svg)](https://playwright.dev)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-orange.svg)](https://openai.com)

An intelligent Telegram bot that extracts event information from web pages using **Playwright** for browser automation and **OpenAI GPT-4o** for intelligent data extraction.

## 🚀 Key Features

- **🌐 Universal Web Scraping**: Handles JavaScript-heavy sites (Lu.ma, Meetup, etc.) with Playwright
- **🧠 AI-Powered Extraction**: Uses GPT-4o for intelligent event/update data extraction
- **📊 Airtable Integration**: Automatically saves events and updates to organized tables
- **⚡ Fast Processing**: ~5-10 second response times
- **🛡️ Robust Error Handling**: Graceful failures with helpful user feedback
- **📈 Weekly Summaries**: Generate newsletter-style event and update summaries

## 🏗️ Architecture

```
User Input (URL) → Playwright (Render Page) → OpenAI (Extract Data) → Airtable (Save) → User Feedback
```

### Why This Approach?

- **Playwright**: Handles modern JavaScript-heavy event platforms
- **OpenAI GPT-4o**: Intelligent, context-aware data extraction
- **Direct Integration**: No third-party scraping services, full control
- **Cost Effective**: Only OpenAI API costs (~$20-50/month typical usage)

## 📋 Commands

- `/start` - Welcome message and usage guide
- `/weeklyweave` - Generate weekly summary of events and updates

## 💬 Message Formats

### Event Extraction
```
event: https://lu.ma/event-link
event: https://meetup.com/group/events/123456
event: https://eventbrite.com/e/event-name-123456
```

### Update Processing
```
update: https://techcrunch.com/article-link
update: Just wanted to share that our meetup went great!
```

## 🌐 Supported Websites

### ✅ **Excellent Support**
- **Lu.ma events** - Full dynamic content support
- **Meetup.com** - Comprehensive event details
- **News sites** - TechCrunch, Wired, etc.
- **Simple event pages** - Static HTML sites
- **Blog posts** - Personal and corporate blogs

### ⚠️ **Limited Support**
- **Eventbrite** - May be blocked due to anti-bot measures
- **Facebook Events** - Requires authentication
- **LinkedIn Events** - Anti-scraping protection

## 🔧 Environment Variables

### Required
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TABLE_NAME=Events
```

### Optional
```bash
AIRTABLE_TABLE_ID=optional_events_table_id
AIRTABLE_VIEW_ID=optional_events_view_id
AIRTABLE_UPDATES_TABLE_NAME=Updates
AIRTABLE_UPDATES_TABLE_ID=optional_updates_table_id
AIRTABLE_UPDATES_VIEW_ID=optional_updates_view_id
```

## 🚀 Deployment

### Option 1: Render (Recommended)
1. Fork this repository
2. Connect to Render
3. Set environment variables
4. Deploy as Worker service

### Option 2: Docker
```bash
# Build image
docker build -t weavebot .

# Run container
docker run -d \
  --name weavebot \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e OPENAI_API_KEY=your_key \
  -e AIRTABLE_API_KEY=your_key \
  -e AIRTABLE_BASE_ID=your_base_id \
  -e AIRTABLE_TABLE_NAME=Events \
  weavebot
```

### Option 3: Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Set environment variables in .env file
cp .env.example .env
# Edit .env with your keys

# Run the bot
python bot.py
```

## 📊 Data Structure

### Events Table (Airtable)
- **Event Title** (Text)
- **Description** (Long Text)
- **Start Datetime** (Date/Time)
- **End Datetime** (Date/Time)
- **Location** (Text)
- **Link** (URL)

### Updates Table (Airtable)
- **Content** (Long Text)
- **Received At** (Date/Time - auto-generated)

## 🏃‍♂️ Performance

- **Cold Start**: ~5-10 seconds
- **Warm Processing**: ~3-5 seconds
- **Memory Usage**: ~150-200MB
- **Browser Overhead**: Minimal (headless Chromium)

## 🔄 Migration from ScrapeGraphAI

This version **removes ScrapeGraphAI** in favor of a cleaner architecture:

### Before (Issues)
- Complex setup with multiple dependencies
- ScrapeGraphAI reliability issues
- Credit-based pricing confusion
- Performance overhead

### After (Benefits)
- Direct Playwright + OpenAI integration
- Predictable OpenAI-only costs
- Better error handling and logging
- Faster processing times

## 🛠️ Development

### Project Structure
```
WeaveBot/
├── bot.py              # Main bot logic
├── requirements.txt    # Python dependencies
├── Dockerfile         # Container configuration
├── render.yaml        # Render deployment config
└── README.md          # This file
```

### Key Components
- **Event Processing**: `scrape_event_data()` + `extract_event_data_with_openai()`
- **Update Processing**: `scrape_update_data()` + `extract_update_data_with_openai()`
- **Browser Automation**: `get_html_with_playwright()`
- **Data Storage**: `save_event_to_airtable()` + `save_update_to_airtable()`

## 🐛 Troubleshooting

### Common Issues

**Bot not responding**
- Check Telegram bot token
- Verify internet connectivity
- Check logs for error messages

**Scraping failures**
- Some sites block automated access
- Try different event platforms (Lu.ma, Meetup)
- Check if URL is accessible manually

**Airtable errors**
- Verify API key and base ID
- Check table names match exactly
- Ensure required fields exist in tables

### Logging
The bot provides detailed logging for debugging:
```bash
# View logs in production
docker logs weavebot

# Local development
python bot.py  # Logs print to console
```

## 📈 Usage Analytics

Track your bot usage:
- **Successful Events**: Check Airtable Events table
- **Updates Processed**: Check Airtable Updates table
- **Error Rates**: Monitor application logs
- **Response Times**: Built-in timing logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙋‍♂️ Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Open a GitHub issue with details

---

**Built with ❤️ using Python, Playwright, and OpenAI GPT-4o** 