/**
 * WHO Z-Score Calculation for Malnutrition Prediction
 * Uses WHO Child Growth Standards LMS (Lambda-Mu-Sigma) method
 * Reference: who.int/tools/child-growth-standards
 *
 * z = (X/M)^L - 1) / (L * S)   if L ≠ 0
 * z = ln(X/M) / S               if L = 0
 *
 * Simplified approximation using WHO median (M) and SD (S) tables.
 * In production, load full LMS tables from WHO reference CSVs.
 */

// Simplified WHO WAZ medians by age (months) for boys — extend with full table in production
const WAZ_BOYS = {
  0: { M: 3.3464, S: 0.14602 },
  1: { M: 4.4709, S: 0.13395 },
  2: { M: 5.5675, S: 0.12385 },
  3: { M: 6.3762, S: 0.11727 },
  4: { M: 7.0023, S: 0.11316 },
  5: { M: 7.5105, S: 0.11065 },
  6: { M: 7.934,  S: 0.10920 },
  9: { M: 9.0715, S: 0.11100 },
  12:{ M: 9.9376, S: 0.11507 },
  18:{ M: 11.167, S: 0.12037 },
  24:{ M: 12.143, S: 0.12314 },
};

const WAZ_GIRLS = {
  0: { M: 3.2322, S: 0.14171 },
  1: { M: 4.1873, S: 0.13724 },
  2: { M: 5.1282, S: 0.13000 },
  3: { M: 5.8458, S: 0.12619 },
  4: { M: 6.4237, S: 0.12402 },
  5: { M: 6.8985, S: 0.12274 },
  6: { M: 7.297,  S: 0.12214 },
  9: { M: 8.3817, S: 0.12425 },
  12:{ M: 9.1635, S: 0.12827 },
  18:{ M: 10.367, S: 0.13268 },
  24:{ M: 11.484, S: 0.13000 },
};

// Get closest age key from table
const getClosestAge = (table, ageMonths) => {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  return keys.reduce((prev, curr) =>
    Math.abs(curr - ageMonths) < Math.abs(prev - ageMonths) ? curr : prev
  );
};

// Calculate z-score: z = (X - M) / S  (simplified; use LMS for full accuracy)
const calcZ = (value, M, S) => {
  return (value - M) / (M * S);
};

/**
 * Classify nutritional status from z-score
 * Healthy: z > -1.0
 * Moderate: -2.0 <= z <= -1.0
 * Severe: z < -2.0
 */
const classify = (z) => {
  if (z < -2.0) return 'severe';
  if (z < -1.0) return 'moderate';
  return 'healthy';
};

/**
 * Compute WAZ (Weight-for-Age Z-score)
 * @param {number} weight - kg
 * @param {number} ageMonths
 * @param {string} gender - 'male' | 'female'
 */
const computeWAZ = (weight, ageMonths, gender) => {
  const table = gender === 'male' ? WAZ_BOYS : WAZ_GIRLS;
  const age = getClosestAge(table, ageMonths);
  const { M, S } = table[age];
  return parseFloat(calcZ(weight, M, S).toFixed(2));
};

/**
 * Predict malnutrition status
 * Returns { waz, hazApprox, whzApprox, prediction, details }
 */
const predictMalnutrition = (weight, height, ageMonths, gender) => {
  const waz = computeWAZ(weight, ageMonths, gender);

  // HAZ and WHZ approximations (replace with full LMS tables for production)
  const expectedHeight = 45 + ageMonths * 1.8; // rough approximation
  const haz = parseFloat(((height - expectedHeight) / (expectedHeight * 0.05)).toFixed(2));

  const expectedWeightForHeight = height * 0.11 - 6;
  const whz = parseFloat(((weight - expectedWeightForHeight) / (expectedWeightForHeight * 0.12)).toFixed(2));

  // Final prediction: worst of three indicators
  const statuses = [classify(waz), classify(haz), classify(whz)];
  const prediction = statuses.includes('severe')
    ? 'severe'
    : statuses.includes('moderate')
    ? 'moderate'
    : 'healthy';

  return {
    waz,
    haz,
    whz,
    wazStatus: classify(waz),
    hazStatus: classify(haz),
    whzStatus: classify(whz),
    prediction,
    advice:
      prediction === 'severe'
        ? 'Immediate referral to Primary Health Centre required.'
        : prediction === 'moderate'
        ? 'ASHA follow-up and diet counselling recommended.'
        : 'Child is growing normally. Continue routine check-ups.',
  };
};

module.exports = { predictMalnutrition, computeWAZ, classify };
