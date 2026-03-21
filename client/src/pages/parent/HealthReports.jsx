import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { reportAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';

const HealthReports = () => {
  const { children, selectedChild, selectedChildId, setSelectedChild, loading } = useSelectedChild();
  const [downloading, setDownloading] = useState(null);

  const downloadPDF = async (childId, name) => {
    setDownloading(childId);
    try {
      const res = await reportAPI.childPDF(childId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}-health-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Layout role="parent">
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3 flex-wrap">
        <h4 className="fw-bold mb-0">
          <i className="bi bi-file-earmark-pdf me-2 text-danger"></i>
          Health Reports
        </h4>
        {children.length > 1 && (
          <select
            className="form-select"
            style={{ maxWidth: 260 }}
            value={selectedChildId}
            onChange={(e) => setSelectedChild(e.target.value)}
          >
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
        </div>
      ) : children.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-file-x fs-1"></i>
          <p className="mt-2">No children registered.</p>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-md-7 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{ width: 52, height: 52 }}
                >
                  <i className="bi bi-person-fill text-success fs-3"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0">{selectedChild?.name}</h6>
                  <span className="text-muted small">
                    {selectedChild?.ageInMonths || 0} months · {selectedChild?.gender}
                  </span>
                </div>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => downloadPDF(selectedChild._id, selectedChild.name)}
                  disabled={downloading === selectedChild?._id}
                >
                  {downloading === selectedChild?._id ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <i className="bi bi-download me-1"></i>PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HealthReports;
