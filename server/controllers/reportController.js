const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Child = require('../models/Child');
const GrowthRecord = require('../models/GrowthRecord');
const Vaccination = require('../models/Vaccination');
const AshaWorker = require('../models/AshaWorker');

const canAccessChildReport = async (child, user) => {
  if (user.role === 'admin') return true;
  if (user.role === 'parent') return String(child.parentId?._id || child.parentId) === String(user._id);
  if (user.role === 'asha') {
    const asha = await AshaWorker.findOne({ userId: user._id });
    return !!asha && String(child.ashaId) === String(asha._id);
  }
  return false;
};

// GET /api/reports/child/:childId — child health report (PDF)
const childReportPDF = async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId).populate('parentId', 'name phone');
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const allowed = await canAccessChildReport(child, req.user);
    if (!allowed) return res.status(403).json({ message: 'Not authorized to access this report' });

    const growthRecords = await GrowthRecord.find({ childId: child._id }).sort('recordedDate');
    const vaccinations = await Vaccination.find({ childId: child._id }).sort('dueDate');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=health-report-${child._id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#1a6b3c').text('Sishu Arogaya — Child Health Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('#000').text(`Child: ${child.name}`);
    doc.text(`DOB: ${child.dob.toDateString()}`);
    doc.text(`Gender: ${child.gender}`);
    doc.text(`Parent: ${child.parentId?.name || 'N/A'}`);
    doc.text(`Nutrition Status: ${child.nutritionStatus.toUpperCase()}`);
    doc.moveDown();

    doc.fontSize(16).fillColor('#1a6b3c').text('Growth Records');
    doc.fontSize(12).fillColor('#000');
    growthRecords.forEach((r) => {
      doc.text(`${r.recordedDate.toDateString()} — Weight: ${r.weight}kg, Height: ${r.height}cm, Status: ${r.prediction}`);
    });
    doc.moveDown();

    doc.fontSize(16).fillColor('#1a6b3c').text('Vaccination Schedule');
    doc.fontSize(12).fillColor('#000');
    vaccinations.forEach((v) => {
      doc.text(`${v.vaccineName} — Due: ${v.dueDate.toDateString()} — Status: ${v.status}`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/district/:districtId — district report (Excel)
const districtReportExcel = async (req, res) => {
  try {
    if (req.user.role === 'asha') {
      const asha = await AshaWorker.findOne({ userId: req.user._id });
      if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
      if (asha.district !== req.params.districtId) {
        return res.status(403).json({ message: 'Not authorized to access another district report' });
      }
    }

    const children = await Child.find({ district: req.params.districtId })
      .populate('parentId', 'name phone')
      .populate('ashaId', 'ashaId block');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('District Health Report');

    sheet.columns = [
      { header: 'Child Name', key: 'name', width: 20 },
      { header: 'DOB', key: 'dob', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Block', key: 'block', width: 15 },
      { header: 'Weight (kg)', key: 'weight', width: 12 },
      { header: 'Height (cm)', key: 'height', width: 12 },
      { header: 'Nutrition Status', key: 'status', width: 18 },
      { header: 'Parent', key: 'parent', width: 20 },
      { header: 'ASHA ID', key: 'asha', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a6b3c' } };

    children.forEach((c) => {
      sheet.addRow({
        name: c.name,
        dob: c.dob.toDateString(),
        gender: c.gender,
        block: c.block,
        weight: c.currentWeight,
        height: c.currentHeight,
        status: c.nutritionStatus,
        parent: c.parentId?.name,
        asha: c.ashaId?.ashaId,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=district-report-${req.params.districtId}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { childReportPDF, districtReportExcel };
