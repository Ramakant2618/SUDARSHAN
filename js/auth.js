// public/js/auth.js
// Authentication management supporting demo OTP flow and user session

const AuthManager = {
  sessionKey: 'sudarshan_user_session',

  getCurrentUser() {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  async sendDemoOtp(identifier) {
    const res = await window.API.sendOtp(identifier);
    if (res.success) {
      if (window.showToast) {
        window.showToast(window.I18N ? window.I18N.t('toast.otpSent') : 'Demo OTP sent! Code: 123456', 'info');
      }
      return true;
    }
    if (window.showToast) {
      window.showToast(res.error?.message || 'Failed to send OTP', 'error');
    }
    return false;
  },

  async verifyDemoOtp(identifier, otp, name) {
    const res = await window.API.verifyOtp(identifier, otp, name);
    if (res.success && res.user) {
      localStorage.setItem(this.sessionKey, JSON.stringify(res.user));
      this.updateNavbarAuthUI();
      if (window.showToast) {
        window.showToast(window.I18N ? window.I18N.t('toast.loginSuccess') : 'Successfully logged in!', 'success');
      }
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: res.user } }));
      return true;
    }
    if (window.showToast) {
      window.showToast(res.error?.message || 'Invalid OTP code. Please use demo OTP: 123456', 'error');
    }
    return false;
  },

  logout() {
    localStorage.removeItem(this.sessionKey);
    this.updateNavbarAuthUI();
    if (window.showToast) {
      window.showToast(window.I18N ? window.I18N.t('toast.logout') : 'Logged out successfully', 'info');
    }
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
  },

  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  updateNavbarAuthUI() {
    const user = this.getCurrentUser();
    const loginBtn = document.getElementById('nav-login-btn');
    const userDropdown = document.getElementById('nav-user-dropdown');
    const userNameEl = document.getElementById('nav-user-name');

    if (user) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (userDropdown) userDropdown.classList.remove('hidden');
      if (userNameEl) userNameEl.textContent = user.name || 'Citizen';
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (userDropdown) userDropdown.classList.add('hidden');
    }
  }
};

window.AuthManager = AuthManager;
