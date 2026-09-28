// public/js/i18n.js
// Centralized Multilingual i18n Engine for Sudarshan Platform

const I18N = {
  currentLang: localStorage.getItem('sudarshan_lang') || 'en',
  translations: {},
  languages: [
    { code: 'en', name: 'English', native: 'English', voiceLocale: 'en-IN' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', voiceLocale: 'hi-IN' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', voiceLocale: 'mr-IN' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', voiceLocale: 'gu-IN' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', voiceLocale: 'bn-IN' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', voiceLocale: 'ta-IN' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', voiceLocale: 'te-IN' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', voiceLocale: 'kn-IN' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', voiceLocale: 'ml-IN' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', voiceLocale: 'pa-IN' }
  ],

  async init() {
    try {
      const res = await fetch('/data/translations.json');
      this.translations = await res.json();
    } catch (err) {
      console.error('Failed to load translations:', err);
    }
    this.setLanguage(this.currentLang, false);
  },

  setLanguage(langCode, triggerEvent = true) {
    if (!this.languages.some(l => l.code === langCode)) {
      langCode = 'en';
    }
    this.currentLang = langCode;
    localStorage.setItem('sudarshan_lang', langCode);
    document.documentElement.lang = langCode;

    this.updateUI();

    // Update Language Dropdown Button Label if present
    const langLabelEl = document.getElementById('current-lang-label');
    if (langLabelEl) {
      const activeObj = this.languages.find(l => l.code === langCode);
      langLabelEl.textContent = activeObj ? activeObj.native : 'English';
    }

    if (triggerEvent) {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }));
    }
  },

  t(key, replacements = {}) {
    const langDict = this.translations[this.currentLang] || this.translations['en'] || {};
    let text = langDict[key] || (this.translations['en'] && this.translations['en'][key]) || key;

    for (const [param, val] of Object.entries(replacements)) {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), val);
    }
    return text;
  },

  getVoiceLocale() {
    const active = this.languages.find(l => l.code === this.currentLang);
    return active ? active.voiceLocale : 'en-IN';
  },

  updateUI() {
    // 1. Text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (val) el.textContent = val;
    });

    // 2. HTML elements
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = this.t(key);
      if (val) el.innerHTML = val;
    });

    // 3. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = this.t(key);
      if (val) el.placeholder = val;
    });

    // 4. Title & ARIA labels
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = this.t(key);
      if (val) el.title = val;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const val = this.t(key);
      if (val) el.setAttribute('aria-label', val);
    });
  }
};

window.I18N = I18N;
