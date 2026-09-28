// public/js/eligibility.js
// Citizen Profile Manager and Transparent Eligibility Engine

const EligibilityManager = {
  profileKey: 'sudarshan_citizen_profile',

  getProfile() {
    try {
      const stored = localStorage.getItem(this.profileKey);
      return stored ? JSON.parse(stored) : this.getDefaultProfile();
    } catch (e) {
      return this.getDefaultProfile();
    }
  },

  getDefaultProfile() {
    return {
      name: '',
      age: '',
      gender: '',
      state: '',
      district: '',
      occupation: '',
      education: '',
      income: '',
      category: '',
      maritalStatus: '',
      disability: 'No'
    };
  },

  saveProfile(profile) {
    localStorage.setItem(this.profileKey, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profile }));
    if (window.showToast) {
      window.showToast(window.I18N ? window.I18N.t('toast.profileSaved') : 'Profile updated successfully!', 'success');
    }
  },

  clearProfile() {
    localStorage.removeItem(this.profileKey);
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: this.getDefaultProfile() }));
    if (window.showToast) {
      window.showToast('Profile cleared successfully.', 'info');
    }
  },

  calculateCompletion(profile = null) {
    const p = profile || this.getProfile();
    const fields = ['name', 'age', 'gender', 'state', 'district', 'occupation', 'education', 'income', 'category', 'maritalStatus'];
    let filled = 0;
    fields.forEach(f => {
      if (p[f] !== undefined && p[f] !== null && String(p[f]).trim() !== '') {
        filled++;
      }
    });
    return Math.round((filled / fields.length) * 100);
  },

  evaluateSchemeLocally(scheme, profile = null) {
    const p = profile || this.getProfile();
    const rules = scheme.eligibilityRules || {};
    const checks = [];

    // State check
    if (scheme.scope === 'State') {
      if (!p.state) {
        checks.push({ label: 'State Domicile', status: 'unknown', icon: '⚠', text: `Requires residency in ${scheme.state}. Add state to your profile.` });
      } else if (p.state.toLowerCase() === scheme.state.toLowerCase()) {
        checks.push({ label: 'State Domicile', status: 'pass', icon: '✓', text: `Resident of ${scheme.state}` });
      } else {
        checks.push({ label: 'State Domicile', status: 'fail', icon: '✗', text: `Restricted to residents of ${scheme.state} (Profile: ${p.state})` });
      }
    } else {
      checks.push({ label: 'Scope', status: 'pass', icon: '✓', text: 'Central Government scheme applicable nationwide' });
    }

    // Gender check
    if (rules.gender && Array.isArray(rules.gender) && rules.gender.length > 0) {
      if (!p.gender) {
        checks.push({ label: 'Gender', status: 'unknown', icon: '⚠', text: `For: ${rules.gender.join(', ')}. Gender missing in profile.` });
      } else if (rules.gender.some(g => g.toLowerCase() === p.gender.toLowerCase())) {
        checks.push({ label: 'Gender', status: 'pass', icon: '✓', text: `Gender matches (${p.gender})` });
      } else {
        checks.push({ label: 'Gender', status: 'fail', icon: '✗', text: `Restricted to: ${rules.gender.join(', ')}` });
      }
    }

    // Age check
    if (rules.minAge !== undefined || rules.maxAge !== undefined) {
      const min = rules.minAge !== undefined ? rules.minAge : 0;
      const max = rules.maxAge !== undefined ? rules.maxAge : 120;
      if (!p.age) {
        checks.push({ label: 'Age Criteria', status: 'unknown', icon: '⚠', text: `Age range: ${min} - ${max} years. Age missing in profile.` });
      } else {
        const ageNum = parseInt(p.age, 10);
        if (ageNum >= min && ageNum <= max) {
          checks.push({ label: 'Age Criteria', status: 'pass', icon: '✓', text: `Age ${ageNum} is within ${min} - ${max} years range` });
        } else {
          checks.push({ label: 'Age Criteria', status: 'fail', icon: '✗', text: `Age ${ageNum} is outside ${min} - ${max} years range` });
        }
      }
    }

    // Income check
    if (rules.maxIncome !== undefined) {
      if (!p.income) {
        checks.push({ label: 'Income Limit', status: 'unknown', icon: '⚠', text: `Income must be under ₹${rules.maxIncome.toLocaleString('en-IN')}. Income missing.` });
      } else {
        const incNum = parseInt(p.income, 10);
        if (incNum <= rules.maxIncome) {
          checks.push({ label: 'Income Limit', status: 'pass', icon: '✓', text: `Income ₹${incNum.toLocaleString('en-IN')} is within ceiling` });
        } else {
          checks.push({ label: 'Income Limit', status: 'fail', icon: '✗', text: `Income ₹${incNum.toLocaleString('en-IN')} exceeds limit of ₹${rules.maxIncome.toLocaleString('en-IN')}` });
        }
      }
    }

    // Overall Status
    const hasFail = checks.some(c => c.status === 'fail');
    const hasUnknown = checks.some(c => c.status === 'unknown');

    let overall = 'Potentially Eligible';
    let colorClass = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
    let badgeText = window.I18N ? window.I18N.t('eligibility.badgeEligible') : 'Potentially Eligible';

    if (hasFail) {
      overall = 'May Not Be Eligible';
      colorClass = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      badgeText = window.I18N ? window.I18N.t('eligibility.badgeNotEligible') : 'May Not Be Eligible';
    } else if (hasUnknown) {
      overall = 'More Information Required';
      colorClass = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      badgeText = window.I18N ? window.I18N.t('eligibility.badgeMoreInfo') : 'More Information Required';
    }

    return {
      status: overall,
      badgeText,
      colorClass,
      checks
    };
  }
};

window.EligibilityManager = EligibilityManager;
