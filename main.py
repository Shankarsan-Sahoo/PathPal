from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure Gemini AI
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    logger.error("GEMINI_API_KEY not found in environment variables")
else:
    logger.info("Gemini API key loaded successfully")
    genai.configure(api_key=gemini_api_key)
    # Use gemini-1.5-flash model which is more reliable
    model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/')
def index():
    """Main page with the PathPal interface"""
    google_maps_api_key = os.getenv('GOOGLE_MAPS_API_KEY', '')
    return render_template('index.html', google_maps_api_key=google_maps_api_key)

@app.route('/get_guide', methods=['POST'])
def get_guide():
    """Generate AI-powered walking guide from Google Maps directions"""
    try:
        data = request.get_json()
        start_location = data.get('start')
        destination = data.get('destination')
        steps = data.get('steps', [])
        distance = data.get('distance', '')
        duration = data.get('duration', '')
        
        logger.info(f"Received request data: {data}")
        
        if not destination or not steps:
            return jsonify({'error': 'Missing destination or steps'}), 400
        
        # Create prompt with distance and duration information
        prompt = f"""You are a friendly local guide helping someone walk from their current location (\"{start_location}\") to their chosen destination (\"{destination}\").\n\nDistance: {distance}\nDuration: {duration}\n\nGoogle Maps walking directions:\n{chr(10).join(f"{i+1}. {step}" for i, step in enumerate(steps))}\n\nRewrite these directions in a friendly, conversational style as if you're a local person guiding them step by step from their current location. \n\nImportant guidelines:\n- Start the directions from the user's current location.\n- Use natural language and avoid technical terms.\n- Mention landmarks, shops, and recognizable places along the way.\n- Avoid cardinal directions (north, south, east, west) - use \"left\", \"right\", \"straight ahead\" instead.\n- Be encouraging and helpful.\n- Include the total distance and time at the beginning.\n- Make it feel like a local friend is giving you directions.\n- Give clear, step-by-step instructions for the entire route.\n\nGive a warm, helpful response that makes the person feel confident about their walk."""

        # Generate response with Gemini
        logger.info("Sending prompt to Gemini AI")
        response = model.generate_content(prompt)
        logger.info("Received response from Gemini AI")
        
        return jsonify({
            'success': True,
            'guide': response.text
        })
        
    except Exception as e:
        logger.error(f"Error in get_guide: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/ask_followup', methods=['POST'])
def ask_followup():
    """Handle follow-up questions about the route"""
    try:
        data = request.get_json()
        question = data.get('question')
        context = data.get('context', '')
        currentDestination = data.get('current_destination', '')
        originalSteps = data.get('original_steps', [])  # Get original route steps
        distance = data.get('distance', '')
        duration = data.get('duration', '')
        
        if not question:
            return jsonify({'error': 'Missing question'}), 400
        
        # Check if user is asking for Hindi/Hinglish translation
        translation_keywords = ['translate', 'hindi', 'hinglish', 'हिंदी', 'translate into hindi', 'hinglish mein']
        is_translation_request = any(keyword in question.lower() for keyword in translation_keywords)
        guide_to_translate = data.get('guide_to_translate', '')
        if is_translation_request and guide_to_translate:
            # Translate the local-guide output instead of original steps
            prompt = f"""You are a helpful local guide. The user wants the following walking directions translated into Hinglish (Hindi + English mixed language).\n\nDirections to translate:\n{guide_to_translate}\n\nGuidelines:\n- Use natural Hinglish like \"Aapko left turn lena hoga\" or \"Straight jaate raho\"\n- Mix Hindi and English words naturally\n- Keep the friendly, local guide tone\n- Make it sound like a local person speaking informally\n- Be specific about landmarks and street names mentioned in the original directions\n- Make the instructions crystal clear and easy to follow\n\nGive a warm, helpful response in Hinglish that makes the person feel confident about their walk, but stick to the exact directions provided."""
        elif is_translation_request:
            # Create Hinglish translation prompt with original route steps
            steps_text = ""
            if originalSteps:
                steps_text = "\n".join(f"{i+1}. {step}" for i, step in enumerate(originalSteps))
            prompt = f"""You are a helpful local guide. The user wants the previous walking directions translated into Hinglish (Hindi + English mixed language).\n\nCurrent Destination: {currentDestination}\nDistance: {distance}\nDuration: {duration}\n\nOriginal Google Maps walking directions:\n{steps_text}\n\nPlease provide the EXACT SAME walking directions in Hinglish style - mix Hindi and English naturally like how people actually speak in India. \n\nIMPORTANT: You must follow the exact same route and steps as the original English directions. Do not make up new directions.\n\nGuidelines for Hinglish response:\n- Use natural Hinglish like \"Aapko left turn lena hoga\" or \"Straight jaate raho\"\n- Mix Hindi and English words naturally\n- Keep the friendly, local guide tone\n- Use familiar Hindi words for directions: left, right, straight, turn, road, etc.\n- Make it sound like a local person speaking informally\n- Include the EXACT same distance and time information\n- Follow the EXACT same route steps as the original directions\n- Be specific about landmarks and street names mentioned in the original directions\n- Make the instructions crystal clear and easy to follow\n\nGive a warm, helpful response in Hinglish that makes the person feel confident about their walk, but stick to the exact route provided."""
        else:
            # Create regular context-aware prompt
            prompt = f"""You are a helpful local guide. Answer this follow-up question about the walking route:\n\nContext: {context}\nCurrent Destination: {currentDestination}\n\nQuestion: {question}\n\nIMPORTANT INSTRUCTIONS:\n- If the user mentions their current location (like \"I'm in front of [place]\" or \"I'm at [place]\"), they want directions FROM that location TO the current destination.\n- The current destination is: {currentDestination}\n- Provide complete walking directions from their mentioned location to the destination.\n- Use landmarks, street names, and natural language (avoid cardinal directions like north/south/east/west).\n- Be friendly and helpful like a local person.\n\nExample: If destination is \"Aster Prime Hospital\" and user says \"I'm in front of Naresh IT\", provide directions from Naresh IT to Aster Prime Hospital.\n\nGive a friendly, helpful response with step-by-step walking directions."""
        # Generate response with Gemini
        response = model.generate_content(prompt)
        return jsonify({
            'success': True,
            'answer': response.text
        })
        
    except Exception as e:
        logger.error(f"Error in ask_followup: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/test')
def test():
    """Test endpoint to check if the server is running"""
    return jsonify({
        'status': 'ok',
        'message': 'PathPal server is running',
        'gemini_configured': bool(gemini_api_key)
    })

if __name__ == '__main__':
    app.run(debug=True) 