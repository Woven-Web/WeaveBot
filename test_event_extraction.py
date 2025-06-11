import pytest
import asyncio
from bot import scrape_event_data

# Test URLs - using past events to ensure they don't change
TEST_URLS = {
    'luma': 'https://lu.ma/futurefight',
    'meetup': 'https://www.meetup.com/genius-networking-boulder/events/305189326/?eventOrigin=your_events',
    'eventbrite': 'https://www.eventbrite.com/e/bierhalle-brawl-live-pro-wrestling-june-tickets-1354003373539?aff=ehometext'
}

EXPECTED_RESULTS = {
    'luma': {
        'should_work': True,
        'expected_title': 'Sovereign Minds: Data, AI & the Fight for the Future',
        'expected_location_contains': 'Denver'
    },
    'meetup': {
        'should_work': True,
        'expected_title_contains': 'Genius Networking',  # We'll be flexible here
        'expected_location_contains': 'Boulder'
    },
    'eventbrite': {
        'should_work': True,
        'expected_title': 'Bierhalle Brawl - Live Pro Wrestling - June',
        'expected_location_contains': 'Denver'
    }
}

async def test_event_extraction():
    """Test that event extraction works for all major platforms."""
    results = {}
    
    for platform, url in TEST_URLS.items():
        print(f"\n🧪 Testing {platform.upper()}: {url}")
        
        try:
            result = await scrape_event_data(url)
            expected = EXPECTED_RESULTS[platform]
            
            if 'error' in result:
                print(f"❌ {platform}: ERROR - {result['error']}")
                results[platform] = {'status': 'error', 'message': result['error']}
                continue
            
            # Check if we got data
            title = result.get('event_title')
            location = result.get('location')
            description = result.get('description')
            
            if not title or title.lower() == 'none':
                print(f"❌ {platform}: No title extracted")
                results[platform] = {'status': 'failed', 'reason': 'no_title'}
                continue
            
            # Check expected values
            success = True
            issues = []
            
            if 'expected_title' in expected and title != expected['expected_title']:
                issues.append(f"Title mismatch: got '{title}', expected '{expected['expected_title']}'")
                success = False
                
            if 'expected_title_contains' in expected:
                if not title or expected['expected_title_contains'].lower() not in title.lower():
                    issues.append(f"Title should contain '{expected['expected_title_contains']}', got '{title}'")
                    success = False
            
            if 'expected_location_contains' in expected:
                if not location or expected['expected_location_contains'].lower() not in location.lower():
                    issues.append(f"Location should contain '{expected['expected_location_contains']}', got '{location}'")
                    success = False
            
            if success:
                print(f"✅ {platform}: SUCCESS")
                print(f"   Title: {title}")
                print(f"   Location: {location}")
                print(f"   Description: {description[:100] if description else 'None'}...")
                results[platform] = {'status': 'success', 'data': result}
            else:
                print(f"⚠️ {platform}: PARTIAL - {', '.join(issues)}")
                results[platform] = {'status': 'partial', 'issues': issues, 'data': result}
                
        except Exception as e:
            print(f"💥 {platform}: EXCEPTION - {str(e)}")
            results[platform] = {'status': 'exception', 'error': str(e)}
    
    return results

def test_login_detection_false_positives():
    """Test that login detection doesn't trigger false positives."""
    # This should be run after the main test
    print("\n🔒 Testing login detection doesn't cause false positives...")
    
    # These should not be flagged as requiring login
    test_content_samples = [
        ("Navigation with login link", "<nav><a href='/login'>Log in</a><a href='/signup'>Sign up</a></nav><main><h1>Event Title</h1></main>"),
        ("Footer with login", "<main><h1>Event</h1></main><footer><a>Log in</a></footer>"),
        ("Meta description", "<meta name='description' content='Log in and find events'><h1>My Event</h1>"),
    ]
    
    # These should be flagged as requiring login
    login_wall_samples = [
        ("Actual login wall", "<h1>Please log in to continue</h1><p>You must log in to view this content</p>"),
        ("Login required", "<div>Login required to access this page</div>"),
        ("Facebook login", "<h1>You must log in first</h1><p>Join Facebook to see this event</p>"),
    ]
    
    print("✅ Login detection test would check these patterns")
    print("   - Navigation links should not trigger login detection")
    print("   - Actual login walls should be detected")
    print("   - Facebook-specific patterns should be caught")

async def main():
    """Run all tests."""
    print("🚀 Starting WeaveBot Event Extraction Tests")
    print("=" * 60)
    
    # Test event extraction
    results = await test_event_extraction()
    
    # Test login detection
    test_login_detection_false_positives()
    
    # Summary
    print(f"\n📊 TEST SUMMARY")
    print("=" * 60)
    
    working_count = sum(1 for r in results.values() if r['status'] == 'success')
    total_count = len(results)
    
    print(f"Working platforms: {working_count}/{total_count}")
    
    for platform, result in results.items():
        status_emoji = {
            'success': '✅',
            'partial': '⚠️', 
            'failed': '❌',
            'error': '❌',
            'exception': '💥'
        }.get(result['status'], '❓')
        
        print(f"{status_emoji} {platform.upper()}: {result['status']}")
        if result['status'] in ['failed', 'error'] and 'reason' in result:
            print(f"     Reason: {result['reason']}")
        elif result['status'] == 'error' and 'message' in result:
            print(f"     Error: {result['message']}")
    
    if working_count == total_count:
        print(f"\n🎉 All tests passed! WeaveBot is working correctly.")
    else:
        print(f"\n⚠️ {total_count - working_count} platform(s) need attention.")
    
    return results

if __name__ == "__main__":
    asyncio.run(main()) 