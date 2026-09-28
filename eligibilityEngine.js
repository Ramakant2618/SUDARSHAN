// server/services/eligibilityEngine.js
// Transparent, explainable rule-based eligibility evaluation engine.

function evaluateScheme(scheme, profile) {
  const rules = scheme.eligibilityRules || {};
  const breakdown = [];
  let definiteFails = 0;
  let unknownCount = 0;
  let matchesCount = 0;

  // 1. Scope / State Check
  if (scheme.scope === 'State') {
    if (!profile.state) {
      breakdown.push({
        criterion: 'State Domicile',
        status: 'unknown',
        detail: `Scheme is specific to ${scheme.state}. Add state to your profile to confirm.`
      });
      unknownCount++;
    } else if (profile.state.toLowerCase() === scheme.state.toLowerCase()) {
      breakdown.push({
        criterion: 'State Domicile',
        status: 'pass',
        detail: `State matched: Resident of ${scheme.state}`
      });
      matchesCount++;
    } else {
      breakdown.push({
        criterion: 'State Domicile',
        status: 'fail',
        detail: `Scheme is restricted to residents of ${scheme.state} (Profile state: ${profile.state})`
      });
      definiteFails++;
    }
  } else {
    breakdown.push({
      criterion: 'Scope',
      status: 'pass',
      detail: 'Central Government scheme applicable across all Indian States and UTs'
    });
    matchesCount++;
  }

  // 2. Gender Check
  if (rules.gender && Array.isArray(rules.gender) && rules.gender.length > 0) {
    if (!profile.gender) {
      breakdown.push({
        criterion: 'Gender',
        status: 'unknown',
        detail: `Restricted to: ${rules.gender.join(', ')}. Gender not specified in profile.`
      });
      unknownCount++;
    } else {
      const match = rules.gender.some(g => g.toLowerCase() === profile.gender.toLowerCase());
      if (match) {
        breakdown.push({
          criterion: 'Gender',
          status: 'pass',
          detail: `Gender requirement matched (${profile.gender})`
        });
        matchesCount++;
      } else {
        breakdown.push({
          criterion: 'Gender',
          status: 'fail',
          detail: `Scheme intended for: ${rules.gender.join(', ')} (Profile: ${profile.gender})`
        });
        definiteFails++;
      }
    }
  }

  // 3. Age Limit Check
  if (rules.minAge !== undefined || rules.maxAge !== undefined) {
    if (profile.age === undefined || profile.age === null || profile.age === '') {
      breakdown.push({
        criterion: 'Age Range',
        status: 'unknown',
        detail: `Applicable age: ${rules.minAge || 0} - ${rules.maxAge || 'Any'} years. Age not provided in profile.`
      });
      unknownCount++;
    } else {
      const age = parseInt(profile.age, 10);
      const minAge = rules.minAge !== undefined ? rules.minAge : 0;
      const maxAge = rules.maxAge !== undefined ? rules.maxAge : 150;

      if (age >= minAge && age <= maxAge) {
        breakdown.push({
          criterion: 'Age Range',
          status: 'pass',
          detail: `Age ${age} falls within eligible bracket (${minAge} - ${maxAge} years)`
        });
        matchesCount++;
      } else {
        breakdown.push({
          criterion: 'Age Range',
          status: 'fail',
          detail: `Age ${age} is outside eligible bracket (${minAge} - ${maxAge} years)`
        });
        definiteFails++;
      }
    }
  }

  // 4. Annual Income Limit Check
  if (rules.maxIncome !== undefined) {
    if (profile.income === undefined || profile.income === null || profile.income === '') {
      breakdown.push({
        criterion: 'Income Ceiling',
        status: 'unknown',
        detail: `Annual family income must be under ₹${rules.maxIncome.toLocaleString('en-IN')}. Income not provided.`
      });
      unknownCount++;
    } else {
      const income = parseInt(profile.income, 10);
      if (income <= rules.maxIncome) {
        breakdown.push({
          criterion: 'Income Ceiling',
          status: 'pass',
          detail: `Reported income (₹${income.toLocaleString('en-IN')}) is within ₹${rules.maxIncome.toLocaleString('en-IN')} ceiling`
        });
        matchesCount++;
      } else {
        breakdown.push({
          criterion: 'Income Ceiling',
          status: 'fail',
          detail: `Reported income (₹${income.toLocaleString('en-IN')}) exceeds ceiling of ₹${rules.maxIncome.toLocaleString('en-IN')}`
        });
        definiteFails++;
      }
    }
  }

  // 5. Social Category (SC/ST/OBC/General) Check
  if (rules.socialCategory && Array.isArray(rules.socialCategory) && rules.socialCategory.length > 0) {
    if (!profile.category) {
      breakdown.push({
        criterion: 'Social Category',
        status: 'unknown',
        detail: `Special focus on: ${rules.socialCategory.join(', ')}. Category not set in profile.`
      });
      unknownCount++;
    } else {
      const catMatch = rules.socialCategory.some(c => c.toLowerCase() === profile.category.toLowerCase());
      if (catMatch || rules.socialCategory.includes('All')) {
        breakdown.push({
          criterion: 'Social Category',
          status: 'pass',
          detail: `Category matched (${profile.category})`
        });
        matchesCount++;
      } else {
        breakdown.push({
          criterion: 'Social Category',
          status: 'fail',
          detail: `Scheme reserved for: ${rules.socialCategory.join(', ')} (Profile: ${profile.category})`
        });
        definiteFails++;
      }
    }
  }

  // Determine overall status
  let status = 'Potentially Eligible';
  let badgeColor = 'emerald';
  let score = 95;

  if (definiteFails > 0) {
    status = 'May Not Be Eligible';
    badgeColor = 'rose';
    score = Math.max(10, 40 - definiteFails * 15);
  } else if (unknownCount > 0) {
    status = 'More Information Required';
    badgeColor = 'amber';
    score = Math.max(50, 80 - unknownCount * 10);
  } else {
    score = 100;
  }

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    schemeNameEn: scheme.name_en,
    status,
    badgeColor,
    score,
    matchesCount,
    definiteFails,
    unknownCount,
    breakdown,
    disclaimer: 'Calculated using transparent indicative rules. Official authorities make final binding determinations.'
  };
}

function evaluateAllSchemes(schemes, profile) {
  return schemes.map(scheme => ({
    ...scheme,
    evaluation: evaluateScheme(scheme, profile)
  })).sort((a, b) => b.evaluation.score - a.evaluation.score);
}

module.exports = {
  evaluateScheme,
  evaluateAllSchemes
};
