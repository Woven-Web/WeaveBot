# Weekly Weave Telegram Bot

This bot provides tools for community event management and updates, all from within a Telegram chat. It can scrape event details from a URL, save community updates, and compile everything into a weekly newsletter format.

This project uses `python-telegram-bot`, `scrapegraphai` for scraping, and `airtable-python-wrapper` for database integration.

## Features

-   **Event Scraping**: Post `event: <url>` to have the bot visit the URL, extract event details (title, description, dates, location), and save them to an Airtable base.
-   **Community Updates**: Post `update: <your message>` to save a Markdown-formatted update to a separate table in Airtable.
-   **Newsletter Generation**: Use the `/weeklyweave` command to generate a summary of all events in the next 14 days and all updates from the last 7 days, formatted in Markdown for easy copy-pasting.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Create a Virtual Environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    # On Windows, use `venv\Scripts\activate`
    ```
    
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Install browser binaries for scraping:**
    This is a one-time command that allows the scraper to handle JavaScript-heavy sites.
    ```bash
    playwright install
    ```

5.  **Set up environment variables:**
    - Rename `env.example` to `.env`.
    - Open the `.env` file and add your credentials for Telegram, Airtable, and OpenAI. The comments in the file guide you on where to find each value.

6.  **Set up your Airtable base:**
    Follow the instructions in `env.example` to get your various IDs.

    **A) Events Table**
    - Your main table for events (e.g., named "Events").
    - It must have the following fields (names are case-sensitive):
        - `Event Title` (Single line text)
        - `Description` (Long text)
        - `Start Datetime` (Date time)
        - `End Datetime` (Date time)
        - `Location` (Single line text)
        - `Link` (URL)

    **B) Updates Table**
    - A second table for updates (e.g., named "Updates"). Your primary field cannot be rich text, so follow this structure:
        - **Primary Field**: Name it `Update ID` and set the type to `Autonumber`.
        - `Content` field: Set the type to `Long text` and enable the "Enable rich text" option.
        - `Received At` field (Recommended): Set the type to `Created time` to automatically track submission times for the `/weeklyweave` command.

## Running the bot

To start the bot, run the following command:

```bash
python bot.py
```

## How to use

In your designated Telegram channel or group, send a message in one of the following formats. For groups, ensure the bot's privacy mode is disabled via BotFather.

**To add an event:**
```
event: https://example.com/event-details
```

**To post an update:**
```
update: This is a community update with some *markdown* formatting.
```

**To generate the weekly newsletter:**
```
/weeklyweave
```

The bot will then scrape the event information from the URL, add it to your Airtable base, and send a confirmation message with a direct link to the new record and a summary of the scraped data.
The `/weeklyweave` command will compile all events starting in the next two weeks and all updates from the past week into a copy-and-paste-friendly Markdown format. 