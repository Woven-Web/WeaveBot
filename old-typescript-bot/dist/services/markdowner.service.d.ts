import { type MarkdownerResponse } from '../types';
export declare class MarkdownerService {
    private readonly baseUrl;
    private readonly timeout;
    /**
     * Scrapes a URL and converts it to markdown using Markdowner API
     * @param url - The URL to scrape
     * @returns Promise containing the markdown content and metadata
     */
    scrapeUrl(url: string): Promise<MarkdownerResponse>;
    /**
     * Checks if Markdowner service is available
     * @returns Promise<boolean> indicating if the service is healthy
     */
    healthCheck(): Promise<boolean>;
    /**
     * Extracts a clean error message from various error types
     */
    private getErrorMessage;
}
//# sourceMappingURL=markdowner.service.d.ts.map