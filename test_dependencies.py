#!/usr/bin/env python3
"""
Test script to verify all dependencies can be imported successfully.
Run this locally before deploying to catch any import issues.
"""

import sys

def test_imports():
    """Test importing all required packages."""
    print("Testing dependency imports...")
    
    try:
        print("✓ Testing os, re, logging, asyncio, datetime...")
        import os
        import re
        import logging
        import asyncio
        from datetime import datetime, timedelta
        print("  ✓ Standard library imports successful")
        
        print("✓ Testing python-dotenv...")
        from dotenv import load_dotenv
        print("  ✓ python-dotenv import successful")
        
        print("✓ Testing playwright...")
        from playwright.async_api import async_playwright
        print("  ✓ playwright import successful")
        
        print("✓ Testing python-telegram-bot...")
        from telegram import Update
        from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
        from telegram.constants import ParseMode
        print("  ✓ python-telegram-bot import successful")
        
        print("✓ Testing scrapegraphai...")
        from scrapegraphai.graphs import SmartScraperGraph
        print("  ✓ scrapegraphai import successful")
        
        print("✓ Testing airtable...")
        from airtable import Airtable
        print("  ✓ airtable import successful")
        
        print("\n🎉 All imports successful! Dependencies are compatible.")
        return True
        
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

def test_basic_functionality():
    """Test basic functionality of key components."""
    print("\nTesting basic functionality...")
    
    try:
        # Test environment variable loading
        from dotenv import load_dotenv
        load_dotenv()
        print("  ✓ Environment variable loading works")
        
        # Test datetime operations
        from datetime import datetime, timedelta
        today = datetime.now()
        future_date = today + timedelta(days=14)
        print(f"  ✓ Date operations work (today: {today.strftime('%Y-%m-%d')})")
        
        # Test regex pattern
        import re
        url_pattern = r'https?://[^\s]+'
        test_url = "https://example.com"
        if re.search(url_pattern, test_url):
            print("  ✓ URL regex pattern works")
        
        print("\n🎉 Basic functionality tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Functionality test error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("WEAVEBOT DEPENDENCY TEST")
    print("=" * 50)
    
    imports_ok = test_imports()
    functionality_ok = test_basic_functionality()
    
    if imports_ok and functionality_ok:
        print("\n✅ ALL TESTS PASSED - Safe to deploy!")
        sys.exit(0)
    else:
        print("\n❌ TESTS FAILED - Fix issues before deploying!")
        sys.exit(1) 