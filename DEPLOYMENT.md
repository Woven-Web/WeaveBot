# WeaveBot Python Deployment Guide 🚀

## Overview

WeaveBot is a Python-based Telegram bot that extracts event data from websites using Playwright browser automation and OpenAI for intelligent content parsing. This guide covers deployment options for the current Python implementation.

## ⚡ **Performance Features**

### **Smart Content Extraction**
WeaveBot uses intelligent HTML parsing to dramatically reduce OpenAI token usage:
- **95%+ Token Reduction**: From 222k+ characters to ~4k max
- **Cost Efficient**: Reduces OpenAI API costs significantly 
- **Event-Focused**: Prioritizes event-specific content (titles, dates, locations)
- **Platform Optimized**: Special handling for Lu.ma, Eventbrite, Meetup.com
- **Fallback Safe**: Graceful degradation for any website structure

## 📋 **Prerequisites**

- Python 3.9+ environment
- Access to environment variables for API keys
- Docker (for containerized deployment)

## 🔧 **Environment Variables**

Create a `.env` file or set these environment variables:

### **Required API Keys:**
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token    # Get from @BotFather
OPENAI_API_KEY=your_openai_api_key            # Get from OpenAI Platform
AIRTABLE_API_KEY=your_airtable_api_key        # Get from Airtable Developer Hub
AIRTABLE_BASE_ID=your_airtable_base_id        # Your Airtable base ID
```

### **Optional Configuration:**
```bash
# Logging
LOG_LEVEL=INFO                                # DEBUG, INFO, WARNING, ERROR

# Browser Settings
PLAYWRIGHT_HEADLESS=true                      # Run browser in headless mode
PLAYWRIGHT_TIMEOUT=30000                      # Browser timeout in milliseconds
```

## 🚀 **Deployment Options**

### **Option 1: Render (Recommended)**

1. **Connect Repository**: 
   - Link your GitHub repo to Render
   - Choose "Web Service"

2. **Configure Build & Start:**
   ```bash
   # Build Command:
   pip install -r requirements.txt && playwright install chromium --with-deps
   
   # Start Command:
   python bot.py
   ```

3. **Environment Variables**: Add all required variables in Render dashboard

4. **Advanced Settings**:
   - Runtime: Python 3
   - Plan: Starter ($7/month) or higher
   - Health Check: `/health` (if you add endpoint)

### **Option 2: Railway**

1. **Deploy from GitHub**: Connect your repository
2. **Configure Environment**: Add all required variables
3. **Automatic Deployment**: Railway will detect Python and deploy

### **Option 3: Heroku**

1. **Create Heroku App**:
   ```bash
   heroku create your-weavebot-app
   ```

2. **Add Buildpacks**:
   ```bash
   heroku buildpacks:add heroku/python
   heroku buildpacks:add https://github.com/mxschmitt/heroku-playwright-buildpack
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set TELEGRAM_BOT_TOKEN=your_token
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set AIRTABLE_API_KEY=your_key
   heroku config:set AIRTABLE_BASE_ID=your_base_id
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

### **Option 4: Docker (Self-Hosted)**

1. **Build Docker Image**:
   ```bash
   docker build -t weavebot .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     --name weavebot \
     --env-file .env \
     --restart unless-stopped \
     weavebot
   ```

3. **Using Docker Compose**:
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     weavebot:
       build: .
       env_file: .env
       restart: unless-stopped
       volumes:
         - ./logs:/app/logs
   ```

### **Option 5: VPS/Cloud Server**

1. **Install Dependencies**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip
   pip3 install -r requirements.txt
   playwright install chromium --with-deps
   ```

2. **Set Up Service** (systemd):
   ```ini
   # /etc/systemd/system/weavebot.service
   [Unit]
   Description=WeaveBot Telegram Bot
   After=network.target

   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/path/to/weavebot
   ExecStart=/usr/bin/python3 bot.py
   EnvironmentFile=/path/to/.env
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start Service**:
   ```bash
   sudo systemctl enable weavebot
   sudo systemctl start weavebot
   ```

## 🧪 **Pre-Deployment Testing**

Run these commands locally to ensure everything works:

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Run tests
python -m pytest test_bot.py -v

# Test bot locally (with .env file)
python bot.py
```

## 📊 **Expected Resource Usage**

- **Memory**: ~200-500MB (depending on browser usage)
- **CPU**: Low to moderate (spikes during scraping)
- **Storage**: ~500MB (browsers + dependencies)
- **Network**: Moderate (API calls + web scraping)

## 🔍 **Monitoring & Logs**

### **Built-in Logging**
The bot uses Python's logging module with structured output:
- `INFO`: Normal operations
- `WARNING`: Non-critical issues
- `ERROR`: Failures that need attention

### **Health Monitoring**
Monitor these indicators:
- Bot responds to `/start` command
- No error spikes in logs
- Successful API calls to Airtable/OpenAI

## 🚨 **Troubleshooting**

### **Common Issues:**

**Playwright Browser Issues:**
```bash
# Reinstall browsers
playwright install chromium --with-deps

# Check browser installation
playwright install-deps
```

**Memory Issues:**
- Increase server RAM allocation
- Ensure browser instances are properly closed
- Monitor for memory leaks

**API Rate Limits:**
- OpenAI: Monitor usage on platform
- Airtable: Stay within API limits
- Telegram: Respect rate limits

**Permission Issues:**
```bash
# Fix file permissions
chmod +x bot.py
chown -R user:user /app
```

## 🔐 **Security Best Practices**

1. **Environment Variables**: Never commit API keys to git
2. **Container Security**: Run as non-root user (already configured)
3. **Network Security**: Use HTTPS for all API calls
4. **Logging**: No sensitive data in logs
5. **Updates**: Keep dependencies updated

## ⚡ **Performance Optimization**

1. **Browser Reuse**: Bot reuses browser instances when possible
2. **Async Operations**: All network calls are asynchronous
3. **Error Handling**: Graceful failure with retries
4. **Resource Cleanup**: Proper cleanup of browser resources

## 🎯 **Production Checklist**

- [ ] All environment variables set
- [ ] Tests passing locally
- [ ] Bot responds to test commands
- [ ] Airtable integration working
- [ ] OpenAI API calls successful
- [ ] Browser automation working
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy planned

## 💰 **Cost Estimates**

### **Hosting:**
- **Render**: $7-25/month (Starter to Standard)
- **Railway**: $5-20/month (Developer to Pro)
- **Heroku**: $7-25/month (Basic to Standard)
- **VPS**: $5-50/month (varies by provider)

### **API Usage:**
- **OpenAI**: ~$0.01-0.10 per event (depending on content)
- **Airtable**: Free tier sufficient for most use cases
- **Telegram**: Free

**Estimated Total**: $12-75/month (depending on usage and hosting choice)

## 🎉 **Ready to Deploy!**

Your WeaveBot Python implementation includes:
- ✅ Comprehensive test suite (22 tests)
- ✅ Docker containerization
- ✅ Browser automation with Playwright
- ✅ Error handling & logging
- ✅ OpenAI integration for smart parsing
- ✅ Airtable integration for data storage

Choose your preferred deployment method and follow the steps above! 🚀

---

**Need help?** Check the troubleshooting section or create an issue in the repository. 