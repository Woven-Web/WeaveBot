import { type ExtractionResponse } from '../types';
export declare class OpenAIService {
    private openai;
    constructor();
    /**
     * Extracts event data from markdown content using GPT-4o
     * @param markdownContent - The markdown content to analyze
     * @param originalUrl - The original URL for context
     * @returns Promise containing extracted event data
     */
    extractEventData(markdownContent: string, originalUrl: string): Promise<ExtractionResponse>;
    /**
     * Builds the system prompt for event extraction
     */
    private buildSystemPrompt;
    /**
     * Builds the user prompt with the markdown content
     */
    private buildUserPrompt;
    /**
     * Extracts a clean error message from various error types
     */
    private getErrorMessage;
}
//# sourceMappingURL=openai.service.d.ts.map