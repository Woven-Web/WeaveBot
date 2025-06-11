import pytest
import asyncio
import json
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime
from bot import (
    is_iso_date,
    extract_event_data_with_openai,
    extract_update_data_with_openai,
    get_html_with_playwright,
    scrape_event_data,
    scrape_update_data,
    save_event_to_airtable,
    save_update_to_airtable,
    fetch_upcoming_events,
    fetch_recent_updates,
    format_newsletter
)

class TestDateValidation:
    """Test date validation functionality."""
    
    def test_valid_iso_dates(self):
        """Test valid ISO 8601 date formats."""
        valid_dates = [
            "2024-06-15T10:30:00",
            "2024-12-25T00:00:00",
            "2025-01-01T23:59:59",
            "2024-06-15T10:30:00Z",
            "2024-06-15T10:30:00+00:00"
        ]
        for date_str in valid_dates:
            assert is_iso_date(date_str), f"Should be valid: {date_str}"
    
    def test_invalid_iso_dates(self):
        """Test invalid date formats."""
        invalid_dates = [
            "",
            None,
            "June 15, 2024",  # Wrong format
            "2024/06/15 10:30:00",  # Wrong separators
            "invalid-date",
            "2024-13-01T10:30:00",  # Invalid month
            "2024-06-32T10:30:00",  # Invalid day
            "2024-02-30T10:30:00",  # Invalid date (Feb 30th)
            "not-a-date-at-all",
        ]
        for date_str in invalid_dates:
            assert not is_iso_date(date_str), f"Should be invalid: {date_str}"
    
    def test_valid_iso_dates_without_time(self):
        """Test that dates without time components are also valid."""
        valid_dates_no_time = [
            "2024-06-15",  # Date only
            "2024-12-25",  # Date only
            "2025-01-01",  # Date only
        ]
        for date_str in valid_dates_no_time:
            assert is_iso_date(date_str), f"Should be valid: {date_str}"

class TestDataExtraction:
    """Test OpenAI data extraction functions."""
    
    @pytest.mark.asyncio
    async def test_extract_event_data_success(self):
        """Test successful event data extraction."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "event_title": "Tech Conference 2024",
            "description": "Annual technology conference featuring industry leaders.",
            "start_datetime": "2024-06-15T09:00:00",
            "end_datetime": "2024-06-15T17:00:00",
            "location": "Convention Center, San Francisco"
        })
        
        with patch('bot.openai_client.chat.completions.create', new_callable=AsyncMock) as mock_openai:
            mock_openai.return_value = mock_response
            
            html_content = "<html><body><h1>Tech Conference 2024</h1></body></html>"
            result = await extract_event_data_with_openai(html_content, "https://example.com")
            
            assert result["event_title"] == "Tech Conference 2024"
            assert result["start_datetime"] == "2024-06-15T09:00:00"
            assert result["location"] == "Convention Center, San Francisco"
            mock_openai.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_extract_event_data_invalid_json(self):
        """Test handling of invalid JSON response."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Invalid JSON response"
        
        with patch('bot.openai_client.chat.completions.create', new_callable=AsyncMock) as mock_openai:
            mock_openai.return_value = mock_response
            
            html_content = "<html><body><h1>Event</h1></body></html>"
            result = await extract_event_data_with_openai(html_content, "https://example.com")
            
            assert result == {}
    
    @pytest.mark.asyncio
    async def test_extract_update_data_success(self):
        """Test successful update data extraction."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "title": "Important Update",
            "content": "We are excited to announce new features.",
            "source": "TechNews"
        })
        
        with patch('bot.openai_client.chat.completions.create', new_callable=AsyncMock) as mock_openai:
            mock_openai.return_value = mock_response
            
            html_content = "<html><body><h1>Important Update</h1></body></html>"
            result = await extract_update_data_with_openai(html_content, "https://example.com")
            
            assert result["title"] == "Important Update"
            assert result["content"] == "We are excited to announce new features."
            assert result["source"] == "TechNews"

class TestPlaywrightIntegration:
    """Test Playwright browser automation."""
    
    @pytest.mark.asyncio
    async def test_get_html_success(self):
        """Test successful HTML fetching with Playwright."""
        mock_page = AsyncMock()
        mock_page.content.return_value = "<html><body><h1>Test Page</h1></body></html>"
        mock_page.goto = AsyncMock()
        mock_page.wait_for_timeout = AsyncMock()
        
        mock_context = AsyncMock()
        mock_context.new_page.return_value = mock_page
        
        mock_browser = AsyncMock()
        mock_browser.new_context.return_value = mock_context
        mock_browser.close = AsyncMock()
        
        mock_playwright = AsyncMock()
        mock_playwright.chromium.launch.return_value = mock_browser
        
        with patch('bot.async_playwright') as mock_async_playwright:
            mock_async_playwright.return_value.__aenter__.return_value = mock_playwright
            
            result = await get_html_with_playwright("https://example.com")
            
            assert result == "<html><body><h1>Test Page</h1></body></html>"
            mock_page.goto.assert_called_once_with(
                "https://example.com", 
                wait_until="networkidle", 
                timeout=30000
            )
    
    @pytest.mark.asyncio
    async def test_get_html_failure(self):
        """Test Playwright failure handling."""
        with patch('bot.async_playwright') as mock_async_playwright:
            mock_async_playwright.return_value.__aenter__.side_effect = Exception("Browser failed")
            
            with pytest.raises(Exception, match="Browser failed"):
                await get_html_with_playwright("https://example.com")

class TestAirtableIntegration:
    """Test Airtable data storage functions."""
    
    def test_save_event_to_airtable_success(self):
        """Test successful event saving."""
        event_data = {
            "event_title": "Test Event",
            "description": "Test Description",
            "start_datetime": "2024-06-15T10:00:00",
            "end_datetime": "2024-06-15T12:00:00",
            "location": "Test Location"
        }
        
        mock_airtable = Mock()
        mock_airtable.insert.return_value = {"id": "rec123", "fields": event_data}
        
        with patch('bot.Airtable', return_value=mock_airtable):
            result = save_event_to_airtable(event_data, "https://example.com")
            
            assert result["id"] == "rec123"
            mock_airtable.insert.assert_called_once()
            
            # Check the data passed to Airtable
            call_args = mock_airtable.insert.call_args[0][0]
            assert call_args["Event Title"] == "Test Event"
            assert call_args["Link"] == "https://example.com"
    
    def test_save_event_invalid_dates(self):
        """Test event saving with invalid dates."""
        event_data = {
            "event_title": "Test Event",
            "description": "Test Description",
            "start_datetime": "invalid-date",
            "end_datetime": "also-invalid",
            "location": "Test Location"
        }
        
        mock_airtable = Mock()
        mock_airtable.insert.return_value = {"id": "rec123"}
        
        with patch('bot.Airtable', return_value=mock_airtable):
            result = save_event_to_airtable(event_data, "https://example.com")
            
            # Check that invalid dates are set to None
            call_args = mock_airtable.insert.call_args[0][0]
            assert call_args["Start Datetime"] is None
            assert call_args["End Datetime"] is None
    
    def test_save_update_to_airtable_dict(self):
        """Test saving structured update data."""
        update_data = {
            "title": "Test Update",
            "content": "This is a test update content.",
            "source": "TestSource"
        }
        
        mock_airtable = Mock()
        mock_airtable.insert.return_value = {"id": "rec456"}
        
        with patch('bot.Airtable', return_value=mock_airtable):
            result = save_update_to_airtable(update_data, "https://example.com")
            
            assert result["id"] == "rec456"
            call_args = mock_airtable.insert.call_args[0][0]
            # The function currently just uses the content field when content key is present
            expected_content = "This is a test update content."
            assert call_args["Content"] == expected_content
    
    def test_save_update_to_airtable_simple(self):
        """Test saving simple update data."""
        update_data = {"content": "Simple update text"}
        
        mock_airtable = Mock()
        mock_airtable.insert.return_value = {"id": "rec789"}
        
        with patch('bot.Airtable', return_value=mock_airtable):
            result = save_update_to_airtable(update_data)
            
            call_args = mock_airtable.insert.call_args[0][0]
            assert call_args["Content"] == "Simple update text"
    
    def test_save_update_to_airtable_structured_without_content_key(self):
        """Test saving structured update data that doesn't have a 'content' key."""
        update_data = {
            "title": "Breaking News",
            "summary": "Important announcement about new features.",
            "source": "TechBlog"
        }
        
        mock_airtable = Mock()
        mock_airtable.insert.return_value = {"id": "rec101"}
        
        with patch('bot.Airtable', return_value=mock_airtable):
            result = save_update_to_airtable(update_data, "https://example.com")
            
            assert result["id"] == "rec101"
            call_args = mock_airtable.insert.call_args[0][0]
            # When no 'content' key, it formats with title and empty content, plus URL
            expected_content = "Breaking News\n\n\n\nSource: https://example.com"
            assert call_args["Content"] == expected_content

class TestNewsletterFormatting:
    """Test newsletter generation functionality."""
    
    def test_format_newsletter_with_events_and_updates(self):
        """Test newsletter formatting with both events and updates."""
        events = [
            {
                "fields": {
                    "Event Title": "Tech Meetup",
                    "Link": "https://example.com/event1",
                    "Location": "Downtown",
                    "Start Datetime": "2024-06-15T19:00:00"
                }
            }
        ]
        
        updates = [
            {
                "fields": {
                    "Content": "Exciting news about our upcoming features!"
                }
            }
        ]
        
        result = format_newsletter(events, updates)
        
        assert "*Upcoming Events:*" in result
        assert "Tech Meetup" in result
        assert "Downtown" in result
        assert "*Recent Updates:*" in result
        assert "Exciting news" in result
    
    def test_format_newsletter_empty(self):
        """Test newsletter formatting with no data."""
        result = format_newsletter([], [])
        assert result == "No upcoming events or recent updates found."
    
    def test_format_newsletter_long_update_truncation(self):
        """Test that long updates are truncated."""
        updates = [
            {
                "fields": {
                    "Content": "This is a very long update content that should be truncated because it exceeds the maximum length limit that we have set for newsletter display to keep the newsletter concise and readable for users who want to quickly scan through the updates."
                }
            }
        ]
        
        result = format_newsletter([], updates)
        assert "..." in result
        assert len(result.split("• ")[1]) <= 203  # 200 chars + "..."

class TestEndToEndWorkflow:
    """Test complete processing workflows."""
    
    @pytest.mark.asyncio
    async def test_scrape_event_data_success(self):
        """Test complete event scraping workflow."""
        # Mock HTML content
        mock_html = "<html><body><h1>Test Event</h1></body></html>"
        
        # Mock OpenAI response
        mock_event_data = {
            "event_title": "Test Event",
            "description": "Test Description",
            "start_datetime": "2024-06-15T10:00:00",
            "end_datetime": None,
            "location": "Test Location"
        }
        
        with patch('bot.get_html_with_playwright', new_callable=AsyncMock) as mock_playwright:
            mock_playwright.return_value = mock_html
            
            with patch('bot.extract_event_data_with_openai', new_callable=AsyncMock) as mock_extract:
                mock_extract.return_value = mock_event_data
                
                result = await scrape_event_data("https://example.com")
                
                assert result == mock_event_data
                mock_playwright.assert_called_once_with("https://example.com")
                mock_extract.assert_called_once_with(mock_html, "https://example.com")
    
    @pytest.mark.asyncio
    async def test_scrape_update_data_success(self):
        """Test complete update scraping workflow."""
        mock_html = "<html><body><h1>Test Update</h1></body></html>"
        mock_update_data = {
            "title": "Test Update",
            "content": "Test content",
            "source": "TestSource"
        }
        
        with patch('bot.get_html_with_playwright', new_callable=AsyncMock) as mock_playwright:
            mock_playwright.return_value = mock_html
            
            with patch('bot.extract_update_data_with_openai', new_callable=AsyncMock) as mock_extract:
                mock_extract.return_value = mock_update_data
                
                result = await scrape_update_data("https://example.com")
                
                assert result == mock_update_data

class TestRealWorldScenarios:
    """Test with real-world-like scenarios."""
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_real_website_structure(self):
        """Test with realistic HTML structure."""
        # Simulate a realistic event page HTML
        realistic_html = """
        <html>
        <head><title>Tech Conference 2024</title></head>
        <body>
            <div class="event-container">
                <h1>Annual Tech Conference 2024</h1>
                <div class="event-details">
                    <p class="description">Join us for the biggest tech event of the year featuring industry leaders and innovative technologies.</p>
                    <div class="datetime">
                        <span class="start">June 15, 2024 at 9:00 AM</span>
                        <span class="end">June 15, 2024 at 5:00 PM</span>
                    </div>
                    <div class="location">Convention Center, 123 Tech Street, San Francisco, CA</div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Mock OpenAI to return realistic extracted data
        expected_data = {
            "event_title": "Annual Tech Conference 2024",
            "description": "Join us for the biggest tech event of the year featuring industry leaders and innovative technologies.",
            "start_datetime": "2024-06-15T09:00:00",
            "end_datetime": "2024-06-15T17:00:00",
            "location": "Convention Center, 123 Tech Street, San Francisco, CA"
        }
        
        with patch('bot.get_html_with_playwright', new_callable=AsyncMock) as mock_playwright:
            mock_playwright.return_value = realistic_html
            
            with patch('bot.extract_event_data_with_openai', new_callable=AsyncMock) as mock_extract:
                mock_extract.return_value = expected_data
                
                result = await scrape_event_data("https://example.com/tech-conference")
                
                assert result["event_title"] == "Annual Tech Conference 2024"
                assert "tech event" in result["description"].lower()
                assert is_iso_date(result["start_datetime"])
                assert is_iso_date(result["end_datetime"])

class TestErrorHandling:
    """Test error handling scenarios."""
    
    @pytest.mark.asyncio
    async def test_playwright_timeout_handling(self):
        """Test handling of Playwright timeouts."""
        with patch('bot.get_html_with_playwright', new_callable=AsyncMock) as mock_playwright:
            mock_playwright.side_effect = Exception("Timeout error")
            
            result = await scrape_event_data("https://example.com")
            assert result == {}
    
    @pytest.mark.asyncio
    async def test_openai_api_error_handling(self):
        """Test handling of OpenAI API errors."""
        mock_html = "<html><body><h1>Test</h1></body></html>"
        
        with patch('bot.get_html_with_playwright', new_callable=AsyncMock) as mock_playwright:
            mock_playwright.return_value = mock_html
            
            with patch('bot.extract_event_data_with_openai', new_callable=AsyncMock) as mock_extract:
                mock_extract.side_effect = Exception("OpenAI API error")
                
                result = await scrape_event_data("https://example.com")
                assert result == {}
    
    def test_airtable_error_handling(self):
        """Test handling of Airtable errors."""
        event_data = {"event_title": "Test Event"}
        
        with patch('bot.Airtable') as mock_airtable_class:
            mock_airtable_class.side_effect = Exception("Airtable API error")
            
            result = save_event_to_airtable(event_data, "https://example.com")
            assert result is None

# Configuration for pytest
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )

if __name__ == "__main__":
    # Run tests when script is executed directly
    pytest.main([__file__, "-v"]) 