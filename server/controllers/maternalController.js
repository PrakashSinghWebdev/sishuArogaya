const mongoose = require('mongoose');
const Pregnancy = require('../models/Pregnancy');
const Child = require('../models/Child');
const AshaWorker = require('../models/AshaWorker');
const { createAuditLog } = require('../utils/auditLogger');
const { createReferral } = require('./referralController');
const { createVaccinationSchedule } = require('./childController');
const { HISTORY_RISKS, PNC_DAYS, eddFromLmp, summarize } = require('../utils/maternal');
const { pageParams } = require('../utils/paginate');

const DAY = 864e5;
const num = (v) => (v === '' || v == null ? undefined : Number(v));
const list = (v) => (Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 20) : []);
const withSummary = (p) => ({ ...p, summary: summarize(p) });

const ashaOf = (user) => AshaWorker.findOne({ userId: user._id }).select('_id ashaId state district block');

// Load a pregnancy the caller may act on: the owning ASHA (or any admin, read-only routes)
async function findOwn(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Invalid record' }); return {}; }
  const asha = await ashaOf(req.user);
  if (!asha) { res.status(404).json({ message: 'ASHA profile not found' }); return {}; }
  const pregnancy = await Pregnancy.findOne({ _id: req.params.id, ashaId: asha._id });
  if (!pregnancy) { res.status(404).json({ message: 'Pregnancy record not found' }); return {}; }
  return { asha, pregnancy };
}

// GET /api/maternal — ASHA: her register with due ANC/PNC and risk flags. Admin: all,
// paged, ?status=&highRisk=true
const listPregnancies = async (req, res) => {
  try {
    if (req.user.role === 'asha') {
      const asha = await ashaOf(req.user);
      if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
      const rows = await Pregnancy.find({ ashaId: asha._id }).sort({ status: 1, lmp: 1 }).limit(1000).lean();
      return res.json(rows.map(withSummary));
    }
    const filter = req.query.status ? { status: String(req.query.status) } : {};
    const { limit, skip } = pageParams(req.query);
    const [rows, total] = await Promise.all([
      Pregnancy.find(filter).sort({ lmp: 1 }).skip(skip).limit(limit)
        .populate({ path: 'ashaId', select: 'ashaId district block userId', populate: { path: 'userId', select: 'name phone' } }).lean(),
      Pregnancy.countDocuments(filter),
    ]);
    let out = rows.map(withSummary);
    if (req.query.highRisk === 'true') out = out.filter((p) => p.summary.risk.high.length); // ponytail: filters the page only
    res.set('X-Total-Count', total).json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/maternal/:id
const getPregnancy = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid record' });
    const filter = { _id: req.params.id };
    if (req.user.role === 'asha') {
      const asha = await ashaOf(req.user);
      if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
      filter.ashaId = asha._id;
    }
    const p = await Pregnancy.findOne(filter).populate('delivery.childId', 'name childId').lean();
    if (!p) return res.status(404).json({ message: 'Pregnancy record not found' });
    res.json(withSummary(p));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/maternal — register a pregnancy
const registerPregnancy = async (req, res) => {
  try {
    const asha = await ashaOf(req.user);
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    const { womanName, husbandName, age, phone, village, rchId, lmp, edd, gravida, para, historyRisks } = req.body;
    if (!womanName || !String(womanName).trim()) return res.status(400).json({ message: "Woman's name is required" });
    const lmpDate = new Date(lmp);
    if (!lmp || Number.isNaN(lmpDate.getTime())) return res.status(400).json({ message: 'Date of last period (LMP) is required' });
    if (lmpDate > new Date()) return res.status(400).json({ message: 'LMP cannot be in the future' });
    if (Date.now() - lmpDate > 300 * DAY) return res.status(400).json({ message: 'LMP is more than 300 days ago — check the date' });
    const pregnancy = await Pregnancy.create({
      ashaId: asha._id,
      createdBy: req.user._id,
      womanName, husbandName, village, rchId,
      age: num(age),
      phone: phone ? String(phone).replace(/\D/g, '') : undefined,
      lmp: lmpDate,
      edd: edd ? new Date(edd) : eddFromLmp(lmpDate),
      gravida: num(gravida),
      para: num(para),
      historyRisks: list(historyRisks).filter((r) => HISTORY_RISKS.includes(r)),
    });
    await createAuditLog({ req, action: 'PREGNANCY_REGISTERED', entityType: 'Pregnancy', entityId: pregnancy._id, details: `${req.user.name} registered pregnancy of ${pregnancy.womanName}` });
    res.status(201).json(withSummary(pregnancy.toObject()));
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

// PATCH /api/maternal/:id — correct details, or close the record ({ status: 'closed', closeReason })
const updatePregnancy = async (req, res) => {
  try {
    const { pregnancy } = await findOwn(req, res);
    if (!pregnancy) return undefined;
    for (const f of ['womanName', 'husbandName', 'village', 'rchId']) if (req.body[f] !== undefined) pregnancy[f] = req.body[f];
    for (const f of ['age', 'gravida', 'para']) if (req.body[f] !== undefined) pregnancy[f] = num(req.body[f]);
    if (req.body.phone !== undefined) pregnancy.phone = String(req.body.phone).replace(/\D/g, '');
    if (req.body.edd) pregnancy.edd = new Date(req.body.edd);
    if (req.body.historyRisks) pregnancy.historyRisks = list(req.body.historyRisks).filter((r) => HISTORY_RISKS.includes(r));
    if (req.body.status === 'closed') { pregnancy.status = 'closed'; pregnancy.closeReason = req.body.closeReason || 'Other'; }
    await pregnancy.save();
    await createAuditLog({ req, action: 'PREGNANCY_UPDATED', entityType: 'Pregnancy', entityId: pregnancy._id, details: `${req.user.name} updated pregnancy of ${pregnancy.womanName}`, metadata: { fields: Object.keys(req.body) } });
    res.json(withSummary(pregnancy.toObject()));
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

// Danger signs open an emergency referral straight away, so they can't be recorded and forgotten
const referDangerSigns = (req, asha, who, signs, facility) => (signs.length
  ? createReferral({ req, asha, ...who, reason: `Danger signs: ${signs.join(', ')}`, urgency: 'emergency', facility })
  : null);

// POST /api/maternal/:id/anc — antenatal check-up
const addAncVisit = async (req, res) => {
  try {
    const { asha, pregnancy } = await findOwn(req, res);
    if (!pregnancy) return undefined;
    if (pregnancy.status !== 'pregnant') return res.status(400).json({ message: 'This pregnancy is no longer active' });
    const b = req.body;
    const date = b.date ? new Date(b.date) : new Date();
    if (Number.isNaN(date.getTime()) || date > new Date() || date < pregnancy.lmp) return res.status(400).json({ message: 'Visit date must be between LMP and today' });
    const visit = {
      date,
      weight: num(b.weight), bpSys: num(b.bpSys), bpDia: num(b.bpDia), hb: num(b.hb),
      ifaTablets: num(b.ifaTablets), calciumTablets: num(b.calciumTablets),
      tdDose: ['Td1', 'Td2', 'Booster'].includes(b.tdDose) ? b.tdDose : '',
      dangerSigns: list(b.dangerSigns),
      notes: b.notes,
      recordedBy: req.user._id,
    };
    pregnancy.ancVisits.push(visit);
    await pregnancy.save();
    const referral = await referDangerSigns(req, asha, { pregnancy }, visit.dangerSigns, b.facility);
    await createAuditLog({ req, action: 'ANC_VISIT_RECORDED', entityType: 'Pregnancy', entityId: pregnancy._id, details: `${req.user.name} recorded ANC for ${pregnancy.womanName}`, metadata: { dangerSigns: visit.dangerSigns } });
    res.status(201).json({ ...withSummary(pregnancy.toObject()), referralId: referral?._id });
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

// POST /api/maternal/:id/delivery — outcome; registers the newborn as a child (with vaccine schedule) if asked
const recordDelivery = async (req, res) => {
  try {
    const { asha, pregnancy } = await findOwn(req, res);
    if (!pregnancy) return undefined;
    if (pregnancy.status !== 'pregnant') return res.status(400).json({ message: 'Delivery is already recorded or the record is closed' });
    const b = req.body;
    const date = b.date ? new Date(b.date) : new Date();
    if (Number.isNaN(date.getTime()) || date > new Date() || date < pregnancy.lmp) return res.status(400).json({ message: 'Delivery date must be between LMP and today' });
    if (!['institutional', 'home'].includes(b.place)) return res.status(400).json({ message: 'Place of delivery is required' });
    if (!['live', 'stillbirth'].includes(b.outcome)) return res.status(400).json({ message: 'Delivery outcome is required' });
    pregnancy.delivery = {
      date, place: b.place, facility: b.facility, outcome: b.outcome,
      babyGender: ['male', 'female'].includes(b.babyGender) ? b.babyGender : undefined,
      birthWeight: num(b.birthWeight),
    };
    pregnancy.status = 'delivered';

    let child = null;
    if (b.outcome === 'live' && b.registerBaby && pregnancy.delivery.babyGender) {
      child = await Child.create({
        name: String(b.babyName || '').trim() || `Baby of ${pregnancy.womanName}`,
        dob: date,
        gender: pregnancy.delivery.babyGender,
        birthWeight: pregnancy.delivery.birthWeight,
        motherName: pregnancy.womanName,
        fatherName: pregnancy.husbandName,
        contactPhone: pregnancy.phone,
        village: pregnancy.village,
        ashaId: asha._id,
        state: asha.state, district: asha.district, block: asha.block,
      });
      await createVaccinationSchedule(child);
      await AshaWorker.updateOne({ _id: asha._id }, { $addToSet: { assignedChildren: child._id } });
      pregnancy.delivery.childId = child._id;
    }
    await pregnancy.save();
    await createAuditLog({ req, action: 'DELIVERY_RECORDED', entityType: 'Pregnancy', entityId: pregnancy._id, details: `${req.user.name} recorded ${b.place} delivery for ${pregnancy.womanName}`, metadata: { outcome: b.outcome, childId: child?._id } });
    res.status(201).json({ ...withSummary(pregnancy.toObject()), childId: child?._id });
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

// POST /api/maternal/:id/pnc — postnatal home visit (HBNC)
const addPncVisit = async (req, res) => {
  try {
    const { asha, pregnancy } = await findOwn(req, res);
    if (!pregnancy) return undefined;
    if (pregnancy.status !== 'delivered') return res.status(400).json({ message: 'Record the delivery first' });
    const b = req.body;
    const day = num(b.day);
    if (![1, ...PNC_DAYS].includes(day)) return res.status(400).json({ message: 'Choose the postnatal visit day' });
    const visit = {
      day,
      date: b.date ? new Date(b.date) : new Date(),
      breastfeeding: b.breastfeeding === undefined ? undefined : Boolean(b.breastfeeding),
      motherDangerSigns: list(b.motherDangerSigns),
      babyDangerSigns: list(b.babyDangerSigns),
      babyWeight: num(b.babyWeight),
      notes: b.notes,
      recordedBy: req.user._id,
    };
    pregnancy.pncVisits.push(visit);
    await pregnancy.save();
    const referrals = [await referDangerSigns(req, asha, { pregnancy }, visit.motherDangerSigns, b.facility)];
    if (visit.babyDangerSigns.length) {
      const baby = pregnancy.delivery?.childId ? await Child.findById(pregnancy.delivery.childId).select('name') : null;
      // Unregistered newborn: refer under the mother's record so it is still tracked
      referrals.push(await createReferral({ req, asha, ...(baby ? { child: baby } : { pregnancy }), reason: `Newborn danger signs: ${visit.babyDangerSigns.join(', ')}`, urgency: 'emergency', facility: b.facility }));
    }
    await createAuditLog({ req, action: 'PNC_VISIT_RECORDED', entityType: 'Pregnancy', entityId: pregnancy._id, details: `${req.user.name} recorded day-${day} postnatal visit for ${pregnancy.womanName}` });
    res.status(201).json({ ...withSummary(pregnancy.toObject()), referralIds: referrals.filter(Boolean).map((r) => r._id) });
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

module.exports = { listPregnancies, getPregnancy, registerPregnancy, updatePregnancy, addAncVisit, recordDelivery, addPncVisit };
