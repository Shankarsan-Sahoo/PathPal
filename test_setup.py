#!/usr/bin/env python3
"""
PathPal Test Script
This script tests the API connections and setup.
"""

import os
import requests
from dotenv import load_dotenv

def test_environment():
    """Test if environment variables are loaded"""
    print("🔍 Testing Environment Variables...")
    
    load_dotenv()
    
    google_maps_key = os.getenv('GOOGLE_MAPS_API_KEY')
    gemini_key = os.getenv('GEMINI_API_KEY')
    
    if google_maps_key:
        print("✅ Google Maps API Key: Found")
    else:
        print("❌ Google Maps API Key: Missing")
    
    if gemini_key:
        print("✅ Gemini AI API Key: Found")
    else:
        print("❌ Gemini AI API Key: Missing")
    
    return bool(google_maps_key and gemini_key)

def test_google_maps_api():
    """Test Google Maps API"""
    print("\n🗺️ Testing Google Maps API...")
    
    google_maps_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not google_maps_key:
        print("❌ No Google Maps API key found")
        return False
    
    # Test with a simple geocoding request
    url = f"https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        'address': 'New York',
        'key': google_maps_key
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'OK':
                print("✅ Google Maps API: Working")
                return True
            else:
                print(f"❌ Google Maps API: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
                print("   Note: This is expected if the API key has referer restrictions for security")
                return False
        else:
            print(f"❌ Google Maps API: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Google Maps API: {str(e)}")
        return False

def test_gemini_api():
    """Test Gemini AI API"""
    print("\n🤖 Testing Gemini AI API...")
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    if not gemini_key:
        print("❌ No Gemini API key found")
        return False
    
    # Test with a simple request using the correct model name
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    params = {'key': gemini_key}
    
    data = {
        "contents": [{
            "parts": [{
                "text": "Hello! Please respond with 'PathPal test successful' if you can see this message."
            }]
        }]
    }
    
    try:
        response = requests.post(url, params=params, json=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and result['candidates']:
                print("✅ Gemini AI API: Working")
                return True
            else:
                print(f"❌ Gemini AI API: Unexpected response format")
                return False
        else:
            print(f"❌ Gemini AI API: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Gemini AI API: {str(e)}")
        return False

def test_flask_server():
    """Test if Flask server is running"""
    print("\n🌐 Testing Flask Server...")
    
    try:
        response = requests.get('http://localhost:5000/test', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Flask Server: Running")
            print(f"   Status: {data.get('status')}")
            print(f"   Message: {data.get('message')}")
            print(f"   Gemini Configured: {data.get('gemini_configured')}")
            return True
        else:
            print(f"❌ Flask Server: HTTP {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Flask Server: Not running (Connection refused)")
        return False
    except Exception as e:
        print(f"❌ Flask Server: {str(e)}")
        return False

def main():
    print("🧪 PathPal Test Suite")
    print("=" * 50)
    
    # Test environment
    env_ok = test_environment()
    
    # Test APIs
    maps_ok = test_google_maps_api()
    gemini_ok = test_gemini_api()
    
    # Test Flask server
    flask_ok = test_flask_server()
    
    print("\n📊 Test Results Summary:")
    print("=" * 30)
    print(f"Environment Variables: {'✅' if env_ok else '❌'}")
    print(f"Google Maps API: {'✅' if maps_ok else '❌'}")
    print(f"Gemini AI API: {'✅' if gemini_ok else '❌'}")
    print(f"Flask Server: {'✅' if flask_ok else '❌'}")
    
    if all([env_ok, maps_ok, gemini_ok]):
        print("\n🎉 All APIs are working! PathPal should function correctly.")
    else:
        print("\n⚠️ Some tests failed. Please check the issues above.")
        
        if not env_ok:
            print("\n💡 To fix environment issues:")
            print("1. Make sure you have a .env file in the project root")
            print("2. Ensure it contains GOOGLE_MAPS_API_KEY and GEMINI_API_KEY")
        
        if not maps_ok:
            print("\n💡 To fix Google Maps API issues:")
            print("1. Check your API key is correct")
            print("2. Ensure the Maps JavaScript API is enabled")
            print("3. Check billing and quotas")
            print("4. Note: Referer restrictions are normal for security")
        
        if not gemini_ok:
            print("\n💡 To fix Gemini AI API issues:")
            print("1. Check your API key is correct")
            print("2. Ensure the Gemini API is enabled")
            print("3. Check billing and quotas")

if __name__ == "__main__":
    main() 