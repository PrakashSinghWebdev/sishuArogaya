// Prev/Next for server-paged admin lists (total comes from the X-Total-Count header)
const Pager = ({ page, limit, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return null;
  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-top small text-muted">
      <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString('en-IN')}</span>
      <div className="d-flex gap-2 align-items-center">
        <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</button>
        <span>Page {page} / {pages}</span>
        <button className="btn btn-sm btn-outline-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next ›</button>
      </div>
    </div>
  );
};

export const totalOf = (res) => Number(res.headers['x-total-count']) || res.data.length;

export default Pager;
