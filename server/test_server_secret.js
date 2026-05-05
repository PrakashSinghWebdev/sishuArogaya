require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('Server JWT_SECRET:', process.env.JWT_SECRET);

// Try to create and verify a token
const secret = process.env.JWT_SECRET;
const token = jwt.sign(
  { id: 'test123', email: 'test@example.com' },
  secret,
  { expiresIn: '1h' }
);

console.log('Token created');

try {
  const decoded = jwt.verify(token, secret);
  console.log('Token verified successfully');
  console.log('Decoded:', decoded);
} catch (err) {
  console.error('Token verification failed:', err.message);
}
