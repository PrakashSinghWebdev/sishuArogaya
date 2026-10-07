// Escape user input before building a RegExp (prevents crashes on '(' and ReDoS)
module.exports = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
