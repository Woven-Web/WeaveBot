# Archived TypeScript Bot Implementation

This directory contains the TypeScript version of WeaveBot that was developed but ultimately replaced with the Python implementation.

## Why Archived?

The TypeScript implementation was created to address deployment issues with the original Python bot that used ScrapeGraphAI. However, after thorough research and testing, we discovered that:

1. **Dynamic Content Issues**: The TypeScript version relied on the Markdowner API, which couldn't handle dynamic JavaScript-heavy sites like Lu.ma and Eventbrite
2. **Limited Functionality**: While faster, it only worked with static content, limiting its usefulness for modern event platforms
3. **Cost vs Benefits**: The core issue (browser automation for dynamic content) still required solving regardless of language

## What's Included

- `src/` - TypeScript source code
- `dist/` - Compiled JavaScript output
- `node_modules/` - Dependencies
- Configuration files for TypeScript, Jest, ESLint, Prettier
- Package configuration files

## Architecture

The TypeScript bot used:
- **Markdowner API** for web scraping (limited to static content)
- **OpenAI GPT-4o** for data extraction
- **Airtable API** for data storage
- **Telegram Bot API** for user interface

## Lessons Learned

1. **Browser automation is essential** for modern event platforms
2. **Third-party scraping APIs** often can't handle dynamic content
3. **Direct Playwright integration** provides the most reliable results
4. **Python ecosystem** offers better tooling for browser automation

## Current Implementation

The project has returned to **Python** with a cleaner architecture:
- **Playwright** for reliable browser automation
- **OpenAI GPT-4o** for intelligent data extraction
- **Direct API integrations** without third-party dependencies
- **Comprehensive testing** with 22 test cases

See the main README.md for the current Python implementation.

---

*Archived on: June 11, 2024*  
*Reason: Replaced with more capable Python implementation* 