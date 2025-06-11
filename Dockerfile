# Use official Playwright image with browsers pre-installed
FROM mcr.microsoft.com/playwright/python:v1.52.0-focal

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ensure Playwright browsers are properly installed
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy the bot code
COPY bot.py .

# Set environment variables for production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Add a small delay on startup to ensure old instances are stopped, then run the bot
CMD ["sh", "-c", "sleep 10 && python bot.py"] 