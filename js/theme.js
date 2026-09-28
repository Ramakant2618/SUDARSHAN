// public/js/theme.js
// Theme Manager supporting Light, Dark, and System modes with prefers-color-scheme listener

const ThemeManager = {
  currentTheme: localStorage.getItem('sudarshan_theme') || 'system',

  init() {
    this.applyTheme(this.currentTheme);

    // Watch for OS system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (this.currentTheme === 'system') {
          this.applyTheme('system');
        }
      });
    }

    this.updateControls();
  },

  setTheme(theme) {
    if (!['light', 'dark', 'system'].includes(theme)) theme = 'system';
    this.currentTheme = theme;
    localStorage.setItem('sudarshan_theme', theme);
    this.applyTheme(theme);
    this.updateControls();
  },

  applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      html.setAttribute('data-theme', theme);
    }
  },

  updateControls() {
    document.querySelectorAll('[data-theme-choice]').forEach(btn => {
      const choice = btn.getAttribute('data-theme-choice');
      if (choice === this.currentTheme) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }
};

window.ThemeManager = ThemeManager;
