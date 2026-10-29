import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/files.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

String thisMonth() => isoDay().substring(0, 7);
const _monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
String monthLabel(String ym) {
  final p = ym.split('-');
  return p.length == 2 ? '${_monthNames[int.parse(p[1]) - 1]} ${p[0]}' : ym;
}

/// Pick a month (yyyy-mm), up to the current one.
Future<String?> pickMonth(BuildContext context, String current) async {
  final d = await showDatePicker(context: context, helpText: t('month', 'Month'), initialDate: DateTime.tryParse('$current-01') ?? DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime.now(), initialDatePickerMode: DatePickerMode.year);
  return d == null ? null : isoOf(d).substring(0, 7);
}

/// The ASHA's own monthly report, with Excel export.
class GenerateReportScreen extends StatefulWidget {
  const GenerateReportScreen({super.key});
  @override
  State<GenerateReportScreen> createState() => _GenerateReportScreenState();
}

class _GenerateReportScreenState extends State<GenerateReportScreen> {
  String month = thisMonth();
  final _loader = GlobalKey<LoaderState<Map>>();

  Widget _section(String icon, String title, List<(String, dynamic, bool)> rows) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Icon(glyphIcon(icon), size: 20, color: C.primary), const SizedBox(width: 8), Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))]),
            const Divider(),
            for (final (label, value, warn) in rows)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(children: [
                  Expanded(child: Text(label)),
                  Text('${value ?? 0}', style: TextStyle(fontWeight: FontWeight.w800, color: warn ? C.red : C.text)),
                ]),
              ),
          ]),
        ),
      );

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/generate-report',
        child: Loader<Map>(
          key: _loader,
          load: () async => await api.get('/asha/report', {'month': month}) as Map,
          builder: (context, r, _) {
            num n(dynamic v) => v is num ? v : 0;
            final v = (r['visits'] as Map?) ?? {}, vac = (r['vaccination'] as Map?) ?? {}, nu = (r['nutrition'] as Map?) ?? {};
            final ref = (r['referrals'] as Map?) ?? {}, m = (r['maternal'] as Map?) ?? {}, camps = (r['camps'] as Map?) ?? {}, inc = (r['incentives'] as Map?) ?? {};
            final follow = (r['followUp'] as List?) ?? [];
            return ListView(padding: const EdgeInsets.all(16), children: [
              Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final mo = await pickMonth(context, month);
                      if (mo != null) {
                        setState(() => month = mo);
                        _loader.currentState?.reload();
                      }
                    },
                    icon: const Icon(Icons.calendar_month),
                    label: Text(monthLabel(month)),
                  ),
                ),
                const SizedBox(width: 10),
                FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: C.green),
                  onPressed: () => downloadAndOpen(context, '/asha/report', 'asha-report-${r['worker']?['ashaId'] ?? 'me'}-$month.xlsx', {'month': month, 'format': 'xlsx'}),
                  icon: const Icon(Icons.download),
                  label: const Text('Excel'),
                ),
              ]),
              gap,
              Text('${r['worker']?['ashaId'] ?? ''} · ${r['worker']?['block'] ?? ''}, ${r['worker']?['district'] ?? ''} · ${monthLabel(month)}', style: const TextStyle(color: C.muted)),
              gap,
              _section('🏠', t('homeVisits', 'Home visits'), [(t('refCompleted', 'Completed'), v['completed'], false), (t('visitMissed', 'Missed'), v['missed'], n(v['missed']) > 0), (t('childrenVisited', 'Children visited'), v['childrenVisited'], false), (t('referredDuringVisits', 'Referred during visits'), v['referredDuringVisits'], false)]),
              _section('💉', t('immunisation', 'Immunisation'), [(t('dosesGivenMonth', 'Doses given'), vac['dosesGiven'], false), (t('upToDate', 'Up to date'), '${vac['upToDatePct'] ?? 0}%', false), (t('childrenOverdue', 'Children overdue'), vac['overdueChildren'], n(vac['overdueChildren']) > 0)]),
              _section('🥗', t('nutritionScreening', 'Nutrition screening'), [(t('screenedMonth', 'Screened'), nu['screened'], false), (t('healthy', 'Healthy'), nu['healthy'], false), (t('moderate', 'Moderate'), nu['moderate'], n(nu['moderate']) > 0), (t('severe', 'Severe'), nu['severe'], n(nu['severe']) > 0)]),
              _section('🏥', t('referrals', 'Referrals'), [(t('referralsMade', 'Referrals made'), ref['total'], false), (t('urgencyEmergency', 'Emergency'), ref['emergency'], false), (t('refCompleted', 'Completed'), ref['completed'], false), (t('refOpen', 'Open'), ref['open'], n(ref['open']) > 0)]),
              _section('🤰', t('maternalCare', 'Maternal care'), [
                (t('pregnancyRegisteredCount', 'Pregnancies registered'), m['registered'], false),
                (t('ancHistory', 'ANC visits'), m['ancVisits'], false),
                (t('deliveries', 'Deliveries'), '${m['deliveries'] ?? 0} (${m['institutional'] ?? 0} ${t('institutionalShort', 'institutional')})', false),
                (t('pncHistory', 'PNC visits'), m['pncVisits'], false),
                (t('highRisk', 'High risk'), m['highRiskNow'], n(m['highRiskNow']) > 0),
              ]),
              _section('📢', t('outreachIncentives', 'Outreach & incentives'), [(t('campsHeld', 'Camps held'), camps['held'], false), (t('incentiveClaims', 'Incentive claims'), inc['claims'], false), (t('claimApproved', 'Approved'), rupees(inc['approvedAmount']), false)]),
              SectionTitle('${t('needsFollowUp', 'Needs follow-up')} (${follow.length})'),
              Card(
                child: follow.isEmpty
                    ? EmptyState(t('visitsNoneDue', 'No visits due'))
                    : Column(children: [for (final f in follow) ListTile(dense: true, title: Text('${f['name']}', style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text('${f['village'] ?? '—'} · ${f['reasons'] ?? ''}'), trailing: Text(fmtDate(f['due'])))]),
              ),
            ]);
          },
        ),
      );
}

// ── Incentive claims ───────────────────────────────────────────────────────
const claimStatus = {
  'pending': ('claimPending', neutralTone),
  'submitted': ('claimSubmitted', Tone(Color(0xFF3B6E8F), Color(0xFFE5ECF2))),
  'approved': ('claimApproved', Tone(Color(0xFF276749), Color(0xFFE3F1E8))),
  'rejected': ('claimRejected', badTone),
  'paid': ('claimPaid', Tone(Color(0xFF276749), Color(0xFFE3F1E8))),
};

class IncentivesScreen extends StatefulWidget {
  const IncentivesScreen({super.key});
  @override
  State<IncentivesScreen> createState() => _IncentivesScreenState();
}

class _IncentivesScreenState extends State<IncentivesScreen> {
  String month = thisMonth(), filter = 'all';
  final _loader = GlobalKey<LoaderState<(List, List)>>();

  Future<(List, List)> load() async {
    final r = await Future.wait([api.get('/incentives'), api.get('/incentives/suggestions', {'month': month}).catchError((_) => {})]);
    return (r[0] as List, ((r[1] as Map?)?['suggestions'] as List?) ?? []);
  }

  Future<void> claim([Map? prefill]) async {
    final msg = await Navigator.push<String>(context, MaterialPageRoute(builder: (_) => _ClaimForm(month: month, prefill: prefill)));
    if (msg != null && mounted) {
      toast(context, msg);
      _loader.currentState?.reload();
    }
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/incentives',
        fab: FloatingActionButton.extended(onPressed: claim, icon: const Icon(Icons.add), label: Text(t('newClaim', 'New claim'))),
        child: Loader<(List, List)>(
          key: _loader,
          load: load,
          builder: (context, data, reload) {
            final (claims, suggestions) = data;
            num total(List<String> st) => claims.where((c) => st.contains(c['status'])).fold<num>(0, (n, c) => n + ((c['amount'] as num?) ?? 0));
            final shown = claims.where((c) => filter == 'all' || c['status'] == filter).toList();
            Future<void> act(Map c, String action) async {
              if (action == 'delete' && !await confirm(context, t('confirmDeleteClaim', 'Delete this draft claim?'))) return;
              if (context.mounted && await runAction(context, () => api.patch('/incentives/${c['_id']}', {'action': action}))) reload();
            }

            return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
              Row(children: [
                for (final (label, st, color) in [(t('claimSubmitted', 'Submitted'), ['submitted'], const Color(0xFF3B6E8F)), (t('claimApproved', 'Approved'), ['approved'], const Color(0xFF276749)), (t('claimPaid', 'Paid'), ['paid'], const Color(0xFF276749))])
                  Expanded(child: Padding(padding: const EdgeInsets.only(right: 6), child: StatTile(label: label, value: rupees(total(st)), color: color))),
              ]),
              gap,
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text(t('eligibleActivities', 'Eligible activities'), style: const TextStyle(fontWeight: FontWeight.w700))),
                      TextButton.icon(
                        onPressed: () async {
                          final mo = await pickMonth(context, month);
                          if (mo != null) {
                            setState(() => month = mo);
                            _loader.currentState?.reload();
                          }
                        },
                        icon: const Icon(Icons.calendar_month, size: 18),
                        label: Text(monthLabel(month)),
                      ),
                    ]),
                    if (suggestions.isEmpty) Text(t('noSuggestions', 'Nothing found in your records for this month.'), style: const TextStyle(color: C.muted)),
                    for (final s in suggestions)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        title: Text('${s['activity']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${s['beneficiary'] ?? ''} · ${s['evidence'] ?? ''}'),
                        trailing: OutlinedButton(onPressed: () => claim(s), child: Text(t('claim', 'Claim'))),
                      ),
                  ]),
                ),
              ),
              ChoiceRow(value: filter, onChanged: (v) => setState(() => filter = v), options: [for (final k in ['all', 'pending', 'submitted', 'approved', 'rejected', 'paid']) (k, '${k == 'all' ? t('visitsAll', 'All') : t(claimStatus[k]!.$1)} (${k == 'all' ? claims.length : claims.where((c) => c['status'] == k).length})')]),
              if (shown.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
              for (final c in shown) ClaimCard(c: c, actions: c['status'] == 'pending' ? [FilledButton(onPressed: () => act(c, 'submit'), child: Text(t('submitClaim', 'Submit'))), IconButton(icon: const Icon(Icons.delete_outline, color: C.red), onPressed: () => act(c, 'delete'))] : const []),
            ]);
          },
        ),
      );
}

/// One claim (shared with the admin's claims page).
class ClaimCard extends StatelessWidget {
  const ClaimCard({super.key, required this.c, this.actions = const [], this.subtitle});
  final Map c;
  final List<Widget> actions;
  final String? subtitle;
  @override
  Widget build(BuildContext context) {
    final (label, tone) = claimStatus[c['status']] ?? claimStatus['pending']!;
    final history = (c['history'] as List?) ?? [];
    final last = history.lastOrNull as Map?;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${c['activity']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                if (subtitle != null) Text(subtitle!, style: const TextStyle(color: C.muted, fontSize: 12.5)),
                Text('${c['beneficiary'] ?? '—'} · ${c['month']}${c['notes'] != null && '${c['notes']}'.isNotEmpty ? ' · ${c['notes']}' : ''}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
                if (last?['note'] != null && c['status'] != 'pending')
                  Text('${last!['by'] is Map ? '${last['by']['name']}: ' : ''}${last['note']} · ${fmtDate(last['at'])}', style: TextStyle(fontSize: 12.5, color: c['status'] == 'rejected' ? C.red : C.muted)),
              ]),
            ),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(c['amount'] != null ? rupees(c['amount']) : '—', style: const TextStyle(fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Badge2(t(label), tone: tone),
            ]),
          ]),
          if (actions.isNotEmpty) Row(mainAxisAlignment: MainAxisAlignment.end, children: actions),
        ]),
      ),
    );
  }
}

class _ClaimForm extends StatefulWidget {
  const _ClaimForm({required this.month, this.prefill});
  final String month;
  final Map? prefill;
  @override
  State<_ClaimForm> createState() => _ClaimFormState();
}

class _ClaimFormState extends State<_ClaimForm> {
  late String activity = '${widget.prefill?['activity'] ?? ''}', month = widget.month;
  late final beneficiary = TextEditingController(text: '${widget.prefill?['beneficiary'] ?? ''}');
  final amount = TextEditingController(), notes = TextEditingController();
  List activities = [];
  bool busy = false;
  bool get linked => widget.prefill?['childId'] != null || widget.prefill?['pregnancyId'] != null;

  @override
  void initState() {
    super.initState();
    api.get('/incentives/activities').then((r) => mounted ? setState(() => activities = r as List) : null).catchError((_) => null);
  }

  Future<void> save(bool submit) async {
    if (activity.isEmpty) return toast(context, 'Choose an activity', error: true);
    setState(() => busy = true);
    final ok = await runAction(context, () => api.post('/incentives', {
          'activity': activity,
          'month': month,
          'beneficiary': beneficiary.text.trim(),
          'childId': widget.prefill?['childId'] ?? '',
          'pregnancyId': widget.prefill?['pregnancyId'] ?? '',
          'amount': amount.text.trim(),
          'notes': notes.text.trim(),
          'submit': submit,
        }));
    if (!mounted) return;
    setState(() => busy = false);
    if (ok) Navigator.pop(context, submit ? t('claimSubmittedMsg', 'Claim submitted for review.') : t('claimSavedMsg', 'Draft saved.'));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(t('newClaim', 'New claim'))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          Pick<String>(label: '${t('activity', 'Activity')} *', value: activity.isEmpty ? null : activity, items: [for (final a in {...activities.map((e) => '$e'), if (activity.isNotEmpty) activity}) (a, a)], onChanged: (v) => setState(() => activity = v ?? '')),
          gap,
          OutlinedButton.icon(
            onPressed: () async {
              final mo = await pickMonth(context, month);
              if (mo != null) setState(() => month = mo);
            },
            icon: const Icon(Icons.calendar_month),
            label: Text('${t('month', 'Month')}: ${monthLabel(month)}'),
          ),
          gap,
          TextField(controller: amount, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: '${t('amount', 'Amount')} (₹)')),
          gap,
          TextField(controller: beneficiary, readOnly: linked, maxLength: 150, decoration: InputDecoration(labelText: t('beneficiary', 'Beneficiary'))),
          TextField(controller: notes, maxLength: 500, decoration: InputDecoration(labelText: t('claimNotes', 'Notes'))),
          Text(t('incentiveRateNote', ''), style: const TextStyle(color: C.muted, fontSize: 12.5)),
          const SizedBox(height: 16),
          FilledButton(onPressed: busy ? null : () => save(true), child: Text(busy ? '…' : t('submitClaim', 'Submit claim'))),
          OutlinedButton(onPressed: busy ? null : () => save(false), child: Text(t('saveDraft', 'Save draft'))),
        ]),
      );
}
