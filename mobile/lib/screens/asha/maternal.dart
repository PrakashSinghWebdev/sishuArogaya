import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

// Kept in step with server/utils/maternal.js (same lists as the website's fieldUi.jsx)
const historyRisks = ['Previous caesarean', 'Previous stillbirth or miscarriage', 'Twins / multiple pregnancy', 'Height below 145 cm', 'Diabetes', 'HIV or syphilis', 'Heart, kidney or thyroid disease', 'Bleeding in this pregnancy'];
const ancDangerSigns = ['Bleeding from vagina', 'Fits / convulsions', 'Severe headache or blurred vision', 'Swelling of face and hands', 'High fever', 'Severe abdominal pain', 'Water leaking before labour', 'Baby moving less', 'Breathless or very pale'];
const motherPncDangerSigns = ['Heavy bleeding', 'Fever or foul-smelling discharge', 'Fits / convulsions', 'Breast pain with fever', 'Very sad or thoughts of self-harm'];
const babyDangerSigns = ['Not feeding well', 'Fast or difficult breathing', 'Fever or very cold', 'Yellow palms or soles', 'Convulsions', 'Red or pus-filled cord', 'Very sleepy / not moving'];
const _closeReasons = ['Miscarriage / abortion', 'Migrated', 'Maternal death', 'Other'];

/// What the ASHA needs to do next for this mother, in one line.
(String, bool)? nextStep(Map p) {
  final s = (p['summary'] as Map?) ?? {};
  final anc = s['nextAnc'] as Map?;
  final pnc = s['nextPnc'] as Map?;
  if (p['status'] == 'pregnant' && anc?['number'] != null) {
    return ('ANC-${anc!['number']} ${anc['dueNow'] == true ? t('visitsDueNow', 'due now').toLowerCase() : '${t('from', 'from')} ${fmtDate(anc['dueDate'])}'}', anc['dueNow'] == true);
  }
  if (p['status'] == 'delivered' && pnc != null && pnc['complete'] != true) {
    return ('${t('pncVisit', 'PNC visit')} ${t('day', 'day')} ${pnc['day']} · ${fmtDate(pnc['dueDate'])}', pnc['overdue'] == true || (parseDate(pnc['dueDate'])?.isBefore(DateTime.now()) ?? false));
  }
  return null;
}

List riskHigh(Map p) => ((p['summary']?['risk']?['high']) as List?) ?? [];
List riskWarn(Map p) => ((p['summary']?['risk']?['warnings']) as List?) ?? [];

/// Risk / next-step chips for one pregnancy.
Widget pregnancyChips(Map p) {
  final step = nextStep(p);
  final missed = ((p['summary']?['nextAnc']?['missed']) as List?) ?? [];
  return Wrap(spacing: 6, runSpacing: 6, children: [
    if (step != null) Badge2(step.$1, tone: step.$2 ? warnTone : infoTone),
    if (missed.isNotEmpty) Badge2('${t('missedAnc', 'Missed ANC')}: ${missed.map((n) => 'ANC-$n').join(', ')}', tone: badTone),
    for (final r in riskHigh(p)) Badge2('$r', tone: const Tone(Colors.white, C.red)),
    for (final r in riskWarn(p)) Badge2('$r', tone: warnTone),
  ]);
}

class MaternalCareScreen extends StatefulWidget {
  const MaternalCareScreen({super.key, this.openForm = false});
  final bool openForm;
  @override
  State<MaternalCareScreen> createState() => _MaternalCareScreenState();
}

class _MaternalCareScreenState extends State<MaternalCareScreen> {
  String tab = 'pregnant', search = '';
  final _loader = GlobalKey<LoaderState<List>>();

  @override
  void initState() {
    super.initState();
    if (widget.openForm) WidgetsBinding.instance.addPostFrameCallback((_) => register());
  }

  Future<void> register() async {
    final ok = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const _RegisterPregnancy()));
    if (ok == true && mounted) {
      toast(context, t('pregnancyRegistered', 'Pregnancy registered'));
      _loader.currentState?.reload();
    }
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/maternal-care',
        fab: FloatingActionButton.extended(onPressed: register, icon: const Icon(Icons.add), label: Text(t('registerPregnancy', 'Register pregnancy'))),
        child: Loader<List>(
          key: _loader,
          load: () async => await api.get('/maternal') as List,
          builder: (context, rows, reload) {
            int count(String s) => rows.where((p) => p['status'] == s).length;
            final high = rows.where((p) => p['status'] == 'pregnant' && riskHigh(p).isNotEmpty).length;
            final due = rows.where((p) => nextStep(p)?.$2 == true).length;
            final q = search.trim().toLowerCase();
            final shown = rows.where((p) => p['status'] == tab).where((p) => q.isEmpty || [p['womanName'], p['husbandName'], p['village'], p['phone'], p['rchId']].any((v) => '${v ?? ''}'.toLowerCase().contains(q))).toList()
              ..sort((a, b) {
                final r = riskHigh(b).length.compareTo(riskHigh(a).length);
                return r != 0 ? r : ((nextStep(b)?.$2 ?? false) ? 1 : 0).compareTo((nextStep(a)?.$2 ?? false) ? 1 : 0);
              });
            return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
              Row(children: [
                for (final (label, n, color) in [(t('pregnantWomen', 'Pregnant'), count('pregnant'), C.dark), (t('highRisk', 'High risk'), high, const Color(0xFF9B3A26)), (t('checkupsDue', 'Check-ups due'), due, const Color(0xFF8A5A12))])
                  Expanded(child: Padding(padding: const EdgeInsets.only(right: 6), child: StatTile(label: label, value: '$n', color: color))),
              ]),
              gap,
              ChoiceRow(value: tab, onChanged: (v) => setState(() => tab = v), options: [for (final (k, l) in [('pregnant', 'tabPregnant'), ('delivered', 'tabPostnatal'), ('closed', 'refClosed')]) (k, '${t(l)} (${count(k)})')]),
              TextField(onChanged: (v) => setState(() => search = v), decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: t('familySearch', 'Search'))),
              gap,
              if (shown.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
              for (final p in shown)
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: riskHigh(p).isNotEmpty ? C.red : C.border, width: 1.5)),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => Navigator.pushNamed(context, '/asha/pregnancy', arguments: {'id': p['_id']}).then((_) => reload()),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('${p['womanName']} →${p['age'] != null ? '  · ${p['age']} ${t('years', 'years')}' : ''}', style: const TextStyle(fontWeight: FontWeight.w800, color: C.dark)),
                              Text('${p['husbandName'] != null ? '${p['husbandName']} · ' : ''}${p['village'] ?? '—'}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
                            ]),
                          ),
                          if (p['phone'] != null) IconButton(icon: const Icon(Icons.call, color: C.primary), onPressed: () => callPhone(p['phone'])),
                        ]),
                        if (p['status'] == 'pregnant') Text('${p['summary']?['weeks']} ${t('weeks', 'weeks')} · T${p['summary']?['trimester']} · ${t('edd', 'EDD')} ${fmtDate(p['summary']?['edd'])}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        if (p['status'] == 'delivered') Text('${t('delivered', 'Delivered')} ${fmtDate(p['delivery']?['date'])}'),
                        if (p['status'] == 'closed') Text('${p['closeReason'] ?? ''}'),
                        const SizedBox(height: 6),
                        pregnancyChips(p),
                      ]),
                    ),
                  ),
                ),
            ]);
          },
        ),
      );
}

class _RegisterPregnancy extends StatefulWidget {
  const _RegisterPregnancy();
  @override
  State<_RegisterPregnancy> createState() => _RegisterPregnancyState();
}

class _RegisterPregnancyState extends State<_RegisterPregnancy> {
  final c = {for (final k in ['womanName', 'husbandName', 'age', 'phone', 'village', 'rchId', 'gravida', 'para']) k: TextEditingController()};
  String lmp = '';
  final risks = <String>{};
  bool busy = false;

  @override
  Widget build(BuildContext context) {
    Widget f(String k, String label, {bool number = false, bool req = false}) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: TextField(controller: c[k], keyboardType: number ? TextInputType.number : null, decoration: InputDecoration(labelText: '$label${req ? ' *' : ''}')),
        );
    final edd = lmp.isEmpty ? null : DateTime.parse(lmp).add(const Duration(days: 280));
    return Scaffold(
      appBar: AppBar(title: Text(t('registerPregnancy', 'Register pregnancy'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        f('womanName', t('womanName', "Woman's name"), req: true),
        f('husbandName', t('husbandName', "Husband's name")),
        DateField(label: '${t('lmp', 'LMP')} *', value: lmp, first: DateTime.now().subtract(const Duration(days: 300)), last: DateTime.now(), onChanged: (v) => setState(() => lmp = v)),
        if (edd != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text('${t('edd', 'EDD')}: ${fmtDate(edd.toIso8601String())}', style: const TextStyle(fontWeight: FontWeight.w700))),
        gap,
        Row(children: [Expanded(child: f('age', t('age', 'Age'), number: true)), const SizedBox(width: 10), Expanded(child: f('phone', t('phone2', 'Phone'), number: true))]),
        f('village', t('village', 'Village')),
        Row(children: [Expanded(child: f('gravida', t('gravida', 'Gravida'), number: true)), const SizedBox(width: 10), Expanded(child: f('para', t('para', 'Para'), number: true))]),
        f('rchId', t('rchId', 'RCH ID')),
        Text(t('riskHistory', 'Risk history'), style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        Wrap(spacing: 6, runSpacing: 6, children: [for (final r in historyRisks) FilterChip(label: Text(r), selected: risks.contains(r), selectedColor: const Color(0xFFF8E3DD), onSelected: (s) => setState(() => s ? risks.add(r) : risks.remove(r)))]),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: busy
              ? null
              : () async {
                  if (c['womanName']!.text.trim().isEmpty || lmp.isEmpty) return toast(context, 'Name and LMP are required', error: true);
                  final phone = c['phone']!.text.replaceAll(RegExp(r'\D'), '');
                  if (phone.isNotEmpty && phone.length != 10) return toast(context, t('phoneInvalid', 'Enter a 10-digit phone number'), error: true);
                  setState(() => busy = true);
                  final ok = await runAction(context, () => api.post('/maternal', {for (final e in c.entries) e.key: e.value.text.trim(), 'lmp': lmp, 'historyRisks': risks.toList()}));
                  if (!context.mounted) return;
                  setState(() => busy = false);
                  if (ok) Navigator.pop(context, true);
                },
          child: Text(busy ? '…' : t('registerPregnancy', 'Register pregnancy')),
        ),
      ]),
    );
  }
}

/// One pregnancy: profile, status, ANC / delivery / PNC forms, history.
class PregnancyDetailScreen extends StatelessWidget {
  const PregnancyDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/pregnancy',
        title: t('maternalCare', 'Maternal care'),
        child: Loader<Map>(
          load: () async => await api.get('/maternal/$id') as Map,
          builder: (context, p, reload) {
            final s = (p['summary'] as Map?) ?? {};
            final status = '${p['status']}';
            final anc = (p['ancVisits'] as List?) ?? [];
            final pnc = (p['pncVisits'] as List?) ?? [];
            final del = p['delivery'] as Map?;
            Future<void> openForm(Widget form) async {
              final msg = await Navigator.push<String>(context, MaterialPageRoute(builder: (_) => form));
              if (msg != null && context.mounted) {
                toast(context, msg);
                reload();
              }
            }

            return ListView(padding: const EdgeInsets.all(16), children: [
              Row(children: [
                Expanded(child: Text('${p['womanName']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))),
                Badge2(t(status == 'pregnant' ? 'tabPregnant' : status == 'delivered' ? 'tabPostnatal' : 'refClosed'), tone: status == 'pregnant' ? infoTone : status == 'delivered' ? goodTone : neutralTone),
              ]),
              gap,
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (p['husbandName'] != null) Text('${t('husbandName', 'Husband')}: ${p['husbandName']}'),
                    if (p['age'] != null) Text('${t('age', 'Age')}: ${p['age']}'),
                    if (p['phone'] != null) InkWell(onTap: () => callPhone(p['phone']), child: Text('${p['phone']}', style: const TextStyle(color: C.primary, fontWeight: FontWeight.w600))),
                    if (p['village'] != null) Text('${p['village']}'),
                    if (p['rchId'] != null) Text('${t('rchId', 'RCH ID')}: ${p['rchId']}'),
                    Text('G${p['gravida'] ?? '?'} P${p['para'] ?? '?'} · ${t('lmp', 'LMP')}: ${fmtDate(p['lmp'])}'),
                  ]),
                ),
              ),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (status == 'pregnant') ...[
                      Text('${s['weeks']} ${t('weeks', 'weeks')} · T${s['trimester']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      Text('${t('edd', 'EDD')}: ${fmtDate(s['edd'])}'),
                    ],
                    if (status == 'delivered' && del != null) ...[
                      Text('${t('delivered', 'Delivered')} ${fmtDate(del['date'])} · ${t(del['place'] == 'home' ? 'homeDelivery' : 'institutionalDelivery')}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      if (del['childId'] is Map)
                        TextButton(style: TextButton.styleFrom(padding: EdgeInsets.zero), onPressed: () => Navigator.pushNamed(context, '/asha/child', arguments: {'id': del['childId']['_id']}), child: Text('${del['childId']['name']}')),
                      if (s['nextPnc']?['complete'] == true) Text(t('pncComplete', 'PNC complete')),
                    ],
                    const SizedBox(height: 6),
                    pregnancyChips(p),
                    if (riskHigh(p).isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(t('highRiskAdvice', ''), style: const TextStyle(fontSize: 12.5))),
                  ]),
                ),
              ),
              if (status != 'closed')
                Wrap(spacing: 8, runSpacing: 8, children: [
                  if (status == 'pregnant') FilledButton.icon(onPressed: () => openForm(_AncForm(id: id)), icon: const Icon(Icons.monitor_heart_outlined), label: Text(t('addAnc', 'Add ANC visit'))),
                  if (status == 'pregnant') FilledButton.icon(style: FilledButton.styleFrom(backgroundColor: C.green), onPressed: () => openForm(_DeliveryForm(id: id, womanName: '${p['womanName']}')), icon: const Icon(Icons.child_friendly), label: Text(t('recordDelivery', 'Record delivery'))),
                  if (status == 'delivered')
                    FilledButton.icon(
                      onPressed: () => openForm(_PncForm(id: id, days: [if (del?['place'] == 'home') 1, 3, 7, 14, 21, 28, 42], done: {for (final v in pnc) v['day']}, nextDay: s['nextPnc']?['day'])),
                      icon: const Icon(Icons.house_outlined),
                      label: Text(t('addPnc', 'Add PNC visit')),
                    ),
                  OutlinedButton.icon(style: OutlinedButton.styleFrom(foregroundColor: C.red), onPressed: () => Navigator.pushNamed(context, '/asha/referrals', arguments: {'pregnancyId': id}), icon: const Icon(Icons.local_hospital), label: Text(t('newReferral', 'Referral'))),
                  OutlinedButton(
                    onPressed: () async {
                      final reason = await showDialog<String>(
                        context: context,
                        builder: (c) => SimpleDialog(title: Text(t('closeReason', 'Reason')), children: [for (final r in _closeReasons) SimpleDialogOption(onPressed: () => Navigator.pop(c, r), child: Text(r))]),
                      );
                      if (reason != null && context.mounted && await runAction(context, () => api.patch('/maternal/$id', {'status': 'closed', 'closeReason': reason}), success: t('saved', 'Saved'))) reload();
                    },
                    child: Text(t('closeRecord', 'Close record')),
                  ),
                ]),
              if (anc.isNotEmpty) ...[
                SectionTitle('${t('ancHistory', 'ANC history')} (${anc.length})'),
                for (final v in anc.reversed)
                  Card(
                    child: ListTile(
                      dense: true,
                      title: Text('${fmtDate(v['date'])} · ${parseDate(v['date']) != null && parseDate(p['lmp']) != null ? parseDate(v['date'])!.difference(parseDate(p['lmp'])!).inDays ~/ 7 : '—'} ${t('weeks', 'weeks')}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text([
                        '${t('weight', 'Weight')} ${v['weight'] ?? '—'}',
                        'BP ${v['bpSys'] != null ? '${v['bpSys']}/${v['bpDia'] ?? '?'}' : '—'}',
                        'Hb ${v['hb'] ?? '—'}',
                        'IFA/Ca ${v['ifaTablets'] ?? '—'}/${v['calciumTablets'] ?? '—'}',
                        'Td ${v['tdDose'] ?? '—'}',
                        if (((v['dangerSigns'] as List?) ?? []).isNotEmpty) (v['dangerSigns'] as List).join(', '),
                      ].join(' · ')),
                    ),
                  ),
              ],
              if (pnc.isNotEmpty) ...[
                SectionTitle('${t('pncHistory', 'PNC history')} (${pnc.length})'),
                for (final v in pnc.reversed)
                  Card(
                    child: ListTile(
                      dense: true,
                      title: Text('${t('day', 'Day')} ${v['day']} · ${fmtDate(v['date'])}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text([
                        '${t('babyWeight', 'Baby weight')} ${v['babyWeight'] ?? '—'}',
                        '${t('exclusiveBreastfeeding', 'Breastfeeding')} ${v['breastfeeding'] == null ? '—' : v['breastfeeding'] == true ? '✓' : '✗'}',
                        if ([...((v['motherDangerSigns'] as List?) ?? []), ...((v['babyDangerSigns'] as List?) ?? [])].isNotEmpty) [...((v['motherDangerSigns'] as List?) ?? []), ...((v['babyDangerSigns'] as List?) ?? [])].join(', '),
                      ].join(' · ')),
                    ),
                  ),
              ],
            ]);
          },
        ),
      );
}

String _savedText(dynamic data) {
  final refs = data is Map ? (data['referralId'] != null ? 1 : ((data['referralIds'] as List?)?.length ?? 0)) : 0;
  return refs > 0 ? '${t('saved', 'Saved')} ${t('dangerSignReferred', 'An emergency referral was opened.')}' : t('saved', 'Saved');
}

Widget _signPicker(List<String> signs, Set<String> value, VoidCallback changed) => Wrap(spacing: 6, runSpacing: 6, children: [
      for (final s in signs)
        FilterChip(
          label: Text(s),
          selected: value.contains(s),
          selectedColor: const Color(0xFFF8E3DD),
          onSelected: (on) {
            on ? value.add(s) : value.remove(s);
            changed();
          },
        ),
    ]);

Widget _autoReferNote() => Card(
      color: const Color(0xFFF8E3DD),
      child: ListTile(
        leading: const Icon(Icons.priority_high_rounded, color: C.red),
        title: Text(t('dangerSignsAutoRefer', 'Danger signs: an emergency referral will be opened. Call an ambulance:')),
        trailing: FilledButton(style: FilledButton.styleFrom(backgroundColor: C.red), onPressed: () => callPhone('108'), child: const Text('108')),
      ),
    );

class _AncForm extends StatefulWidget {
  const _AncForm({required this.id});
  final String id;
  @override
  State<_AncForm> createState() => _AncFormState();
}

class _AncFormState extends State<_AncForm> {
  String date = isoDay(), td = '';
  final c = {for (final k in ['weight', 'bpSys', 'bpDia', 'hb', 'ifaTablets', 'calciumTablets', 'notes']) k: TextEditingController()};
  final signs = <String>{};
  bool busy = false;

  @override
  Widget build(BuildContext context) {
    final sys = num.tryParse(c['bpSys']!.text) ?? 0, dia = num.tryParse(c['bpDia']!.text) ?? 0, hb = num.tryParse(c['hb']!.text);
    Widget n(String k, String label) => Expanded(child: Padding(padding: const EdgeInsets.all(4), child: TextField(controller: c[k], keyboardType: const TextInputType.numberWithOptions(decimal: true), onChanged: (_) => setState(() {}), decoration: InputDecoration(labelText: label))));
    return Scaffold(
      appBar: AppBar(title: Text(t('addAnc', 'Add ANC visit'))),
      body: ListView(padding: const EdgeInsets.all(12), children: [
        DateField(label: t('date', 'Date'), value: date, last: DateTime.now(), onChanged: (v) => setState(() => date = v)),
        Row(children: [n('weight', '${t('weight', 'Weight')} (kg)'), n('hb', 'Hb (g/dL)')]),
        Row(children: [n('bpSys', 'BP (upper)'), n('bpDia', 'BP (lower)')]),
        Row(children: [n('ifaTablets', t('ifaGiven', 'IFA tablets')), n('calciumTablets', t('calciumGiven', 'Calcium tablets'))]),
        Padding(padding: const EdgeInsets.all(4), child: Pick<String>(label: 'Td', value: td, items: const [('', '—'), ('Td1', 'Td1'), ('Td2', 'Td2'), ('Booster', 'Booster')], onChanged: (v) => setState(() => td = v ?? ''))),
        if (sys >= 140 || dia >= 90) NoticeBox(t('highBpWarning', 'High blood pressure'), tone: badTone),
        if (hb != null && hb < 7) NoticeBox(t('severeAnaemiaWarning', 'Severe anaemia'), tone: badTone),
        const SizedBox(height: 8),
        Text(t('dangerSigns', 'Danger signs'), style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        _signPicker(ancDangerSigns, signs, () => setState(() {})),
        if (signs.isNotEmpty) _autoReferNote(),
        Padding(padding: const EdgeInsets.all(4), child: TextField(controller: c['notes'], maxLength: 1000, maxLines: 2, decoration: InputDecoration(hintText: t('notePlaceholder', 'Notes')))),
        FilledButton(
          onPressed: busy
              ? null
              : () async {
                  setState(() => busy = true);
                  try {
                    final data = await api.post('/maternal/${widget.id}/anc', {for (final e in c.entries) e.key: e.value.text.trim(), 'date': date, 'tdDose': td, 'dangerSigns': signs.toList()});
                    if (context.mounted) Navigator.pop(context, _savedText(data));
                  } catch (e) {
                    if (context.mounted) toast(context, errText(e), error: true);
                    setState(() => busy = false);
                  }
                },
          child: Text(busy ? '…' : t('save2', 'Save')),
        ),
      ]),
    );
  }
}

class _DeliveryForm extends StatefulWidget {
  const _DeliveryForm({required this.id, required this.womanName});
  final String id, womanName;
  @override
  State<_DeliveryForm> createState() => _DeliveryFormState();
}

class _DeliveryFormState extends State<_DeliveryForm> {
  String date = isoDay(), place = 'institutional', outcome = 'live', gender = '';
  final facility = TextEditingController(), birthWeight = TextEditingController(), babyName = TextEditingController();
  bool registerBaby = true, busy = false;

  @override
  Widget build(BuildContext context) {
    final bw = double.tryParse(birthWeight.text) ?? 0;
    return Scaffold(
      appBar: AppBar(title: Text(t('recordDelivery', 'Record delivery'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        DateField(label: t('date', 'Date'), value: date, last: DateTime.now(), onChanged: (v) => setState(() => date = v)),
        gap,
        Pick<String>(label: t('deliveryPlace', 'Place'), value: place, items: [('institutional', t('institutionalDelivery', 'Institutional')), ('home', t('homeDelivery', 'Home'))], onChanged: (v) => setState(() => place = v ?? 'institutional')),
        gap,
        TextField(controller: facility, maxLength: 200, decoration: InputDecoration(labelText: t('facility', 'Facility'))),
        Pick<String>(label: t('outcome', 'Outcome'), value: outcome, items: [('live', t('liveBirth', 'Live birth')), ('stillbirth', t('stillbirth', 'Stillbirth'))], onChanged: (v) => setState(() => outcome = v ?? 'live')),
        if (outcome == 'live') ...[
          gap,
          Pick<String>(label: '${t('gender', 'Gender')}${registerBaby ? ' *' : ''}', value: gender, items: [('', '—'), ('female', t('girl', 'Girl')), ('male', t('boy', 'Boy'))], onChanged: (v) => setState(() => gender = v ?? '')),
          gap,
          TextField(controller: birthWeight, keyboardType: const TextInputType.numberWithOptions(decimal: true), onChanged: (_) => setState(() {}), decoration: InputDecoration(labelText: '${t('birthWeight', 'Birth weight')} (kg)')),
          if (bw > 0 && bw < 2.5) NoticeBox(t('lowBirthWeight', 'Low birth weight'), tone: warnTone),
          CheckboxListTile(contentPadding: EdgeInsets.zero, value: registerBaby, onChanged: (v) => setState(() => registerBaby = v ?? true), title: Text(t('registerNewborn', 'Register the newborn'))),
          if (registerBaby) TextField(controller: babyName, maxLength: 100, decoration: InputDecoration(hintText: '${t('babyName', 'Baby name')} (${t('optional', 'optional')}) — Baby of ${widget.womanName}')),
        ],
        const SizedBox(height: 16),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: C.green),
          onPressed: busy
              ? null
              : () async {
                  if (outcome == 'live' && registerBaby && gender.isEmpty) return toast(context, 'Choose the baby\'s gender', error: true);
                  setState(() => busy = true);
                  try {
                    final data = await api.post('/maternal/${widget.id}/delivery', {
                      'date': date,
                      'place': place,
                      'facility': facility.text.trim(),
                      'outcome': outcome,
                      'babyGender': gender,
                      'birthWeight': birthWeight.text.trim(),
                      'registerBaby': registerBaby,
                      'babyName': babyName.text.trim(),
                    });
                    if (context.mounted) Navigator.pop(context, _savedText(data));
                  } catch (e) {
                    if (context.mounted) toast(context, errText(e), error: true);
                    setState(() => busy = false);
                  }
                },
          child: Text(busy ? '…' : t('save2', 'Save')),
        ),
      ]),
    );
  }
}

class _PncForm extends StatefulWidget {
  const _PncForm({required this.id, required this.days, required this.done, this.nextDay});
  final String id;
  final List<int> days;
  final Set done;
  final dynamic nextDay;
  @override
  State<_PncForm> createState() => _PncFormState();
}

class _PncFormState extends State<_PncForm> {
  late String day = widget.nextDay == null ? '' : '${widget.nextDay}';
  String date = isoDay();
  final babyWeight = TextEditingController(), notes = TextEditingController();
  final mother = <String>{}, baby = <String>{};
  bool breastfeeding = true, busy = false;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(t('addPnc', 'Add PNC visit'))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          Pick<String>(label: '${t('day', 'Day')} *', value: day, items: [('', '—'), for (final d in widget.days) ('$d', '${t('day', 'Day')} $d${widget.done.contains(d) ? ' ✓' : ''}')], onChanged: (v) => setState(() => day = v ?? '')),
          gap,
          DateField(label: t('date', 'Date'), value: date, last: DateTime.now(), onChanged: (v) => setState(() => date = v)),
          gap,
          TextField(controller: babyWeight, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: '${t('babyWeight', 'Baby weight')} (kg)')),
          CheckboxListTile(contentPadding: EdgeInsets.zero, value: breastfeeding, onChanged: (v) => setState(() => breastfeeding = v ?? true), title: Text(t('exclusiveBreastfeeding', 'Exclusive breastfeeding'))),
          Text(t('motherDangerSigns', "Mother's danger signs"), style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          _signPicker(motherPncDangerSigns, mother, () => setState(() {})),
          gap,
          Text(t('babyDangerSigns', "Baby's danger signs"), style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          _signPicker(babyDangerSigns, baby, () => setState(() {})),
          if (mother.isNotEmpty || baby.isNotEmpty) _autoReferNote(),
          TextField(controller: notes, maxLength: 1000, maxLines: 2, decoration: InputDecoration(hintText: t('notePlaceholder', 'Notes'))),
          FilledButton(
            onPressed: busy || day.isEmpty
                ? null
                : () async {
                    setState(() => busy = true);
                    try {
                      final data = await api.post('/maternal/${widget.id}/pnc', {
                        'day': day,
                        'date': date,
                        'breastfeeding': breastfeeding,
                        'motherDangerSigns': mother.toList(),
                        'babyDangerSigns': baby.toList(),
                        'babyWeight': babyWeight.text.trim(),
                        'notes': notes.text.trim(),
                      });
                      if (context.mounted) Navigator.pop(context, _savedText(data));
                    } catch (e) {
                      if (context.mounted) toast(context, errText(e), error: true);
                      setState(() => busy = false);
                    }
                  },
            child: Text(busy ? '…' : t('save2', 'Save')),
          ),
        ]),
      );
}
