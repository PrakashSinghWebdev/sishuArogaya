const { findAnswer } = require('../data/chatbotKnowledge');

// POST /api/chatbot/query
const query = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }
    const answer = findAnswer(message.trim());
    res.json({ answer, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { query };
