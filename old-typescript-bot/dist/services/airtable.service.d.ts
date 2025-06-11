import { type EventData, type UpdateData } from '../types';
export declare class AirtableService {
    private base;
    private config;
    constructor();
    /**
     * Saves an event to Airtable
     * @param eventData - The event data to save
     * @returns Promise containing the created record ID
     */
    saveEvent(eventData: EventData): Promise<string>;
    /**
     * Saves an update to Airtable
     * @param updateData - The update data to save
     * @returns Promise containing the created record ID
     */
    saveUpdate(updateData: UpdateData): Promise<string>;
    /**
     * Retrieves recent events from Airtable for weekly report
     * @param daysBack - Number of days to look back (default: 7)
     * @returns Promise containing array of recent events
     */
    getRecentEvents(daysBack?: number): Promise<EventData[]>;
    /**
     * Retrieves recent updates from Airtable for weekly report
     * @param daysBack - Number of days to look back (default: 7)
     * @returns Promise containing array of recent updates
     */
    getRecentUpdates(daysBack?: number): Promise<UpdateData[]>;
    /**
     * Tests the Airtable connection
     * @returns Promise<boolean> indicating if the connection is working
     */
    healthCheck(): Promise<boolean>;
    /**
     * Extracts a clean error message from various error types
     */
    private getErrorMessage;
}
//# sourceMappingURL=airtable.service.d.ts.map