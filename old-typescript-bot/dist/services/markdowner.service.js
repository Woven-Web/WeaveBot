"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownerService = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class MarkdownerService {
    baseUrl = 'https://md.dhr.wtf';
    timeout = 30000; // 30 seconds
    /**
     * Scrapes a URL and converts it to markdown using Markdowner API
     * @param url - The URL to scrape
     * @returns Promise containing the markdown content and metadata
     */
    async scrapeUrl(url) {
        (0, logger_1.logInfo)(`Starting to scrape URL: ${url}`, 'MarkdownerService');
        try {
            // Validate URL format
            new URL(url);
            (0, logger_1.logDebug)(`Making request to Markdowner API`, 'MarkdownerService', { url });
            const response = await axios_1.default.get(this.baseUrl, {
                params: {
                    url,
                    enableDetailedResponse: true,
                },
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (compatible; WeaveBot/1.0.0; +https://github.com/Woven-Web/WeaveBot)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
                timeout: this.timeout,
            });
            (0, logger_1.logDebug)(`Markdowner API response status: ${response.status}`, 'MarkdownerService');
            // Handle different response formats
            let markdownContent;
            let metadata;
            if (typeof response.data === 'string') {
                // Simple string response
                markdownContent = response.data;
                metadata = { url };
            }
            else if (response.data && typeof response.data === 'object') {
                // Structured response
                markdownContent = response.data.content || response.data.markdown || response.data.data || '';
                metadata = {
                    title: response.data.title,
                    description: response.data.description,
                    url,
                };
            }
            else {
                throw new types_1.ScrapingError('Invalid response format from Markdowner API', url);
            }
            if (!markdownContent || markdownContent.trim().length === 0) {
                throw new types_1.ScrapingError('Received empty content from Markdowner API', url);
            }
            const result = {
                success: true,
                data: markdownContent,
                metadata,
            };
            // Validate response against schema
            const validatedResult = types_1.MarkdownerResponseSchema.parse(result);
            (0, logger_1.logInfo)(`Successfully scraped URL: ${url} (${markdownContent.length} characters)`, 'MarkdownerService');
            return validatedResult;
        }
        catch (error) {
            if (error instanceof types_1.ScrapingError) {
                throw error;
            }
            const errorMessage = this.getErrorMessage(error);
            (0, logger_1.logError)(new Error(`Failed to scrape URL: ${errorMessage}`), 'MarkdownerService', { url });
            if (axios_1.default.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    throw new types_1.ScrapingError('Request timeout - the website took too long to respond', url);
                }
                if (error.response?.status === 404) {
                    throw new types_1.ScrapingError('Website not found (404)', url);
                }
                if (error.response?.status === 403) {
                    const domain = new URL(url).hostname;
                    throw new types_1.ScrapingError(`${domain} blocked our request. Some sites (like Eventbrite) have anti-bot protection. Please try copying the event details manually or use a different event platform.`, url);
                }
                if (error.response && error.response.status >= 500) {
                    throw new types_1.ScrapingError('Website server error - please try again later', url);
                }
            }
            throw new types_1.ScrapingError(`Failed to scrape website: ${errorMessage}`, url);
        }
    }
    /**
     * Checks if Markdowner service is available
     * @returns Promise<boolean> indicating if the service is healthy
     */
    async healthCheck() {
        try {
            (0, logger_1.logDebug)('Performing Markdowner health check', 'MarkdownerService');
            // Try scraping a simple, reliable page
            const testUrl = 'https://example.com';
            const response = await this.scrapeUrl(testUrl);
            const isHealthy = response.success && !!response.data;
            (0, logger_1.logInfo)(`Markdowner health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`, 'MarkdownerService');
            return isHealthy;
        }
        catch (error) {
            (0, logger_1.logError)(new Error('Markdowner health check failed'), 'MarkdownerService', {
                error: this.getErrorMessage(error),
            });
            return false;
        }
    }
    /**
     * Extracts a clean error message from various error types
     */
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'Unknown error occurred';
    }
}
exports.MarkdownerService = MarkdownerService;
//# sourceMappingURL=markdowner.service.js.map