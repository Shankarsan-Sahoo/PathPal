#!/usr/bin/env python3
"""
PathPal Setup Script
This script helps you set up the PathPal application.
"""

import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def create_env_file():
    """Create .env file if it doesn't exist"""
    if not os.path.exists('.env'):
        print("📝 Creating .env file...")
        with open('.env', 'w') as f:
            f.write("# Google Maps API Key\n")
            f.write("GOOGLE_MAPS_API_KEY=AIzaSyAauNDczc3rDej1gKV4PeXg5kVxnSyCgtk\n\n")
            f.write("# Gemini AI API Key\n")
            f.write("GEMINI_API_KEY=AIzaSyCDG8lbr9T1pSRimefjlCWBQ6U80RSpMgM\n")
        print("✅ .env file created with your API keys")
    else:
        print("✅ .env file already exists")

def main():
    print("🚀 Welcome to PathPal Setup!")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Install dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        print("❌ Failed to install dependencies. Please check your internet connection and try again.")
        sys.exit(1)
    
    # Create .env file
    create_env_file()
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Run the application: flask run")
    print("2. Open your browser to: http://localhost:5000")
    print("3. Allow location access when prompted")
    print("4. Start exploring with PathPal!")
    
    print("\n🔧 If you encounter any issues:")
    print("- Check that your API keys are valid")
    print("- Ensure you have an internet connection")
    print("- Try refreshing the page if the map doesn't load")

if __name__ == "__main__":
    main() 