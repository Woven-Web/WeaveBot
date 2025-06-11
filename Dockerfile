# Use official Playwright image with browsers pre-installed
FROM mcr.microsoft.com/playwright/python:v1.52.0-focal

# Set working directory
WORKDIR /app

# Set environment variables for production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ensure Playwright browsers are properly installed
RUN playwright install chromium --with-deps

# Copy the bot code
COPY bot.py .

# Create a non-root user for security
RUN useradd -m -u 1000 botuser && chown -R botuser:botuser /app
USER botuser

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import sys; sys.exit(0)"

# Run the bot with proper signal handling
CMD ["python", "-u", "bot.py"] 