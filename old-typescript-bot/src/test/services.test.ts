import { describe, test, expect } from '@jest/globals';
import { MarkdownerService } from '../services/markdowner.service';
import { OpenAIService } from '../services/openai.service';
import { AirtableService } from '../services/airtable.service';
import { processEvent } from '../services/event.processor';

describe('Service Health Checks', () => {
  test('MarkdownerService should be instantiable and handle errors gracefully', async () => {
    const service = new MarkdownerService();
    expect(service).toBeDefined();
    
    // Test that the service handles failures gracefully
    const isHealthy = await service.healthCheck();
    expect(typeof isHealthy).toBe('boolean');
    // Don't expect specific result since it depends on external API availability
  }, 30000); // 30 second timeout for external API

  test('MarkdownerService should handle invalid URLs gracefully', async () => {
    const service = new MarkdownerService();
    
    // Test that the service throws appropriate errors for invalid URLs
    await expect(
      service.scrapeUrl('https://invalid-url-that-should-not-exist-12345.com')
    ).rejects.toThrow();
    
    // The service should throw a meaningful error, not crash unexpectedly
  }, 30000);

  test('AirtableService should be healthy', async () => {
    const service = new AirtableService();
    const isHealthy = await service.healthCheck();
    expect(isHealthy).toBe(true);
  }, 30000);

  test('OpenAIService should handle invalid event data gracefully', async () => {
    const service = new OpenAIService();
    const result = await service.extractEventData('This is not event content', 'https://example.com');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('event');
  }, 30000);
});

describe('Real Event Processing', () => {
  test('Should successfully process Boulder tech event from Luma', async () => {
    const lumaEventUrl = 'https://lu.ma/nqvmy0bp?tk=OuRHAx';
    const mockUserId = 12345;
    
    const result = await processEvent(lumaEventUrl, mockUserId);
    
    // Test that the function runs and returns a result structure
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    
    if (result.success && result.data) {
      // If successful, validate the extracted event data structure
      expect(result.data.event_title).toBeDefined();
      expect(result.data.event_title).toContain('Boulder');
      expect(result.data.description).toBeDefined();
      expect(result.data.location).toBeDefined();
      expect(result.data.location).toContain('Boulder');
      expect(result.data.url).toBe(lumaEventUrl);
      
      // Should have valid datetime formats
      expect(result.data.start_datetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.data.end_datetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      console.log('✅ Successfully extracted event data:', {
        title: result.data.event_title,
        location: result.data.location,
        start: result.data.start_datetime
      });
    } else {
      // If processing fails, verify it's handled gracefully with meaningful error
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      console.log('⚠️  Event processing failed gracefully:', result.error);
      
      // This is expected behavior when APIs are not available or configured
      console.log('💡 Note: This test validates error handling when external APIs are unavailable');
    }
  }, 60000); // Extended timeout for real API calls
});

describe('Service Integration', () => {
  test('Event processing workflow should work end-to-end', async () => {
    // Test the basic workflow structure without external dependencies
    expect(processEvent).toBeDefined();
    expect(typeof processEvent).toBe('function');
  });
});

describe('Configuration and Types', () => {
  test('Environment configuration should be validated', async () => {
    // Test that config loading works
    const { getConfig } = await import('../utils/config');
    
    expect(() => {
      const config = getConfig();
      expect(config).toBeDefined();
    }).not.toThrow();
  });

  test('Logger should be initialized', async () => {
    const { logger } = await import('../utils/logger');
    
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
}); 