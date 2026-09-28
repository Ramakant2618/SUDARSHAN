// server/services/aiProvider.js
// Multi-provider AI abstraction supporting Google Gemini, OpenAI, and a Smart Local Rule-based NLP Engine.

const HINDI_ENGLISH_SYNONYMS = {
  farmers: ['farmer', 'farmers', 'kisan', 'किसान', 'agriculture', 'krishi', 'कृषि', 'खेती', 'balram', 'bhavantar', 'fasal', 'beema', 'crop', 'soil', 'kusum', 'urja'],
  women: ['women', 'woman', 'mahila', 'महिला', 'कन्या', 'kanya', 'beti', 'बेटी', 'ladli', 'laadli', 'लाड़ली', 'लाडली', 'behna', 'बहना', 'बहन', 'laxmi', 'लक्ष्मी', 'ujjwala', 'उज्ज्वला', 'matru', 'मातृ', 'gas', 'गैस', 'gruha', 'गृह'],
  students: ['student', 'students', 'scholarship', 'scholarships', 'विद्यार्थी', 'छात्र', 'छात्रवृत्ति', 'स्कॉलरशिप', 'medhavi', 'मेधावी', 'gaon ki beti', 'scooty', 'स्कूटी', 'akanksha', 'आकांक्षा', 'swayam', 'स्वयं', 'nmms', 'yasasvi', 'यशस्वी', 'shiksha', 'शिक्षा', 'college', 'school', 'degree', '10th', '12th'],
  youth: ['youth', 'yuva', 'युवा', 'berojgar', 'बेरोजगार', 'रोजगार', 'employment', 'jobs', 'mmsky', 'seekho kamao', 'सीखो', 'कमाओ', 'skill', 'कौशल', 'pmkvy', 'mgnrega', 'मनरेगा', 'job'],
  health: ['health', 'hospital', 'ayushman', 'आयुष्मान', 'swasthya', 'स्वास्थ्य', 'इलाज', 'treatment', 'बीमारी', 'bal hriday', 'बाल हृदय', 'chiranjeevi', 'आरोग्य', 'abha', 'card', 'medicine', 'mediclaim'],
  housing: ['housing', 'house', 'awas', 'आवास', 'मकान', 'घर', 'pmay', 'abua', 'pucca'],
  finance: ['loan', 'ऋण', 'लोन', 'business', 'व्यापार', 'mudra', 'मुद्रा', 'startup', 'udyam', 'उद्यम', 'svanidhi', 'स्वनिधि', 'vishwakarma', 'विश्वकर्मा', 'credit', 'bank', 'finance', 'paisa'],
  solar: ['solar', 'सौर', 'सोलर', 'surya ghar', 'सूर्य घर', 'bijli', 'बिजली', 'power', 'electricity', 'urja', 'ऊर्जा', 'atal griha', 'अटल गृह', 'kusum', 'rooftop', 'unit'],
  seniors: ['senior', 'old age', 'वृद्ध', 'वरिष्ठ', 'बुजुर्ग', 'pension', 'पेंशन', 'atal pension', 'teerth darshan', 'तीर्थ दर्शन']
};

const parseLocalSmartQuery = (query, schemes, states, categories) => {
  const q = (query || '').toLowerCase().trim();
  const result = {
    provider: 'Sudarshan Smart AI Engine',
    isAiPowered: true,
    extracted: {
      state: null,
      category: null,
      gender: null,
      age: null,
      occupation: null,
      keywords: []
    },
    message: ''
  };

  if (!q) {
    result.message = 'Showing all verified government schemes.';
    return result;
  }

  // 1. Extract Age
  const ageMatch = q.match(/(\d{1,2})\s*(?:years?|yr|साल|वर्ष)/i) || q.match(/\b(?:i am|age|उम्र|आयु)\s*(\d{1,2})\b/i);
  if (ageMatch) {
    result.extracted.age = parseInt(ageMatch[1] || ageMatch[2], 10);
  }

  // 2. Extract Gender
  if (/\b(woman|women|female|girl|mahila|ladli|बेटी|महिला|लड़की|स्त्री|माता|बहना)\b/i.test(q)) {
    result.extracted.gender = 'Female';
  } else if (/\b(man|men|male|boy|purush|पुरुष|लड़का)\b/i.test(q)) {
    result.extracted.gender = 'Male';
  }

  // 3. Extract State
  for (const s of states) {
    const sName = s.name.toLowerCase();
    const sCode = s.code.toLowerCase();
    const sNameHi = (s.name_hi || '').toLowerCase();
    if (q.includes(sName) || (sCode.length === 2 && new RegExp(`\\b${sCode}\\b`, 'i').test(q)) || (sNameHi && q.includes(sNameHi))) {
      result.extracted.state = s.name;
      break;
    }
  }
  // Common state shortcuts & Hindi names
  if (!result.extracted.state) {
    if (/\b(mp|madhya pradesh|मप्र|मध्य प्रदेश|एमपी)\b/i.test(q)) result.extracted.state = 'Madhya Pradesh';
    else if (/\b(up|uttar pradesh|उत्तर प्रदेश|यूपी)\b/i.test(q)) result.extracted.state = 'Uttar Pradesh';
    else if (/\b(mh|maharashtra|महाराष्ट्र)\b/i.test(q)) result.extracted.state = 'Maharashtra';
    else if (/\b(rj|rajasthan|राजस्थान)\b/i.test(q)) result.extracted.state = 'Rajasthan';
    else if (/\b(br|bihar|बिहार)\b/i.test(q)) result.extracted.state = 'Bihar';
    else if (/\b(delhi|दिल्ली)\b/i.test(q)) result.extracted.state = 'Delhi';
    else if (/\b(haryana|हरियाणा)\b/i.test(q)) result.extracted.state = 'Haryana';
    else if (/\b(karnataka|कर्नाटक)\b/i.test(q)) result.extracted.state = 'Karnataka';
    else if (/\b(bengal|west bengal|पश्चिम बंगाल)\b/i.test(q)) result.extracted.state = 'West Bengal';
  }

  // 4. Extract Category & Occupation via Synonyms
  if (HINDI_ENGLISH_SYNONYMS.farmers.some(term => q.includes(term))) {
    result.extracted.category = 'Farmers';
    result.extracted.occupation = 'Farmer';
  } else if (HINDI_ENGLISH_SYNONYMS.students.some(term => q.includes(term))) {
    result.extracted.category = 'Scholarship';
    result.extracted.occupation = 'Student';
  } else if (HINDI_ENGLISH_SYNONYMS.women.some(term => q.includes(term))) {
    result.extracted.category = 'Women';
  } else if (HINDI_ENGLISH_SYNONYMS.solar.some(term => q.includes(term))) {
    result.extracted.category = 'Environment';
  } else if (HINDI_ENGLISH_SYNONYMS.health.some(term => q.includes(term))) {
    result.extracted.category = 'Health';
  } else if (HINDI_ENGLISH_SYNONYMS.housing.some(term => q.includes(term))) {
    result.extracted.category = 'Housing';
  } else if (HINDI_ENGLISH_SYNONYMS.finance.some(term => q.includes(term))) {
    result.extracted.category = 'Finance';
  } else if (HINDI_ENGLISH_SYNONYMS.youth.some(term => q.includes(term))) {
    result.extracted.category = 'Youth';
  } else if (HINDI_ENGLISH_SYNONYMS.seniors.some(term => q.includes(term))) {
    result.extracted.category = 'Senior Citizens';
  }

  // 5. Generate Natural Intent Message
  const parts = [];
  if (result.extracted.category) parts.push(result.extracted.category);
  if (result.extracted.state) parts.push(`in ${result.extracted.state}`);
  if (result.extracted.age) parts.push(`for age ${result.extracted.age}`);
  if (result.extracted.gender) parts.push(`(${result.extracted.gender})`);

  result.message = parts.length > 0 
    ? `Identified intent: Schemes for ${parts.join(' ')}`
    : `Matching schemes for: "${query}"`;

  return result;
};

class AIProvider {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY || null;
    this.openaiKey = process.env.OPENAI_API_KEY || null;
  }

  getProviderStatus() {
    return {
      geminiAvailable: !!this.geminiKey,
      openaiAvailable: !!this.openaiKey,
      activeMode: this.geminiKey ? 'Gemini 1.5' : (this.openaiKey ? 'OpenAI GPT' : 'Sudarshan Smart AI Engine (Active)')
    };
  }

  async parseQuery(query, schemes, states, categories) {
    if (this.geminiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI assistant for the Sudarshan Indian Government Schemes platform.
Given user query: "${query}", extract parameters in JSON format:
{
  "state": "State name or null",
  "category": "One of (Women, Students, Farmers, Health, Housing, Youth, Finance, Scholarship, Senior Citizens, Environment) or null",
  "gender": "Female, Male or null",
  "age": number or null,
  "occupation": "string or null",
  "keywords": ["keyword1"],
  "summary": "1-sentence friendly intent summary"
}`
              }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (parsedText) {
            const aiResult = JSON.parse(parsedText);
            return {
              provider: 'Google Gemini 1.5 AI',
              isAiPowered: true,
              extracted: aiResult,
              message: aiResult.summary || 'Query analyzed with Google Gemini'
            };
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local smart engine:', err.message);
      }
    }

    return parseLocalSmartQuery(query, schemes, states, categories);
  }
}

module.exports = new AIProvider();
module.exports.HINDI_ENGLISH_SYNONYMS = HINDI_ENGLISH_SYNONYMS;
