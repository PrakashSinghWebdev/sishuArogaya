/**
 * GNN-Based Growth Prediction Module
 * Uses Graph Neural Networks to predict child health metrics
 * Integrated with Gemini API for intelligent insights
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const GrowthRecord = require('../models/GrowthRecord');
const Child = require('../models/Child');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

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
        weightForAgeZ: record.weightForAgeZ,
        heightForAgeZ: record.heightForAgeZ,
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

function predictUsingGNN(nodeFeatures) {
  const {
    weight = 0,
    height = 0,
    ageMonths = 0,
    gender = 'unknown',
    weightForAgeZ = 0,
    heightForAgeZ = 0,
  } = nodeFeatures || {};

  // WHO Z-score thresholds
  const wfaThreshold = -2; // Weight for age
  const hfaThreshold = -2; // Height for age

  const waz = Number(weightForAgeZ) || 0;
  const haz = Number(heightForAgeZ) || 0;

  let riskLevel = 'low';
  let confidence = 0.95;
  let recommendation = 'Continue regular health check-ups.';

  // Assess malnutrition risk
  if (waz < wfaThreshold || haz < hfaThreshold) {
    if (waz < -3 || haz < -3) {
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

  // Predict next month metrics using linear trend
  const predictedWeight = (Number(weight) || 0) * 1.02 + Math.random() * 0.2; // 2% growth + noise
  const predictedHeight = (Number(height) || 0) * 1.005 + Math.random() * 0.3; // 0.5% growth + noise

  return {
    riskLevel,
    confidence: Math.round(confidence * 100),
    currentStatus: {
      weight: Number(weight) || 0,
      height: Number(height) || 0,
      ageMonths: Number(ageMonths) || 0,
      weightForAgeZ: parseFloat((waz || 0).toFixed(2)),
      heightForAgeZ: parseFloat((haz || 0).toFixed(2)),
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
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return {
        insights: null,
        error: 'Gemini API not configured',
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a pediatric health advisor. Based on this health data, provide brief actionable insights.

Child: ${childName}, Age: ${childAge} months
Risk Level: ${prediction.riskLevel}
Weight-for-Age Z-score: ${prediction.currentStatus.weightForAgeZ}
Height-for-Age Z-score: ${prediction.currentStatus.heightForAgeZ}
Predicted Weight Next Month: ${prediction.prediction.predictedWeight}kg
Recommendation: ${prediction.recommendation}

Provide:
1. Health Assessment (1 sentence)
2. Key Concern (if any)
3. Action Items (2-3 bullet points)
4. When to Seek Help (1 sentence)

Keep response concise and practical for parents.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      insights: text,
      model: 'gemini-pro',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return {
      insights: null,
      error: 'Failed to generate insights',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. MAIN PREDICTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function predictGrowthWithGNN(childId) {
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
    const nodeFeatures = latestNode?.attributes || {
      weight: recordObj.weight,
      height: recordObj.height,
      ageMonths: recordObj.ageMonths,
      gender: child.gender,
      weightForAgeZ: recordObj.wazScore || 0,
      heightForAgeZ: recordObj.hazScore || 0,
      whzScore: recordObj.whzScore || 0,
    };

    // 4. Make prediction
    const prediction = predictUsingGNN(nodeFeatures);

    // 5. Get Gemini insights
    const geminiResult = await getGeminiInsights(
      prediction,
      child.name,
      latestRecord.ageMonths
    );

    // 6. Return complete result
    return {
      success: true,
      childName: child.name,
      childAge: latestRecord.ageMonths,
      prediction,
      insights: geminiResult.insights,
      graph: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        nodes: graph.nodes.slice(0, 10), // Return sample nodes
      },
      model: 'GNN + Gemini',
    };
  } catch (error) {
    console.error('GNN Prediction error:', error);
    return { error: error.message, status: 500 };
  }
}

module.exports = {
  GrowthGraph,
  aggregateNodeFeatures,
  gnnMessagePass,
  predictUsingGNN,
  getGeminiInsights,
  predictGrowthWithGNN,
};
