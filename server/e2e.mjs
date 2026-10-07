// End-to-end regression check for auth, child, growth, vaccination, reports and chatbot.
// Run against a THROWAWAY database (it creates users and children):
//   PORT=5099 EMAIL_HOST= SENDGRID_API_KEY= MONGO_URI=mongodb://localhost:27017/sishu_test node server.js  (blank email vars so no real OTP mail is sent)
//   node e2e.mjs        (then drop the sishu_test database)

const B = process.env.API_URL || 'http://localhost:5099/api';
let fails = 0;
const ok = (name, cond, extra = '') => { console.log(`${cond ? '✅' : '❌'} ${name} ${cond ? '' : extra}`); if (!cond) fails++; };
const req = async (method, path, body, token) => {
  const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data; try { data = await r.json(); } catch { data = null; }
  return { status: r.status, data };
};
const P1 = { name: 'Parent One', email: 'p1@t.in', phone: '9000000001', password: 'secret123', role: 'parent' };
const P2 = { name: 'Parent Two', email: 'p2@t.in', phone: '9000000002', password: 'secret123', role: 'parent' };
const A1 = { name: 'Asha One', email: 'a1@t.in', phone: '9000000003', password: 'secret123', role: 'asha', ashaId: 'ASHA-T1', district: 'Dehradun', block: 'Raipur' };

ok('register short password rejected', (await req('POST', '/auth/register', { ...P1, password: '123' })).status === 400);
for (const u of [P1, P2, A1]) ok(`register ${u.role} ${u.email}`, (await req('POST', '/auth/register', u)).status === 201);
const dupAsha = await req('POST', '/auth/register', { ...A1, email: 'a2@t.in', phone: '9000000004' });
ok('duplicate ASHA ID rejected cleanly', dupAsha.status === 400, JSON.stringify(dupAsha.data));
ok('no orphan user from failed ASHA reg', (await req('POST', '/auth/login', { email: 'a2@t.in', password: 'secret123' })).status === 401);

const t1 = (await req('POST', '/auth/login', { email: P1.email, password: P1.password })).data.token;
const t2 = (await req('POST', '/auth/login', { email: P2.email, password: P2.password })).data.token;
const ta = (await req('POST', '/auth/login', { email: A1.email, password: A1.password })).data.token;
ok('logins', t1 && t2 && ta);

// reset-password without OTP must fail (was a takeover bug)
const me2 = (await req('GET', '/auth/me', null, t2)).data.user;
const rp = await req('POST', '/auth/reset-password', { userId: me2._id, newPassword: 'hacked123' });
ok('reset-password without OTP rejected', rp.status === 400, JSON.stringify(rp));
ok('password unchanged after attack', (await req('POST', '/auth/login', { email: P2.email, password: P2.password })).status === 200);

// forgot → reset flow (dev fallback returns OTP)
const fp = await req('POST', '/auth/forgot-password', { email: P2.email });
ok('forgot-password returns dev OTP', !!fp.data?.otp, JSON.stringify(fp.data));
ok('wrong OTP rejected', (await req('POST', '/auth/reset-password', { userId: fp.data.userId, otp: '000000', newPassword: 'newpass123' })).status === 400);
ok('correct OTP resets', (await req('POST', '/auth/reset-password', { userId: fp.data.userId, otp: fp.data.otp, newPassword: 'newpass123' })).status === 200);
ok('OTP single-use', (await req('POST', '/auth/reset-password', { userId: fp.data.userId, otp: fp.data.otp, newPassword: 'again1234' })).status === 400);

// child: mass assignment blocked
const dob = new Date(Date.now() - 36 * 30.44 * 864e5).toISOString().slice(0, 10); // ~3 years old
const add = await req('POST', '/child/add', { name: 'Kid One', dob, gender: 'male', nutritionStatus: 'severe', parentId: me2._id }, t1);
ok('parent adds child', add.status === 201, JSON.stringify(add.data));
const kid = add.data.child;
ok('parentId forced to self on add', String(kid.parentId._id) !== String(me2._id));
ok('nutritionStatus not client-settable', kid.nutritionStatus === 'healthy');
ok('ageInMonths ~35-36', kid.ageInMonths >= 35 && kid.ageInMonths <= 36, kid.ageInMonths);
const steal = await req('PUT', `/child/update/${kid._id}`, { parentId: me2._id, name: 'Renamed' }, t1);
ok('update ignores parentId', steal.status === 200 && String(steal.data.parentId._id) !== String(me2._id) && steal.data.name === 'Renamed');
ok('other parent cannot read child', (await req('GET', `/child/${kid._id}`, null, t2)).status === 403);
ok('bad add → 400 not 500', (await req('POST', '/child/add', { name: 'x' }, t1)).status === 400);

// search regex safety
ok('search with "(" does not 500', (await req('GET', '/child/search/parent?q=(', null, t1)).status === 200);
ok('search finds child', (await req('GET', '/child/search/parent?q=Renam', null, t1)).data.results.length === 1);

// growth: 15kg 3-year-old is valid now (was rejected by 14kg cap)
const g = await req('POST', '/growth/add', { childId: kid._id, weight: 14.3, height: 96 }, t1);
ok('15kg-class 3yo accepted', g.status === 201, JSON.stringify(g.data));
ok('absurd weight rejected', (await req('POST', '/growth/add', { childId: kid._id, weight: 45, height: 96 }, t1)).status === 400);
ok('NaN weight rejected', (await req('POST', '/growth/add', { childId: kid._id, weight: 'abc', height: 96 }, t1)).status === 400);
ok('invalid childId → 400', (await req('POST', '/growth/add', { childId: 'nope', weight: 10, height: 80 }, t1)).status === 400);
// malnourished record → prediction must not say "low"
await req('POST', '/growth/add', { childId: kid._id, weight: 9.0, height: 88, ageMonths: 36 }, t1);
const pr = await req('GET', `/growth/${kid._id}/predict`, null, t1);
ok('prediction ok', pr.status === 200, JSON.stringify(pr.data).slice(0, 200));
ok('severe child not rated low risk', pr.data?.prediction?.riskLevel === 'severe', pr.data?.prediction?.riskLevel + ' ' + JSON.stringify(pr.data?.prediction?.currentStatus));
const pr2 = await req('GET', `/growth/${kid._id}/predict`, null, t1);
ok('prediction deterministic', pr2.data?.prediction?.prediction?.predictedWeight === pr.data?.prediction?.prediction?.predictedWeight);
ok('AI insights present', !!pr.data?.insights, pr.data?.insights);
console.log('   insights source:', pr.data?.model);

// vaccination
const vs = await req('GET', `/vaccination/${kid._id}`, null, t1);
ok('schedule loads & past doses marked due', vs.status === 200 && vs.data.some((v) => v.status === 'due'));
const upd = await req('PUT', '/vaccination/update', { vaccineId: vs.data[0]._id }, ta);
ok('ASHA cannot update unassigned child vaccine', upd.status === 403, JSON.stringify(upd));
const md = await req('PUT', '/vaccination/parent-mark-done', { vaccineId: vs.data[0]._id }, t1);
const md2 = await req('PUT', '/vaccination/parent-mark-done', { vaccineId: vs.data[0]._id }, t1);
ok('parent mark-done idempotent', md2.data.notes === md.data.notes);
ok('ASHA cannot queue unassigned child', (await req('POST', '/asha/checkup-queue', { childId: kid._id }, ta)).status === 403);

// hospitals regex
ok('hospital search "(" no 500', (await req('GET', '/hospitals/search?q=(')).status !== 500);

// report with Hindi name
await req('PUT', `/child/update/${kid._id}`, { name: 'आरव कुमार' }, t1);
const rep = await fetch(`${B}/reports/child/${kid._id}`, { headers: { Authorization: `Bearer ${t1}` } });
ok('PDF report with Hindi name', rep.status === 200 && rep.headers.get('content-type') === 'application/pdf', rep.status);

// chatbot
const cb = await req('POST', '/chatbot/query', { message: 'Is my baby fit for BCG vaccine at birth?' });
ok('chatbot answers', cb.status === 200 && cb.data.answer, JSON.stringify(cb.data).slice(0, 200));
ok('no false emergency alert on "fit"', !cb.data.answer.startsWith('🚨'));
ok('empty chat message → 400', (await req('POST', '/chatbot/query', { message: '   ' })).status === 400);
// facility directory
const em = await req('GET', '/hospitals/emergency?lat=28.61&lng=77.21');
ok('emergency endpoint lists 108/102/112', em.status === 200 && ['108', '102', '112'].every((n) => em.data.numbers.some((x) => x.number === n)));
const dir = await req('POST', '/chatbot/query', { message: 'nearest hospital', location: { lat: 28.6139, lng: 77.209 } });
ok('hospital question answered from directory', dir.data.source === 'directory' && dir.data.answer.includes('108'), dir.data.source);
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exitCode = fails ? 1 : 0;
