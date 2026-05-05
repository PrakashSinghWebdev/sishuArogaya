const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const Child = require('./models/Child');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sishu-arogaya');
    const child = await Child.findOne({ name: 'Test Child' });
    
    if (!child) {
      console.log('No test child found');
      process.exit(1);
    }

    const childId = child._id.toString();
    console.log('Testing with Child ID:', childId);

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/growth/${childId}/predict`,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
          const json = JSON.parse(data);
          console.log('Success:', json.success);
          console.log('Graph Nodes:', json.graph?.nodeCount);
          console.log('Graph Edges:', json.graph?.edgeCount);
          console.log('Has Insights:', !!json.insights);
          console.log('Risk Level:', json.prediction?.riskLevel);
          console.log('Model:', json.model);
        } catch (e) {
          console.log('Response length:', data.length);
          console.log('First 200 chars:', data.substring(0, 200));
        }
        process.exit(0);
      });
    });
    req.on('error', e => {
      console.error('Error:', e.message);
      process.exit(1);
    });
    req.end();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

test();
