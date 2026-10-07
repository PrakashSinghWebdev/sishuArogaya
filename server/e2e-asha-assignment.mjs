// Regression check: children are linked to the ASHA worker of their state/district. Run like e2e.mjs.
const B = 'http://localhost:5099/api';
let fails = 0; const ok = (n, c, x = '') => { console.log(`${c ? '✅' : '❌'} ${n} ${c ? '' : x}`); if (!c) fails++; };
const req = async (m, p, b, t) => { const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => null) }; };
const id = Date.now() % 1e6;
const reg = async (u) => { const r = await req('POST', '/auth/register', u); if (r.status !== 201) console.log(r.data); return (await req('POST', '/auth/login', { email: u.email, password: u.password })).data.token; };
const mk = (role, n, extra) => ({ name: `${role} ${n}`, email: `${role}${n}${id}@t.in`, phone: `8${String(id).padStart(6, '0')}${n}`.slice(0, 10), password: 'secret123', role, ...extra });
const dob = '2025-01-15';

// 1. parent adds child BEFORE any ASHA exists in Patna
const p1 = await reg(mk('parent', 1, { state: 'Bihar', district: 'Patna', block: 'Phulwari' }));
const early = (await req('POST', '/child/add', { name: 'Early Kid', dob, gender: 'female' }, p1)).data.child;
ok('child inherits parent location', early.district === 'Patna' && early.state === 'Bihar', JSON.stringify(early));
ok('no ASHA yet → unassigned', !early.ashaId);

// 2. ASHA registers in same state/district (different case) → sees the earlier child
const a1 = await reg(mk('asha', 2, { state: 'Bihar', district: 'patna', block: 'Phulwari', ashaId: `ASHA-T-${id}-1` }));
let kids = (await req('GET', '/asha/children', null, a1)).data;
ok('ASHA picks up existing child in district', kids.some((k) => k.name === 'Early Kid'), JSON.stringify(kids.map((k) => k.name)));

// 3. new child after ASHA exists → assigned immediately
const p2 = await reg(mk('parent', 3, { state: 'Bihar', district: 'Patna', block: 'Danapur' }));
await req('POST', '/child/add', { name: 'New Kid', dob, gender: 'male' }, p2);
kids = (await req('GET', '/child', null, a1)).data;
ok('new child appears for ASHA', kids.some((k) => k.name === 'New Kid'));
const prof = (await req('GET', '/asha/profile', null, a1)).data;
ok('profile counts assigned children', prof.assignedChildren.length >= 2, prof.assignedChildren.length);

// 4. same district name in another state → NOT assigned to Bihar ASHA
const a2 = await reg(mk('asha', 4, { state: 'Bihar', district: 'Aurangabad', block: 'X', ashaId: `ASHA-T-${id}-2` }));
const p3 = await reg(mk('parent', 5, { state: 'Maharashtra', district: 'Aurangabad', block: 'Y' }));
await req('POST', '/child/add', { name: 'MH Kid', dob, gender: 'male' }, p3);
kids = (await req('GET', '/asha/children', null, a2)).data;
ok('district name in another state is not mixed up', !kids.some((k) => k.name === 'MH Kid'), JSON.stringify(kids.map((k) => k.name)));

// 5. other parent still can't see these children
ok('parents only see their own children', (await req('GET', '/child', null, p2)).data.every((k) => k.name === 'New Kid'));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
