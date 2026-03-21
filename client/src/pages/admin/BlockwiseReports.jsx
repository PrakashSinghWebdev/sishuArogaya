import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { adminAPI, reportAPI } from '../../services/api';

const BlockwiseReports = () => {
  const [stats, setStats] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => { adminAPI.getDashboard().then(r=>setStats(r.data)).catch(console.error); }, []);

  const download = async (district) => {
    setDownloading(district);
    try {
      const res = await reportAPI.districtExcel(district);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href=url; link.setAttribute('download',`${district}-report.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch { alert('Failed to generate report.'); }
    finally { setDownloading(null); }
  };

  const blocks = stats?.blockStats || [];

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-file-earmark-excel me-2 text-success"></i>Block-wise Reports</h4>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead><tr><th>Block</th><th>Total Children</th><th>Moderate</th><th>Severe</th><th>Action</th></tr></thead>
            <tbody>
              {blocks.length===0?<tr><td colSpan={5} className="text-muted text-center py-4">No block data available.</td></tr>:blocks.map((b,i)=>(
                <tr key={i}>
                  <td className="fw-semibold">{b._id||'Unknown'}</td>
                  <td>{b.total}</td>
                  <td><span className="badge bg-warning text-dark">{b.moderate}</span></td>
                  <td><span className="badge bg-danger">{b.severe}</span></td>
                  <td><button className="btn btn-sm btn-outline-success" onClick={()=>download(b._id)} disabled={downloading===b._id}>{downloading===b._id?'...':<><i className="bi bi-download me-1"></i>Excel</>}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default BlockwiseReports;
