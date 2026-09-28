// public/js/app.js
// Main application controller for Sudarshan Platform

const App = {
  allSchemes: [],
  allStates: [],
  allCategories: [],
  activeFilters: {
    state: 'All',
    category: 'All',
    gender: 'All',
    search: '',
    sort: 'relevance',
    scope: 'All'
  },
  savedSchemeIds: new Set(),
  recentSchemeIds: [],
  currentModalScheme: null,

  async init() {
    this.loadLocalData();

    // Initialize systems
    await window.I18N.init();
    window.ThemeManager.init();
    window.VoiceAssistant.init();
    window.AuthManager.updateNavbarAuthUI();

    // Bind DOM events
    this.bindEvents();

    // Fetch primary data
    await this.fetchInitialData();

    // Handle URL query parameters
    this.parseUrlParams();

    // Initial render
    this.renderCategoriesChips();
    this.renderStateDirectory();
    this.applyFiltersAndRender();
    this.updateDashboardView();
  },

  loadLocalData() {
    try {
      const saved = JSON.parse(localStorage.getItem('sudarshan_saved_schemes') || '[]');
      this.savedSchemeIds = new Set(saved);
      this.recentSchemeIds = JSON.parse(localStorage.getItem('sudarshan_recent_schemes') || '[]');
    } catch (e) {
      this.savedSchemeIds = new Set();
      this.recentSchemeIds = [];
    }
  },

  async fetchInitialData() {
    try {
      const [schemesRes, statesRes, catsRes] = await Promise.all([
        window.API.getSchemes(),
        window.API.getStates(),
        window.API.getCategories()
      ]);

      this.allSchemes = schemesRes.data || [];
      this.allStates = statesRes.data || [];
      this.allCategories = catsRes.data || [];

      this.populateFilterDropdowns();
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  },

  populateFilterDropdowns() {
    const stateSelect = document.getElementById('filter-state');
    if (stateSelect) {
      stateSelect.innerHTML = `<option value="All">${window.I18N.t('search.allStates')}</option>`;
      this.allStates.forEach(s => {
        stateSelect.innerHTML += `<option value="${s.name}">${s.name} ${s.name_hi ? '(' + s.name_hi + ')' : ''}</option>`;
      });
    }

    const catSelect = document.getElementById('filter-category');
    if (catSelect) {
      catSelect.innerHTML = `<option value="All">${window.I18N.t('search.allCategories')}</option>`;
      this.allCategories.forEach(c => {
        catSelect.innerHTML += `<option value="${c.name}">${c.name} ${c.name_hi ? '(' + c.name_hi + ')' : ''}</option>`;
      });
    }
  },

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('state')) this.activeFilters.state = params.get('state');
    if (params.get('category')) this.activeFilters.category = params.get('category');
    if (params.get('gender')) this.activeFilters.gender = params.get('gender');
    if (params.get('search')) {
      this.activeFilters.search = params.get('search');
      const searchInput = document.getElementById('main-search-input');
      if (searchInput) searchInput.value = this.activeFilters.search;
    }
    if (params.get('sort')) this.activeFilters.sort = params.get('sort');

    // Check if direct scheme requested
    const schemeId = params.get('scheme');
    if (schemeId) {
      setTimeout(() => this.openSchemeModal(schemeId), 400);
    }

    this.syncFilterControls();
  },

  syncFilterControls() {
    const stateEl = document.getElementById('filter-state');
    const catEl = document.getElementById('filter-category');
    const genderEl = document.getElementById('filter-gender');
    const sortEl = document.getElementById('filter-sort');

    if (stateEl) stateEl.value = this.activeFilters.state;
    if (catEl) catEl.value = this.activeFilters.category;
    if (genderEl) genderEl.value = this.activeFilters.gender;
    if (sortEl) sortEl.value = this.activeFilters.sort;
  },

  updateUrlParams() {
    const url = new URL(window.location);
    if (this.activeFilters.state !== 'All') url.searchParams.set('state', this.activeFilters.state);
    else url.searchParams.delete('state');

    if (this.activeFilters.category !== 'All') url.searchParams.set('category', this.activeFilters.category);
    else url.searchParams.delete('category');

    if (this.activeFilters.gender !== 'All') url.searchParams.set('gender', this.activeFilters.gender);
    else url.searchParams.delete('gender');

    if (this.activeFilters.search) url.searchParams.set('search', this.activeFilters.search);
    else url.searchParams.delete('search');

    if (this.activeFilters.sort !== 'relevance') url.searchParams.set('sort', this.activeFilters.sort);
    else url.searchParams.delete('sort');

    window.history.replaceState({}, '', url);
  },

  bindEvents() {
    // Search form submission
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', e => {
        e.preventDefault();
        const input = document.getElementById('main-search-input');
        this.performNaturalSearch(input ? input.value : '');
      });
    }

    // Voice button trigger
    const voiceBtn = document.getElementById('voice-search-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        window.VoiceAssistant.openModal((spokenText) => {
          const input = document.getElementById('main-search-input');
          if (input) input.value = spokenText;
          this.performNaturalSearch(spokenText);
        });
      });
    }

    // Filter controls
    const stateEl = document.getElementById('filter-state');
    if (stateEl) {
      stateEl.addEventListener('change', e => {
        this.activeFilters.state = e.target.value;
        this.applyFiltersAndRender();
      });
    }

    const catEl = document.getElementById('filter-category');
    if (catEl) {
      catEl.addEventListener('change', e => {
        this.activeFilters.category = e.target.value;
        this.applyFiltersAndRender();
      });
    }

    const genderEl = document.getElementById('filter-gender');
    if (genderEl) {
      genderEl.addEventListener('change', e => {
        this.activeFilters.gender = e.target.value;
        this.applyFiltersAndRender();
      });
    }

    const sortEl = document.getElementById('filter-sort');
    if (sortEl) {
      sortEl.addEventListener('change', e => {
        this.activeFilters.sort = e.target.value;
        this.applyFiltersAndRender();
      });
    }

    // Clear filters button
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllFilters());
    }

    // Scope tab buttons (All, Central, State)
    document.querySelectorAll('[data-scope-tab]').forEach(tab => {
      tab.addEventListener('click', e => {
        document.querySelectorAll('[data-scope-tab]').forEach(t => t.classList.remove('active', 'border-primary', 'text-primary'));
        tab.classList.add('active', 'border-primary', 'text-primary');
        this.activeFilters.scope = tab.getAttribute('data-scope-tab');
        this.applyFiltersAndRender();
      });
    });

    // Theme selector buttons
    document.querySelectorAll('[data-theme-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme-choice');
        window.ThemeManager.setTheme(theme);
      });
    });

    // Language selector options
    document.querySelectorAll('[data-lang-code]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const code = item.getAttribute('data-lang-code');
        window.I18N.setLanguage(code);
      });
    });

    // Language changed event listener to re-render localized dynamic texts
    window.addEventListener('languageChanged', () => {
      this.populateFilterDropdowns();
      this.renderCategoriesChips();
      this.applyFiltersAndRender();
      this.updateDashboardView();
    });

    // Profile updated event
    window.addEventListener('profileUpdated', () => {
      this.updateDashboardView();
    });

    // Auth state changed event
    window.addEventListener('authStateChanged', () => {
      this.updateDashboardView();
    });

    // Mobile nav toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
        if (modalId === 'scheme-modal') {
          window.VoiceAssistant.stopSpeaking();
        }
      });
    });

    // Scheme Modal Read Aloud buttons
    const ttsPlayBtn = document.getElementById('tts-play-btn');
    if (ttsPlayBtn) {
      ttsPlayBtn.addEventListener('click', () => {
        if (this.currentModalScheme) {
          const text = `${this.currentModalScheme.name}. ${this.currentModalScheme.shortDescription}. ${this.currentModalScheme.eligibility}`;
          window.VoiceAssistant.speakText(text);
        }
      });
    }

    const ttsPauseBtn = document.getElementById('tts-pause-btn');
    if (ttsPauseBtn) {
      ttsPauseBtn.addEventListener('click', () => window.VoiceAssistant.pauseSpeaking());
    }

    const ttsStopBtn = document.getElementById('tts-stop-btn');
    if (ttsStopBtn) {
      ttsStopBtn.addEventListener('click', () => window.VoiceAssistant.stopSpeaking());
    }

    // Print button
    const printBtn = document.getElementById('modal-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    // Share button
    const shareBtn = document.getElementById('modal-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareCurrentScheme());
    }

    // Save toggle in modal
    const modalSaveBtn = document.getElementById('modal-save-btn');
    if (modalSaveBtn) {
      modalSaveBtn.addEventListener('click', () => {
        if (this.currentModalScheme) {
          this.toggleSaveScheme(this.currentModalScheme.id);
          this.updateModalSaveButtonState();
        }
      });
    }
  },

  async performNaturalSearch(query) {
    this.activeFilters.search = query.trim();
    this.updateUrlParams();

    // Show indicator
    const queryBadge = document.getElementById('active-query-badge');
    if (queryBadge) {
      if (this.activeFilters.search) {
        queryBadge.classList.remove('hidden');
        queryBadge.textContent = `Search: "${this.activeFilters.search}"`;
      } else {
        queryBadge.classList.add('hidden');
      }
    }

    if (query.trim().length > 3) {
      const res = await window.API.aiSearch(query);
      if (res.success && res.data) {
        this.renderSchemesList(res.data);
        const countEl = document.getElementById('schemes-count');
        if (countEl) countEl.textContent = window.I18N.t('search.resultsCount', { count: res.data.length });
        
        // Show AI insight banner if available
        const aiBanner = document.getElementById('ai-search-banner');
        if (aiBanner && res.analysis) {
          aiBanner.classList.remove('hidden');
          aiBanner.textContent = `⚡ ${res.analysis.provider}: ${res.analysis.message}`;
        }
        return;
      }
    }

    this.applyFiltersAndRender();
  },

  clearAllFilters() {
    this.activeFilters = {
      state: 'All',
      category: 'All',
      gender: 'All',
      search: '',
      sort: 'relevance',
      scope: 'All'
    };
    const searchInput = document.getElementById('main-search-input');
    if (searchInput) searchInput.value = '';
    const queryBadge = document.getElementById('active-query-badge');
    if (queryBadge) queryBadge.classList.add('hidden');
    const aiBanner = document.getElementById('ai-search-banner');
    if (aiBanner) aiBanner.classList.add('hidden');

    this.syncFilterControls();
    this.updateUrlParams();
    this.applyFiltersAndRender();
  },

  applyFiltersAndRender() {
    this.updateUrlParams();

    let filtered = [...this.allSchemes];

    // Scope filter
    if (this.activeFilters.scope && this.activeFilters.scope !== 'All') {
      filtered = filtered.filter(s => s.scope && s.scope.toLowerCase() === this.activeFilters.scope.toLowerCase());
    }

    // State filter
    if (this.activeFilters.state && this.activeFilters.state !== 'All') {
      filtered = filtered.filter(s => 
        s.scope === 'Central' || 
        (s.state && s.state.toLowerCase() === this.activeFilters.state.toLowerCase())
      );
    }

    // Category filter
    if (this.activeFilters.category && this.activeFilters.category !== 'All') {
      const catLower = this.activeFilters.category.toLowerCase();
      filtered = filtered.filter(s => 
        (s.category && s.category.toLowerCase() === catLower) ||
        (s.subcategory && s.subcategory.toLowerCase().includes(catLower))
      );
    }

    // Gender filter
    if (this.activeFilters.gender && this.activeFilters.gender !== 'All') {
      filtered = filtered.filter(s => !s.gender || s.gender === 'All' || s.gender.toLowerCase() === this.activeFilters.gender.toLowerCase());
    }

    // Text search
    if (this.activeFilters.search && this.activeFilters.search.trim()) {
      const q = this.activeFilters.search.toLowerCase().trim();
      filtered = filtered.filter(s => {
        const text = `${s.name} ${s.name_en} ${s.description} ${s.shortDescription} ${s.category} ${s.state}`.toLowerCase();
        return text.includes(q);
      });
    }

    // Sort
    if (this.activeFilters.sort === 'az') {
      filtered.sort((a, b) => (a.name_en || a.name).localeCompare(b.name_en || b.name));
    } else if (this.activeFilters.sort === 'recent') {
      filtered.sort((a, b) => new Date(b.lastVerified || '2024-01-01') - new Date(a.lastVerified || '2024-01-01'));
    }

    this.renderSchemesList(filtered);

    const countEl = document.getElementById('schemes-count');
    if (countEl) {
      countEl.textContent = window.I18N.t('search.resultsCount', { count: filtered.length });
    }
  },

  renderSchemesList(schemes) {
    const grid = document.getElementById('schemes-grid');
    const emptyState = document.getElementById('schemes-empty');

    if (!grid) return;

    if (schemes.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = schemes.map(s => {
      const isSaved = this.savedSchemeIds.has(s.id);
      const isCentral = s.scope === 'Central';
      const lang = window.I18N.currentLang;
      const title = (lang === 'hi' && s.name) ? s.name : (s.name_en || s.name);
      const subTitle = (lang === 'hi') ? s.name_en : s.name;
      const desc = (s.translations && s.translations[lang]?.shortDescription) || s.shortDescription;

      return `
        <div class="sudarshan-card flex flex-col justify-between p-5 relative overflow-hidden" data-scheme-card="${s.id}">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold ${isCentral ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}">
                  ${isCentral ? 'Central Scheme' : s.state}
                </span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
                  ${s.category}
                </span>
              </div>
              <button onclick="App.toggleSaveScheme('${s.id}')" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors" title="${isSaved ? window.I18N.t('scheme.saved') : window.I18N.t('scheme.save')}" aria-label="Bookmark">
                <i class="${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark text-base"></i>
              </button>
            </div>

            <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onclick="App.openSchemeModal('${s.id}')">
              ${title}
            </h3>
            ${subTitle && subTitle !== title ? `<p class="text-xs text-slate-500 dark:text-slate-400 mb-2.5 line-clamp-1">${subTitle}</p>` : ''}

            <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 leading-relaxed">
              ${desc}
            </p>

            <div class="space-y-1.5 mb-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-building text-slate-400"></i>
                <span class="truncate">${s.officialDepartment}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-regular fa-clock text-slate-400"></i>
                <span>${window.I18N.t('scheme.lastVerified')}: ${s.lastVerified}</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 mt-auto">
            <button onclick="App.openSchemeModal('${s.id}')" class="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors text-center">
              ${window.I18N.t('scheme.viewDetails')}
            </button>
            <a href="${s.officialApplicationUrl || s.officialWebsite}" target="_blank" rel="noopener noreferrer" class="py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5" title="${window.I18N.t('scheme.applyNow')}">
              <span>Apply</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');
  },

  renderCategoriesChips() {
    const container = document.getElementById('quick-categories-chips');
    if (!container) return;

    const quickList = ['Women', 'Students', 'Farmers', 'Youth', 'Health', 'Education', 'Employment', 'Housing', 'Entrepreneurship', 'Senior Citizens'];
    
    container.innerHTML = quickList.map(catName => {
      const match = this.allCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      const label = match ? (window.I18N.currentLang === 'hi' && match.name_hi ? match.name_hi : match.name) : catName;
      const icon = match ? match.icon : 'fa-tag';
      return `
        <button onclick="App.filterByCategory('${catName}')" class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 transition-all">
          <i class="fa-solid ${icon} text-blue-600 dark:text-blue-400 text-xs"></i>
          <span>${label}</span>
        </button>
      `;
    }).join('');
  },

  filterByCategory(catName) {
    this.activeFilters.category = catName;
    const catSelect = document.getElementById('filter-category');
    if (catSelect) catSelect.value = catName;
    this.applyFiltersAndRender();
    const schemesSection = document.getElementById('schemes-section');
    if (schemesSection) schemesSection.scrollIntoView({ behavior: 'smooth' });
  },

  renderStateDirectory() {
    const container = document.getElementById('state-directory-grid');
    if (!container) return;

    container.innerHTML = this.allStates.map(st => {
      const name = window.I18N.currentLang === 'hi' && st.name_hi ? st.name_hi : st.name;
      return `
        <div onclick="App.filterByState('${st.name}')" class="sudarshan-card p-3 cursor-pointer hover:border-blue-500 transition-all flex items-center justify-between">
          <div>
            <h4 class="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">${name}</h4>
            <span class="text-[11px] text-slate-400">${st.type}</span>
          </div>
          <span class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
            ${st.totalAvailableSchemeCount || 0}
          </span>
        </div>
      `;
    }).join('');
  },

  filterByState(stateName) {
    this.activeFilters.state = stateName;
    const stateSelect = document.getElementById('filter-state');
    if (stateSelect) stateSelect.value = stateName;
    this.applyFiltersAndRender();
    const schemesSection = document.getElementById('schemes-section');
    if (schemesSection) schemesSection.scrollIntoView({ behavior: 'smooth' });
  },

  // -----------------------------------------------------------------
  // Scheme Detail Modal
  // -----------------------------------------------------------------
  async openSchemeModal(schemeId) {
    let scheme = this.allSchemes.find(s => s.id === schemeId);
    if (!scheme) {
      const res = await window.API.getSchemeById(schemeId);
      scheme = res.data;
    }
    if (!scheme) return;

    this.currentModalScheme = scheme;
    this.recordRecentScheme(scheme.id);

    const modal = document.getElementById('scheme-modal');
    if (!modal) return;

    // Reset Voice Narrator
    window.VoiceAssistant.stopSpeaking();

    // Populate Modal Fields
    const titleEl = document.getElementById('modal-scheme-title');
    const subtitleEl = document.getElementById('modal-scheme-subtitle');
    const scopeBadge = document.getElementById('modal-scope-badge');
    const catBadge = document.getElementById('modal-category-badge');
    const descEl = document.getElementById('modal-scheme-desc');
    const benefitsList = document.getElementById('modal-benefits-list');
    const eligibilityEl = document.getElementById('modal-eligibility-text');
    const documentsList = document.getElementById('modal-documents-list');
    const stepsList = document.getElementById('modal-steps-list');
    const deptEl = document.getElementById('modal-dept-text');
    const verifiedEl = document.getElementById('modal-verified-text');
    const applyBtn = document.getElementById('modal-apply-btn');
    const helplineContainer = document.getElementById('modal-helpline-container');
    const whatsappBtn = document.getElementById('modal-whatsapp-btn');
    const eligibilityBreakdown = document.getElementById('modal-eligibility-breakdown');

    const lang = window.I18N.currentLang;
    const isHindi = lang === 'hi';
    const title = (isHindi && scheme.name) ? scheme.name : (scheme.name_en || scheme.name);
    const sub = isHindi ? scheme.name_en : scheme.name;

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = (sub && sub !== title) ? sub : '';
    if (scopeBadge) scopeBadge.textContent = scheme.scope === 'Central' ? 'Central Government Scheme' : `${scheme.state} State Scheme`;
    if (catBadge) catBadge.textContent = scheme.category;
    if (descEl) descEl.textContent = scheme.description;

    // Benefits
    if (benefitsList) {
      benefitsList.innerHTML = (scheme.benefits || []).map(b => `
        <li class="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
          <i class="fa-solid fa-circle-check text-emerald-500 mt-1 flex-shrink-0"></i>
          <span>${b}</span>
        </li>
      `).join('');
    }

    // Eligibility
    if (eligibilityEl) eligibilityEl.textContent = scheme.eligibility;

    // Real-time Eligibility Rule Breakdown with User Profile
    if (eligibilityBreakdown) {
      const evalRes = window.EligibilityManager.evaluateSchemeLocally(scheme);
      eligibilityBreakdown.innerHTML = `
        <div class="p-3.5 rounded-lg border ${evalRes.colorClass} mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-xs uppercase tracking-wide">Citizen Status:</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full border">${evalRes.badgeText}</span>
          </div>
          <ul class="space-y-1.5 text-xs">
            ${evalRes.checks.map(c => `
              <li class="flex items-start gap-2">
                <span class="font-bold">${c.icon}</span>
                <span>${c.text}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Documents Checklist
    if (documentsList) {
      documentsList.innerHTML = (scheme.documents || []).map(d => `
        <li class="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
          <i class="fa-solid fa-id-card text-blue-500 mt-1 flex-shrink-0"></i>
          <span>${d}</span>
        </li>
      `).join('');
    }

    // Application Steps
    if (stepsList) {
      stepsList.innerHTML = (scheme.applicationSteps || []).map((step, idx) => `
        <li class="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
          <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            ${idx + 1}
          </span>
          <span>${step}</span>
        </li>
      `).join('');
    }

    if (deptEl) deptEl.textContent = scheme.officialDepartment;
    if (verifiedEl) verifiedEl.textContent = scheme.lastVerified;

    // Apply Button
    if (applyBtn) {
      applyBtn.href = scheme.officialApplicationUrl || scheme.officialWebsite;
      applyBtn.target = '_blank';
      applyBtn.rel = 'noopener noreferrer';
    }

    // Helpline
    if (helplineContainer) {
      if (scheme.helpline) {
        helplineContainer.classList.remove('hidden');
        const helplineText = document.getElementById('modal-helpline-text');
        if (helplineText) helplineText.textContent = scheme.helpline;
      } else {
        helplineContainer.classList.add('hidden');
      }
    }

    // WhatsApp
    if (whatsappBtn) {
      if (scheme.officialWhatsapp) {
        whatsappBtn.classList.remove('hidden');
        whatsappBtn.href = `https://wa.me/${scheme.officialWhatsapp.replace(/[^0-9]/g, '')}`;
        whatsappBtn.target = '_blank';
      } else {
        whatsappBtn.classList.add('hidden');
      }
    }

    this.updateModalSaveButtonState();

    // Show Modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  updateModalSaveButtonState() {
    const saveBtn = document.getElementById('modal-save-btn');
    if (!saveBtn || !this.currentModalScheme) return;
    const isSaved = this.savedSchemeIds.has(this.currentModalScheme.id);
    saveBtn.innerHTML = `
      <i class="${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark"></i>
      <span>${isSaved ? window.I18N.t('scheme.saved') : window.I18N.t('scheme.save')}</span>
    `;
  },

  toggleSaveScheme(schemeId) {
    if (this.savedSchemeIds.has(schemeId)) {
      this.savedSchemeIds.delete(schemeId);
      if (window.showToast) window.showToast(window.I18N.t('toast.unsaved'), 'info');
    } else {
      this.savedSchemeIds.add(schemeId);
      if (window.showToast) window.showToast(window.I18N.t('toast.saved'), 'success');
    }
    localStorage.setItem('sudarshan_saved_schemes', JSON.stringify([...this.savedSchemeIds]));

    // Refresh cards bookmark icons
    document.querySelectorAll(`[data-scheme-card="${schemeId}"] i.fa-bookmark`).forEach(icon => {
      const isSaved = this.savedSchemeIds.has(schemeId);
      icon.className = `${isSaved ? 'fa-solid text-amber-500' : 'fa-regular'} fa-bookmark text-base`;
    });

    this.updateDashboardView();
  },

  recordRecentScheme(schemeId) {
    this.recentSchemeIds = this.recentSchemeIds.filter(id => id !== schemeId);
    this.recentSchemeIds.unshift(schemeId);
    if (this.recentSchemeIds.length > 12) this.recentSchemeIds.pop();
    localStorage.setItem('sudarshan_recent_schemes', JSON.stringify(this.recentSchemeIds));
    this.updateDashboardView();
  },

  shareCurrentScheme() {
    if (!this.currentModalScheme) return;
    const url = `${window.location.origin}/?scheme=${this.currentModalScheme.id}`;
    const shareData = {
      title: this.currentModalScheme.name_en || this.currentModalScheme.name,
      text: `Check out ${this.currentModalScheme.name} on Sudarshan Scheme Discovery platform:`,
      url: url
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        if (window.showToast) window.showToast(window.I18N.t('toast.copied'), 'success');
      });
    }
  },

  // -----------------------------------------------------------------
  // Citizen Dashboard Updates
  // -----------------------------------------------------------------
  updateDashboardView() {
    const profile = window.EligibilityManager.getProfile();
    const completion = window.EligibilityManager.calculateCompletion(profile);

    const completionMeter = document.getElementById('profile-completion-meter');
    const completionText = document.getElementById('profile-completion-text');
    if (completionMeter) completionMeter.style.width = `${completion}%`;
    if (completionText) completionText.textContent = `${completion}%`;

    // Render Saved Schemes
    const savedContainer = document.getElementById('dashboard-saved-schemes');
    if (savedContainer) {
      const savedList = this.allSchemes.filter(s => this.savedSchemeIds.has(s.id));
      if (savedList.length === 0) {
        savedContainer.innerHTML = `<p class="text-sm text-slate-400 py-4 italic">${window.I18N.t('dashboard.emptySaved')}</p>`;
      } else {
        savedContainer.innerHTML = savedList.map(s => `
          <div class="sudarshan-card p-3 flex items-center justify-between gap-3">
            <div class="truncate cursor-pointer" onclick="App.openSchemeModal('${s.id}')">
              <h5 class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${s.name}</h5>
              <span class="text-xs text-slate-400">${s.state} · ${s.category}</span>
            </div>
            <button onclick="App.toggleSaveScheme('${s.id}')" class="text-xs text-rose-500 hover:text-rose-700 p-1">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `).join('');
      }
    }

    // Render Recently Viewed Schemes
    const recentContainer = document.getElementById('dashboard-recent-schemes');
    if (recentContainer) {
      const recentList = this.recentSchemeIds.map(id => this.allSchemes.find(s => s.id === id)).filter(Boolean);
      if (recentList.length === 0) {
        recentContainer.innerHTML = `<p class="text-sm text-slate-400 py-4 italic">${window.I18N.t('dashboard.emptyRecent')}</p>`;
      } else {
        recentContainer.innerHTML = recentList.map(s => `
          <div onclick="App.openSchemeModal('${s.id}')" class="sudarshan-card p-3 cursor-pointer hover:border-blue-400 transition-colors">
            <h5 class="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">${s.name}</h5>
            <span class="text-xs text-slate-400">${s.state} · ${s.category}</span>
          </div>
        `).join('');
      }
    }

    // Render Recommended Schemes based on Profile
    const recContainer = document.getElementById('dashboard-recommended-schemes');
    if (recContainer) {
      const ranked = window.EligibilityManager.evaluateSchemeLocally ? 
        this.allSchemes.filter(s => {
          const res = window.EligibilityManager.evaluateSchemeLocally(s, profile);
          return res.status === 'Potentially Eligible';
        }).slice(0, 6) : this.allSchemes.slice(0, 6);

      recContainer.innerHTML = ranked.map(s => `
        <div onclick="App.openSchemeModal('${s.id}')" class="sudarshan-card p-4 cursor-pointer hover:border-emerald-500 transition-all border-l-4 border-l-emerald-500">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Match Found</span>
            <span class="text-xs text-slate-400">${s.state}</span>
          </div>
          <h5 class="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">${s.name}</h5>
          <p class="text-xs text-slate-500 line-clamp-1 mt-1">${s.shortDescription}</p>
        </div>
      `).join('');
    }
  }
};

// Global Toast System
window.showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = 'fa-info-circle text-blue-500';
  if (type === 'success') icon = 'fa-check-circle text-emerald-500';
  if (type === 'warning') icon = 'fa-triangle-exclamation text-amber-500';
  if (type === 'error') icon = 'fa-circle-xmark text-rose-500';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

window.App = App;

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
