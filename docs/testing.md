# WeaveBot Testing Guide

This document explains the comprehensive testing setup for WeaveBot, covering all aspects of the bot's functionality.

## Test Structure

The test suite is organized into several categories:

### 🧪 Test Categories

1. **Unit Tests** - Fast tests for individual functions
2. **Integration Tests** - Tests that verify component integration 
3. **Mock Tests** - Tests using mocked external services
4. **End-to-End Tests** - Complete workflow testing
5. **Error Handling Tests** - Robust error scenario testing

## Test Files

- `test_bot.py` - Main test suite with comprehensive coverage
- `pytest.ini` - Pytest configuration
- `run_tests.py` - Test runner script with different options

## Running Tests

### Quick Start

```bash
# Run all tests
python3 -m pytest test_bot.py -v

# Or use the test runner
python3 run_tests.py all
```

### Test Runner Options

```bash
# Run all tests
python3 run_tests.py all

# Run only fast unit tests (excludes integration tests)
python3 run_tests.py unit

# Run integration tests only
python3 run_tests.py integration

# Run with coverage report
python3 run_tests.py coverage

# Run a specific test class
python3 run_tests.py specific --test TestDateValidation

# Run a specific test method
python3 run_tests.py specific --test TestDateValidation::test_valid_iso_dates
```

## Test Coverage

### What's Tested

✅ **Date Validation**
- ISO 8601 date format validation
- Valid and invalid date scenarios
- Edge cases (leap years, invalid months/days)

✅ **Data Extraction**
- OpenAI API integration
- Event data extraction from HTML
- Update data extraction from HTML
- JSON parsing and error handling

✅ **Browser Automation**
- Playwright HTML fetching
- Browser configuration and timeouts
- Error scenarios and recovery

✅ **Database Integration**
- Airtable event saving
- Airtable update saving
- Data mapping and validation
- Date field handling

✅ **Newsletter Generation**
- Event formatting
- Update formatting
- Content truncation
- Empty data handling

✅ **Workflow Integration**
- Complete event processing pipeline
- Complete update processing pipeline
- Error propagation and handling

✅ **Error Handling**
- API failures (OpenAI, Airtable)
- Browser timeouts and crashes
- Invalid data scenarios
- Network errors

### Test Classes

#### `TestDateValidation`
Tests the ISO 8601 date validation functionality that ensures event dates are properly formatted.

```python
# Example: Valid dates
"2024-06-15T10:30:00"
"2024-12-25T00:00:00"
"2024-06-15"

# Example: Invalid dates  
"June 15, 2024"
"2024/06/15"
"invalid-date"
```

#### `TestDataExtraction`
Tests OpenAI integration for extracting structured data from HTML content.

- Mocks OpenAI API responses
- Tests JSON parsing and error handling
- Validates extracted event and update data

#### `TestPlaywrightIntegration`
Tests browser automation functionality.

- Mocks Playwright browser operations
- Tests HTML content fetching
- Validates browser configuration and error handling

#### `TestAirtableIntegration`
Tests database operations with Airtable.

- Mocks Airtable API calls
- Tests data mapping between bot and Airtable fields
- Validates date field handling and error scenarios

#### `TestNewsletterFormatting`
Tests the newsletter generation functionality.

- Tests event and update formatting
- Validates content truncation
- Tests empty data scenarios

#### `TestEndToEndWorkflow`
Tests complete processing workflows.

- Event scraping: HTML → Data Extraction → Database
- Update scraping: HTML → Data Extraction → Database
- Integration between all components

#### `TestRealWorldScenarios`
Tests with realistic website structures and data.

- Realistic HTML content simulation
- Complex event page structures
- Real-world data validation

#### `TestErrorHandling`
Tests robust error handling across all components.

- API timeouts and failures
- Invalid data handling
- Network error scenarios
- Graceful degradation

## Mocking Strategy

The test suite uses comprehensive mocking to avoid hitting real external services:

```python
# OpenAI API mocking
with patch('bot.openai_client.chat.completions.create', new_callable=AsyncMock):
    # Test OpenAI integration without API calls

# Playwright mocking
with patch('bot.async_playwright') as mock_playwright:
    # Test browser automation without launching browsers

# Airtable mocking  
with patch('bot.Airtable', return_value=mock_airtable):
    # Test database operations without real Airtable calls
```

## Dependencies

Test dependencies are included in `requirements.txt`:

```
pytest>=7.0.0
pytest-asyncio>=0.21.0
```

## CI/CD Integration

The test suite is designed to work in CI/CD environments:

- No external dependencies during testing
- Fast execution (typically under 30 seconds)
- Clear pass/fail indicators
- Detailed error reporting

## Performance Benchmarks

- **Total test runtime**: ~0.3 seconds (22 tests)
- **Memory usage**: Minimal (mocked external services)
- **Coverage**: Comprehensive core functionality coverage

## Writing New Tests

### Guidelines

1. **Use descriptive test names**: `test_extract_event_data_with_invalid_json`
2. **Mock external services**: Don't hit real APIs in tests
3. **Test both success and failure scenarios**: Happy path + error cases
4. **Use appropriate async/await**: For async functions
5. **Group related tests**: Use test classes to organize

### Example Test Structure

```python
class TestNewFeature:
    """Test new feature functionality."""
    
    def test_success_case(self):
        """Test successful operation."""
        # Arrange
        # Act  
        # Assert
        
    def test_error_case(self):
        """Test error handling."""
        # Arrange (setup error condition)
        # Act
        # Assert (verify proper error handling)
```

## Troubleshooting

### Common Issues

**Import Errors**
```bash
# Ensure dependencies are installed
python3 -m pip install -r requirements.txt
```

**Async Test Failures**
```bash
# Make sure pytest-asyncio is installed
python3 -m pip install pytest-asyncio
```

**Mock Issues**
```bash
# Verify unittest.mock import paths match actual module structure
from unittest.mock import Mock, AsyncMock, patch
```

### Running Tests in Debug Mode

```bash
# Verbose output with full traceback
python3 -m pytest test_bot.py -v -s --tb=long

# Run single test with maximum debugging
python3 -m pytest test_bot.py::TestDateValidation::test_valid_iso_dates -v -s --tb=long
```

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass: `python3 run_tests.py all`
3. Add integration tests for new external service integrations
4. Update this documentation for new test categories

The comprehensive test suite ensures WeaveBot remains reliable and maintainable as it evolves. 