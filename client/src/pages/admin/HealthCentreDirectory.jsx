import React from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';

// Static PHC/CHC data for Uttarakhand district — replace with DB in production
const CENTRES = [
  { name:'Primary Health Centre Pauri',   type:'PHC', block:'Pauri',    contact:'01368-222xxx', services:'OPD, Immunisation, Maternal Care' },
  { name:'Community Health Centre Kotdwar', type:'CHC', block:'Kotdwar', contact:'01382-222xxx', services:'IPD, Surgery, Lab, Radiology' },
  { name:'PHC Lansdowne',                 type:'PHC', block:'Lansdowne', contact:'01386-222xxx', services:'OPD, Immunisation' },
  { name:'PHC Dugadda',                   type:'PHC', block:'Dugadda',  contact:'01368-333xxx', services:'OPD, Maternal Care' },
  { name:'Sub-District Hospital Pauri',   type:'SDH', block:'Pauri',    contact:'01368-111xxx', services:'Full spectrum — IPD, ICU, Surgery' },
];

const HealthCentreDirectory = () => {
  const { t } = useLanguage();
  return (
  <Layout role="admin">
    <h4 className="fw-bold mb-4"><i className="bi bi-hospital me-2 text-info"></i>{t('healthCentreDirectory')}</h4>
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead><tr><th>{t('name')}</th><th>Type</th><th>{t('block')}</th><th>Contact</th><th>Services</th></tr></thead>
          <tbody>
            {CENTRES.map((c,i)=>(
              <tr key={i}>
                <td className="fw-semibold">{c.name}</td>
                <td><span className={`badge ${c.type==='PHC'?'bg-primary':c.type==='CHC'?'bg-success':'bg-info'}`}>{c.type}</span></td>
                <td>{c.block}</td>
                <td><a href={`tel:${c.contact}`}>{c.contact}</a></td>
                <td className="small text-muted">{c.services}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
  );
};

export default HealthCentreDirectory;
