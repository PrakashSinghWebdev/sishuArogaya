import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const AnalyticsReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminAPI.getDashboard().then(r=>setStats(r.data)).catch(console.error).finally(()=>setLoading(false)); }, []);

  const blocks = stats?.blockStats?.map(b=>b._id)||[];
  const barData = {labels:blocks,datasets:[{label:'Severe',data:stats?.blockStats?.map(b=>b.severe)||[],backgroundColor:'#dc3545'},{label:'Moderate',data:stats?.blockStats?.map(b=>b.moderate)||[],backgroundColor:'#ffc107'},{label:'Total',data:stats?.blockStats?.map(b=>b.total)||[],backgroundColor:'#1a6b3c66'}]};

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-bar-chart-line me-2 text-primary"></i>Analytics & Reports</h4>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> : (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 fw-semibold">Block-wise Health Overview</div>
              <div className="card-body" style={{height:320}}>
                <Bar data={barData} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}}}} />
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 fw-semibold">KPI Summary</div>
              <div className="card-body">
                {[{l:'Total Children',v:stats?.totalChildren},{l:'ASHA Workers',v:stats?.totalAshaWorkers},{l:'Malnutrition Cases',v:stats?.malnutritionCases},{l:'Missed Vaccines',v:stats?.missedVaccinations}].map(k=>(
                  <div key={k.l} className="d-flex justify-content-between py-2 border-bottom"><span className="text-muted small">{k.l}</span><span className="fw-bold">{k.v||0}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AnalyticsReports;
