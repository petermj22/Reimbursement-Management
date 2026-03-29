// =============================================================
// AI ENGINE - In-browser ML for expense intelligence
// Category classification, duplicate detection, anomaly scoring
// =============================================================

export interface CategorySuggestion {
  categoryName: string;
  categoryId: string;
  confidence: number; // 0-1
  reason: string;
}

export interface DuplicateAlert {
  expense: {
    id: string;
    description: string;
    amount: number;
    expenseDate: string;
    merchantName?: string;
  };
  similarity: number; // 0-1
  reasons: string[];
}

export interface AnomalyAlert {
  type: 'amount' | 'frequency' | 'category' | 'time';
  severity: 'low' | 'medium' | 'high';
  message: string;
  context: string;
  zScore?: number;
}

// ---- Category Classification Patterns ----
const CATEGORY_PATTERNS: Record<string, { keywords: string[]; patterns: RegExp[] }> = {
  'Travel': {
    keywords: ['hotel', 'flight', 'uber', 'lyft', 'taxi', 'airbnb', 'motel', 'airline', 'airport', 'train', 'amtrak', 'atd', 'transit', 'travel', 'rentacar', 'car rental', 'gas', 'fuel', 'parking'],
    patterns: [/\b(flight|hotel|hostel|motel|airb&b|airways|airlines|uber|lyft|taxi|cab|train|bus|rental)\b/i]
  },
  'Meals & Entertainment': {
    keywords: ['restaurant', 'cafe', 'starbucks', 'mcdonalds', 'lunch', 'dinner', 'breakfast', 'food', 'coffee', 'bar', 'pub', 'sushi', 'pizza', 'burger', 'grill', 'bistro', 'catering', 'grubhub', 'doordash', 'ubereats'],
    patterns: [/\b(restaurant|cafe|diner|bistro|grill|eatery|food|meal|lunch|dinner|breakfast|coffee)\b/i]
  },
  'Office Supplies': {
    keywords: ['staples', 'office depot', 'amazon', 'paper', 'pen', 'printer', 'ink', 'toner', 'notebook', 'binder', 'supplies', 'stationery', 'keyboard', 'mouse', 'monitor', 'desk'],
    patterns: [/\b(office|supply|supplies|stationery|paper|printer|toner|staples)\b/i]
  },
  'Software & Subscriptions': {
    keywords: ['software', 'subscription', 'saas', 'aws', 'azure', 'github', 'jira', 'slack', 'zoom', 'adobe', 'microsoft', 'google workspace', 'notion', 'figma', 'canva', 'license', 'api', 'hosting', 'domain'],
    patterns: [/\b(software|subscription|license|saas|cloud|hosting|api|digital)\b/i]
  },
  'Marketing': {
    keywords: ['ads', 'advertising', 'facebook ads', 'google ads', 'linkedin', 'promotion', 'marketing', 'event', 'conference', 'sponsorship', 'billboard', 'print', 'design'],
    patterns: [/\b(ad|ads|advertising|marketing|promotion|campaign|event|conference)\b/i]
  },
  'Professional Services': {
    keywords: ['consulting', 'legal', 'accounting', 'attorney', 'lawyer', 'cpa', 'audit', 'freelance', 'contractor', 'consultant', 'advisor', 'professional'],
    patterns: [/\b(consulting|legal|audit|attorney|lawyer|accountant|advisor|consultant)\b/i]
  },
  'Training & Education': {
    keywords: ['training', 'course', 'certification', 'udemy', 'coursera', 'seminar', 'workshop', 'conference', 'education', 'book', 'textbook', 'learning'],
    patterns: [/\b(training|course|certification|seminar|workshop|education|learning|book)\b/i]
  },
};

// ---- Levenshtein Distance (Fuzzy Matching) ----
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  return 1 - dist / maxLen;
}

// ---- Main: Suggest Category ----
export function suggestCategory(
  description: string,
  merchantName: string = '',
  categories: Array<{ id: string; name: string }>
): CategorySuggestion | null {
  if (!description && !merchantName) return null;

  const text = `${description} ${merchantName}`.toLowerCase().trim();
  const scores: Map<string, { score: number; matchedKeywords: string[] }> = new Map();

  for (const [catName, data] of Object.entries(CATEGORY_PATTERNS)) {
    let score = 0;
    const matched: string[] = [];

    for (const keyword of data.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        // Longer keywords weigh more (more specific match)
        score += 1 + keyword.length / 20;
        matched.push(keyword);
      }
    }
    for (const pattern of data.patterns) {
      if (pattern.test(text)) {
        score += 0.5;
      }
    }

    if (score > 0) scores.set(catName, { score, matchedKeywords: matched });
  }

  if (scores.size === 0) return null;

  // Pick highest scoring category
  const [bestName, bestData] = [...scores.entries()].sort((a, b) => b[1].score - a[1].score)[0];

  // Find the matching real category from DB
  const match = categories.find(c =>
    c.name.toLowerCase().includes(bestName.toLowerCase()) ||
    bestName.toLowerCase().includes(c.name.toLowerCase())
  );

  if (!match) return null;

  const maxScore = 5;
  const confidence = Math.min(0.99, bestData.score / maxScore);

  return {
    categoryName: match.name,
    categoryId: match.id,
    confidence,
    reason: `Matched: ${bestData.matchedKeywords.slice(0, 3).join(', ')}`,
  };
}

// ---- Main: Detect Duplicates ----
export function detectDuplicates(
  currentExpense: { description: string; amount: number; expenseDate: string; merchantName?: string },
  existingExpenses: Array<{ id: string; description: string; amount: number; expenseDate: string; merchantName?: string }>,
  windowDays = 14
): DuplicateAlert[] {
  const alerts: DuplicateAlert[] = [];
  const currentDate = new Date(currentExpense.expenseDate);

  for (const exp of existingExpenses) {
    const expDate = new Date(exp.expenseDate);
    const dayDiff = Math.abs((currentDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));

    // Only check expenses within the time window
    if (dayDiff > windowDays) continue;

    const reasons: string[] = [];
    let totalScore = 0;

    // 1. Description similarity
    const descSim = stringSimilarity(currentExpense.description, exp.description);
    if (descSim > 0.7) {
      totalScore += descSim * 0.4;
      reasons.push(`${Math.round(descSim * 100)}% similar description`);
    }

    // 2. Amount proximity
    const amountDiff = Math.abs(currentExpense.amount - exp.amount) / Math.max(currentExpense.amount, exp.amount);
    if (amountDiff < 0.05) {
      totalScore += 0.35;
      reasons.push(`Same amount ($${exp.amount})`);
    } else if (amountDiff < 0.15) {
      totalScore += 0.2;
      reasons.push(`Similar amount ($${exp.amount})`);
    }

    // 3. Merchant match
    if (currentExpense.merchantName && exp.merchantName) {
      const merchSim = stringSimilarity(currentExpense.merchantName, exp.merchantName);
      if (merchSim > 0.8) {
        totalScore += 0.25;
        reasons.push(`Same merchant`);
      }
    }

    // 4. Date proximity bonus
    if (dayDiff < 2 && totalScore > 0.3) {
      totalScore += 0.1;
      reasons.push(`${dayDiff < 1 ? 'Same day' : Math.round(dayDiff) + ' day(s) apart'}`);
    }

    if (totalScore >= 0.55 && reasons.length >= 1) {
      alerts.push({
        expense: exp,
        similarity: Math.min(0.99, totalScore),
        reasons,
      });
    }
  }

  return alerts.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

// ---- Main: Anomaly Detection ----
export function detectAnomalies(
  currentExpense: { description: string; amount: number; categoryId: string },
  historicalExpenses: Array<{ amount: number; categoryId: string; expenseDate: string }>,
  categoryName: string
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  if (historicalExpenses.length < 3) return alerts;

  const sameCategory = historicalExpenses.filter(e => e.categoryId === currentExpense.categoryId);

  if (sameCategory.length > 2) {
    const amounts = sameCategory.map(e => e.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const std = Math.sqrt(amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length);
    const zScore = std > 0 ? (currentExpense.amount - mean) / std : 0;

    if (zScore > 2.5) {
      alerts.push({
        type: 'amount',
        severity: zScore > 3.5 ? 'high' : 'medium',
        message: `$${currentExpense.amount.toFixed(2)} is ${(currentExpense.amount / mean).toFixed(1)}x your average for ${categoryName}`,
        context: `Your average ${categoryName} expense is $${mean.toFixed(2)} (σ=$${std.toFixed(2)}, n=${sameCategory.length})`,
        zScore,
      });
    }
  }

  // Check all-time average
  const allAmounts = historicalExpenses.map(e => e.amount);
  const allMean = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
  if (currentExpense.amount > allMean * 4 && currentExpense.amount > 500) {
    alerts.push({
      type: 'amount',
      severity: 'high',
      message: `This expense is ${(currentExpense.amount / allMean).toFixed(1)}x your overall average`,
      context: `Your average expense across all categories is $${allMean.toFixed(2)}`,
    });
  }

  return alerts;
}

// ---- Predictive: Forecast Month End ----
export function forecastMonthEnd(
  expenses: Array<{ amount: number; expenseDate: string }>
): { predicted: number; trend: 'up' | 'down' | 'stable'; confidence: number } {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const remainingDays = daysInMonth - dayOfMonth;

  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.expenseDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const dailyRate = dayOfMonth > 0 ? thisMonthTotal / dayOfMonth : 0;
  const predicted = thisMonthTotal + dailyRate * remainingDays;

  // Last month for trend
  const lastMonthExpenses = expenses.filter(e => {
    const d = new Date(e.expenseDate);
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
  });
  const lastMonthTotal = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);

  const pctChange = lastMonthTotal > 0 ? (predicted - lastMonthTotal) / lastMonthTotal : 0;
  const trend: 'up' | 'down' | 'stable' = pctChange > 0.05 ? 'up' : pctChange < -0.05 ? 'down' : 'stable';

  return {
    predicted,
    trend,
    confidence: Math.min(0.9, dayOfMonth / 15),
  };
}
