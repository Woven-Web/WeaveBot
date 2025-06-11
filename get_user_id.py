#!/usr/bin/env python3
"""
Quick script to get your Telegram User ID for bot authorization.
Run this and send any message to your bot to see your user ID.
"""

import os
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes

load_dotenv()

async def get_user_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Display user and chat information."""
    user = update.effective_user
    chat = update.effective_chat
    
    info_message = f"""
🆔 **Your Telegram Information:**

**User Details:**
• User ID: `{user.id}`
• Username: @{user.username or 'None'}
• Name: {user.first_name} {user.last_name or ''}

**Chat Details:**
• Chat ID: `{chat.id}`
• Chat Type: {chat.type}

**For Bot Authorization:**
Add this to your environment variables:
`AUTHORIZED_ADMINS={user.id}`

You can now stop this script with Ctrl+C.
"""
    
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=info_message,
        parse_mode='Markdown'
    )
    print(f"User ID: {user.id}")
    print(f"Chat ID: {chat.id}")

async def main():
    """Run the ID getter bot."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("❌ TELEGRAM_BOT_TOKEN not found in environment variables")
        return
    
    print("🤖 Starting User ID getter...")
    print("📱 Send any message to your bot to get your User ID")
    print("⏹️  Press Ctrl+C to stop")
    
    app = ApplicationBuilder().token(token).build()
    app.add_handler(MessageHandler(filters.ALL, get_user_info))
    
    await app.run_polling()

if __name__ == "__main__":
    asyncio.run(main()) 