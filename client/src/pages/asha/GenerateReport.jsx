import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI, reportAPI } from '../../services/api';

const GenerateReport = () => {
  const [profile, setProfile] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { ashaAPI.getProfile().then(r=>setProfile(r.data)).catch(console.error); }, []);

  const download = async () => {
    if (!profile?.district) return;
    setDownloading(true);
    try {
      const res = await reportAPI.districtExcel(profile.district);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `field-report-${profile.district}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch { alert('Failed to generate report.'); }
    finally { setDownloading(false); }
  };

  return (
    <Layout role="asha">
      <h4 className="fw-bold mb-4"><i className="bi bi-file-earmark-bar-graph me-2 text-purple"></i>Generate Report</h4>
      <div className="card border-0 shadow-sm" style={{maxWidth:480}}>
        <div className="card-body p-4 text-center">
          <i className="bi bi-file-earmark-excel text-success" style={{fontSize:60}}></i>
          <h5 className="fw-bold mt-3">Monthly Field Report</h5>
          <p className="text-muted small mb-4">Download an Excel report of all children in your district with health status, growth records, and vaccination data.</p>
          {profile && <div className="mb-3 text-muted small"><strong>District:</strong> {profile.district} · <strong>Block:</strong> {profile.block}</div>}
          <button className="btn btn-sa-primary w-100" onClick={download} disabled={downloading}>
            {downloading?<><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>:<><i className="bi bi-download me-2"></i>Download Excel Report</>}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default GenerateReport;
