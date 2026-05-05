const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const Child = require('./models/Child');
const User = require('./models/User');

async function testPrediction() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sishu-arogaya');
    
    // Get test child
    const child = await Child.findOne({ name: 'Test Child' });
    if (!child) {
      console.error('No test child found');
      process.exit(1);
    }

    console.log('Testing GNN Prediction for child:', child._id);

    // Get parent user for JWT token
    const parent = await User.findOne({ role: 'parent' });
    if (!parent) {
      console.error('No parent user found');
      process.exit(1);
    }

    // Call the prediction endpoint
    const path = `/api/growth/${child._id}/predict`;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer fake-jwt-token-${parent._id}`,
        'Content-Type': 'application/json'
      }
    };

    console.log(`\nCalling ${options.hostname}:${options.port}${path}`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode);
        try {
          const json = JSON.parse(data);
          console.log('\nPrediction Response Structure:');
          console.log({
            success: json.success,
            childName: json.childName,
            childAge: json.childAge,
            hasGraph: !!json.graph,
            graphNodeCount: json.graph?.nodeCount,
            graphEdgeCount: json.graph?.edgeCount,
            hasPrediction: !!json.prediction,
            predictionKeys: Object.keys(json.prediction || {}),
            hasInsights: !!json.insights,
            insightsPreview: json.insights ? json.insights.substring(0, 100) : null,
            model: json.model
          });
          
          if (json.prediction) {
            console.log('\nPrediction Details:');
            console.log({
              riskLevel: json.prediction.riskLevel,
              confidence: json.prediction.confidence,
              recommendation: json.prediction.recommendation,
              currentStatus: json.prediction.currentStatus,
              prediction: json.prediction.prediction
            });
          }
        } catch (e) {
          console.log('Response:', data);
        }
        process.exit(0);
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err.message);
      process.exit(1);
    });

    req.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Start server first
const { spawn } = require('child_process');
const serverProcess = spawn('node', ['server.js'], { cwd: __dirname });

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('running on port')) {
    console.log('✓ Server started, running test...\n');
    setTimeout(testPrediction, 500);
  }
});

serverProcess.stderr.on('data', (data) => {
  if (data.toString().includes('MongoDB connected')) {
    // Server is ready
  }
});

setTimeout(() => {
  if (serverProcess.pid) {
    serverProcess.kill();
    console.error('Test timeout');
    process.exit(1);
  }
}, 20000);
