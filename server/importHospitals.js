const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hospital = require('./models/Hospital');

dotenv.config();

const CSV_FILE = '../hospital_directory.csv';

async function importHospitals() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sishuarogaya');
    console.log('MongoDB connected');

    // Clear existing hospitals
    await Hospital.deleteMany({});
    console.log('Cleared existing hospital records');

    const results = [];

    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (data) => {
        // Parse coordinates "lat, lng" -> [lng, lat]
        const coordsRaw = data.Location_Coordinates || '';
        const coordsParts = coordsRaw.split(',').map(s => s.trim());
        
        if (coordsParts.length === 2 && !isNaN(coordsParts[0]) && !isNaN(coordsParts[1])) {
          const lat = parseFloat(coordsParts[0]);
          const lng = parseFloat(coordsParts[1]);

          // Filter out obvious garbage coordinates
          if (lat === 0 && lng === 0) return;

          const isGov = String(data.Hospital_Category || '').toLowerCase().includes('public') || String(data.Hospital_Category || '').toLowerCase().includes('government');
          
          // Improved emergency check
          const rawEmerg = String(data.Emergency_Services || '').trim().toLowerCase();
          const hasEmerg = (rawEmerg !== '0' && rawEmerg !== '' && rawEmerg !== 'no' && rawEmerg !== 'none' && rawEmerg !== 'na');
          
          const hasICU = String(data.Facilities || '').toLowerCase().includes('icu') || String(data.Miscellaneous_Facilities || '').toLowerCase().includes('icu');

          results.push({
            name: data.Hospital_Name || 'Unknown Hospital',
            type: (data.Hospital_Care_Type || '').toLowerCase().includes('clinic') ? 'clinic' : 'hospital',
            address: (data.Location || data.Address_Original_First_Line || '').trim(),
            phone: data.Mobile_Number !== '0' ? data.Mobile_Number : data.Telephone !== '0' ? data.Telephone : '',
            district: data.District || '',
            state: data.State || '',
            pincode: data.Pincode || '',
            isGovernment: !!isGov,
            hasEmergency: !!hasEmerg,
            hasICU: !!hasICU,
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          });
        }
      })
      .on('end', async () => {
        console.log(`Parsed ${results.length} valid hospitals from CSV`);
        
        // Batch insert for performance
        const batchSize = 1000;
        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          await Hospital.insertMany(batch);
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}...`);
        }

        console.log('\n[Success] Hospital directory updated successfully!');
        process.exit(0);
      });

  } catch (err) {
    console.error('Import error:', err.message);
    process.exit(1);
  }
}

importHospitals();
