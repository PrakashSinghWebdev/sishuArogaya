import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { INDIA_DISTRICTS, INDIA_STATES } from '../../data/indiaDistricts';

const cardBox = {
  background: 'rgba(255,255,255,0.95)',
  border: '1.5px solid #c5e8ef',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 8px 30px rgba(8,145,178,0.08)',
  maxWidth: 760,
};

const label = { display: 'block', fontSize: 13, fontWeight: 700, color: '#0c2340', marginBottom: 6 };
const input = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box', background: '#fff' };
const btn = { padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#059669', color: '#fff', textDecoration: 'none', display: 'inline-block' };

const EMPTY = { name: '', email: '', phone: '', dob: '', aadhar: '', state: '', district: '', block: '', village: '' };

const AddAshaWorker = () => {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value, ...(key === 'state' ? { district: '' } : {}) }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await adminAPI.createAsha(form);
      setResult(data);
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ASHA worker');
    } finally {
      setSaving(false);
    }
  }

  const field = (key, text, props = {}) => (
    <div>
      <label style={label} htmlFor={key}>{text}</label>
      <input id={key} style={input} value={form[key]} onChange={update(key)} {...props} />
    </div>
  );

  return (
    <Layout role="admin">
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Link to="/admin/asha-workers" style={{ color: '#0891b2', fontSize: 14, fontWeight: 600 }}>← Back to ASHA Workers</Link>
        <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 700, color: '#0c2340', margin: '12px 0 24px' }}>
          👩‍⚕️ Add ASHA Worker
        </h3>

        {result ? (
          <div style={cardBox}>
            <h4 style={{ color: '#059669', marginTop: 0 }}>✅ ASHA worker created</h4>
            <p style={{ color: '#475569' }}>Share these login details if any message below failed:</p>
            <div style={{ background: '#f0fdff', border: '2px solid #0891b2', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div>Username: <strong>{result.username}</strong></div>
              <div>Password: <strong>{result.password}</strong></div>
            </div>
            {Object.entries(result.delivery).map(([channel, status]) => (
              <div key={channel} style={{ fontSize: 14, marginBottom: 4, color: status === 'sent' ? '#059669' : '#dc2626' }}>
                {status === 'sent' ? '✓' : '✕'} {channel.toUpperCase()}: {status}
              </div>
            ))}
            <p style={{ color: '#475569', fontSize: 13, margin: '16px 0 8px' }}>Or send from your own phone:</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={`https://wa.me/91${result.phone}?text=${encodeURIComponent(result.text)}`} target="_blank" rel="noreferrer" style={{ ...btn, background: '#25d366' }}>
                Send via WhatsApp
              </a>
              <a href={`sms:+91${result.phone}?body=${encodeURIComponent(result.text)}`} style={{ ...btn, background: '#0891b2' }}>
                Send via SMS
              </a>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button style={btn} onClick={() => setResult(null)}>+ Add another</button>
              <Link to="/admin/asha-workers" style={{ ...btn, background: '#e2e8f0', color: '#475569' }}>Done</Link>
            </div>
          </div>
        ) : (
          <form style={cardBox} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {field('name', 'Full name *', { required: true })}
              {field('dob', 'Date of birth *', { type: 'date', required: true, max: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toLocaleDateString('en-CA') })}
              {field('phone', 'Mobile number *', { type: 'tel', required: true, pattern: '\\d{10}', title: '10-digit mobile number', inputMode: 'numeric' })}
              {field('email', 'Email *', { type: 'email', required: true })}
              {field('aadhar', 'Aadhaar number', { pattern: '\\d{12}', title: '12-digit Aadhaar number', inputMode: 'numeric' })}
              <div>
                <label style={label} htmlFor="state">State / UT</label>
                <select id="state" style={input} value={form.state} onChange={update('state')}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={label} htmlFor="district">District *</label>
                <select id="district" style={input} value={form.district} onChange={update('district')} required disabled={!form.state}>
                  <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
                  {(INDIA_DISTRICTS[form.state] || []).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {field('block', 'Block *', { required: true })}
              {field('village', 'Village')}
            </div>

            <p style={{ fontSize: 13, color: '#64748b', margin: '20px 0' }}>
              A username (ASHA ID) and a random one-time password are generated and sent to the worker by SMS,
              WhatsApp and email. She must set her own password at first login.
            </p>
            {error && <div style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{error}</div>}
            <button type="submit" style={{ ...btn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? 'Creating…' : 'Create ASHA Worker'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default AddAshaWorker;
