const mongoose = require('mongoose');

// One pregnancy in an ASHA's area, from registration through delivery and the 42-day postnatal period
const signs = { type: [{ type: String, trim: true, maxlength: 100 }], validate: (v) => v.length <= 20 };

const ancVisitSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    weight: { type: Number, min: 25, max: 150 }, // kg
    bpSys: { type: Number, min: 60, max: 250 },
    bpDia: { type: Number, min: 30, max: 150 },
    hb: { type: Number, min: 3, max: 20 }, // g/dL
    ifaTablets: { type: Number, min: 0, max: 400 }, // iron-folic acid given this visit
    calciumTablets: { type: Number, min: 0, max: 400 },
    tdDose: { type: String, enum: ['', 'Td1', 'Td2', 'Booster'], default: '' },
    dangerSigns: signs,
    notes: { type: String, trim: true, maxlength: 1000 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const pncVisitSchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 60 }, // HBNC day this visit covers (1, 3, 7 … 42)
    date: { type: Date, default: Date.now },
    breastfeeding: { type: Boolean },
    motherDangerSigns: signs,
    babyDangerSigns: signs,
    babyWeight: { type: Number, min: 0.5, max: 8 },
    notes: { type: String, trim: true, maxlength: 1000 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const pregnancySchema = new mongoose.Schema(
  {
    ashaId: { type: mongoose.Schema.Types.ObjectId, ref: 'AshaWorker', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    womanName: { type: String, required: true, trim: true, maxlength: 100 },
    husbandName: { type: String, trim: true, maxlength: 100 },
    age: { type: Number, min: 10, max: 60 },
    phone: { type: String, trim: true, maxlength: 15 },
    village: { type: String, trim: true, maxlength: 100 },
    rchId: { type: String, trim: true, maxlength: 30 }, // RCH / MCP card number
    lmp: { type: Date, required: true }, // first day of last menstrual period
    edd: { type: Date }, // expected delivery date (LMP + 280 days unless corrected by ultrasound)
    gravida: { type: Number, min: 1, max: 20 }, // pregnancies including this one
    para: { type: Number, min: 0, max: 20 }, // previous births
    historyRisks: { type: [{ type: String, trim: true, maxlength: 100 }], validate: (v) => v.length <= 20 },
    ancVisits: [ancVisitSchema],
    status: { type: String, enum: ['pregnant', 'delivered', 'closed'], default: 'pregnant' },
    closeReason: { type: String, enum: ['', 'Miscarriage / abortion', 'Migrated', 'Maternal death', 'Other'], default: '' },
    delivery: {
      date: Date,
      place: { type: String, enum: ['institutional', 'home'] },
      facility: { type: String, trim: true, maxlength: 200 },
      outcome: { type: String, enum: ['live', 'stillbirth'] },
      babyGender: { type: String, enum: ['male', 'female'] },
      birthWeight: { type: Number, min: 0.3, max: 6 },
      childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' }, // newborn registered as a child
    },
    pncVisits: [pncVisitSchema],
  },
  { timestamps: true }
);

pregnancySchema.index({ ashaId: 1, status: 1, lmp: 1 });

module.exports = mongoose.model('Pregnancy', pregnancySchema);
