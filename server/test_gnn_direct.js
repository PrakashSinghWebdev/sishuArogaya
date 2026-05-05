const mongoose = require('mongoose');
require('dotenv').config();

const Child = require('./models/Child');
const GrowthRecord = require('./models/GrowthRecord');
const { predictGrowthWithGNN } = require('./utils/gnnPrediction');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sishu-arogaya');
    console.log('✓ Connected to MongoDB');

    const child = await Child.findOne({ name: 'Test Child' });
    if (!child) {
      console.error('✗ Test child not found');
      process.exit(1);
    }

    console.log('✓ Found test child:', child._id);

    const recordCount = await GrowthRecord.countDocuments({ childId: child._id });
    console.log(`✓ Found ${recordCount} growth records`);

    console.log('\n▶ Calling predictGrowthWithGNN...');
    const result = await predictGrowthWithGNN(child._id.toString());

    if (result.error) {
      console.error('✗ Error:', result.error);
      process.exit(1);
    }

    console.log('\n✓ Prediction successful!');
    console.log('\nResponse Structure:');
    console.log({
      success: result.success,
      childName: result.childName,
      childAge: result.childAge,
      model: result.model,
      graphNodes: result.graph?.nodeCount,
      graphEdges: result.graph?.edgeCount,
      hasPrediction: !!result.prediction,
      hasInsights: !!result.insights,
      insightsLength: result.insights?.length
    });

    console.log('\nPrediction Details:');
    console.log({
      riskLevel: result.prediction?.riskLevel,
      confidence: result.prediction?.confidence,
      recommendation: result.prediction?.recommendation,
      currentStatus: result.prediction?.currentStatus,
      predictedMetrics: result.prediction?.prediction
    });

    console.log('\nInsights Preview (first 150 chars):');
    console.log(result.insights?.substring(0, 150) || '(no insights)');

    console.log('\n✓ All tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Test failed:', err.message);
    process.exit(1);
  }
}

test();
