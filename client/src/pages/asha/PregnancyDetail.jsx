import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { maternalAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, fmtDate, isoDay, telHref, Badge, ANC_DANGER_SIGNS, MOTHER_PNC_DANGER_SIGNS, BABY_DANGER_SIGNS } from './fieldUi';

const blankAnc = { date: isoDay(0), weight: '', bpSys: '', bpDia: '', hb: '', ifaTablets: '', calciumTablets: '', tdDose: '', dangerSigns: [], notes: '' };
const blankDelivery = { date: isoDay(0), place: 'institutional', facility: '', outcome: 'live', babyGender: '', birthWeight: '', registerBaby: true, babyName: '' };
const blankPnc = { day: '', date: isoDay(0), breastfeeding: true, motherDangerSigns: [], babyDangerSigns: [], babyWeight: '', notes: '' };
const CLOSE_REASONS = ['Miscarriage / abortion', 'Migrated', 'Maternal death', 'Other'];

function SignPicker({ signs, value, onChange }) {
  return (
    <div className="d-flex flex-wrap gap-1">
      {signs.map((s) => (
        <button type="button" key={s} style={{ fontSize: 12 }} className={`btn btn-sm ${value.includes(s) ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s])}>{s}</button>
      ))}
    </div>
  );
}

function Num({ id, label, value, onChange, ...props }) {
  return (
    <div className="col-md-3 col-6">
      <label className="form-label small fw-semibold" htmlFor={id}>{label}</label>
      <input id={id} type="number" inputMode="decimal" className="form-control" value={value} onChange={onChange} {...props} />
    </div>
  );
}

export default function PregnancyDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(''); // which form is open: anc | delivery | pnc | close
  const [anc, setAnc] = useState(blankAnc);
  const [delivery, setDelivery] = useState(blankDelivery);
  const [pnc, setPnc] = useState(blankPnc);
  const [closeReason, setCloseReason] = useState(CLOSE_REASONS[0]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    maternalAPI.get(id).then((r) => setP(r.data)).catch((err) => setError(err.response?.data?.message || 'Could not load'));
  }, [id]);
  useEffect(load, [load]);

  async function save(call, after, okText) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data } = await call();
      after();
      setOpen('');
      const refs = data.referralId ? 1 : data.referralIds?.length || 0;
      setNotice(refs ? `${okText} 🚨 ${t('dangerSignReferred')}` : okText);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  if (!p) {
    return <Layout role="asha">{error ? <div className="alert alert-danger">{error}</div> : <div className="text-center py-5"><div className="spinner-border" style={{ color: palette.primary }}></div></div>}</Layout>;
  }

  const s = p.summary;
  const onA = (k) => (e) => setAnc((f) => ({ ...f, [k]: e.target.value }));
  const onD = (k) => (e) => setDelivery((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const onP = (k) => (e) => setPnc((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const pncDays = [...(p.delivery?.place === 'home' ? [1] : []), 3, 7, 14, 21, 28, 42];
  const doneDays = new Set(p.pncVisits.map((v) => v.day));

  return (
    <Layout role="asha">
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <Link to="/asha/maternal-care" className="btn btn-sm btn-outline-secondary"><i className="bi bi-arrow-left"></i></Link>
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}>{p.womanName}</h4>
        <Badge bg={p.status === 'pregnant' ? '#cffafe' : p.status === 'delivered' ? '#d1fae5' : '#f1f5f9'} color={palette.dark}>{t(p.status === 'pregnant' ? 'tabPregnant' : p.status === 'delivered' ? 'tabPostnatal' : 'refClosed')}</Badge>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {notice && <div className="alert alert-success py-2 small">{notice}</div>}

      {/* Profile + status */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-3 h-100 small">
            {p.husbandName && <div>👨 {t('husbandName')}: <strong>{p.husbandName}</strong></div>}
            {p.age && <div>🎂 {t('age')}: <strong>{p.age}</strong></div>}
            {p.phone && <div>📞 <a href={telHref(p.phone)}>{p.phone}</a></div>}
            {p.village && <div>🏠 {p.village}</div>}
            {p.rchId && <div>🪪 {t('rchId')}: {p.rchId}</div>}
            <div>🤰 G{p.gravida || '?'} P{p.para ?? '?'} · {t('lmp')}: {fmtDate(p.lmp)}</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ background: s.risk.high.length ? '#fef2f2' : palette.bg }}>
            {p.status === 'pregnant' && (
              <>
                <div className="fs-5 fw-bold" style={{ color: palette.dark }}>{s.weeks} {t('weeks')} · T{s.trimester}</div>
                <div className="small">{t('edd')}: <strong>{fmtDate(s.edd)}</strong></div>
                {s.nextAnc?.number && <div className="small mt-1">📅 ANC-{s.nextAnc.number}: {s.nextAnc.dueNow ? <strong className="text-danger">{t('visitsDueNow')}</strong> : `${t('from')} ${fmtDate(s.nextAnc.dueDate)}`}</div>}
                {s.nextAnc?.missed?.length > 0 && <div className="small text-danger">{t('missedAnc')}: {s.nextAnc.missed.map((n) => `ANC-${n}`).join(', ')}</div>}
              </>
            )}
            {p.status === 'delivered' && (
              <>
                <div className="fw-bold" style={{ color: palette.dark }}>{t('delivered')} {fmtDate(p.delivery.date)} · {t(p.delivery.place === 'home' ? 'homeDelivery' : 'institutionalDelivery')}</div>
                {p.delivery.childId && <div className="small">👶 <Link to={`/asha/child/${p.delivery.childId._id}`}>{p.delivery.childId.name}</Link></div>}
                {s.nextPnc && !s.nextPnc.complete && <div className={`small mt-1 ${s.nextPnc.overdue ? 'text-danger fw-semibold' : ''}`}>📅 {t('pncVisit')} {t('day')} {s.nextPnc.day}: {fmtDate(s.nextPnc.dueDate)}</div>}
                {s.nextPnc?.complete && <div className="small mt-1">✅ {t('pncComplete')}</div>}
              </>
            )}
            <div className="d-flex flex-wrap gap-1 mt-2">
              {s.risk.high.map((r) => <Badge key={r} bg="#dc2626" color="#fff">⚠ {r}</Badge>)}
              {s.risk.warnings.map((r) => <Badge key={r} bg="#fef3c7" color="#92400e">{r}</Badge>)}
            </div>
            {s.risk.high.length > 0 && <div className="small mt-2" style={{ color: '#991b1b' }}>{t('highRiskAdvice')}</div>}
          </div>
        </div>
      </div>

      {/* Actions */}
      {p.status !== 'closed' && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {p.status === 'pregnant' && <button className="btn btn-sa-primary" onClick={() => setOpen(open === 'anc' ? '' : 'anc')}><i className="bi bi-clipboard2-pulse me-1"></i>{t('addAnc')}</button>}
          {p.status === 'pregnant' && <button className="btn btn-success" onClick={() => setOpen(open === 'delivery' ? '' : 'delivery')}><i className="bi bi-balloon-heart me-1"></i>{t('recordDelivery')}</button>}
          {p.status === 'delivered' && <button className="btn btn-sa-primary" onClick={() => { setOpen(open === 'pnc' ? '' : 'pnc'); setPnc({ ...blankPnc, day: String(s.nextPnc?.day || '') }); }}><i className="bi bi-house-heart me-1"></i>{t('addPnc')}</button>}
          <Link to={`/asha/referrals?pregnancyId=${p._id}`} className="btn btn-outline-danger"><i className="bi bi-hospital me-1"></i>{t('newReferral')}</Link>
          <button className="btn btn-outline-secondary" onClick={() => setOpen(open === 'close' ? '' : 'close')}>{t('closeRecord')}</button>
        </div>
      )}

      {open === 'anc' && (
        <form className="card border-0 shadow-sm p-3 mb-3" onSubmit={(e) => { e.preventDefault(); save(() => maternalAPI.addAnc(p._id, anc), () => setAnc(blankAnc), t('saved')); }}>
          <div className="fw-semibold mb-2">{t('addAnc')}</div>
          <div className="row g-2">
            <div className="col-md-3 col-6">
              <label className="form-label small fw-semibold" htmlFor="anc-date">{t('date')}</label>
              <input id="anc-date" type="date" className="form-control" max={isoDay(0)} value={anc.date} onChange={onA('date')} />
            </div>
            <Num id="anc-weight" label={`${t('weight')} (kg)`} value={anc.weight} onChange={onA('weight')} min={25} max={150} step="0.1" />
            <Num id="anc-bps" label="BP (upper)" value={anc.bpSys} onChange={onA('bpSys')} min={60} max={250} />
            <Num id="anc-bpd" label="BP (lower)" value={anc.bpDia} onChange={onA('bpDia')} min={30} max={150} />
            <Num id="anc-hb" label="Hb (g/dL)" value={anc.hb} onChange={onA('hb')} min={3} max={20} step="0.1" />
            <Num id="anc-ifa" label={t('ifaGiven')} value={anc.ifaTablets} onChange={onA('ifaTablets')} min={0} max={400} />
            <Num id="anc-ca" label={t('calciumGiven')} value={anc.calciumTablets} onChange={onA('calciumTablets')} min={0} max={400} />
            <div className="col-md-3 col-6">
              <label className="form-label small fw-semibold" htmlFor="anc-td">Td</label>
              <select id="anc-td" className="form-select" value={anc.tdDose} onChange={onA('tdDose')}>
                <option value="">—</option><option>Td1</option><option>Td2</option><option>Booster</option>
              </select>
            </div>
          </div>
          {(Number(anc.bpSys) >= 140 || Number(anc.bpDia) >= 90) && <div className="alert alert-danger py-1 small mt-2 mb-0">⚠ {t('highBpWarning')}</div>}
          {anc.hb !== '' && Number(anc.hb) < 7 && <div className="alert alert-danger py-1 small mt-2 mb-0">⚠ {t('severeAnaemiaWarning')}</div>}
          <div className="small fw-semibold mt-3 mb-1">{t('dangerSigns')}</div>
          <SignPicker signs={ANC_DANGER_SIGNS} value={anc.dangerSigns} onChange={(v) => setAnc((f) => ({ ...f, dangerSigns: v }))} />
          {anc.dangerSigns.length > 0 && <div className="alert alert-danger py-2 small mt-2 mb-0">🚨 {t('dangerSignsAutoRefer')} <a href={telHref('108')} className="fw-bold">108</a></div>}
          <textarea className="form-control mt-2" rows={2} maxLength={1000} placeholder={t('notePlaceholder')} value={anc.notes} onChange={onA('notes')} />
          <div className="mt-2"><button className="btn btn-sa-primary" disabled={busy}>{busy ? '…' : t('save2')}</button></div>
        </form>
      )}

      {open === 'delivery' && (
        <form className="card border-0 shadow-sm p-3 mb-3" onSubmit={(e) => { e.preventDefault(); save(() => maternalAPI.recordDelivery(p._id, delivery), () => setDelivery(blankDelivery), t('saved')); }}>
          <div className="fw-semibold mb-2">{t('recordDelivery')}</div>
          <div className="row g-2">
            <div className="col-md-4 col-6">
              <label className="form-label small fw-semibold" htmlFor="del-date">{t('date')}</label>
              <input id="del-date" type="date" className="form-control" max={isoDay(0)} value={delivery.date} onChange={onD('date')} />
            </div>
            <div className="col-md-4 col-6">
              <label className="form-label small fw-semibold" htmlFor="del-place">{t('deliveryPlace')}</label>
              <select id="del-place" className="form-select" value={delivery.place} onChange={onD('place')}>
                <option value="institutional">{t('institutionalDelivery')}</option><option value="home">{t('homeDelivery')}</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold" htmlFor="del-fac">{t('facility')}</label>
              <input id="del-fac" className="form-control" maxLength={200} value={delivery.facility} onChange={onD('facility')} />
            </div>
            <div className="col-md-4 col-6">
              <label className="form-label small fw-semibold" htmlFor="del-out">{t('outcome')}</label>
              <select id="del-out" className="form-select" value={delivery.outcome} onChange={onD('outcome')}>
                <option value="live">{t('liveBirth')}</option><option value="stillbirth">{t('stillbirth')}</option>
              </select>
            </div>
            {delivery.outcome === 'live' && (
              <>
                <div className="col-md-4 col-6">
                  <label className="form-label small fw-semibold" htmlFor="del-sex">{t('gender')}</label>
                  <select id="del-sex" className="form-select" value={delivery.babyGender} onChange={onD('babyGender')} required={delivery.registerBaby}>
                    <option value="">—</option><option value="female">{t('girl')}</option><option value="male">{t('boy')}</option>
                  </select>
                </div>
                <Num id="del-bw" label={`${t('birthWeight')} (kg)`} value={delivery.birthWeight} onChange={onD('birthWeight')} min={0.3} max={6} step="0.01" />
                <div className="col-12">
                  <div className="form-check">
                    <input id="del-reg" type="checkbox" className="form-check-input" checked={delivery.registerBaby} onChange={onD('registerBaby')} />
                    <label htmlFor="del-reg" className="form-check-label small">{t('registerNewborn')}</label>
                  </div>
                  {delivery.registerBaby && <input className="form-control mt-1" maxLength={100} placeholder={`${t('babyName')} (${t('optional')}) — Baby of ${p.womanName}`} value={delivery.babyName} onChange={onD('babyName')} />}
                </div>
              </>
            )}
          </div>
          {delivery.outcome === 'live' && Number(delivery.birthWeight) > 0 && Number(delivery.birthWeight) < 2.5 && <div className="alert alert-warning py-1 small mt-2 mb-0">⚠ {t('lowBirthWeight')}</div>}
          <div className="mt-2"><button className="btn btn-success" disabled={busy}>{busy ? '…' : t('save2')}</button></div>
        </form>
      )}

      {open === 'pnc' && (
        <form className="card border-0 shadow-sm p-3 mb-3" onSubmit={(e) => { e.preventDefault(); save(() => maternalAPI.addPnc(p._id, pnc), () => setPnc(blankPnc), t('saved')); }}>
          <div className="fw-semibold mb-2">{t('addPnc')}</div>
          <div className="row g-2">
            <div className="col-md-3 col-6">
              <label className="form-label small fw-semibold" htmlFor="pnc-day">{t('day')}</label>
              <select id="pnc-day" className="form-select" required value={pnc.day} onChange={onP('day')}>
                <option value="">—</option>
                {pncDays.map((d) => <option key={d} value={d}>{t('day')} {d}{doneDays.has(d) ? ' ✓' : ''}</option>)}
              </select>
            </div>
            <div className="col-md-3 col-6">
              <label className="form-label small fw-semibold" htmlFor="pnc-date">{t('date')}</label>
              <input id="pnc-date" type="date" className="form-control" max={isoDay(0)} value={pnc.date} onChange={onP('date')} />
            </div>
            <Num id="pnc-bw" label={`${t('babyWeight')} (kg)`} value={pnc.babyWeight} onChange={onP('babyWeight')} min={0.5} max={8} step="0.01" />
            <div className="col-md-3 col-6 d-flex align-items-end">
              <div className="form-check">
                <input id="pnc-bf" type="checkbox" className="form-check-input" checked={pnc.breastfeeding} onChange={onP('breastfeeding')} />
                <label htmlFor="pnc-bf" className="form-check-label small">{t('exclusiveBreastfeeding')}</label>
              </div>
            </div>
          </div>
          <div className="small fw-semibold mt-3 mb-1">{t('motherDangerSigns')}</div>
          <SignPicker signs={MOTHER_PNC_DANGER_SIGNS} value={pnc.motherDangerSigns} onChange={(v) => setPnc((f) => ({ ...f, motherDangerSigns: v }))} />
          <div className="small fw-semibold mt-3 mb-1">{t('babyDangerSigns')}</div>
          <SignPicker signs={BABY_DANGER_SIGNS} value={pnc.babyDangerSigns} onChange={(v) => setPnc((f) => ({ ...f, babyDangerSigns: v }))} />
          {(pnc.motherDangerSigns.length > 0 || pnc.babyDangerSigns.length > 0) && <div className="alert alert-danger py-2 small mt-2 mb-0">🚨 {t('dangerSignsAutoRefer')} <a href={telHref('108')} className="fw-bold">108</a></div>}
          <textarea className="form-control mt-2" rows={2} maxLength={1000} placeholder={t('notePlaceholder')} value={pnc.notes} onChange={onP('notes')} />
          <div className="mt-2"><button className="btn btn-sa-primary" disabled={busy}>{busy ? '…' : t('save2')}</button></div>
        </form>
      )}

      {open === 'close' && (
        <div className="card border-0 shadow-sm p-3 mb-3 d-flex flex-row flex-wrap gap-2 align-items-end">
          <div>
            <label className="form-label small fw-semibold" htmlFor="close-reason">{t('closeReason')}</label>
            <select id="close-reason" className="form-select" value={closeReason} onChange={(e) => setCloseReason(e.target.value)}>
              {CLOSE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button className="btn btn-outline-danger" disabled={busy} onClick={() => save(() => maternalAPI.update(p._id, { status: 'closed', closeReason }), () => {}, t('saved'))}>{t('closeRecord')}</button>
        </div>
      )}

      {/* ANC history */}
      {p.ancVisits.length > 0 && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-white fw-semibold">{t('ancHistory')} ({p.ancVisits.length})</div>
          <div className="table-responsive">
            <table className="table table-sm mb-0 small">
              <thead><tr><th>{t('date')}</th><th>{t('weeks')}</th><th>{t('weight')}</th><th>BP</th><th>Hb</th><th>IFA / Ca</th><th>Td</th><th>{t('dangerSigns')}</th></tr></thead>
              <tbody>
                {[...p.ancVisits].reverse().map((v) => (
                  <tr key={v._id}>
                    <td>{fmtDate(v.date)}</td>
                    <td>{Math.floor((new Date(v.date) - new Date(p.lmp)) / (7 * 864e5))}</td>
                    <td>{v.weight ?? '—'}</td>
                    <td className={v.bpSys >= 140 || v.bpDia >= 90 ? 'text-danger fw-semibold' : ''}>{v.bpSys ? `${v.bpSys}/${v.bpDia ?? '?'}` : '—'}</td>
                    <td className={v.hb != null && v.hb < 11 ? 'text-danger fw-semibold' : ''}>{v.hb ?? '—'}</td>
                    <td>{v.ifaTablets ?? '—'} / {v.calciumTablets ?? '—'}</td>
                    <td>{v.tdDose || '—'}</td>
                    <td className="text-danger">{v.dangerSigns?.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PNC history */}
      {p.pncVisits.length > 0 && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-white fw-semibold">{t('pncHistory')} ({p.pncVisits.length})</div>
          <div className="table-responsive">
            <table className="table table-sm mb-0 small">
              <thead><tr><th>{t('day')}</th><th>{t('date')}</th><th>{t('babyWeight')}</th><th>{t('exclusiveBreastfeeding')}</th><th>{t('dangerSigns')}</th></tr></thead>
              <tbody>
                {[...p.pncVisits].reverse().map((v) => (
                  <tr key={v._id}>
                    <td>{v.day}</td>
                    <td>{fmtDate(v.date)}</td>
                    <td>{v.babyWeight ?? '—'}</td>
                    <td>{v.breastfeeding == null ? '—' : v.breastfeeding ? '✓' : '✗'}</td>
                    <td className="text-danger">{[...(v.motherDangerSigns || []), ...(v.babyDangerSigns || [])].join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
