/**
 * WHO Growth Standards Seeder
 * Reads Excel files from D:/Sishu data/who health data/
 * and seeds the who_references MongoDB collection.
 *
 * Run: node server/seedWHO.js
 */
const path    = require('path');
const fs      = require('fs');
const mongoose = require('mongoose');
const ExcelJS  = require('exceljs');
const dotenv   = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const WHO_DIR = 'D:/Sishu data/who health data';

const WHOReference = require('./models/WHOReference');

// ── column-name normalisers ──────────────────────────────────────────────────
const normalise = (str) =>
  (str ?? '').toString().toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/month[s]?/, 'month')
    .replace(/length[s]?/, 'length')
    .replace(/age[s]?/, 'age');

const findCol = (headers, ...candidates) => {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => normalise(h) === normalise(c));
    if (idx !== -1) return idx;
  }
  // partial match
  for (const c of candidates) {
    const nc = normalise(c);
    const idx = headers.findIndex((h) => normalise(h).includes(nc));
    if (idx !== -1) return idx;
  }
  return -1;
};

// ── determine metric and gender from filename ────────────────────────────────
function fileMeta(filename) {
  const f = filename.toLowerCase();
  let metric = null;
  let gender = null;

  if (f.includes('wfa') || f.includes('weight') && f.includes('age'))      metric = 'wfa';
  else if (f.includes('wfl') || (f.includes('weight') && f.includes('length'))) metric = 'wfh';
  else if (f.includes('hcfa') || f.includes('headc'))                       metric = 'hcfa';
  else if (f.includes('bmi'))                                                metric = 'bmi';
  else if (f.includes('acfa'))                                               metric = 'acfa';
  else if (f.includes('ssfa') || f.includes('tsfa'))                        return null; // skinfolds – skip
  else if (f.includes('length'))                                             metric = 'hfa';
  else                                                                       return null;

  if (f.includes('boy'))  gender = 'male';
  else if (f.includes('girl')) gender = 'female';
  else                         return null;

  const isZscore = f.includes('_z') || f.includes('zscore');
  return { metric, gender, isZscore };
}

// ── parse one sheet into records ─────────────────────────────────────────────
async function parseSheet(workbook, meta) {
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows = [];
  sheet.eachRow((row, rowNum) => {
    rows.push(row.values.slice(1)); // exceljs: values[0] is undefined
  });

  if (rows.length < 2) return [];

  // find header row (first row that has at least 5 string cells)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const strCells = rows[i].filter((c) => c && isNaN(parseFloat(c))).length;
    if (strCells >= 3) { headerIdx = i; break; }
  }
  const headers = rows[headerIdx].map((c) => (c == null ? '' : c.toString()));

  // key columns
  const ageCol    = findCol(headers, 'Month', 'Age', 'Months', 'age (months)');
  const lenCol    = findCol(headers, 'Length', 'Height', 'length (cm)', 'height (cm)');
  const lCol      = findCol(headers, 'L', 'Lambda', 'l');
  const mCol      = findCol(headers, 'M', 'Mu', 'Median', 'm');
  const sCol      = findCol(headers, 'S', 'Sigma', 's');
  const sd3nCol   = findCol(headers, 'SD3neg', '-3 SD', '-3SD', 'SD3Neg', 'sd3neg');
  const sd2nCol   = findCol(headers, 'SD2neg', '-2 SD', '-2SD', 'SD2Neg', 'sd2neg');
  const sd1nCol   = findCol(headers, 'SD1neg', '-1 SD', '-1SD', 'SD1Neg', 'sd1neg');
  const sd0Col    = findCol(headers, 'SD0', 'Median', '0 SD', 'sd0');
  const sd1Col    = findCol(headers, 'SD1', '1 SD', '1SD', 'sd1');
  const sd2Col    = findCol(headers, 'SD2', '2 SD', '2SD', 'sd2');
  const sd3Col    = findCol(headers, 'SD3', '3 SD', '3SD', 'sd3');

  const isLengthBased = meta.metric === 'wfh';
  const keyCol = isLengthBased ? lenCol : ageCol;

  if (keyCol === -1) {
    // try first numeric column
    console.warn('  Could not find key column in headers:', headers.slice(0, 6));
  }

  const records = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const keyVal = parseFloat(row[keyCol !== -1 ? keyCol : 0]);
    if (isNaN(keyVal)) continue;

    const rec = {
      metric: meta.metric,
      gender: meta.gender,
      l: lCol   !== -1 ? parseFloat(row[lCol])   : undefined,
      m: mCol   !== -1 ? parseFloat(row[mCol])   : undefined,
      s: sCol   !== -1 ? parseFloat(row[sCol])   : undefined,
      sd3neg: sd3nCol !== -1 ? parseFloat(row[sd3nCol]) : undefined,
      sd2neg: sd2nCol !== -1 ? parseFloat(row[sd2nCol]) : undefined,
      sd1neg: sd1nCol !== -1 ? parseFloat(row[sd1nCol]) : undefined,
      sd0:    sd0Col  !== -1 ? parseFloat(row[sd0Col])  : undefined,
      sd1:    sd1Col  !== -1 ? parseFloat(row[sd1Col])  : undefined,
      sd2:    sd2Col  !== -1 ? parseFloat(row[sd2Col])  : undefined,
      sd3:    sd3Col  !== -1 ? parseFloat(row[sd3Col])  : undefined,
    };

    if (isLengthBased) rec.length = keyVal;
    else               rec.ageMonths = keyVal;

    // drop rows where all LMS/SD are NaN
    const hasData = ['l','m','s','sd0','sd2neg'].some(
      (k) => rec[k] !== undefined && !isNaN(rec[k])
    );
    if (hasData) records.push(rec);
  }
  return records;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function seedWHO() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const files = fs.readdirSync(WHO_DIR).filter((f) => f.endsWith('.xlsx'));
  console.log(`Found ${files.length} Excel files`);

  let totalInserted = 0;
  let totalSkipped  = 0;

  for (const file of files) {
    const meta = fileMeta(file);
    if (!meta) { console.log(`  [skip] ${file} (unrecognised pattern)`); totalSkipped++; continue; }
    if (!meta.isZscore) { console.log(`  [skip] ${file} (percentile table)`); totalSkipped++; continue; }

    const fullPath = path.join(WHO_DIR, file);
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(fullPath);

      const records = await parseSheet(workbook, meta);
      if (records.length === 0) {
        console.log(`  [empty] ${file}`);
        continue;
      }

      // Upsert to avoid duplicates on re-run
      for (const rec of records) {
        const filter = { metric: rec.metric, gender: rec.gender };
        if (rec.ageMonths !== undefined) filter.ageMonths = rec.ageMonths;
        if (rec.length    !== undefined) filter.length    = rec.length;

        await WHOReference.findOneAndUpdate(filter, rec, { upsert: true, new: true });
      }

      console.log(`  [ok] ${file} => ${records.length} records (${meta.metric}/${meta.gender})`);
      totalInserted += records.length;
    } catch (err) {
      console.error(`  [error] ${file}: ${err.message}`);
    }
  }

  console.log(`\nSeeding complete: ${totalInserted} records inserted, ${totalSkipped} files skipped`);
  await mongoose.disconnect();
}

seedWHO().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
