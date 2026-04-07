const DietChecklist = require('../models/DietChecklist');

/**
 * GET /api/diet/checklist?childId=&date=YYYY-MM-DD
 * Returns the checklist for a specific child and date.
 * If no record exists for today → returns { checks: [] } (fresh start = auto-reset).
 */
exports.getChecklist = async (req, res) => {
  try {
    const { childId, date } = req.query;
    if (!childId || !date) return res.status(400).json({ message: 'childId and date are required.' });

    const record = await DietChecklist.findOne({
      userId:  req.user._id,
      childId,
      date,
    });

    // No record for today = fresh/reset day
    if (!record) return res.json({ checks: [], notes: '', completedAt: null, isNew: true });

    res.json({
      checks:      record.checks,
      notes:       record.notes,
      completedAt: record.completedAt,
      isNew:       false,
    });
  } catch (err) {
    console.error('getChecklist error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * PUT /api/diet/checklist
 * Body: { childId, date, ageGroup, checks, notes, totalItems }
 * Upserts the checklist; marks completedAt when all items are checked.
 */
exports.saveChecklist = async (req, res) => {
  try {
    const { childId, date, ageGroup, checks = [], notes = '', totalItems = 0 } = req.body;
    if (!childId || !date || !ageGroup) return res.status(400).json({ message: 'childId, date and ageGroup are required.' });

    const allDone = totalItems > 0 && checks.length >= totalItems;

    const record = await DietChecklist.findOneAndUpdate(
      { userId: req.user._id, childId, date },
      {
        $set: {
          ageGroup,
          checks,
          notes,
          completedAt: allDone ? (new Date()) : null,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      checks:      record.checks,
      notes:       record.notes,
      completedAt: record.completedAt,
      allDone,
    });
  } catch (err) {
    console.error('saveChecklist error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/diet/checklist/streak?childId=
 * Returns how many consecutive days the checklist was fully completed.
 */
exports.getStreak = async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ message: 'childId required.' });

    // Get last 30 completed records, sorted newest first
    const records = await DietChecklist.find({
      userId:      req.user._id,
      childId,
      completedAt: { $ne: null },
    }).sort({ date: -1 }).limit(30);

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const rec of records) {
      const recDate = new Date(rec.date + 'T00:00:00');
      const diffDays = Math.round((cursor - recDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        streak++;
        cursor = recDate;
      } else {
        break;
      }
    }

    res.json({ streak, total: records.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
