import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { hospitalAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const facilityTypes = [
  { value: 'all',         label: 'All Types'    },
  { value: 'hospital',    label: 'Hospitals'    },
  { value: 'clinic',      label: 'Clinics'      },
  { value: 'pharmacy',    label: 'Pharmacies'   },
  { value: 'health_post', label: 'Health Posts' },
  { value: 'doctors',     label: 'Doctors'      },
];

// "health_post" → "Health Post"
function humaniseType(raw = '') {
  return raw.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const HealthCentreDirectory = () => {
  const { t } = useLanguage();
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: '',
    state: '',
    type: 'all',
    emergency: false,
  });

  useEffect(() => {
    setLoading(true);
    hospitalAPI
      .list({
        district: filters.district || undefined,
        state: filters.state || undefined,
        type: filters.type,
        emergency: filters.emergency || undefined,
      })
      .then(res => setCentres(res.data?.hospitals || []))
      .catch(() => setCentres([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const summaryNumbers = useMemo(() => ({
    total:      centres.length,
    emergency:  centres.filter(c => c.hasEmergency).length,
    government: centres.filter(c => c.isGovernment).length,
    icu:        centres.filter(c => c.hasICU).length,
  }), [centres]);

  function setFilter(field, value) {
    setFilters(prev => ({ ...prev, [field]: value }));
  }

  return (
    <Layout role="admin">
      {/* overview numbers */}
      <div className="row g-3 mb-4">
        {[
          ['Total Centres',   summaryNumbers.total,      '#0891b2'],
          ['Emergency Ready', summaryNumbers.emergency,  '#dc2626'],
          ['Government',      summaryNumbers.government, '#059669'],
          ['ICU Support',     summaryNumbers.icu,        '#7c3aed'],
        ].map(([label, value, color]) => (
          <div className="col-12 col-sm-6 col-xl-3" key={label}>
            <div className="card h-100">
              <div className="card-body">
                <div className="small text-muted mb-2">{label}</div>
                <div className="fw-bold" style={{ fontSize: '1.9rem', color }}>{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* filter bar */}
      <div className="card mb-4">
        <div className="card-header">Database-backed Health Centre Directory</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small text-muted">{t('district') || 'District'}</label>
              <input
                className="form-control"
                value={filters.district}
                onChange={e => setFilter('district', e.target.value)}
                placeholder="Search district"
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small text-muted">{t('state') || 'State'}</label>
              <input
                className="form-control"
                value={filters.state}
                onChange={e => setFilter('state', e.target.value)}
                placeholder="Search state"
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small text-muted">Type</label>
              <select
                className="form-select"
                value={filters.type}
                onChange={e => setFilter('type', e.target.value)}
              >
                {facilityTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="d-inline-flex align-items-center gap-2 small fw-semibold" style={{ color: '#0e7490', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.emergency}
                  onChange={e => setFilter('emergency', e.target.checked)}
                />
                Show emergency-ready centres only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* results table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>{t('healthCentreDirectory') || 'Health Centre Directory'}</span>
          <span className="badge bg-info text-dark">{centres.length} results</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>{t('name') || 'Name'}</th>
                <th>Type</th>
                <th>{t('district') || 'District'}</th>
                <th>{t('state') || 'State'}</th>
                <th>Phone</th>
                <th>Services</th>
                <th>{t('status') || 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5">
                    {t('loading') || 'Loading'}...
                  </td>
                </tr>
              ) : centres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5">
                    No health centres found for the selected filters.
                  </td>
                </tr>
              ) : centres.map(centre => (
                <tr key={centre._id}>
                  <td>
                    <div className="fw-semibold">{centre.name}</div>
                    <div className="small text-muted">{centre.address || 'Address unavailable'}</div>
                  </td>
                  <td>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {humaniseType(centre.type)}
                    </span>
                  </td>
                  <td>{centre.district || '—'}</td>
                  <td>{centre.state || '—'}</td>
                  <td>{centre.phone || '—'}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      {centre.isGovernment && <span className="badge bg-success">Govt</span>}
                      {centre.hasEmergency && <span className="badge bg-danger">Emergency</span>}
                      {centre.hasICU && <span className="badge bg-dark">ICU</span>}
                      {!centre.isGovernment && <span className="badge bg-secondary">Private</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${centre.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {centre.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
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
