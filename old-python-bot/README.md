# Old Python WeaveBot Implementation

This directory contains the original Python implementation of WeaveBot that was replaced by the TypeScript version.

## What's in this directory

- `bot.py` - Original Python bot implementation using ScrapeGraphAI and Playwright
- `requirements.txt` - Python dependencies
- `Dockerfile` - Docker configuration for Python version
- `render.yaml` - Render deployment configuration
- `test_dependencies.py` - Dependency validation script
- `deploy.sh` - Deployment script
- `venv/` - Python virtual environment

## Issues that led to the rewrite

1. **Complex deployment** - Playwright browser installation issues on Render
2. **Event loop conflicts** - Python asyncio issues causing deployment failures  
3. **Slow performance** - 30+ second processing times due to browser rendering
4. **ScrapeGraphAI reliability** - Inconsistent results and crashes
5. **Limited type safety** - Runtime errors due to lack of strong typing

## The new TypeScript implementation

The new TypeScript implementation addresses all these issues:
- Uses hosted Markdowner API (no browser dependencies)
- Full type safety with TypeScript and Zod validation
- Expected <10 second processing times
- Simplified deployment with Node.js
- Comprehensive error handling and logging

For the current implementation, see the main directory. 