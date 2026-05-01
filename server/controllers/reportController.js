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
    const { type = 'comprehensive' } = req.query;
    const child = await Child.findById(req.params.childId).populate('parentId', 'name phone');
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const allowed = await canAccessChildReport(child, req.user);
    if (!allowed) return res.status(403).json({ message: 'Not authorized to access this report' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${child.name.replace(/\s+/g, '-')}.pdf`);
    doc.pipe(res);

    // Header Decoration
    doc.rect(0, 0, 612, 100).fill('#0891b2'); 
    doc.fontSize(24).fillColor('#ffffff').text('SISHU AROGAYA', 50, 40, { characterSpacing: 1 });
    doc.fontSize(10).text('National Integrated Child Health Monitoring System', 51, 68);
    doc.moveDown(4);

    // Title
    const titleMap = {
      comprehensive: 'Comprehensive Health Report',
      vaccination: 'Vaccination Status Report',
      growth: 'Growth Monitoring Report'
    };
    doc.fontSize(18).fillColor('#0e7490').text(titleMap[type] || titleMap.comprehensive, { underline: true });
    doc.moveDown();

    // Child Info Section
    doc.fontSize(12).fillColor('#333333').text(`Child Name: `, { continued: true }).fillColor('#000000').text(child.name);
    doc.fillColor('#333333').text(`Date of Birth: `, { continued: true }).fillColor('#000000').text(child.dob.toDateString());
    doc.fillColor('#333333').text(`Gender: `, { continued: true }).fillColor('#000000').text(child.gender);
    doc.fillColor('#333333').text(`Parent/Guardian: `, { continued: true }).fillColor('#000000').text(child.parentId?.name || 'N/A');
    doc.fillColor('#333333').text(`Nutrition Status: `, { continued: true }).fillColor('#000000').text(child.nutritionStatus.toUpperCase());
    doc.moveDown();
    doc.path('M 50 240 L 550 240').lineWidth(1).strokeColor('#cffafe').stroke();
    doc.moveDown();

    // Conditional Sections
    if (type === 'comprehensive' || type === 'growth') {
      const growthRecords = await GrowthRecord.find({ childId: child._id }).sort('recordedDate');
      doc.fontSize(16).fillColor('#0e7490').text('Growth Records History');
      doc.moveDown(0.5);
      
      if (growthRecords.length === 0) {
        doc.fontSize(11).fillColor('#666').text('No growth records found.');
      } else {
        growthRecords.forEach((r, i) => {
          doc.fontSize(11).fillColor('#333').text(`${i + 1}. ${r.recordedDate.toDateString()}`, { continued: true });
          doc.fillColor('#444').text(` — Weight: ${r.weight}kg, Height: ${r.height}cm, Status: `, { continued: true });
          doc.fillColor((r.prediction === 'healthy' || r.prediction === 'normal') ? '#059669' : '#b91c1c').text(r.prediction.toUpperCase());
        });
      }
      doc.moveDown();
    }

    if (type === 'comprehensive' || type === 'vaccination') {
      const vaccinations = await Vaccination.find({ childId: child._id }).sort('dueDate');
      doc.fontSize(16).fillColor('#0e7490').text('Vaccination Schedule');
      doc.moveDown(0.5);

      if (vaccinations.length === 0) {
        doc.fontSize(11).fillColor('#666').text('No vaccination records found.');
      } else {
        vaccinations.forEach((v, i) => {
          doc.fontSize(11).fillColor('#333').text(`${i + 1}. ${v.vaccineName}`, { continued: true });
          doc.fillColor('#444').text(` — Due: ${v.dueDate.toDateString()} — Status: `, { continued: true });
          doc.fillColor((v.status === 'done' || v.status === 'completed') ? '#059669' : '#b45309').text(v.status.toUpperCase());
        });
      }
    }

    // Footer
    doc.fontSize(10).fillColor('#999').text(`Generated on ${new Date().toLocaleString()}`, 50, 750, { align: 'center' });
    doc.text('This is a computer-generated report and does not require a signature.', { align: 'center' });

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
