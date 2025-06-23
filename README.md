# PathPal - Your Local Walking Guide 🚶‍♂️

PathPal is a Flask-based web application that provides friendly, local-style walking directions using Google Maps and Gemini AI. Instead of robotic navigation instructions, PathPal gives you directions like a local friend would - with landmarks, tips, and conversational guidance.

## ✨ Features

- **📍 Auto-location Detection**: Automatically detects your current location
- **🎯 Smart Destination Search**: Google Places autocomplete for easy destination selection
- **🗺️ Interactive Map**: Dark-themed Google Maps with walking route visualization
- **🤖 AI-Powered Directions**: Gemini AI transforms Google Maps instructions into friendly, local-style guidance
- **💬 Follow-up Questions**: Ask additional questions about your route
- **🎨 Modern UI**: Floating glassmorphism panel with smooth animations
- **📱 Mobile-Friendly**: Fully responsive design

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Maps**: Google Maps API (Places, Directions, Geocoding)
- **AI**: Google Gemini Generative AI API
- **Deployment**: Ready for Render, Heroku, or any Python hosting

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd PathPal
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Up API Keys

Create a `.env` file in the project root:
```bash
cp env.example .env
```

Edit `.env` and add your API keys:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Getting API Keys:

**Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the key to your domain for security

**Gemini AI API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

### 4. Update Google Maps API Key in HTML

Edit `templates/index.html` and replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places"></script>
```

### 5. Run the Application
```bash
flask run
```

Open your browser and navigate to `http://localhost:5000`

## 📁 Project Structure

```
PathPal/
├── main.py              # Flask application entry point
├── requirements.txt     # Python dependencies
├── env.example         # Environment variables template
├── .env               # Your API keys (create this)
├── templates/
│   └── index.html     # Main HTML template
└── static/
    └── app.js         # JavaScript for maps and AI integration
```

## 🎯 How It Works

1. **Location Detection**: The app automatically detects your current location using browser geolocation
2. **Destination Search**: Type in your destination using the "Where to go?" input field
3. **Route Calculation**: Google Maps calculates the optimal walking route
4. **AI Enhancement**: The route instructions are sent to Gemini AI, which transforms them into friendly, local-style guidance
5. **Interactive Chat**: Ask follow-up questions about your route for additional help

## 🎨 UI Design

The application features a modern, dark-themed interface with:
- **Floating Glassmorphism Panel**: Semi-transparent panel positioned on the left side
- **Dark Map Theme**: Custom-styled Google Maps for better visibility
- **Smooth Animations**: Fade-in and slide-up animations for better UX
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🚀 Deployment

### Deploy to Render

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set environment variables:
   - `GOOGLE_MAPS_API_KEY`
   - `GEMINI_API_KEY`
5. Deploy!

### Deploy to Heroku

1. Install Heroku CLI
2. Create a new Heroku app
3. Set environment variables:
   ```bash
   heroku config:set GOOGLE_MAPS_API_KEY=your_key
   heroku config:set GEMINI_API_KEY=your_key
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

## 🔧 Configuration

### Customizing the AI Prompts

Edit the prompts in `main.py` to customize how the AI generates directions:

```python
# In get_guide() function
prompt = f"""You are a friendly local guide. Give walking directions from {start_location} to {destination} in a warm, conversational style like a local would give to a friend.

Use these Google Maps directions as reference:
{steps_text}

Make the directions:
- Friendly and conversational
- Include local landmarks and tips
- Easy to follow
- About 2-3 sentences per step
- Natural language, not robotic

Start with a brief greeting and end with arrival confirmation."""
```

### Styling Customization

The UI uses Tailwind CSS classes. You can customize the appearance by modifying the classes in `templates/index.html`.

## 🐛 Troubleshooting

### Common Issues

1. **"Google Maps API key not valid"**
   - Ensure your API key is correct
   - Check that the required APIs are enabled in Google Cloud Console
   - Verify the key is not restricted to specific domains

2. **"Geolocation not working"**
   - Make sure you're using HTTPS (required for geolocation)
   - Check browser permissions for location access
   - Try refreshing the page

3. **"Gemini AI not responding"**
   - Verify your Gemini API key is correct
   - Check your API quota and billing status
   - Ensure the API is enabled in Google AI Studio

### Debug Mode

Run the app in debug mode for detailed error messages:
```bash
export FLASK_ENV=development
flask run
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**IMPORTANT:**
Before pushing to GitHub or deploying, edit `templates/index.html` and replace the Google Maps API key in the script tag with your own key, or use an environment variable and template rendering for better security. Never commit your real API keys to public repositories.

**Happy Walking! 🚶‍♀️✨** 