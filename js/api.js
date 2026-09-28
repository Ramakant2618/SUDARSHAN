// public/js/api.js
// Client API Client for Sudarshan Platform

const API = {
  baseUrl: window.location.origin,

  async getSchemes(params = {}) {
    const query = new URLSearchParams();
    if (params.state && params.state !== 'All') query.append('state', params.state);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.gender && params.gender !== 'All') query.append('gender', params.gender);
    if (params.search) query.append('search', params.search);
    if (params.sort) query.append('sort', params.sort);
    if (params.scope && params.scope !== 'All') query.append('scope', params.scope);

    const url = `/api/schemes?${query.toString()}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error, falling back to static dataset:', err);
      return this.fallbackStaticSchemes(params);
    }
  },

  async getSchemeById(id) {
    try {
      const res = await fetch(`/api/schemes/${id}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error, falling back to static dataset:', err);
      const data = await this.fallbackStaticSchemes();
      const scheme = (data.data || []).find(s => s.id === id);
      return { success: !!scheme, data: scheme };
    }
  },

  async getStates() {
    try {
      const res = await fetch('/api/states');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      const res = await fetch('/data/states.json');
      const data = await res.json();
      return { success: true, count: data.length, data };
    }
  },

  async getCategories() {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      const res = await fetch('/data/categories.json');
      const data = await res.json();
      return { success: true, count: data.length, data };
    }
  },

  async aiSearch(query) {
    try {
      const res = await fetch('/api/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('AI API search error, using client fallback:', err);
      return this.fallbackAiSearch(query);
    }
  },

  async checkEligibility(profile, schemeId = null) {
    try {
      const res = await fetch('/api/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, schemeId })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API eligibility error, using client engine:', err);
      return { success: false, error: err.message };
    }
  },

  async sendOtp(identifier) {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      return await res.json();
    } catch (err) {
      return { success: true, isDemoMode: true, demoCode: '123456', message: 'Demo OTP: 123456' };
    }
  },

  async verifyOtp(identifier, otp, name) {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, name })
      });
      return await res.json();
    } catch (err) {
      if (otp === '123456') {
        return {
          success: true,
          user: {
            id: 'usr_' + Date.now().toString(36),
            name: name || identifier.split('@')[0],
            identifier,
            isDemoAccount: true
          }
        };
      }
      return { success: false, error: { message: 'Invalid demo code' } };
    }
  },

  // Fallbacks in case server static-only
  async fallbackStaticSchemes(params = {}) {
    const res = await fetch('/data/schemes.json');
    let list = await res.json();
    if (params.state && params.state !== 'All') {
      list = list.filter(s => s.scope === 'Central' || (s.state && s.state.toLowerCase() === params.state.toLowerCase()));
    }
    if (params.category && params.category !== 'All') {
      list = list.filter(s => s.category && s.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(s => `${s.name} ${s.name_en} ${s.description}`.toLowerCase().includes(q));
    }
    return { success: true, count: list.length, data: list };
  },

  async fallbackAiSearch(query) {
    const data = await this.fallbackStaticSchemes({ search: query });
    return {
      success: true,
      analysis: {
        provider: 'Local Smart NLP (Client Fallback)',
        isAiPowered: false,
        message: 'Query matched using client-side smart keywords.'
      },
      count: data.count,
      data: data.data
    };
  }
};

window.API = API;
