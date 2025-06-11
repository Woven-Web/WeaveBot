import os
import re
import logging
import asyncio
import signal
import sys
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from telegram import Update, Bot
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ParseMode
from telegram.error import Conflict, TimedOut, NetworkError
from openai import AsyncOpenAI
from airtable import Airtable

# Load environment variables from .env file (for local development)
# In production (Render), environment variables are provided directly
load_dotenv()

# Set up logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get environment variables
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_ID = os.getenv("AIRTABLE_TABLE_ID")
AIRTABLE_VIEW_ID = os.getenv("AIRTABLE_VIEW_ID")
AIRTABLE_TABLE_NAME = os.getenv("AIRTABLE_TABLE_NAME")
AIRTABLE_UPDATES_TABLE_NAME = os.getenv("AIRTABLE_UPDATES_TABLE_NAME")
AIRTABLE_UPDATES_TABLE_ID = os.getenv("AIRTABLE_UPDATES_TABLE_ID")
AIRTABLE_UPDATES_VIEW_ID = os.getenv("AIRTABLE_UPDATES_VIEW_ID")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# URL regex pattern
URL_PATTERN = r'https?://[^\s]+'

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages for events or updates."""
    message_text = update.message.text
    
    if message_text.lower().startswith('event:'):
        await handle_event(update, context)
    elif message_text.lower().startswith('update:'):
        await handle_update(update, context)

async def handle_event(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Process messages that contain an event."""
    url_match = re.search(URL_PATTERN, update.message.text)
    if url_match:
        url = url_match.group(0)
        await context.bot.send_message(
            chat_id=update.effective_chat.id, 
            text=f"🔄 Scraping {url} for event information..."
        )
        
        try:
            event_data = await scrape_event_data(url)
            if event_data:
                airtable_record = await asyncio.to_thread(save_event_to_airtable, event_data, url)
                if airtable_record:
                    record_id = airtable_record['id']
                    record_url = f"https://airtable.com/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_ID}/{AIRTABLE_VIEW_ID}/{record_id}"

                    # Format the scraped data for the message
                    scraped_info = "\n\n*Scraped Information:*\n"
                    scraped_info += f"*Title:* {event_data.get('event_title', 'N/A')}\n"
                    scraped_info += f"*Description:* {event_data.get('description', 'N/A')}\n"
                    scraped_info += f"*Start:* {event_data.get('start_datetime', 'N/A')}\n"
                    scraped_info += f"*End:* {event_data.get('end_datetime', 'N/A')}\n"
                    scraped_info += f"*Location:* {event_data.get('location', 'N/A')}"
                    
                    message = f"✅ Event information saved to Airtable: {record_url}{scraped_info}"

                    await context.bot.send_message(
                        chat_id=update.effective_chat.id,
                        text=message,
                        parse_mode=ParseMode.MARKDOWN
                    )
                else:
                    await context.bot.send_message(
                        chat_id=update.effective_chat.id, 
                        text="❌ Failed to save event information to Airtable."
                    )
            else:
                await context.bot.send_message(
                    chat_id=update.effective_chat.id, 
                    text="❌ Failed to scrape event information from the URL. The website might be blocking automated access or use dynamic content that couldn't be processed."
                )
        except Exception as e:
            logger.error(f"Error processing event: {e}")
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text="❌ An error occurred while processing the event. Please try again later."
            )
    else:
        await context.bot.send_message(
            chat_id=update.effective_chat.id, 
            text="❌ No URL found after 'event:'. Please provide a valid URL."
        )

async def handle_update(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Process messages that contain a community update."""
    url_match = re.search(URL_PATTERN, update.message.text)
    if url_match:
        url = url_match.group(0)
        await context.bot.send_message(
            chat_id=update.effective_chat.id, 
            text=f"🔄 Processing update from {url}..."
        )
        
        try:
            update_data = await scrape_update_data(url)
            if update_data:
                airtable_record = await asyncio.to_thread(save_update_to_airtable, update_data, url)
                if airtable_record:
                    record_id = airtable_record['id']
                    record_url = f"https://airtable.com/{AIRTABLE_BASE_ID}/{AIRTABLE_UPDATES_TABLE_ID}/{AIRTABLE_UPDATES_VIEW_ID}/{record_id}"
                    
                    message = f"✅ Update saved to Airtable: {record_url}\n\n*Title:* {update_data.get('title', 'N/A')}"
                    await context.bot.send_message(
                        chat_id=update.effective_chat.id,
                        text=message,
                        parse_mode=ParseMode.MARKDOWN
                    )
                else:
                    await context.bot.send_message(
                        chat_id=update.effective_chat.id, 
                        text="❌ Failed to save update to Airtable."
                    )
            else:
                await context.bot.send_message(
                    chat_id=update.effective_chat.id, 
                    text="❌ Failed to process update from the URL."
                )
        except Exception as e:
            logger.error(f"Error processing update: {e}")
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text="❌ An error occurred while processing the update. Please try again later."
            )
    else:
        # Handle plain text updates (without URL)
        update_content = update.message.text[len('update:'):].strip()
        if not update_content:
            await context.bot.send_message(
                chat_id=update.effective_chat.id, 
                text="❌ Please provide content or URL for the update after 'update:'."
            )
            return

        await context.bot.send_message(
            chat_id=update.effective_chat.id, 
            text="💾 Saving your update to Airtable..."
        )
        
        update_data = {"title": "Manual Update", "content": update_content}
        airtable_record = await asyncio.to_thread(save_update_to_airtable, update_data)
        
        if airtable_record:
            record_id = airtable_record['id']
            record_url = f"https://airtable.com/{AIRTABLE_BASE_ID}/{AIRTABLE_UPDATES_TABLE_ID}/{AIRTABLE_UPDATES_VIEW_ID}/{record_id}"
            await context.bot.send_message(
                chat_id=update.effective_chat.id, 
                text=f"✅ Update saved to Airtable: {record_url}"
            )
        else:
            await context.bot.send_message(
                chat_id=update.effective_chat.id, 
                text="❌ Failed to save update to Airtable."
            )

async def get_html_with_playwright(url: str) -> str:
    """Use Playwright to fetch the fully rendered HTML of a page."""
    logger.info(f"Fetching page with Playwright: {url}")
    html_content = ""
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            )
            
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (compatible; WeaveBot/1.0; +https://github.com/Woven-Web/WeaveBot)'
            )
            
            page = await context.new_page()
            
            # Set a reasonable timeout and wait for network to be idle
            await page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Wait a bit more for any lazy-loaded content
            await page.wait_for_timeout(2000)
            
            html_content = await page.content()
            await browser.close()
            
            logger.info(f"Successfully fetched rendered HTML ({len(html_content)} characters)")
            
    except Exception as e:
        logger.error(f"Playwright failed to fetch HTML: {e}")
        raise
        
    return html_content

async def extract_event_data_with_openai(html_content: str, url: str) -> dict:
    """Use OpenAI to extract structured event data from HTML."""
    today_date = datetime.now().strftime('%Y-%m-%d')
    
    system_prompt = """You are a helpful assistant that extracts event information from web pages. 
    Extract the event details and return them as a JSON object with the following structure:
    {
        "event_title": "string - the main title of the event",
        "description": "string - a detailed summary of the event", 
        "start_datetime": "string - in ISO 8601 format (YYYY-MM-DDTHH:MM:SS) or null if not found",
        "end_datetime": "string - in ISO 8601 format (YYYY-MM-DDTHH:MM:SS) or null if not found",
        "location": "string - physical address or venue name or null if not found"
    }
    
    Important guidelines:
    - If the year is not specified, assume it's for the current year or future
    - If no specific time is found, use T00:00:00 for the date
    - Return null for any field that cannot be found
    - Be precise with date formatting - use ISO 8601 strictly"""

    user_prompt = f"""Today's date is {today_date}. 

    Please extract event information from this HTML content from {url}:

    {html_content[:8000]}  # Limit to avoid token limits
    
    Return only the JSON object with no additional text."""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1000,
            temperature=0.1
        )
        
        content = response.choices[0].message.content.strip()
        
        # Try to parse JSON from the response
        try:
            # Remove any markdown formatting if present
            if content.startswith('```json'):
                content = content[7:-3]
            elif content.startswith('```'):
                content = content[3:-3]
                
            event_data = json.loads(content)
            logger.info(f"Extracted event data: {event_data}")
            return event_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from OpenAI response: {e}")
            logger.error(f"Raw response: {content}")
            return {}
            
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return {}

async def extract_update_data_with_openai(html_content: str, url: str) -> dict:
    """Use OpenAI to extract update/article data from HTML."""
    
    system_prompt = """You are a helpful assistant that extracts article/update information from web pages.
    Extract the content and return it as a JSON object with the following structure:
    {
        "title": "string - the main title of the article/update",
        "content": "string - a concise summary of the main content (2-3 sentences max)",
        "source": "string - the website/source name"
    }
    
    Focus on the main content and provide a clear, concise summary."""

    user_prompt = f"""Please extract article/update information from this HTML content from {url}:

    {html_content[:8000]}  # Limit to avoid token limits
    
    Return only the JSON object with no additional text."""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=800,
            temperature=0.1
        )
        
        content = response.choices[0].message.content.strip()
        
        # Try to parse JSON from the response
        try:
            # Remove any markdown formatting if present
            if content.startswith('```json'):
                content = content[7:-3]
            elif content.startswith('```'):
                content = content[3:-3]
                
            update_data = json.loads(content)
            logger.info(f"Extracted update data: {update_data}")
            return update_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from OpenAI response: {e}")
            logger.error(f"Raw response: {content}")
            return {}
            
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return {}

async def scrape_event_data(url: str) -> dict:
    """Scrape event data from a given URL using Playwright + OpenAI."""
    try:
        # Get the fully rendered HTML using Playwright
        html_content = await get_html_with_playwright(url)
        
        if not html_content:
            logger.error("Could not retrieve HTML from Playwright")
            return {}
        
        # Extract structured data using OpenAI
        event_data = await extract_event_data_with_openai(html_content, url)
        
        return event_data

    except Exception as e:
        logger.error(f"Error during event scraping: {e}")
        return {}

async def scrape_update_data(url: str) -> dict:
    """Scrape update/article data from a given URL using Playwright + OpenAI."""
    try:
        # Get the fully rendered HTML using Playwright
        html_content = await get_html_with_playwright(url)
        
        if not html_content:
            logger.error("Could not retrieve HTML from Playwright")
            return {}
        
        # Extract structured data using OpenAI
        update_data = await extract_update_data_with_openai(html_content, url)
        
        return update_data

    except Exception as e:
        logger.error(f"Error during update scraping: {e}")
        return {}

def is_iso_date(date_string: str) -> bool:
    """Check if a string is a valid ISO 8601 date."""
    if not date_string or not isinstance(date_string, str):
        return False
    try:
        # Attempt to parse the date string. fromisoformat is quite strict.
        datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return True
    except (ValueError, TypeError):
        return False

def save_event_to_airtable(data: dict, url: str) -> dict:
    """Save event data to Airtable."""
    try:
        # Validate and clean date fields before mapping
        start_datetime = data.get("start_datetime")
        if not is_iso_date(start_datetime):
            start_datetime = None

        end_datetime = data.get("end_datetime")
        if not is_iso_date(end_datetime):
            end_datetime = None

        # Map the keys from the scraper to the column names in Airtable
        airtable_data = {
            "Event Title": data.get("event_title"),
            "Description": data.get("description"),
            "Start Datetime": start_datetime,
            "End Datetime": end_datetime,
            "Location": data.get("location"),
            "Link": url,
        }
        
        airtable = Airtable(AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, api_key=AIRTABLE_API_KEY)
        record = airtable.insert(airtable_data)
        logger.info(f"Airtable record created: {record}")
        return record
        
    except Exception as e:
        logger.error(f"Error saving to Airtable: {e}")
        return None

def save_update_to_airtable(data: dict, url: str = None) -> dict:
    """Save update data to the Updates table in Airtable."""
    try:
        # Handle both structured data and simple content
        if isinstance(data, dict):
            if "content" in data:
                # Simple content update
                airtable_data = {'Content': data.get("content", "")}
            else:
                # Structured update data
                content = f"{data.get('title', '')}\n\n{data.get('content', '')}"
                if url:
                    content += f"\n\nSource: {url}"
                airtable_data = {'Content': content.strip()}
        else:
            # Legacy string content
            airtable_data = {'Content': str(data)}
        
        airtable = Airtable(AIRTABLE_BASE_ID, AIRTABLE_UPDATES_TABLE_NAME, api_key=AIRTABLE_API_KEY)
        record = airtable.insert(airtable_data)
        logger.info(f"Airtable record created in Updates table: {record}")
        return record
        
    except Exception as e:
        logger.error(f"Error saving update to Airtable: {e}")
        return None

def fetch_upcoming_events() -> list:
    """Fetch events from Airtable starting in the next 14 days."""
    try:
        airtable = Airtable(AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, api_key=AIRTABLE_API_KEY)
        
        # Formula to get events between today and 14 days from now
        fourteen_days_from_now = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
        formula = f"AND(IS_AFTER({{Start Datetime}}, TODAY()), IS_BEFORE({{Start Datetime}}, '{fourteen_days_from_now}'))"
        
        events = airtable.get_all(
            formula=formula,
            sort=[('Start Datetime', 'asc')]
        )
        logger.info(f"Found {len(events)} upcoming events.")
        return events
        
    except Exception as e:
        logger.error(f"Error fetching events from Airtable: {e}")
        return []

def fetch_recent_updates() -> list:
    """Fetch updates from Airtable created in the last 7 days."""
    try:
        airtable = Airtable(AIRTABLE_BASE_ID, AIRTABLE_UPDATES_TABLE_NAME, api_key=AIRTABLE_API_KEY)
        
        # Formula to get updates from the last 7 days
        formula = "DATETIME_DIFF(TODAY(), {Received At}, 'days') <= 7"
        
        updates = airtable.get_all(
            formula=formula,
            sort=[('Received At', 'desc')]
        )
        logger.info(f"Found {len(updates)} recent updates.")
        return updates
        
    except Exception as e:
        # If the 'Received At' field doesn't exist, this will fail. We can ignore it.
        logger.warning(f"Could not fetch recent updates (maybe 'Received At' field is missing?): {e}")
        return []

def format_newsletter(events: list, updates: list) -> str:
    """Format events and updates into a Markdown newsletter string."""
    newsletter = ""
    
    if events:
        newsletter += "*Upcoming Events:*\n"
        for event_record in events:
            event = event_record.get('fields', {})
            title = event.get('Event Title', 'No Title')
            link = event.get('Link', '#')
            location = event.get('Location', 'No Location')
            start_str = event.get('Start Datetime')
            
            if start_str:
                try:
                    dt_obj = datetime.fromisoformat(start_str.replace('Z', ''))
                    # Format: Mon, Jun 10 @ 7:00 PM
                    formatted_date = dt_obj.strftime('%a, %b %d @ %-I:%M %p')
                except:
                    formatted_date = start_str
            else:
                formatted_date = "Date TBD"
            
            newsletter += f"• {formatted_date} @ {location} - [{title}]({link})\n"
        newsletter += "\n"

    if updates:
        newsletter += "*Recent Updates:*\n"
        for update_record in updates:
            update = update_record.get('fields', {})
            content = update.get('Content', 'No content.')
            # Truncate long updates for the newsletter
            if len(content) > 200:
                content = content[:197] + "..."
            newsletter += f"• {content}\n"
    
    if not newsletter:
        return "No upcoming events or recent updates found."
        
    return newsletter

async def weekly_weave(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Gathers events and updates and formats them into a newsletter."""
    await context.bot.send_message(
        chat_id=update.effective_chat.id, 
        text="📊 Gathering events and updates for the Weekly Weave..."
    )
    
    try:
        events = await asyncio.to_thread(fetch_upcoming_events)
        updates = await asyncio.to_thread(fetch_recent_updates)
        
        newsletter_content = format_newsletter(events, updates)
        
        # Send the content in a way that's easy to copy
        final_message = f"📈 *Weekly Weave Summary*\n\n{newsletter_content}"

        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=final_message,
            parse_mode=ParseMode.MARKDOWN
        )
        
    except Exception as e:
        logger.error(f"Error generating weekly weave: {e}")
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text="❌ Failed to generate Weekly Weave. Please try again later."
        )

async def cleanup_webhook_and_pending_updates():
    """Clean up any existing webhooks and pending updates before starting polling."""
    try:
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        
        # Delete webhook to ensure we can use polling
        logger.info("Cleaning up webhook...")
        await bot.delete_webhook(drop_pending_updates=True)
        
        # Wait a moment for cleanup
        await asyncio.sleep(2)
        
        logger.info("Webhook cleanup completed")
        
    except Exception as e:
        logger.warning(f"Webhook cleanup failed (this might be normal): {e}")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Sends a welcome message when the /start command is issued."""
    welcome_message = """🌟 *WeaveBot* 🌟

Welcome to WeaveBot - your intelligent event assistant!

*Commands:*
• `/start` - Show this welcome message
• `/weeklyweave` - Get recent events and updates summary

*Message Formats:*
• `event: [URL]` - Extract event details from a webpage
• `update: [URL or text]` - Process update information

*Best supported sites:*
📰 News sites & blogs
📋 Simple event pages  
🎯 Meetup.com events
📄 Static websites

*Examples:*
`event: https://meetup.com/event-link`
`update: https://techcrunch.com/article`
`update: Just wanted to share that our meetup went great!`

Built with Python + Playwright + OpenAI GPT-4o 🚀"""

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=welcome_message,
        parse_mode=ParseMode.MARKDOWN
    )

async def start_bot():
    """Start the bot."""
    # Clean up any webhooks/pending updates first
    await cleanup_webhook_and_pending_updates()
    
    application = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    start_handler = CommandHandler('start', start)
    application.add_handler(start_handler)

    weave_handler = CommandHandler('weeklyweave', weekly_weave)
    application.add_handler(weave_handler)

    message_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message)
    application.add_handler(message_handler)

    # Initialize the application
    await application.initialize()
    await application.start()
    
    # Start polling manually
    await application.updater.start_polling(drop_pending_updates=True)
    
    logger.info("🚀 WeaveBot started and listening for messages...")
    
    try:
        # Keep the bot running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    finally:
        # Clean shutdown
        await application.updater.stop()
        await application.stop()
        await application.shutdown()

def main():
    """Start the bot."""
    required_vars = [
        TELEGRAM_BOT_TOKEN, AIRTABLE_API_KEY, AIRTABLE_BASE_ID, 
        AIRTABLE_TABLE_NAME, OPENAI_API_KEY
    ]
    
    if not all(required_vars):
        logger.error("Missing required environment variables:")
        missing = []
        if not TELEGRAM_BOT_TOKEN: missing.append("TELEGRAM_BOT_TOKEN")
        if not AIRTABLE_API_KEY: missing.append("AIRTABLE_API_KEY") 
        if not AIRTABLE_BASE_ID: missing.append("AIRTABLE_BASE_ID")
        if not AIRTABLE_TABLE_NAME: missing.append("AIRTABLE_TABLE_NAME")
        if not OPENAI_API_KEY: missing.append("OPENAI_API_KEY")
        logger.error(f"Missing: {', '.join(missing)}")
        return

    # Simple event loop handling
    try:
        asyncio.run(start_bot())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Bot crashed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main()