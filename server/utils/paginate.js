// Admin lists are paged so one request can't pull every record (50k children = 34 MB).
// ?page=1&limit=100 (max 500). The body stays a plain array; the total goes in X-Total-Count.
function pageParams(query, defaultLimit = 100) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 500);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  return { limit, skip: (page - 1) * limit };
}

// Totals for admin lists ("1–100 of 50,000"). Counting 50k–750k rows on every page view swamped MongoDB
// under load, so each total is kept for 30 s; an unfiltered total uses the collection's instant estimate.
// `key` must identify the filter (use the request's query params, not the filter: RegExps don't stringify).
const { cached } = require('./cache');

function countCached(Model, filter, key) {
  return cached(`count:${Model.modelName}:${key}`, 30_000, () =>
    (Object.keys(filter).length ? Model.countDocuments(filter) : Model.estimatedDocumentCount()));
}

// Cache key for a list: its query params minus paging
const countKey = (query) => JSON.stringify(Object.entries(query).filter(([k]) => k !== 'page' && k !== 'limit').sort());

module.exports = { pageParams, countCached, countKey };
