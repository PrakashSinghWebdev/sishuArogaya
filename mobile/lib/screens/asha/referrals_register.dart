import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

const quickReasons = [
  'Fast or difficult breathing',
  'Not able to feed / vomits everything',
  'Convulsions (fits)',
  'Very sleepy or unconscious',
  'Severe dehydration (sunken eyes)',
  'High fever',
  'Severe acute malnutrition (SAM)',
  'Growth faltering',
  'Missed vaccinations',
];
const referralStatus = {
  'pending': ('refPending', warnTone),
  'reached': ('refReached', infoTone),
  'completed': ('refCompleted', goodTone),
  'cancelled': ('refCancelled', neutralTone),
};
const emergencyNumbers = [('108', 'ambulance108'), ('102', 'transport102'), ('112', 'emergency112'), ('104', 'helpline104')];

bool referralOpen(Map r) => r['status'] == 'pending' || r['status'] == 'reached';

/// Referral card shared by ASHA and admin pages: status, history and the actions the role allows.
class ReferralCard extends StatelessWidget {
  const ReferralCard({super.key, required this.r, required this.onUpdate, this.admin = false});
  final Map r;
  final Future<void> Function(Map body) onUpdate;
  final bool admin;

  @override
  Widget build(BuildContext context) {
    final (stLabel, stTone) = referralStatus[r['status']] ?? referralStatus['pending']!;
    final urg = urgencyTone[r['urgency']] ?? urgencyTone['routine']!;
    final open = referralOpen(r);
    final follow = parseDate(r['followUpDate']);
    final overdue = open && follow != null && follow.isBefore(DateTime.now().subtract(const Duration(days: 1)));
    final mother = r['pregnancyId'] is Map ? r['pregnancyId'] as Map : null;
    final child = r['childId'] is Map ? r['childId'] as Map : null;
    final asha = r['ashaId'] is Map ? r['ashaId'] as Map : null;
    final history = ((r['history'] as List?) ?? []).skip(1);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: r['urgency'] == 'emergency' ? C.red : stTone.fg.withValues(alpha: .5), width: 1.5)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: InkWell(
                onTap: admin ? null : () => Navigator.pushNamed(context, mother != null ? '/asha/pregnancy' : '/asha/child', arguments: {'id': (mother ?? child)?['_id']}),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(mother != null ? '🤰 ${mother['womanName']}' : '${child?['name'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w800, color: C.dark, fontSize: 15)),
                  Text('${r['reason'] ?? ''}'),
                  Text(
                    '${r['facility'] != null ? '🏥 ${r['facility']} · ' : ''}${t('referredOn', 'Referred on')} ${fmtDate(r['createdAt'])}${follow != null ? ' · ${t('followUpDate', 'Follow-up')}: ${fmtDate(r['followUpDate'])}' : ''}',
                    style: TextStyle(fontSize: 12.5, color: overdue ? C.red : C.muted, fontWeight: overdue ? FontWeight.w700 : null),
                  ),
                  if (admin && asha != null)
                    Row(children: [
                      Expanded(child: Text('ASHA ${asha['ashaId'] ?? ''} · ${asha['userId'] is Map ? asha['userId']['name'] : ''} · ${asha['block'] ?? ''}', style: const TextStyle(fontSize: 12.5, color: C.muted))),
                      if (asha['userId'] is Map && asha['userId']['phone'] != null) IconButton(icon: const Icon(Icons.call, color: C.primary, size: 20), onPressed: () => callPhone(asha['userId']['phone'])),
                    ]),
                ]),
              ),
            ),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Badge2(t('urgency${'${r['urgency'] ?? 'routine'}'[0].toUpperCase()}${'${r['urgency'] ?? 'routine'}'.substring(1)}', '${r['urgency']}'), tone: urg),
              const SizedBox(height: 4),
              Badge2(t(stLabel), tone: stTone),
              if (r['escalatedAt'] != null) Padding(padding: const EdgeInsets.only(top: 4), child: Badge2(t('escalated', 'Escalated'), tone: const Tone(Color(0xFF5B21B6), Color(0xFFEDE9FE)))),
            ]),
          ]),
          if (history.isNotEmpty) ...[
            const SizedBox(height: 6),
            for (final h in history) Text('• ${fmtDate(h['at'])}: ${t(referralStatus[h['status']]?.$1 ?? '${h['status']}')}${h['note'] != null ? ' — ${h['note']}' : ''}', style: const TextStyle(fontSize: 12.5)),
          ],
          if (open) ...[
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 4, children: [
              if (r['status'] == 'pending' && !admin) OutlinedButton(onPressed: () => onUpdate({'status': 'reached'}), child: Text(t('markReached', 'Reached facility'))),
              if (!admin) FilledButton(onPressed: () => onUpdate({'status': 'completed'}), child: Text(t('markCompleted', 'Completed'))),
              if (admin) FilledButton(onPressed: () => onUpdate({'status': 'completed', 'note': t('closedBySupervisor', 'Closed by admin')}), child: Text(t('markCompleted', 'Completed'))),
              OutlinedButton(
                onPressed: () async {
                  final note = await askText(context, t('addNote', 'Add note'), hint: admin ? t('supervisorNotePlaceholder', 'Advice or action taken') : t('notePlaceholder', ''), required: true);
                  if (note != null && note.isNotEmpty) await onUpdate({'note': note});
                },
                child: Text(t('addNote', 'Add note')),
              ),
              if (!admin)
                TextButton(
                  onPressed: () async {
                    final note = await askText(context, t('refCancel', 'Cancel referral'), hint: t('notePlaceholder', 'Why?'));
                    if (note != null) await onUpdate({'status': 'cancelled', if (note.isNotEmpty) 'note': note});
                  },
                  child: Text(t('refCancel', 'Cancel referral')),
                ),
              if (!admin && r['escalatedAt'] == null)
                OutlinedButton(style: OutlinedButton.styleFrom(foregroundColor: C.red), onPressed: () => onUpdate({'escalate': true}), child: Text(t('escalate', 'Escalate'))),
            ]),
          ],
        ]),
      ),
    );
  }
}

class ReferralsScreen extends StatefulWidget {
  const ReferralsScreen({super.key, this.args = const {}});
  final Map<String, dynamic> args;
  @override
  State<ReferralsScreen> createState() => _ReferralsScreenState();
}

class _ReferralsScreenState extends State<ReferralsScreen> {
  String filter = 'open';
  final _loader = GlobalKey<LoaderState<List>>();

  @override
  void initState() {
    super.initState();
    final a = widget.args;
    if (a['new'] == '1' || a['childId'] != null || a['pregnancyId'] != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => openForm(a['pregnancyId'] != null ? 'mother:${a['pregnancyId']}' : a['childId'] != null ? 'child:${a['childId']}' : ''));
    }
  }

  Future<void> openForm([String target = '']) async {
    final saved = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => _ReferralForm(target: target)));
    if (saved == true && mounted) {
      toast(context, t('referralSaved', 'Referral saved'));
      _loader.currentState?.reload();
    }
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/referrals',
        fab: FloatingActionButton.extended(backgroundColor: C.red, foregroundColor: Colors.white, onPressed: openForm, icon: const Icon(Icons.add), label: Text(t('newReferral', 'New referral'))),
        child: Loader<List>(
          key: _loader,
          load: () async => await api.get('/referrals') as List,
          builder: (context, rows, reload) {
            bool match(String k, Map r) => k == 'open' ? referralOpen(r) : k == 'closed' ? !referralOpen(r) : true;
            final shown = rows.where((r) => match(filter, r)).toList();
            return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
              Wrap(spacing: 8, runSpacing: 4, children: [
                for (final (n, k) in emergencyNumbers) OutlinedButton.icon(style: OutlinedButton.styleFrom(foregroundColor: C.red), onPressed: () => callPhone(n), icon: const Icon(Icons.call, size: 16), label: Text('$n · ${t(k)}')),
              ]),
              gap,
              ChoiceRow(value: filter, onChanged: (v) => setState(() => filter = v), options: [for (final (k, l) in [('open', 'refOpen'), ('closed', 'refClosed'), ('all', 'visitsAll')]) (k, '${t(l)} (${rows.where((r) => match(k, r)).length})')]),
              if (shown.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
              for (final r in shown)
                ReferralCard(
                  r: r,
                  onUpdate: (body) async {
                    if (await runAction(context, () => api.patch('/referrals/${r['_id']}', body))) reload();
                  },
                ),
            ]);
          },
        ),
      );
}

class _ReferralForm extends StatefulWidget {
  const _ReferralForm({required this.target});
  final String target;
  @override
  State<_ReferralForm> createState() => _ReferralFormState();
}

class _ReferralFormState extends State<_ReferralForm> {
  late String target = widget.target;
  String urgency = 'urgent', followUp = isoDay(3);
  final reason = TextEditingController(), facility = TextEditingController();
  List children = [], mothers = [], facilities = [];
  bool busy = false;

  @override
  void initState() {
    super.initState();
    api.get('/asha/children').then((r) => mounted ? setState(() => children = r as List) : null).catchError((_) => null);
    api.get('/maternal').then((r) => mounted ? setState(() => mothers = (r as List).where((m) => m['status'] != 'closed').toList()) : null).catchError((_) => null);
    _nearby();
  }

  // nearest facilities as suggestions for the "refer to" box
  Future<void> _nearby() async {
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return;
      final p = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(timeLimit: Duration(seconds: 15)));
      final res = await api.get('/hospitals/nearby', {'lat': p.latitude, 'lng': p.longitude, 'radius': 30000});
      if (mounted) setState(() => facilities = ((res['hospitals'] as List?) ?? []).take(15).toList());
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(t('newReferral', 'New referral')), backgroundColor: C.red),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          NoticeBox('⚠️ ${t('referralSafetyNote', 'For danger signs, arrange transport first and call 108.')}', tone: warnTone),
          Pick<String>(
            label: '${t('whoIsReferred', 'Who is referred?')} *',
            value: target.isEmpty ? null : target,
            items: [
              for (final c in children) ('child:${c['_id']}', '${c['name']}${c['motherName'] != null ? ' (${c['motherName']})' : ''}'),
              for (final m in mothers) ('mother:${m['_id']}', '🤰 ${m['womanName']}${m['village'] != null ? ' (${m['village']})' : ''}'),
            ],
            onChanged: (v) => setState(() => target = v ?? ''),
          ),
          gap,
          Text('${t('urgency', 'Urgency')} *', style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          SegmentedButton<String>(
            segments: [for (final u in ['routine', 'urgent', 'emergency']) ButtonSegment(value: u, label: Text(t('urgency${u[0].toUpperCase()}${u.substring(1)}', u)))],
            selected: {urgency},
            onSelectionChanged: (s) => setState(() => urgency = s.first),
          ),
          gap,
          Text('${t('referralReason', 'Reason')} *', style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Wrap(spacing: 6, runSpacing: 6, children: [for (final r in quickReasons) ChoiceChip(label: Text(r), selected: reason.text == r, onSelected: (_) => setState(() => reason.text = r))]),
          const SizedBox(height: 8),
          TextField(controller: reason, maxLength: 500, maxLines: 2, onChanged: (_) => setState(() {})),
          Autocomplete<String>(
            optionsBuilder: (v) => facilities.map((h) => '${h['name']}').where((n) => n.toLowerCase().contains(v.text.toLowerCase())),
            onSelected: (v) => facility.text = v,
            fieldViewBuilder: (context, ctrl, focus, _) {
              ctrl.addListener(() => facility.text = ctrl.text);
              return TextField(controller: ctrl, focusNode: focus, maxLength: 200, decoration: InputDecoration(labelText: t('referTo', 'Refer to'), hintText: 'PHC / CHC / District Hospital'));
            },
          ),
          DateField(label: t('followUpDate', 'Follow-up date'), value: followUp, first: DateTime.now(), onChanged: (v) => setState(() => followUp = v)),
          if (urgency == 'emergency') ...[
            gap,
            Card(color: const Color(0xFFFEE2E2), child: ListTile(leading: const Text('🚨'), title: Text(t('emergencyCallFirst', 'Emergency: call an ambulance first')), trailing: FilledButton(style: FilledButton.styleFrom(backgroundColor: C.red), onPressed: () => callPhone('108'), child: const Text('108')))),
          ],
          const SizedBox(height: 16),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: C.red),
            onPressed: busy
                ? null
                : () async {
                    if (target.isEmpty || reason.text.trim().isEmpty) return toast(context, 'Choose who is referred and give a reason', error: true);
                    setState(() => busy = true);
                    final [kind, id] = target.split(':');
                    final ok = await runAction(context, () => api.post('/referrals', {
                          kind == 'mother' ? 'pregnancyId' : 'childId': id,
                          'reason': reason.text.trim(),
                          'urgency': urgency,
                          'facility': facility.text.trim(),
                          'followUpDate': followUp,
                        }));
                    if (!context.mounted) return;
                    setState(() => busy = false);
                    if (ok) Navigator.pop(context, true);
                  },
            child: Text(busy ? '…' : t('saveReferral', 'Save referral')),
          ),
        ]),
      );
}

// ── Register a child (ASHA) ────────────────────────────────────────────────
class RegisterChildScreen extends StatefulWidget {
  const RegisterChildScreen({super.key});
  @override
  State<RegisterChildScreen> createState() => _RegisterChildScreenState();
}

class _RegisterChildScreenState extends State<RegisterChildScreen> {
  final name = TextEditingController(), mother = TextEditingController(), father = TextEditingController();
  final phone = TextEditingController(), village = TextEditingController(), birthWeight = TextEditingController();
  String dob = '', gender = '', blood = 'Unknown', error = '';
  Map? duplicate;
  List existing = [];
  bool busy = false;

  @override
  void initState() {
    super.initState();
    api.get('/asha/children').then((r) => existing = r as List).catchError((_) => []);
  }

  String _norm(dynamic s) => '${s ?? ''}'.trim().toLowerCase();

  Future<void> submit({bool confirmed = false}) async {
    setState(() => error = '');
    final digits = phone.text.replaceAll(RegExp(r'\D'), '');
    if (name.text.trim().isEmpty || dob.isEmpty || gender.isEmpty || mother.text.trim().isEmpty) return setState(() => error = 'Fill in the name, date of birth, gender and mother.');
    if (phone.text.isNotEmpty && digits.length != 10) return setState(() => error = t('phoneInvalid', 'Enter a 10-digit phone number'));
    // same name and birth date within 3 days in this caseload: probably already registered
    final d = DateTime.parse(dob);
    final match = existing.where((c) => _norm(c['name']) == _norm(name.text) && (parseDate(c['dob'])?.difference(d).inDays.abs() ?? 99) <= 3).firstOrNull;
    if (match != null && !confirmed) return setState(() => duplicate = match);
    setState(() => busy = true);
    try {
      final data = await api.post('/child/add', {
        'name': name.text.trim(),
        'dob': dob,
        'gender': gender,
        'motherName': mother.text.trim(),
        'fatherName': father.text.trim(),
        if (digits.isNotEmpty) 'contactPhone': digits,
        'village': village.text.trim(),
        if (double.tryParse(birthWeight.text) != null) 'birthWeight': double.parse(birthWeight.text),
        'bloodGroup': blood,
      });
      if (mounted) Navigator.pushReplacementNamed(context, '/asha/child', arguments: {'id': data['child']['_id']});
    } catch (e) {
      setState(() {
        error = e is ApiException ? e.message : 'Could not register the child';
        busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/register-child',
        child: ListView(padding: const EdgeInsets.all(16), children: [
          if (error.isNotEmpty) ErrorBox(error),
          TextField(controller: name, maxLength: 100, onChanged: (_) => setState(() => duplicate = null), decoration: InputDecoration(labelText: '${t('childName', 'Child name')} *')),
          DateField(label: '${t('dob', 'Date of birth')} *', value: dob, last: DateTime.now(), onChanged: (v) => setState(() {
                dob = v;
                duplicate = null;
              })),
          gap,
          SegmentedButton<String>(
            emptySelectionAllowed: true,
            segments: [ButtonSegment(value: 'female', label: Text('♀ ${t('girl', 'Girl')}')), ButtonSegment(value: 'male', label: Text('♂ ${t('boy', 'Boy')}'))],
            selected: gender.isEmpty ? {} : {gender},
            onSelectionChanged: (s) => setState(() {
              gender = s.isEmpty ? '' : s.first;
              duplicate = null;
            }),
          ),
          gap,
          TextField(controller: birthWeight, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: '${t('birthWeight', 'Birth weight')} (kg)')),
          gap,
          TextField(controller: mother, maxLength: 100, decoration: InputDecoration(labelText: '${t('mother', 'Mother')} *')),
          TextField(controller: father, maxLength: 100, decoration: InputDecoration(labelText: t('father', 'Father'))),
          TextField(controller: phone, keyboardType: TextInputType.phone, maxLength: 14, decoration: InputDecoration(labelText: t('phone2', 'Phone'), hintText: '9876543210')),
          TextField(controller: village, maxLength: 100, decoration: InputDecoration(labelText: t('village', 'Village'))),
          Pick<String>(label: t('bloodGroup', 'Blood group'), value: blood, items: [for (final b in ['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']) (b, b)], onChanged: (v) => setState(() => blood = v ?? 'Unknown')),
          if (duplicate != null)
            Card(
              color: const Color(0xFFFFFBEB),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t('possibleDuplicates', 'Possible duplicate'), style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text('${duplicate!['name']} · ${fmtDate(duplicate!['dob'])}'),
                  Row(children: [
                    TextButton(onPressed: () => Navigator.pushNamed(context, '/asha/child', arguments: {'id': duplicate!['_id']}), child: Text(t('viewRecord', 'View record'))),
                    FilledButton(style: FilledButton.styleFrom(backgroundColor: C.amber), onPressed: busy ? null : () => submit(confirmed: true), child: Text(t('registerAnyway', 'Register anyway'))),
                  ]),
                ]),
              ),
            ),
          const SizedBox(height: 16),
          FilledButton(onPressed: busy || gender.isEmpty ? null : submit, child: Text(busy ? '…' : t('registerChild', 'Register child'))),
          const SizedBox(height: 6),
          Text(t('registerChildHint', ''), style: const TextStyle(color: C.muted, fontSize: 12.5)),
        ]),
      );
}
