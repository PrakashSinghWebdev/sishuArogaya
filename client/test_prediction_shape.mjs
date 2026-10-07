/**
 * Verification for the "Objects are not valid as a React child"
 * (throwOnInvalidObjectType) crash in the parent growth / AI-prediction pages.
 *
 *   node _diag_verify.mjs
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { normalizePrediction } from './src/utils/predictionShape.js';

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`  ❌ ${name}\n     ${err.message}`);
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

/* ── payloads ─────────────────────────────────────────────────────────────── */

// What GET /api/growth/:id/predict really returns (server/utils/gnnPrediction.js)
const gnnPayload = {
  success: true,
  childName: 'Test Child',
  childAge: 24,
  prediction: {
    riskLevel: 'moderate',
    confidence: 92,
    currentStatus: { weight: 9.1, height: 78.2, ageMonths: 24, weightForAgeZ: -1.6, heightForAgeZ: -2.4 },
    prediction: { predictedWeight: 9.3, predictedHeight: 78.8, nextMonthAge: 25 },
    recommendation: 'Increase nutritional intake. Follow ASHA recommendations.',
    riskFactors: [],
  },
  zScores: {
    waz: -1.6, haz: -2.4, whz: -1.35,
    wazStatus: 'moderate', hazStatus: 'moderate', whzStatus: 'moderate',
    prediction: 'moderate',
    advice: 'Moderate nutritional risk. ASHA follow-up recommended.',
  },
  insights: '**Assessment**\nChild is at moderate risk.\n**Action**\nConsult ASHA worker.',
  graph: {
    nodeCount: 4,
    edgeCount: 3,
    nodes: [{ id: 'child_1', type: 'child' }, { id: 'growth_2', type: 'growth_record' }],
    edges: [{ source: 'child_1', target: 'growth_2', type: 'has_record' }],
  },
  model: 'GNN + Gemini',
};

// Legacy flat WHO contract
const flatPayload = {
  prediction: 'severe',
  waz: -3.1, haz: -2.2, whz: -3.4,
  wazStatus: 'severe', hazStatus: 'moderate', whzStatus: 'severe',
  advice: 'Immediate referral to PHC required.',
  graph: { nodes: [{ id: 'child_1' }], edges: [] },
  insights: 'ok',
};

// Payload WITHOUT the new zScores field (older server still running)
const gnnLegacy = { ...gnnPayload };
delete gnnLegacy.zScores;

/* ── 1. reproduce the original crash ──────────────────────────────────────── */

console.log('\n1) Original failure mode (raw GNN payload rendered directly)');
check('raw prediction object throws throwOnInvalidObjectType-style error', () => {
  let message = null;
  try {
    renderToString(React.createElement('div', { className: 'stat-value' }, gnnPayload.prediction));
  } catch (err) {
    message = err.message;
  }
  assert(message, 'expected React to throw when an object is a child');
  assert(/not valid as a React child/i.test(message), `unexpected error: ${message}`);
  console.log(`     reproduced: ${message.split('\n')[0]}`);

/* ── 2. normalised payload is render-safe ─────────────────────────────────── */

console.log('\n2) Normalised payload (what the pages now use)');
const n = normalizePrediction(gnnPayload);

check('prediction is a lowercase status string', () => {
  assert(typeof n.prediction === 'string', `prediction is ${typeof n.prediction}`);
  assert(n.prediction === 'moderate', `got ${n.prediction}`);
});

check('z-scores come from zScores / currentStatus', () => {
  assert(n.waz === -1.6, `waz=${n.waz}`);
  assert(n.haz === -2.4, `haz=${n.haz}`);
  assert(n.whz === -1.35, `whz=${n.whz}`);
  assert(n.wazStatus === 'moderate' && n.hazStatus === 'moderate' && n.whzStatus === 'moderate', 'statuses');
});

check('advice / recommendation are strings', () => {
  assert(n.advice === 'Moderate nutritional risk. ASHA follow-up recommended.', `advice=${n.advice}`);
  assert(n.recommendation === 'Increase nutritional intake. Follow ASHA recommendations.', `rec=${n.recommendation}`);
});

check('forecast/riskLevel available for the dashboard card', () => {
  assert(n.riskLevel === 'moderate', `riskLevel=${n.riskLevel}`);
  assert(n.predictedWeight === 9.3 && n.predictedHeight === 78.8, 'forecast values');
  assert(n.confidence === 92, `confidence=${n.confidence}`);
});

check('graph keeps nodes + now has an edges array', () => {
  assert(Array.isArray(n.graph.nodes) && n.graph.nodes.length === 2, 'nodes');
  assert(Array.isArray(n.graph.edges) && n.graph.edges.length === 1, 'edges');
});

check('renders the whole stats row without throwing (GrowthMonitoring)', () => {
  const html = renderToString(
    React.createElement('div', null,
      React.createElement('div', null, n.waz != null ? n.waz.toFixed(1) : '—'),
      React.createElement('div', null, n.prediction),
      React.createElement('div', null, n.advice.slice(0, 40)),
      React.createElement('div', null, n.insights),
      React.createElement('span', null, n.graph.nodeCount),
      React.createElement('span', null, n.graph.edgeCount),
    )
  );
  assert(html.includes('-1.6') && html.includes('moderate'), 'rendered output looks wrong');
});

check('renders risk chip + forecast (Dashboard) without throwing', () => {
  const html = renderToString(
    React.createElement('div', null,
      React.createElement('div', null, n.predictedWeight, ' kg'),
      React.createElement('div', null, n.predictedHeight, ' cm'),
      React.createElement('div', null, n.riskLevel.charAt(0).toUpperCase() + n.riskLevel.slice(1)),
      React.createElement('p', null, n.recommendation),
    )
  );
  assert(html.includes('Moderate'), 'risk level missing');
});

});


/* ── 3. backward / forward compatibility ──────────────────────────────────── */

console.log('\n3) Compatibility');
check('flat z-score payload still works', () => {
  const f = normalizePrediction(flatPayload);
  assert(f.prediction === 'severe', `prediction=${f.prediction}`);
  assert(f.waz === -3.1 && f.haz === -2.2 && f.whz === -3.4, 'z-scores');
  assert(f.advice === 'Immediate referral to PHC required.', `advice=${f.advice}`);
  assert(Array.isArray(f.graph.edges), 'edges array');
});

check('GNN payload without zScores (server not restarted yet) still safe', () => {
  const l = normalizePrediction(gnnLegacy);
  assert(l.prediction === 'moderate', `prediction=${l.prediction}`);
  assert(l.waz === -1.6 && l.haz === -2.4 && l.whz === null, `waz=${l.waz} haz=${l.haz} whz=${l.whz}`);
  // WHO thresholds mirror server/utils/zScore.js: < -2 moderate, < -3 severe
  assert(l.wazStatus === 'healthy', `wazStatus=${l.wazStatus}`);
  assert(l.hazStatus === 'moderate', `hazStatus=${l.hazStatus}`);
  assert(renderToString(React.createElement('div', null, l.prediction)).includes('moderate'), 'render');
});

check('riskLevel "low" maps to healthy status but keeps the low chip', () => {
  const low = normalizePrediction({ prediction: { riskLevel: 'low', prediction: {}, currentStatus: {} } });
  assert(low.prediction === 'healthy', `prediction=${low.prediction}`);
  assert(low.riskLevel === 'low', `riskLevel=${low.riskLevel}`);
});

check('garbage payloads never leak objects', () => {
  assert(normalizePrediction(null) === null, 'null -> null');
  assert(normalizePrediction(undefined) === null, 'undefined -> null');
  assert(normalizePrediction('boom') === null, 'string -> null');
  assert(normalizePrediction([]) === null, 'array -> null');
  const weird = normalizePrediction({ prediction: { riskLevel: {}, recommendation: {} }, waz: {}, advice: {} });
  assert(typeof weird.prediction === 'string', 'prediction must stay a string');
  assert(weird.waz === null, 'waz must be null');
  assert(weird.advice === null, 'advice must be null');
  renderToString(React.createElement('div', null,
    weird.prediction, weird.waz, weird.advice, weird.insights, weird.error, String(weird.predictedWeight)));
});

console.log(failures === 0 ? '\n✨ All checks passed\n' : `\n💥 ${failures} check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
