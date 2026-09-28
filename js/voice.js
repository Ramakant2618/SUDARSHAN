// public/js/voice.js
// Non-blocking Inline Voice Assistant using Web Speech API

const VoiceAssistant = {
  recognition: null,
  isListening: false,
  synth: window.speechSynthesis || null,
  currentUtterance: null,
  isSpeaking: false,
  isPaused: false,
  latestTranscript: '',
  onCompleteCallback: null,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateListeningUI(true);
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        this.latestTranscript = transcript;
        this.onTranscriptUpdate(transcript, event.results[0]?.isFinal);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        this.updateListeningUI(false);
        if (event.error === 'not-allowed') {
          if (window.showToast) {
            window.showToast('Microphone access denied. Please allow microphone in browser settings.', 'warning');
          }
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateListeningUI(false);
        if (this.latestTranscript && this.latestTranscript.trim().length > 1) {
          const finalQuery = this.latestTranscript.trim();
          this.latestTranscript = '';
          if (this.onCompleteCallback) {
            this.onCompleteCallback(finalQuery);
          }
        }
      };
    }
  },

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  toggleListening(onSearch) {
    if (!this.isSupported()) {
      if (window.showToast) {
        window.showToast(window.I18N ? window.I18N.t('voice.unsupported') : 'Voice recognition is not supported in this browser. Please type your query.', 'warning');
      }
      return;
    }

    if (this.isListening) {
      this.stopAndSearch();
    } else {
      this.startListening(onSearch);
    }
  },

  startListening(onComplete) {
    if (!this.recognition) return;
    this.onCompleteCallback = onComplete;
    this.latestTranscript = '';

    // Set voice language to match active UI language
    this.recognition.lang = window.I18N ? window.I18N.getVoiceLocale() : 'hi-IN';

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Failed to start recognition, re-initializing:', err);
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 200);
      } catch (e) {}
    }
  },

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {}
      this.isListening = false;
      this.updateListeningUI(false);
    }
  },

  stopAndSearch() {
    this.stopListening();
    const query = this.latestTranscript || document.getElementById('main-search-input')?.value || '';
    if (query.trim() && this.onCompleteCallback) {
      this.onCompleteCallback(query.trim());
    }
    this.latestTranscript = '';
  },

  cancelListening() {
    this.latestTranscript = '';
    this.stopListening();
  },

  onTranscriptUpdate(transcript, isFinal) {
    const input = document.getElementById('main-search-input');
    const transcriptText = document.getElementById('voice-inline-transcript');

    // Type live text directly into search input so user sees it in real time!
    if (input) {
      input.value = transcript;
    }
    if (transcriptText) {
      transcriptText.textContent = `"${transcript}"`;
    }

    if (isFinal && transcript.trim()) {
      setTimeout(() => {
        this.stopAndSearch();
      }, 500);
    }
  },

  updateListeningUI(isListening) {
    const inlineBar = document.getElementById('voice-inline-bar');
    const micIcon = document.getElementById('voice-mic-icon');
    const voiceBtn = document.getElementById('voice-search-btn');
    const searchWrapper = document.querySelector('.ai-search-wrapper');

    if (isListening) {
      if (inlineBar) inlineBar.classList.remove('hidden');
      if (micIcon) {
        micIcon.className = 'fa-solid fa-microphone text-rose-500 text-lg animate-pulse';
      }
      if (voiceBtn) {
        voiceBtn.classList.add('bg-rose-50', 'dark:bg-rose-950/40');
      }
      if (searchWrapper) {
        searchWrapper.classList.add('ring-4', 'ring-rose-500/20', 'border-rose-400');
      }
      const statusText = document.getElementById('voice-inline-status');
      if (statusText) {
        const langObj = window.I18N?.languages?.find(l => l.code === window.I18N.currentLang);
        statusText.textContent = `🎙️ Listening in ${langObj ? langObj.name : 'Hindi/English'}... Speak your query`;
      }
    } else {
      if (inlineBar) inlineBar.classList.add('hidden');
      if (micIcon) {
        micIcon.className = 'fa-solid fa-microphone-lines text-lg text-blue-600 dark:text-blue-400';
      }
      if (voiceBtn) {
        voiceBtn.classList.remove('bg-rose-50', 'dark:bg-rose-950/40');
      }
      if (searchWrapper) {
        searchWrapper.classList.remove('ring-4', 'ring-rose-500/20', 'border-rose-400');
      }
    }
  },

  // -------------------------------------------------------------
  // Text to Speech for Scheme Details (Read Aloud)
  // -------------------------------------------------------------
  speakText(text, lang = null) {
    if (!this.synth) {
      if (window.showToast) window.showToast('Text-to-speech is not supported by your browser.', 'warning');
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || (window.I18N ? window.I18N.getVoiceLocale() : 'hi-IN');
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.updateTTSControlsUI('playing');
    };

    utterance.onpause = () => {
      this.isPaused = true;
      this.updateTTSControlsUI('paused');
    };

    utterance.onresume = () => {
      this.isPaused = false;
      this.updateTTSControlsUI('playing');
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.updateTTSControlsUI('stopped');
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.updateTTSControlsUI('stopped');
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  },

  pauseSpeaking() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
    }
  },

  resumeSpeaking() {
    if (this.synth && this.isSpeaking && this.isPaused) {
      this.synth.resume();
    }
  },

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.updateTTSControlsUI('stopped');
    }
  },

  updateTTSControlsUI(state) {
    const playBtn = document.getElementById('tts-play-btn');
    const pauseBtn = document.getElementById('tts-pause-btn');
    const stopBtn = document.getElementById('tts-stop-btn');

    if (!playBtn) return;

    if (state === 'playing') {
      playBtn.classList.add('hidden');
      if (pauseBtn) pauseBtn.classList.remove('hidden');
      if (stopBtn) stopBtn.classList.remove('hidden');
    } else if (state === 'paused') {
      playBtn.classList.remove('hidden');
      if (pauseBtn) pauseBtn.classList.add('hidden');
    } else {
      playBtn.classList.remove('hidden');
      if (pauseBtn) pauseBtn.classList.add('hidden');
      if (stopBtn) stopBtn.classList.add('hidden');
    }
  }
};

window.VoiceAssistant = VoiceAssistant;
