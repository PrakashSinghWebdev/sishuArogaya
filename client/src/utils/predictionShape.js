/**
 * Normalises the payload returned by `GET /api/growth/:childId/predict`.
 *
 * The endpoint can answer in two shapes:
 *
 *  1. Flat WHO z-score contract (what the parent pages render):
 *     { prediction: 'healthy'|'moderate'|'severe', waz, haz, whz,
 *       wazStatus, hazStatus, whzStatus, advice, graph, insights, error }
 *
 *  2. GNN / Gemini payload (server/utils/gnnPrediction.js):
 *     { prediction: { riskLevel, confidence, currentStatus: {...},
 *                     prediction: { predictedWeight, predictedHeight, ... },
 *                     recommendation },
 *       zScores: {...}, graph: { nodes, edges, ... }, insights, error }
 *
 * Rendering the raw GNN payload directly used to break the UI with
 * "Objects are not valid as a React child (throwOnInvalidObjectType)",
 * because `prediction.prediction` is an object there. Everything that a
 * component can render is therefore forced to a primitive below.
 */

/** Coerce anything to a finite number, or null. */
const num = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Coerce anything to a non-empty trimmed string, or null. */
const str = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

/** WHO z-score classification — mirrors server/utils/zScore.js `classify()`. */
export const classifyZ = (z) => {
  const value = num(z);
  if (value === null) return null;
  if (value < -3) return 'severe';
  if (value < -2) return 'moderate';
  return 'healthy';
};

const lowered = (value) => {
  const raw = str(value);
  return raw ? raw.toLowerCase() : null;
};

/** GNN risk levels ('low') map onto the UI status vocabulary ('healthy'). */
const cleanStatus = (value) => {
  const raw = lowered(value);
  if (!raw) return null;
  return raw === 'low' || raw === 'normal' || raw === 'healthy' ? 'healthy' : raw;
};

/**
 * @param {unknown} raw - response body of the prediction endpoint
 * @returns {object|null} flat, render-safe prediction object
 */
export function normalizePrediction(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const gnn = raw.prediction && typeof raw.prediction === 'object' ? raw.prediction : null;
  const current = raw.currentStatus && typeof raw.currentStatus === 'object'
    ? raw.currentStatus
    : (gnn && gnn.currentStatus && typeof gnn.currentStatus === 'object' ? gnn.currentStatus : {});
  const forecast = gnn && gnn.prediction && typeof gnn.prediction === 'object'
    ? gnn.prediction
    : (raw.forecast && typeof raw.forecast === 'object' ? raw.forecast : {});
  const legacyZScores = raw.zScores && typeof raw.zScores === 'object' ? raw.zScores : {};

  const status =
    cleanStatus(typeof raw.prediction === 'string' ? raw.prediction : null) ||
    cleanStatus(legacyZScores.prediction) ||
    cleanStatus(raw.riskLevel) ||
    cleanStatus(gnn && gnn.riskLevel) ||
    'healthy';

  // Keep the raw GNN risk level ('low' / 'moderate' / 'severe') for the
  // dashboard chip, which colours `low` green.
  const riskLevel = lowered(raw.riskLevel) || lowered(gnn && gnn.riskLevel) || status;

  const waz = num(raw.waz) ?? num(legacyZScores.waz) ?? num(current.weightForAgeZ);
  const haz = num(raw.haz) ?? num(legacyZScores.haz) ?? num(current.heightForAgeZ);
  const whz = num(raw.whz) ?? num(legacyZScores.whz) ?? num(current.whzScore ?? current.weightForHeightZ);

  const advice =
    str(raw.advice) ||
    str(legacyZScores.advice) ||
    str(raw.recommendation) ||
    str(gnn && gnn.recommendation);

  const recommendation =
    str(raw.recommendation) ||
    str(gnn && gnn.recommendation) ||
    advice;

  const graph = raw.graph && typeof raw.graph === 'object'
    ? {
        ...raw.graph,
        nodes: Array.isArray(raw.graph.nodes) ? raw.graph.nodes : [],
        edges: Array.isArray(raw.graph.edges) ? raw.graph.edges : [],
        nodeCount: num(raw.graph.nodeCount) ?? (Array.isArray(raw.graph.nodes) ? raw.graph.nodes.length : 0),
        edgeCount: num(raw.graph.edgeCount) ?? (Array.isArray(raw.graph.edges) ? raw.graph.edges.length : 0),
      }
    : null;

  return {
    ...raw,
    success: raw.success !== false,
    // string statuses only — never objects
    prediction: status,
    riskLevel,
    currentStatus: current,
    // z-scores
    waz,
    haz,
    whz,
    wazStatus: cleanStatus(raw.wazStatus) || cleanStatus(legacyZScores.wazStatus) || classifyZ(waz),
    hazStatus: cleanStatus(raw.hazStatus) || cleanStatus(legacyZScores.hazStatus) || classifyZ(haz),
    whzStatus: cleanStatus(raw.whzStatus) || cleanStatus(legacyZScores.whzStatus) || classifyZ(whz),
    // guidance
    advice,
    recommendation,
    confidence: num(raw.confidence) ?? num(gnn && gnn.confidence),
    forecast: {
      predictedWeight: num(forecast.predictedWeight),
      predictedHeight: num(forecast.predictedHeight),
      nextMonthAge: num(forecast.nextMonthAge),
    },
    // Dashboard reads these straight off the response
    predictedWeight: num(raw.predictedWeight) ?? num(forecast.predictedWeight),
    predictedHeight: num(raw.predictedHeight) ?? num(forecast.predictedHeight),
    // extras
    graph,
    insights: str(raw.insights),
    error: str(raw.error),
    childName: str(raw.childName),
    childAge: num(raw.childAge),
  };
}

export default normalizePrediction;
