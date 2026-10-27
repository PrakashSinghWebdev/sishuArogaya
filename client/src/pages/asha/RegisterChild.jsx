import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ashaAPI, childAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, isoDay } from './fieldUi';

const BLOOD_GROUPS = ['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const blank = { name: '', dob: '', gender: '', motherName: '', fatherName: '', contactPhone: '', village: '', birthWeight: '', bloodGroup: 'Unknown' };
const norm = (s) => String(s || '').trim().toLowerCase();

// ASHA registers a child in her area; the server assigns it to her and creates the vaccination schedule
export default function RegisterChild() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [existing, setExisting] = useState([]);
  const [duplicate, setDuplicate] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { ashaAPI.getMyChildren().then((r) => setExisting(r.data || [])).catch(() => {}); }, []);

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setDuplicate(null); };

  async function submit(e, confirmed = false) {
    e?.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(form.contactPhone.replace(/\D/g, '')) && form.contactPhone) return setError(t('phoneInvalid'));
    // Same name and birth date within 3 days in this caseload: probably already registered
    const match = existing.find((c) => norm(c.name) === norm(form.name) && Math.abs(new Date(c.dob) - new Date(form.dob)) <= 3 * 864e5);
    if (match && !confirmed) return setDuplicate(match);
    setBusy(true);
    try {
      const { data } = await childAPI.add({
        ...form,
        contactPhone: form.contactPhone.replace(/\D/g, '') || undefined,
        birthWeight: form.birthWeight ? Number(form.birthWeight) : undefined,
      });
      navigate(`/asha/child/${data.child._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register the child');
      setBusy(false);
    }
  }

  const field = (key, label, props = {}) => (
    <div className="col-md-6">
      <label className="form-label small fw-semibold" htmlFor={`rc-${key}`}>{label}{props.required ? ' *' : ''}</label>
      <input id={`rc-${key}`} className="form-control form-control-lg" value={form[key]} onChange={set(key)} {...props} />
    </div>
  );

  return (
    <Layout role="asha">
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/asha/families" className="btn btn-sm btn-outline-secondary"><i className="bi bi-arrow-left"></i></Link>
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-person-plus me-2" style={{ color: palette.primary }}></i>{t('registerChild')}</h4>
      </div>
      <form onSubmit={submit} className="card border-0 shadow-sm p-3" style={{ maxWidth: 760 }}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="row g-3">
          {field('name', t('childName'), { required: true, maxLength: 100, autoComplete: 'off' })}
          {field('dob', t('dob'), { required: true, type: 'date', max: isoDay(0) })}
          <div className="col-md-6">
            <span className="form-label small fw-semibold d-block">{t('gender')} *</span>
            <div className="btn-group w-100" role="group">
              {[['female', '♀ ' + t('girl')], ['male', '♂ ' + t('boy')]].map(([g, label]) => (
                <button type="button" key={g} className={`btn btn-lg ${form.gender === g ? 'btn-sa-primary' : 'btn-outline-secondary'}`} onClick={() => { setForm((f) => ({ ...f, gender: g })); setDuplicate(null); }}>{label}</button>
              ))}
            </div>
          </div>
          {field('birthWeight', `${t('birthWeight')} (kg)`, { type: 'number', step: '0.01', min: '0.5', max: '6', inputMode: 'decimal' })}
          {field('motherName', t('mother'), { required: true, maxLength: 100 })}
          {field('fatherName', t('father'), { maxLength: 100 })}
          {field('contactPhone', t('phone2'), { type: 'tel', inputMode: 'numeric', maxLength: 14, placeholder: '9876543210' })}
          {field('village', t('village'), { maxLength: 100 })}
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="rc-blood">{t('bloodGroup')}</label>
            <select id="rc-blood" className="form-select form-select-lg" value={form.bloodGroup} onChange={set('bloodGroup')}>
              {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {duplicate && (
          <div className="alert alert-warning mt-3 mb-0">
            <div className="fw-semibold">{t('possibleDuplicates')}</div>
            <div className="small">{duplicate.name} · {new Date(duplicate.dob).toLocaleDateString('en-IN')} · <Link to={`/asha/child/${duplicate._id}`}>{t('viewRecord')}</Link></div>
            <button type="button" className="btn btn-sm btn-warning mt-2" disabled={busy} onClick={() => submit(null, true)}>{t('registerAnyway')}</button>
          </div>
        )}

        <div className="mt-3">
          <button type="submit" className="btn btn-sa-primary btn-lg" disabled={busy || !form.gender}>{busy ? '…' : t('registerChild')}</button>
          <div className="small text-muted mt-2">{t('registerChildHint')}</div>
        </div>
      </form>
    </Layout>
  );
}
