const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sishu-arogaya');
    console.log('✓ Connected to MongoDB');

    const Child = require('./models/Child');
    const User = require('./models/User');

    const child = await Child.findOne({ name: 'Test Child' });
    const parent = await User.findOne({ role: 'parent' });

    if (!child || !parent) {
      console.error('✗ Test data not found');
      process.exit(1);
    }

    console.log(`✓ Found test data`);

    // Use the actual JWT_SECRET from .env
    const token = jwt.sign(
      { id: parent._id.toString(), email: parent.email, role: parent.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✓ Created JWT token');

    const { spawn } = require('child_process');
    const server = spawn('node', ['server.js'], { 
      stdio: 'pipe',
      cwd: __dirname 
    });

    let started = false;

    server.stdout.on('data', (data) => {
      if (data.toString().includes('running on port') && !started) {
        started = true;
        setTimeout(testAPI, 1000);
      }
    });

    const testAPI = async () => {
      try {
        console.log('▶ Testing API...');
        const response = await axios.get(
          `http://localhost:5000/api/growth/${child._id}/predict`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log('\n✓ API SUCCESS!');
        const d = response.data;
        console.log('\nResponse Summary:');
        console.log(`  Child: ${d.childName} (${d.childAge} months)`);
        console.log(`  Model: ${d.model}`);
        console.log(`  Risk Level: ${d.prediction?.riskLevel}`);
        console.log(`  Confidence: ${d.prediction?.confidence}%`);
        console.log(`  Graph: ${d.graph?.nodeCount} nodes, ${d.graph?.edgeCount} edges`);
        console.log(`  Insights: ${d.insights ? 'Generated' : 'Not available (API key not configured)'}`);
        
        console.log('\n✓ GNN Prediction feature is fully functional!');
        server.kill();
        process.exit(0);
      } catch (err) {
        console.error('\n✗ Error:', err.message);
        if (err.response?.data) {
          console.error('Details:', err.response.data);
        }
        server.kill();
        process.exit(1);
      }
    };

    setTimeout(() => {
      console.error('\n✗ Timeout');
      server.kill();
      process.exit(1);
    }, 45000);

  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

test();
