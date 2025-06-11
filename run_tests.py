#!/usr/bin/env python3
"""
WeaveBot Test Runner

This script provides different ways to run tests for the WeaveBot project.
"""

import subprocess
import sys
import argparse

def run_command(cmd):
    """Run a command and return the result."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"Error running command: {e}", file=sys.stderr)
        return False

def run_all_tests():
    """Run all tests."""
    print("🧪 Running all tests...")
    return run_command("python3 -m pytest test_bot.py -v")

def run_unit_tests():
    """Run only unit tests (fast tests that don't require external services)."""
    print("⚡ Running unit tests...")
    return run_command("python3 -m pytest test_bot.py -v -k 'not integration'")

def run_integration_tests():
    """Run only integration tests."""
    print("🔗 Running integration tests...")
    return run_command("python3 -m pytest test_bot.py -v -m integration")

def run_specific_test(test_name):
    """Run a specific test class or method."""
    print(f"🎯 Running specific test: {test_name}")
    return run_command(f"python3 -m pytest test_bot.py::{test_name} -v")

def run_tests_with_coverage():
    """Run tests with coverage report."""
    print("📊 Running tests with coverage...")
    # Install coverage if not available
    run_command("python3 -m pip install coverage")
    success = run_command("python3 -m coverage run -m pytest test_bot.py")
    if success:
        run_command("python3 -m coverage report -m")
        run_command("python3 -m coverage html")
        print("📈 Coverage report generated in htmlcov/index.html")
    return success

def main():
    """Main function to handle command line arguments."""
    parser = argparse.ArgumentParser(description="WeaveBot Test Runner")
    parser.add_argument(
        "command",
        choices=["all", "unit", "integration", "coverage", "specific"],
        help="Type of tests to run"
    )
    parser.add_argument(
        "--test",
        help="Specific test to run (use with 'specific' command)"
    )
    
    args = parser.parse_args()
    
    if args.command == "all":
        success = run_all_tests()
    elif args.command == "unit":
        success = run_unit_tests()
    elif args.command == "integration":
        success = run_integration_tests()
    elif args.command == "coverage":
        success = run_tests_with_coverage()
    elif args.command == "specific":
        if not args.test:
            print("❌ Please specify a test with --test flag")
            return False
        success = run_specific_test(args.test)
    
    if success:
        print("✅ Tests completed successfully!")
        return True
    else:
        print("❌ Some tests failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 