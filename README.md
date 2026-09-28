# SUDARSHAN
### AI-Powered Government Scheme Discovery & Citizen Assistance Platform

> **Disclaimer**: *Sudarshan is an independent informational platform and is not affiliated with or endorsed by any Government department. Users should verify eligibility, documents and application details on the concerned official government portal.*

---

## 🌟 Executive Overview
**Sudarshan** is a national-level civic-tech platform designed to bridge the digital information gap for Indian citizens seeking central and state government welfare schemes. Built with a focus on accessibility, transparency, and linguistic inclusion, Sudarshan supports **10 Indian languages**, **voice-assisted interaction**, **natural-language query processing**, and a **transparent, rule-based eligibility engine**.

---

## 🚀 Key Features

1. **Multilingual Architecture (10 Indian Languages)**:
   - Full interface translation across:
     - English
     - हिन्दी (Hindi)
     - मराठी (Marathi)
     - ગુજરાતી (Gujarati)
     - বাংলা (Bengali)
     - தமிழ் (Tamil)
     - తెలుగు (Telugu)
     - ಕನ್ನಡ (Kannada)
     - മലയാളം (Malayalam)
     - ਪੰਜਾਬੀ (Punjabi)
   - Dynamic localization of navbar, filters, search placeholders, scheme details, eligibility badges, voice prompts, and disclaimers.
   - Selected language persists in `localStorage` across page reloads.

2. **AI-Powered Natural Language Search & Voice Assistant**:
   - Natural language query understanding (e.g., *"I am a 20 year old student from Madhya Pradesh. Which scholarships can I apply for?"*).
   - Multi-provider abstraction (`AIProvider`):
     - **Google Gemini 1.5** integration via `GEMINI_API_KEY`
     - **OpenAI GPT** architecture via `OPENAI_API_KEY`
     - **Built-in Smart Local Rule-based NLP Engine** fallback (zero dependency on external keys during offline or hackathon presentations).
   - Language-aware speech-to-text with Web Speech API and text-to-speech scheme narration (Play, Pause, Stop).

3. **Curated Comprehensive Scheme Database**:
   - **Madhya Pradesh Schemes**:
     - *Women*: मुख्यमंत्री लाड़ली बहना योजना, लाड़ली बहना गैस रिफिल योजना, लाड़ली लक्ष्मी योजना 2.0, मुख्यमंत्री कन्या विवाह / निकाह योजना
     - *Farmers*: मुख्यमंत्री किसान कल्याण योजना, बलराम ताल योजना, सूरजधारा योजना, भावांतर भुगतान योजना
     - *Youth & Employment*: मुख्यमंत्री सीखो-कमाओ योजना (MMSKY), संत रविदास स्वरोजगार योजना, मुख्यमंत्री उद्यम क्रांति योजना
     - *Education*: मुख्यमंत्री मेधावी विद्यार्थी योजना, गांव की बेटी योजना, आकांक्षा योजना, महर्षि वाल्मीकि प्रोत्साहन योजना, फ्री स्कूटी योजना
     - *Health & Social*: आयुष्मान भारत मध्य प्रदेश, मुख्यमंत्री बाल हृदय उपचार योजना, मुख्यमंत्री तीर्थ दर्शन योजना, सरल बिजली बिल / अटल गृह ज्योति योजना
   - **Central Government Schemes**:
     - PM-KISAN, PMFBY, PM-KUSUM, Soil Health Card, PM PRANAM, PMAY-G, PMAY-U, Jal Jeevan Mission, Swachh Bharat Mission, PM Surya Ghar, PM SVANidhi, PMGSY, Smart Cities, PMJDY, Mudra, Stand-Up India, Sukanya Samriddhi, Atal Pension, NPS Vatsalya, Beti Bachao Beti Padhao, PMMVY, Poshan Abhiyaan, PM Ujjwala, Ayushman Bharat PM-JAY, ABDM, PMSBY, PMJJBY, MGNREGA, PMKVY, PM Vishwakarma, Startup India, Make in India, Digital India, PMJUGA, PM-JANMAN.
   - **Education & Scholarships**:
     - PM-USP, NMMS, PM YASASVI, SWAYAM, etc.
   - **State Coverage**: All 28 Indian States & 8 Union Territories with verified official portals.

4. **Transparent Explainable Eligibility Engine**:
   - Evaluates citizen profiles against age, domicile, gender, income, and social category.
   - Distinct statuses:
     - 🟢 **Potentially Eligible**
     - 🟡 **More Information Required**
     - 🔴 **May Not Be Eligible**
   - Detailed rule-by-rule breakdown indicating matched rules and missing documentation.

5. **Safe Official Interaction**:
   - All schemes first open a rich in-depth detail modal with benefits, eligibility, checklist of documents, step-by-step process, and department contacts.
   - "Apply Now" button opens verified official government portals in a new tab (`target="_blank" rel="noopener noreferrer"`) with prominent external domain safety warnings.
   - Verified official helpline and WhatsApp links (where officially available).

6. **Theme Engine**:
   - `[☀ Light] [🌙 Dark] [💻 System]` buttons with persistent theme states.
   - Listens dynamically to OS-level `prefers-color-scheme`.
   - Accessible contrast in both light and dark modes.

7. **Citizen Dashboard & Local State**:
   - Dynamic profile completion calculation (0 - 100%).
   - Recommended schemes for profile.
   - Bookmarked / Saved schemes with quick remove.
   - Last 12 recently viewed schemes history.
   - URL query synchronization for shareable search results (e.g., `?state=Madhya+Pradesh&category=Women`).

---

## 📂 Project Structure

```
C:\Users\Ramakant\.gemini\antigravity\scratch\sudarshan\
├── data/
│   ├── schemes.json          # Curated database of central & state schemes
│   ├── states.json           # All 28 States & 8 UTs with official portals
│   ├── categories.json       # 32 Category configurations with icons & colors
│   └── translations.json     # Full 10-language UI translation dictionary
├── server/
│   ├── middleware/
│   │   └── errorHandler.js   # Centralized error handler
│   ├── routes/
│   │   ├── auth.js           # Demo OTP & session endpoints
│   │   ├── categories.js     # Category listings with live scheme counts
│   │   ├── eligibility.js    # Profile eligibility evaluation API
│   │   ├── schemes.js        # Scheme discovery, filter, and detail endpoints
│   │   ├── search.js         # Standard and AI-assisted search endpoints
│   │   └── states.js         # States & UTs with dynamic counts
│   └── services/
│       ├── aiProvider.js     # AI abstraction (Gemini / OpenAI / Local NLP)
│       └── eligibilityEngine.js # Explainable rule-based evaluator
├── public/
│   ├── css/
│   │   └── styles.css        # Custom CSS variables, dark theme, animations
│   ├── js/
│   │   ├── api.js            # Client API client with resilient fallbacks
│   │   ├── app.js            # Main application controller & URL sync
│   │   ├── auth.js           # Demo authentication manager
│   │   ├── eligibility.js    # Client-side eligibility & profile completion
│   │   ├── i18n.js           # 10-language translation engine
│   │   ├── theme.js          # Theme selector (Light, Dark, System)
│   │   └── voice.js          # Web Speech API voice assistant & narrator
│   ├── index.html            # Primary single page responsive interface
│   ├── robots.txt
│   └── sitemap.xml
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js                 # Express server & API gateway
```

---

## 💻 Windows CMD Quickstart Guide

### 1. Open Windows Command Prompt (CMD) or PowerShell
```cmd
cd C:\Users\Ramakant\.gemini\antigravity\scratch\sudarshan
```

### 2. Install Dependencies
```cmd
npm install
```
*(Dependencies: `express`, `cors`, `dotenv`. Installs in ~5-10 seconds!)*

### 3. Start the Server
```cmd
npm start
```

### 4. Open in Browser
Open your browser and navigate to:
```
http://localhost:3000
```
Health Check:
```
http://localhost:3000/api/health
```

---

## 🔑 AI Provider Configuration (.env)

By default, **Sudarshan works out-of-the-box in Smart Local NLP Mode** with zero external API keys needed!

To enable real-time Google Gemini or OpenAI language models:

1. Create a `.env` file in the project root:
   ```cmd
   copy .env.example .env
   ```
2. Open `.env` and insert your API keys:
   ```env
   PORT=3000
   NODE_ENV=development

   # For Google Gemini (Recommended):
   GEMINI_API_KEY=your_google_gemini_api_key_here

   # For OpenAI GPT:
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Restart the server (`npm start`). The system automatically activates the external AI provider when available.

---

## 🛡️ Demo vs. Production Clarification

| Feature | Hackathon / Demo Mode | Production Integration Required |
| :--- | :--- | :--- |
| **Authentication** | Demo OTP (`123456`) or one-click verification | Production SMS Gateway (Twilio / Fast2SMS / CDAC NIC SMS Gateway) + OAuth Client IDs |
| **Natural Language Search** | Local Smart NLP Engine (Active) | Optional: `GEMINI_API_KEY` for advanced generative understanding |
| **Voice Assistant** | Native Web Speech API | Production ready (Chrome, Edge, Safari supported natively) |
| **Eligibility Evaluation** | Transparent client & server rule engine | Production ready |
| **Citizen Profile & Bookmarks** | Browser `localStorage` | PostgreSQL / MongoDB user database via JWT sessions |
| **Official Application Links** | Verified government portals (`.gov.in`, `.nic.in`) | Production ready |
