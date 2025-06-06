import os
import re
import logging
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ParseMode
from scrapegraphai.graphs import SmartScraperGraph
from airtable import Airtable

# Load environment variables from .env file
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
        await context.bot.send_message(chat_id=update.effective_chat.id, text=f"Scraping {url} for event information...")
        
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
                
                message = f"Event information saved to Airtable: {record_url}{scraped_info}"

                await context.bot.send_message(
                    chat_id=update.effective_chat.id,
                    text=message,
                    parse_mode=ParseMode.MARKDOWN
                )
            else:
                await context.bot.send_message(chat_id=update.effective_chat.id, text="Failed to save event information to Airtable.")
        else:
            await context.bot.send_message(chat_id=update.effective_chat.id, text="Failed to scrape event information from the URL.")
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text="No URL found after 'event:'.")

async def handle_update(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Process messages that contain a community update."""
    update_content = update.message.text[len('update:'):].strip()
    if not update_content:
        await context.bot.send_message(chat_id=update.effective_chat.id, text="Please provide content for the update after 'update:'.")
        return

    await context.bot.send_message(chat_id=update.effective_chat.id, text="Saving your update to Airtable...")
    
    airtable_record = await asyncio.to_thread(save_update_to_airtable, update_content)
    
    if airtable_record:
        record_id = airtable_record['id']
        record_url = f"https://airtable.com/{AIRTABLE_BASE_ID}/{AIRTABLE_UPDATES_TABLE_ID}/{AIRTABLE_UPDATES_VIEW_ID}/{record_id}"
        await context.bot.send_message(chat_id=update.effective_chat.id, text=f"Update saved to Airtable: {record_url}")
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text="Failed to save update to Airtable.")

async def get_html_with_playwright(url: str) -> str:
    """Use Playwright to fetch the fully rendered HTML of a page."""
    logger.info("Fetching page with Playwright to handle dynamic content...")
    html_content = ""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            # Wait for network to be idle, a good signal for SPAs
            await page.goto(url, wait_until="networkidle", timeout=10000)
            html_content = await page.content()
            await browser.close()
            logger.info("Successfully fetched rendered HTML with Playwright.")
    except Exception as e:
        logger.error(f"Playwright failed to fetch HTML: {e}")
    return html_content

async def scrape_event_data(url: str) -> dict:
    """Scrape event data from a given URL."""
    
    # First, get the fully rendered HTML using Playwright
    rendered_html = await get_html_with_playwright(url)
    
    if not rendered_html:
        logger.error("Could not retrieve HTML from Playwright, aborting scrape.")
        return {}
        
    try:
        graph_config = {
            "llm": {
                "api_key": OPENAI_API_KEY,
                "model": "openai/gpt-4o",
            },
        }
        
        today_date = datetime.now().strftime('%Y-%m-%d')
        # A more robust prompt for complex SPAs
        prompt = (
            f"For context, today's date is {today_date}. If the year of the event is not specified, assume it is for the current year or a future year. Do not guess a past year.\\n\\n"
            "Please extract the following information about the event from the provided HTML. "
            "Look for main content containers like <main> or <article> tags.\\n"
            "1. event_title: The main title of the event.\\n"
            "2. description: A detailed summary of the event.\\n"
            "3. start_datetime: The starting date and time. It is crucial this is in ISO 8601 format (e.g., YYYY-MM-DDTHH:MM:SS). If you cannot find a time, use T00:00:00.\\n"
            "4. end_datetime: The ending date and time, also in strict ISO 8601 format. If no end time is specified, return null.\\n"
            "5. location: The physical address or venue of the event.\\n"
            "If any field cannot be found, please explicitly return null for that field."
        )

        smart_scraper_graph = SmartScraperGraph(
            prompt=prompt,
            source=rendered_html, # Pass the pre-rendered HTML directly
            config=graph_config
        )
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, smart_scraper_graph.run)
        
        logger.info(f"Scraping result: {result}")
        return result

    except Exception as e:
        logger.error(f"An error occurred during scraping: {e}")
        return None

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
        logger.error(f"An error occurred while saving to Airtable: {e}")
        return None

def save_update_to_airtable(content: str) -> dict:
    """Save update data to the Updates table in Airtable."""
    try:
        airtable = Airtable(AIRTABLE_BASE_ID, AIRTABLE_UPDATES_TABLE_NAME, api_key=AIRTABLE_API_KEY)
        record = airtable.insert({'Content': content})
        logger.info(f"Airtable record created in Updates table: {record}")
        return record
    except Exception as e:
        logger.error(f"An error occurred while saving update to Airtable: {e}")
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
        logger.error(f"An error occurred while fetching events from Airtable: {e}")
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
        newsletter += "*Events:*\n"
        for event_record in events:
            event = event_record.get('fields', {})
            title = event.get('Event Title', 'No Title')
            link = event.get('Link', '#')
            location = event.get('Location', 'No Location')
            start_str = event.get('Start Datetime')
            
            if start_str:
                dt_obj = datetime.fromisoformat(start_str.replace('Z', ''))
                # Format: Mon, Jun 10 @ 7:00 PM
                formatted_date = dt_obj.strftime('%a, %b %d @ %-I:%M %p')
            else:
                formatted_date = "Date TBD"
            
            newsletter += f"• {formatted_date} @ {location} - [{title}]({link})\n"
        newsletter += "\n"

    if updates:
        newsletter += "*Updates:*\n"
        for update_record in updates:
            update = update_record.get('fields', {})
            content = update.get('Content', 'No content.')
            newsletter += f"• {content}\n"
    
    if not newsletter:
        return "No upcoming events or recent updates found."
        
    return newsletter

async def weekly_weave(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Gathers events and updates and formats them into a newsletter."""
    await context.bot.send_message(chat_id=update.effective_chat.id, text="Gathering events and updates for the Weekly Weave...")
    
    events = await asyncio.to_thread(fetch_upcoming_events)
    updates = await asyncio.to_thread(fetch_recent_updates)
    
    newsletter_content = format_newsletter(events, updates)
    
    # Send the content in a way that's easy to copy
    final_message = f"Here is your Weekly Weave draft:\n\n```markdown\n{newsletter_content}```"

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=final_message,
        parse_mode=ParseMode.MARKDOWN_V2 # Use V2 for safer parsing of user content
    )

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Sends a welcome message when the /start command is issued."""
    await context.bot.send_message(chat_id=update.effective_chat.id, text="Hello! I'm a bot to help you scrape events and add them to Airtable.")

def main():
    """Start the bot."""
    if not all([
        TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, AIRTABLE_API_KEY, 
        AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_TABLE_ID, AIRTABLE_VIEW_ID,
        AIRTABLE_UPDATES_TABLE_NAME, AIRTABLE_UPDATES_TABLE_ID, AIRTABLE_UPDATES_VIEW_ID,
        OPENAI_API_KEY
    ]):
        logger.error("Missing one or more required environment variables.")
        return

    application = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    start_handler = CommandHandler('start', start)
    application.add_handler(start_handler)

    weave_handler = CommandHandler('weeklyweave', weekly_weave)
    application.add_handler(weave_handler)

    message_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message)
    application.add_handler(message_handler)

    logger.info("Bot started and listening for messages...")
    application.run_polling()

if __name__ == '__main__':
    main() 