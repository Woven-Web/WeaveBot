#!/bin/bash

# WeaveBot Deployment Script
# This script helps ensure graceful deployment with minimal downtime

echo "🚀 Starting WeaveBot deployment..."

# If running locally, this can help test the shutdown process
if [ "$1" == "local" ]; then
    echo "Local deployment mode"
    
    # Kill any existing bot processes
    echo "Stopping any existing bot processes..."
    pkill -f "python.*bot.py" || true
    
    # Wait a moment for graceful shutdown
    sleep 3
    
    # Start the bot
    echo "Starting bot..."
    python3 bot.py &
    
    echo "Bot started in background. Check logs with: tail -f /tmp/bot.log"
    
elif [ "$1" == "render" ]; then
    echo "Render deployment mode"
    echo "Make sure to:"
    echo "1. Push changes to your repository"
    echo "2. Render will automatically detect changes and redeploy"
    echo "3. The graceful shutdown will handle the transition"
    
else
    echo "Usage: $0 [local|render]"
    echo ""
    echo "local  - For local testing"
    echo "render - Instructions for Render deployment"
fi 