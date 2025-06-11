import Airtable from 'airtable';
import { type EventData, type UpdateData, type AirtableEventRecord, type AirtableUpdateRecord, AirtableError } from '../types';
import { getConfig } from '../utils/config';
import { logInfo, logError, logDebug } from '../utils/logger';

export class AirtableService {
  private base: Airtable.Base;
  private config: ReturnType<typeof getConfig>;

  constructor() {
    this.config = getConfig();
    
    Airtable.configure({
      apiKey: this.config.AIRTABLE_API_KEY,
    });
    
    this.base = Airtable.base(this.config.AIRTABLE_BASE_ID);
  }

  /**
   * Saves an event to Airtable
   * @param eventData - The event data to save
   * @returns Promise containing the created record ID
   */
  async saveEvent(eventData: EventData): Promise<string> {
    logInfo(`Saving event to Airtable: ${eventData.event_title}`, 'AirtableService');
    
    try {
      const record: AirtableEventRecord = {
        fields: {
          'Event Title': eventData.event_title,
          'Description': eventData.description,
          'Start DateTime': eventData.start_datetime,
          'End DateTime': eventData.end_datetime,
          'Location': eventData.location,
          'URL': eventData.url,
          'Created At': new Date().toISOString(),
          'Status': 'pending',
        },
      };

      logDebug('Creating event record in Airtable', 'AirtableService', { 
        tableName: this.config.AIRTABLE_TABLE_NAME 
      });

      const createdRecords = await this.base(this.config.AIRTABLE_TABLE_NAME).create([record]);
      
      if (!createdRecords || createdRecords.length === 0) {
        throw new AirtableError('Failed to create event record', 'saveEvent');
      }

      const recordId = createdRecords[0].id;
      logInfo(`Event saved successfully with ID: ${recordId}`, 'AirtableService');
      
      return recordId;

    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      logError(new Error(`Failed to save event: ${errorMessage}`), 'AirtableService', { 
        eventTitle: eventData.event_title 
      });
      
      throw new AirtableError(`Failed to save event to Airtable: ${errorMessage}`, 'saveEvent');
    }
  }

  /**
   * Saves an update to Airtable
   * @param updateData - The update data to save
   * @returns Promise containing the created record ID
   */
  async saveUpdate(updateData: UpdateData): Promise<string> {
    logInfo(`Saving update to Airtable`, 'AirtableService');
    
    try {
      const record: AirtableUpdateRecord = {
        fields: {
          'Content': updateData.content,
          'Timestamp': updateData.timestamp,
          'Chat ID': updateData.chat_id,
          'Created At': new Date().toISOString(),
        },
      };

      logDebug('Creating update record in Airtable', 'AirtableService', { 
        tableName: this.config.AIRTABLE_UPDATES_TABLE_NAME 
      });

      const createdRecords = await this.base(this.config.AIRTABLE_UPDATES_TABLE_NAME).create([record]);
      
      if (!createdRecords || createdRecords.length === 0) {
        throw new AirtableError('Failed to create update record', 'saveUpdate');
      }

      const recordId = createdRecords[0].id;
      logInfo(`Update saved successfully with ID: ${recordId}`, 'AirtableService');
      
      return recordId;

    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      logError(new Error(`Failed to save update: ${errorMessage}`), 'AirtableService');
      
      throw new AirtableError(`Failed to save update to Airtable: ${errorMessage}`, 'saveUpdate');
    }
  }

  /**
   * Retrieves recent events from Airtable for weekly report
   * @param daysBack - Number of days to look back (default: 7)
   * @returns Promise containing array of recent events
   */
  async getRecentEvents(daysBack: number = 7): Promise<EventData[]> {
    logInfo(`Retrieving events from last ${daysBack} days`, 'AirtableService');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      const cutoffISOString = cutoffDate.toISOString();

      logDebug('Querying Airtable for recent events', 'AirtableService', { 
        cutoffDate: cutoffISOString 
      });

      const records = await this.base(this.config.AIRTABLE_TABLE_NAME)
        .select({
          view: this.config.AIRTABLE_VIEW_ID,
          filterByFormula: `IS_AFTER({Created At}, '${cutoffISOString}')`,
          sort: [{ field: 'Created At', direction: 'desc' }],
        })
        .all();

      const events: EventData[] = records.map(record => {
        const fields = record.fields as AirtableEventRecord['fields'];
        return {
          event_title: fields['Event Title'],
          description: fields['Description'],
          start_datetime: fields['Start DateTime'],
          end_datetime: fields['End DateTime'],
          location: fields['Location'],
          url: fields['URL'],
        };
      });

      logInfo(`Retrieved ${events.length} recent events`, 'AirtableService');
      return events;

    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      logError(new Error(`Failed to retrieve recent events: ${errorMessage}`), 'AirtableService');
      
      throw new AirtableError(`Failed to retrieve recent events: ${errorMessage}`, 'getRecentEvents');
    }
  }

  /**
   * Retrieves recent updates from Airtable for weekly report
   * @param daysBack - Number of days to look back (default: 7)
   * @returns Promise containing array of recent updates
   */
  async getRecentUpdates(daysBack: number = 7): Promise<UpdateData[]> {
    logInfo(`Retrieving updates from last ${daysBack} days`, 'AirtableService');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      const cutoffISOString = cutoffDate.toISOString();

      logDebug('Querying Airtable for recent updates', 'AirtableService', { 
        cutoffDate: cutoffISOString 
      });

      const records = await this.base(this.config.AIRTABLE_UPDATES_TABLE_NAME)
        .select({
          view: this.config.AIRTABLE_UPDATES_VIEW_ID,
          filterByFormula: `IS_AFTER({Created At}, '${cutoffISOString}')`,
          sort: [{ field: 'Created At', direction: 'desc' }],
        })
        .all();

      const updates: UpdateData[] = records.map(record => {
        const fields = record.fields as AirtableUpdateRecord['fields'];
        return {
          content: fields['Content'],
          timestamp: fields['Timestamp'],
          chat_id: fields['Chat ID'],
        };
      });

      logInfo(`Retrieved ${updates.length} recent updates`, 'AirtableService');
      return updates;

    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      logError(new Error(`Failed to retrieve recent updates: ${errorMessage}`), 'AirtableService');
      
      throw new AirtableError(`Failed to retrieve recent updates: ${errorMessage}`, 'getRecentUpdates');
    }
  }

  /**
   * Tests the Airtable connection
   * @returns Promise<boolean> indicating if the connection is working
   */
  async healthCheck(): Promise<boolean> {
    try {
      logDebug('Performing Airtable health check', 'AirtableService');
      
      // Try to read one record from the events table
      const records = await this.base(this.config.AIRTABLE_TABLE_NAME)
        .select({
          view: this.config.AIRTABLE_VIEW_ID,
          maxRecords: 1,
        })
        .firstPage();

      const isHealthy = Array.isArray(records);
      logInfo(`Airtable health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`, 'AirtableService');
      
      return isHealthy;
    } catch (error) {
      logError(new Error('Airtable health check failed'), 'AirtableService', {
        error: this.getErrorMessage(error),
      });
      return false;
    }
  }

  /**
   * Extracts a clean error message from various error types
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'Unknown error occurred';
  }
} 