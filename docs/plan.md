# WeaveBot TypeScript Rewrite Plan

## Executive Summary

This plan outlines a complete rewrite of WeaveBot from Python to TypeScript, addressing current deployment issues and improving reliability. Key improvements include:

**🔧 Technical Improvements:**
- Replace problematic ScrapeGraphAI with [Markdowner API](https://github.com/supermemoryai/markdowner)
- Eliminate Playwright browser installation issues
- Use TypeScript for better type safety and development experience
- Modern Node.js deployment (no more event loop conflicts)

**📈 Operational Benefits:**
- Faster, more reliable web scraping via Markdowner
- Simplified deployment (single Node.js container)
- Better error handling and user feedback
- Comprehensive testing strategy

**⚡ Expected Results:**
- Sub-10 second event processing (vs current 30+ seconds)
- >99% uptime (vs current deployment issues)
- 90%+ test coverage for reliability
- Easier maintenance and feature additions

**📊 Timeline:** 14-19 days for complete rewrite with extensive testing

## Current State Analysis

### Existing Functionality
The current Python-based WeaveBot provides:

1. **Telegram Bot Interface**
   - `/start` command for welcome message
   - `/weeklyweave` command for newsletter generation
   - Message handlers for `event:` and `update:` prefixed messages

2. **Event Scraping Pipeline**
   - Uses Playwright to render JavaScript-heavy pages
   - Uses ScrapeGraphAI + OpenAI GPT-4o to extract event data
   - Extracts: `event_title`, `description`, `start_datetime`, `end_datetime`, `location`
   - Validates ISO 8601 date formats
   - Saves to Airtable Events table

3. **Update Management**
   - Handles `update:` messages for community updates
   - Saves to separate Airtable Updates table

4. **Newsletter Generation**
   - Fetches upcoming events (next 14 days)
   - Fetches recent updates (last 7 days)
   - Formats into Markdown newsletter

5. **Data Storage**
   - Two Airtable tables: Events and Updates
   - Specific field mapping and validation

### Current Problems
- Complex deployment issues with event loops and Docker
- ScrapeGraphAI reliability issues
- Python async complexity in Render environment
- Dependency conflicts and browser installation problems

## Proposed TypeScript Solution

### Architecture Overview
We'll build a modern TypeScript bot using:

1. **[Markdowner API](https://github.com/supermemoryai/markdowner)** (hosted at https://md.dhr.wtf) for web scraping
2. **OpenAI API** for intelligent event data extraction from markdown
3. **Telegraf.js** for Telegram bot framework
4. **Airtable.js** for database operations
5. **Node.js** runtime for consistent deployment

### Technology Stack

#### Core Dependencies
- **Runtime**: Node.js 20+ with TypeScript
- **Bot Framework**: `telegraf` (robust Telegram bot library)
- **HTTP Client**: `axios` for API calls
- **Validation**: `zod` for type-safe data validation
- **Environment**: `dotenv` for configuration
- **Date Handling**: `date-fns` for robust date parsing
- **Testing**: `jest` + `@types/jest` for comprehensive testing
- **Development**: `tsx` for TypeScript execution, `nodemon` for hot reload

#### External Services
- **Web Scraping**: Hosted Markdowner API (`https://md.dhr.wtf`) - FREE
- **LLM Processing**: OpenAI GPT-4o API
- **Database**: Airtable API
- **Messaging**: Telegram Bot API

### Detailed Implementation Plan

#### Phase 1: Project Setup & Infrastructure
1. **Initialize TypeScript project**
   - Setup `package.json` with all dependencies
   - Configure `tsconfig.json` for modern TypeScript
   - Setup testing framework with Jest
   - Create development and production Docker configurations
   - Setup ESLint + Prettier for code quality

2. **Environment & Configuration**
   - Create type-safe environment configuration using Zod
   - Setup environment validation on startup
   - Create configuration for different environments (dev/prod)

3. **Core Architecture**
   - Define TypeScript interfaces for all data structures
   - Setup error handling patterns
   - Create logging utilities
   - Setup health check endpoints

#### Phase 2: Data Layer & External Integrations
1. **Airtable Integration**
   - Create type-safe Airtable client
   - Define event and update record schemas
   - Implement CRUD operations for events and updates
   - Add proper error handling and retries

2. **Web Scraping Service**
   - Integrate with Markdowner API
   - Create fallback mechanisms for API failures
   - Add content validation and sanitization
   - Implement rate limiting and caching

3. **LLM Processing Service**
   - Create OpenAI client with structured event extraction
   - Design robust prompts for event data extraction
   - Implement response validation and retry logic
   - Add fallback for partial data extraction

#### Phase 3: Core Bot Functionality
1. **Telegram Bot Framework**
   - Setup Telegraf bot with proper middleware
   - Implement command handlers (`/start`, `/weeklyweave`)
   - Create message processors for `event:` and `update:` patterns
   - Add user feedback and error messaging

2. **Event Processing Pipeline**
   - URL validation and sanitization
   - Markdowner API integration for content extraction
   - LLM-based event data extraction
   - Date validation and ISO 8601 formatting
   - Airtable storage with error handling

3. **Update Processing**
   - Simple text processing for updates
   - Markdown sanitization
   - Airtable storage

4. **Newsletter Generation**
   - Query Airtable for upcoming events
   - Query Airtable for recent updates
   - Format into markdown newsletter
   - Handle edge cases (no events, no updates)

#### Phase 4: Testing & Quality Assurance
1. **Unit Testing**
   - Test all utility functions
   - Test data validation schemas
   - Test API integration functions
   - Mock external services for isolated testing

2. **Integration Testing**
   - Test complete event processing pipeline
   - Test newsletter generation
   - Test error scenarios and recovery
   - Test rate limiting and timeouts

3. **End-to-End Testing**
   - Test full Telegram bot interactions
   - Test real API integrations (with test data)
   - Performance testing under load

#### Phase 5: Deployment & Monitoring
1. **Containerization**
   - Create optimized Docker image
   - Multi-stage build for production
   - Health checks and proper signal handling

2. **Deploy Configuration**
   - Setup for Render (or alternative platform)
   - Environment variable configuration
   - Monitoring and logging setup

### Data Structures & Schemas

#### Event Data Schema
```typescript
interface EventData {
  event_title: string | null;
  description: string | null;
  start_datetime: string | null; // ISO 8601 format
  end_datetime: string | null;   // ISO 8601 format
  location: string | null;
}

interface EventRecord extends EventData {
  link: string;
  id?: string;
  created_at?: string;
}
```

#### Update Data Schema
```typescript
interface UpdateData {
  content: string;
  received_at?: string;
}

interface UpdateRecord extends UpdateData {
  id?: string;
}
```

### LLM Prompt Strategy

We'll design a robust prompt for extracting event data from markdown content:

```typescript
const EVENT_EXTRACTION_PROMPT = `
You are an expert at extracting structured event information from web content.

Given the markdown content below, extract the following information about the event:

1. event_title: The main title or name of the event
2. description: A concise summary of what the event is about
3. start_datetime: The start date and time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)
4. end_datetime: The end date and time in ISO 8601 format (if available)
5. location: The physical address or venue name

Important guidelines:
- Today's date is {current_date}
- If year is missing, assume current year or next year (not past)
- If time is missing, use 00:00:00
- If information is not found, return null for that field
- Ensure dates are valid and in ISO 8601 format
- Be precise and avoid making assumptions

Return the data as a JSON object with these exact field names.
`;
```

### Error Handling Strategy
1. **Graceful Degradation**: If LLM extraction fails, save partial data
2. **Retry Logic**: Exponential backoff for API failures
3. **User Feedback**: Clear error messages for users
4. **Logging**: Comprehensive logging for debugging
5. **Fallbacks**: Alternative extraction methods if primary fails

### Testing Strategy
1. **Mock Data**: Create comprehensive test datasets
2. **API Mocking**: Mock external services for reliable testing
3. **Edge Cases**: Test various content types and formats
4. **Performance**: Load testing for high-volume usage
5. **Integration**: Test real-world scenarios

### Benefits of TypeScript Rewrite

#### Technical Benefits
- **Type Safety**: Catch errors at compile time
- **Better Tooling**: Superior IDE support and debugging
- **Simpler Deployment**: Node.js has fewer environment issues
- **Better Testing**: More mature testing ecosystem
- **Cleaner Architecture**: Modern async/await patterns

#### Operational Benefits
- **Reduced Complexity**: Eliminate ScrapeGraphAI reliability issues
- **Better Performance**: Markdowner API is optimized for speed
- **Easier Maintenance**: TypeScript provides better code organization
- **Scalability**: Better suited for cloud deployment

#### Development Benefits
- **Faster Iteration**: Better hot reload and development experience
- **Code Quality**: Static typing prevents many runtime errors
- **Documentation**: Types serve as living documentation
- **Team Collaboration**: Easier onboarding for new developers

### Migration Strategy
1. **Parallel Development**: Build new TypeScript version alongside current Python version
2. **Feature Parity**: Ensure all current functionality is replicated
3. **Testing**: Extensive testing before switching
4. **Gradual Rollout**: Test with limited users before full deployment
5. **Fallback Plan**: Keep Python version as backup during initial rollout

### Timeline Estimate
- **Phase 1**: 2-3 days (Setup & Infrastructure)
- **Phase 2**: 3-4 days (Data Layer & Integrations)
- **Phase 3**: 4-5 days (Core Bot Functionality)
- **Phase 4**: 3-4 days (Testing & QA)
- **Phase 5**: 2-3 days (Deployment)

**Total Estimated Time**: 14-19 days for complete rewrite with comprehensive testing

### Success Metrics
- All existing functionality working in TypeScript
- Improved reliability (< 1% failure rate for event extraction)
- Faster response times (< 10 seconds for event processing)
- Successful deployment without environment issues
- Comprehensive test coverage (> 90%)
- Clear documentation and maintainable code

This plan provides a solid foundation for migrating to a more reliable, maintainable TypeScript solution while improving the overall user experience. 