/**
 * Graph-based Growth Prediction Module
 * Builds a child → growth-record graph, assesses risk from WHO z-scores,
 * projects next-month growth from the child's own trend, and asks the
 * local LLM (Ollama, Gemini fallback) for parent-friendly insights.
 */

const GrowthRecord = require('../models/GrowthRecord');
const Child = require('../models/Child');
const { predictMalnutrition } = require('./zScore');
const { chat } = require('./llm');

// ═══════════════════════════════════════════════════════════════════════════
// 1. GRAPH NEURAL NETWORK NODE CREATION
// ═══════════════════════════════════════════════════════════════════════════

class GrowthGraph {
  constructor() {
    this.nodes = [];
    this.edges = [];
  }

  addChildNode(child, latestRecord) {
    const nodeId = `child_${child._id}`;
    this.nodes.push({
      id: nodeId,
      type: 'child',
      label: child.name,
      attributes: {
        age: latestRecord?.ageInMonths || 0,
        gender: child.gender,
        nutritionStatus: child.nutritionStatus,
      },
    });
    return nodeId;
  }

  addGrowthNode(record, parentNodeId) {
    const nodeId = `growth_${record._id}`;
    this.nodes.push({
      id: nodeId,
      type: 'growth_record',
      label: `Weight: ${record.weight}kg, Height: ${record.height}cm`,
      attributes: {
        weight: record.weight,
        height: record.height,
        ageMonths: record.ageMonths,
        weightForAgeZ: record.wazScore,
        heightForAgeZ: record.hazScore,
        weightForHeightZ: record.whzScore,
        date: record.recordedDate,
      },
    });

    // Add edge from child to growth record
    this.edges.push({
      source: parentNodeId,
      target: nodeId,
      type: 'has_record',
      weight: 1,
    });

    return nodeId;
  }

  addReferenceNode(category, value) {
    const nodeId = `ref_${category}_${value}`;
    this.nodes.push({
      id: nodeId,
      type: 'reference',
      label: `${category}: ${value}`,
      attributes: { category, value },
    });
    return nodeId;
  }

  connectToReference(sourceNodeId, refNodeId) {
    this.edges.push({
      source: sourceNodeId,
      target: refNodeId,
      type: 'references',
      weight: 0.8,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. GNN MESSAGE PASSING & AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════

function aggregateNodeFeatures(node, connectedNodes) {
  if (node.type !== 'growth_record') return node.attributes;

  const aggregated = { ...node.attributes };

  // Aggregate information from connected nodes
  connectedNodes.forEach((connectedNode) => {
    if (connectedNode.type === 'reference') {
      const { category, value } = connectedNode.attributes;
      aggregated[category] = value;
    }
  });

  return aggregated;
}

function gnnMessagePass(graph) {
  const nodeMap = {};
  graph.nodes.forEach((node) => {
    nodeMap[node.id] = node;
  });

  const updatedNodes = graph.nodes.map((node) => {
    const connectedNodeIds = [
      ...graph.edges.filter((e) => e.source === node.id).map((e) => e.target),
      ...graph.edges.filter((e) => e.target === node.id).map((e) => e.source),
    ];

    const connectedNodes = connectedNodeIds.map((id) => nodeMap[id]);
    const aggregatedAttrs = aggregateNodeFeatures(node, connectedNodes);

    return {
      ...node,
      attributes: aggregatedAttrs,
    };
  });

  return updatedNodes;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. PREDICTION MODEL
// ═══════════════════════════════════════════════════════════════════════════

function predictUsingGNN(nodeFeatures, trend = null) {
  const {
    weight = 0,
    height = 0,
    ageMonths = 0,
    weightForAgeZ = 0,
    heightForAgeZ = 0,
    weightForHeightZ = 0,
  } = nodeFeatures || {};

  const waz = Number(weightForAgeZ) || 0;
  const haz = Number(heightForAgeZ) || 0;
  const whz = Number(weightForHeightZ) || 0; // wasting — the primary SAM/MAM criterion

  let riskLevel = 'low';
  let confidence = 0.95;
  let recommendation = 'Continue regular health check-ups.';

  // WHO cut-offs: < -2 SD moderate, < -3 SD severe
  if (waz < -2 || haz < -2 || whz < -2) {
    if (waz < -3 || haz < -3 || whz < -3) {
      riskLevel = 'severe';
      confidence = 0.98;
      recommendation =
        'Immediate medical attention required. Visit nearest PHC urgently.';
    } else {
      riskLevel = 'moderate';
      confidence = 0.92;
      recommendation =
        'Increase nutritional intake. Follow ASHA recommendations.';
    }
  }

  // Next-month projection: the child's own monthly trend when there are 2+ records,
  // otherwise a conservative default (+2% weight, +0.5% height). Deterministic, never negative.
  const w = Number(weight) || 0;
  const h = Number(height) || 0;
  const predictedWeight = w + Math.max(0, trend?.weightPerMonth ?? w * 0.02);
  const predictedHeight = h + Math.max(0, trend?.heightPerMonth ?? h * 0.005);

  return {
    riskLevel,
    confidence: Math.round(confidence * 100),
    currentStatus: {
      weight: Number(weight) || 0,
      height: Number(height) || 0,
      ageMonths: Number(ageMonths) || 0,
      weightForAgeZ: parseFloat(waz.toFixed(2)),
      heightForAgeZ: parseFloat(haz.toFixed(2)),
      weightForHeightZ: parseFloat(whz.toFixed(2)),
    },
    prediction: {
      predictedWeight: parseFloat(predictedWeight.toFixed(2)),
      predictedHeight: parseFloat(predictedHeight.toFixed(2)),
      nextMonthAge: (Number(ageMonths) || 0) + 1,
    },
    recommendation,
    riskFactors: [],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. GEMINI API INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

async function getGeminiInsights(prediction, childName, childAge) {
  const prompt = `Child: ${childName}, Age: ${childAge} months
Risk Level: ${prediction.riskLevel}
Weight-for-Age Z-score: ${prediction.currentStatus.weightForAgeZ}
Height-for-Age Z-score: ${prediction.currentStatus.heightForAgeZ}
Weight-for-Height Z-score: ${prediction.currentStatus.weightForHeightZ}
Predicted Weight Next Month: ${prediction.prediction.predictedWeight}kg
Recommendation: ${prediction.recommendation}

Provide:
1. Health Assessment (1 sentence)
2. Key Concern (if any)
3. Action Items (2-3 bullet points)
4. When to Seek Help (1 sentence)`;

  try {
    const { text, source } = await chat(
      'You are a pediatric health advisor for Indian parents. Use WHO growth standards. Be concise, practical and never prescribe medicines. Plain English, under 150 words.',
      [{ role: 'user', content: prompt }]
    );
    return { insights: text, model: source, timestamp: new Date() };
  } catch (error) {
    console.error('AI insights error:', error.message);
    return { insights: null, error: 'AI insights unavailable' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. MAIN PREDICTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function predictGrowthWithGNN(childId, { insights = true } = {}) {
  try {
    const child = await Child.findById(childId);
    if (!child) {
      return { error: 'Child not found', status: 404 };
    }

    // Get growth history
    const records = await GrowthRecord.find({ childId }).sort('recordedDate');
    if (records.length === 0) {
      return { error: 'No growth records found', status: 404 };
    }

    const latestRecord = records[records.length - 1];

    // 1. Create growth graph
    const graph = new GrowthGraph();
    const childNodeId = graph.addChildNode(child, latestRecord);

    // Add growth records to graph
    records.forEach((record) => {
      const recordNodeId = graph.addGrowthNode(record, childNodeId);

      // Add WHO reference nodes
      const whoRefId = graph.addReferenceNode('who_standard', 'linear');
      graph.connectToReference(recordNodeId, whoRefId);
    });

    // 2. Message passing (GNN)
    const updatedNodes = gnnMessagePass(graph);

    // 3. Get latest node features after message passing
    const latestNodeId = `growth_${latestRecord._id}`;
    const latestNode = updatedNodes.find((n) => n.id === latestNodeId);
    const recordObj = latestRecord.toObject();

    // Monthly growth rate between the two most recent records
    let trend = null;
    if (records.length >= 2) {
      const prev = records[records.length - 2];
      const months = (latestRecord.ageMonths - prev.ageMonths) || (latestRecord.recordedDate - prev.recordedDate) / (30.44 * 864e5);
      if (months > 0) {
        trend = {
          weightPerMonth: (latestRecord.weight - prev.weight) / months,
          heightPerMonth: (latestRecord.height - prev.height) / months,
        };
      }
    }

    // 4. Make prediction
    const prediction = predictUsingGNN(latestNode.attributes, trend);

    // 4b. WHO LMS z-score assessment of the latest record.
    //     Returned as `zScores` so the UI gets WAZ/HAZ/WHZ + advice without
    //     changing the existing `prediction` (GNN) object contract.
    let zScores = null;
    try {
      if (recordObj.weight != null && recordObj.height != null) {
        zScores = predictMalnutrition(
          Number(recordObj.weight),
          Number(recordObj.height),
          Number(latestRecord.ageMonths) || 0,
          child.gender
        );
      }
    } catch (zErr) {
      console.error('WHO z-score calculation failed:', zErr.message);
      zScores = null;
    }

    // 5. Get Gemini insights
    const geminiResult = insights
      ? await getGeminiInsights(prediction, child.name, latestRecord.ageMonths)
      : { insights: null };

    // 6. Return complete result
    return {
      success: true,
      childName: child.name,
      childAge: latestRecord.ageMonths,
      prediction,
      zScores,
      insights: geminiResult.insights,
      graph: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        nodes: graph.nodes.slice(0, 10), // Return sample nodes
        edges: graph.edges.slice(0, 20), // Required by GNNVisualization
      },
      model: `GNN + ${geminiResult.model || 'AI'}`,
    };
  } catch (error) {
    console.error('GNN Prediction error:', error);
    return { error: error.message, status: 500 };
  }
}

module.exports = { predictGrowthWithGNN };
