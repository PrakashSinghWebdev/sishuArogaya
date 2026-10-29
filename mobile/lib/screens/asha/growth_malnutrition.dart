import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../../widgets/growth.dart';

num? _z(Map? r, String a, String b) => (r?[a] ?? r?[b]) is num ? (r?[a] ?? r?[b]) as num : null;
String statusFromZ(num? z) => z == null ? 'healthy' : z < -3 ? 'severe' : z < -2 ? 'moderate' : 'healthy';

/// Weight / height / z-scores for the ASHA's children, with a quick measurement form.
class GrowthRecordsScreen extends StatefulWidget {
  const GrowthRecordsScreen({super.key, this.childId});
  final String? childId;
  @override
  State<GrowthRecordsScreen> createState() => _GrowthRecordsScreenState();
}

class _GrowthRecordsScreenState extends State<GrowthRecordsScreen> {
  List children = [];
  String? selected;
  List records = [];
  bool loading = true, loadingRecords = false;
  String? error;
  String search = '';

  @override
  void initState() {
    super.initState();
    api.get('/asha/children').then((r) {
      final list = r as List;
      setState(() {
        children = list;
        selected = list.any((c) => c['_id'] == widget.childId) ? widget.childId : list.firstOrNull?['_id'];
        loading = false;
      });
      _loadRecords();
    }).catchError((e) {
      setState(() {
        error = 'Failed to load children.';
        loading = false;
      });
    });
  }

  Future<void> _loadRecords() async {
    if (selected == null) return;
    setState(() => loadingRecords = true);
    final r = await api.get('/growth/$selected').catchError((_) => []);
    if (mounted) {
      setState(() {
        records = (r as List?) ?? [];
        loadingRecords = false;
      });
    }
  }

  Future<void> addEntry(Map child) async {
    final w = TextEditingController(), h = TextEditingController(), hc = TextEditingController();
    String date = isoDay();
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (c) => StatefulBuilder(builder: (c, setS) {
        String err = '';
        bool saving = false;
        return StatefulBuilder(builder: (c, setInner) {
          return Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(c).viewInsets.bottom + 20),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text('${t('growthEntry', 'Growth entry')} — ${child['name']}', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              gap,
              Row(children: [
                Expanded(child: TextField(controller: w, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: '${t('weight', 'Weight')} (kg)', hintText: 'e.g. 8.5'))),
                const SizedBox(width: 8),
                Expanded(child: TextField(controller: h, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: '${t('height', 'Height')} (cm)', hintText: 'e.g. 70'))),
              ]),
              gap,
              TextField(controller: hc, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Head Circ. (cm)', hintText: 'e.g. 42')),
              gap,
              DateField(label: t('date', 'Date'), value: date, last: DateTime.now(), onChanged: (v) => setInner(() => date = v)),
              if (err.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(err, style: const TextStyle(color: C.red))),
              gap,
              FilledButton(
                onPressed: saving
                    ? null
                    : () async {
                        if (w.text.isEmpty || h.text.isEmpty) return setInner(() => err = 'Weight, height and date are required.');
                        setInner(() => saving = true);
                        try {
                          await api.post('/growth/add', {'childId': child['_id'], 'weight': num.parse(w.text), 'height': num.parse(h.text), if (num.tryParse(hc.text) != null) 'headCircumference': num.parse(hc.text), 'date': date});
                          if (c.mounted) Navigator.pop(c, true);
                        } catch (e) {
                          setInner(() {
                            err = errText(e);
                            saving = false;
                          });
                        }
                      },
                child: Text(saving ? '${t('loading', 'Saving')}…' : t('save', 'Save')),
              ),
            ]),
          );
        });
      }),
    );
    if (saved == true) _loadRecords();
  }

  @override
  Widget build(BuildContext context) {
    final child = children.where((c) => c['_id'] == selected).firstOrNull as Map?;
    final latest = records.lastOrNull as Map?;
    num? cz(Map c) => _z(c, 'weightForAgeZ', 'waz');
    final normal = children.where((c) => cz(c) == null || cz(c)! >= -1).length;
    final moderate = children.where((c) => cz(c) != null && cz(c)! < -1 && cz(c)! >= -3).length;
    final severe = children.where((c) => cz(c) != null && cz(c)! < -3).length;
    final matching = children.where((c) => '${c['name'] ?? ''}'.toLowerCase().contains(search.toLowerCase())).toList();
    return RoleShell(
      route: '/asha/growth-records',
      fab: child == null ? null : FloatingActionButton.extended(onPressed: () => addEntry(child), icon: const Icon(Icons.add), label: Text(t('growthEntry', 'Growth entry'))),
      child: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
              ? ListView(padding: const EdgeInsets.all(16), children: [ErrorBox(error!)])
              : ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
                  StatGrid([
                    StatTile(label: '${t('healthy', 'Healthy')} (WAZ ≥ −1)', value: '$normal', color: C.green),
                    StatTile(label: t('moderate', 'Moderate'), value: '$moderate', color: const Color(0xFFB7791F)),
                    StatTile(label: '${t('severe', 'Severe')} Cases', value: '$severe', color: const Color(0xFFB5452F)),
                    StatTile(label: t('totalChildren', 'Total children'), value: '${children.length}', color: C.primary),
                  ]),
                  gap,
                  TextField(onChanged: (v) => setState(() => search = v), decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: t('searchByName', 'Search by name'))),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 46,
                    child: ListView(scrollDirection: Axis.horizontal, children: [
                      for (final c in matching)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text('${c['name']}'),
                            selected: c['_id'] == selected,
                            onSelected: (_) {
                              setState(() => selected = c['_id']);
                              _loadRecords();
                            },
                          ),
                        ),
                    ]),
                  ),
                  if (children.isEmpty) Card(child: EmptyState(t('noChildrenAssigned', 'No children assigned'))),
                  if (child != null) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text('${child['name']}', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800))),
                            StatusBadge(statusFromZ(_z(latest, 'weightForAgeZ', 'wazScore') ?? cz(child))),
                          ]),
                          Text([if (child['ageInMonths'] != null) '${child['ageInMonths']} months old', if (child['gender'] != null) '${child['gender']}', if (child['bloodGroup'] != null) 'Blood: ${child['bloodGroup']}'].join(' · '), style: const TextStyle(color: C.muted)),
                          gap,
                          if (latest == null)
                            NoticeBox(t('noRecords', 'No records'), tone: infoTone)
                          else ...[
                            StatGrid(columns: 3, [
                              StatTile(label: t('weight', 'Weight'), value: latest['weight'] != null ? '${latest['weight']} kg' : '—'),
                              StatTile(label: t('height', 'Height'), value: latest['height'] != null ? '${latest['height']} cm' : '—'),
                              StatTile(label: 'Head Circ.', value: latest['headCircumference'] != null ? '${latest['headCircumference']} cm' : '—'),
                            ]),
                            gap,
                            const Text('WHO Z-Scores', style: TextStyle(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 8),
                            if (_z(latest, 'weightForAgeZ', 'wazScore') != null) ZGauge(value: _z(latest, 'weightForAgeZ', 'wazScore'), label: 'Weight-for-Age Z (WAZ)'),
                            if (_z(latest, 'heightForAgeZ', 'hazScore') != null) ZGauge(value: _z(latest, 'heightForAgeZ', 'hazScore'), label: 'Height-for-Age Z (HAZ)'),
                          ],
                        ]),
                      ),
                    ),
                    if (loadingRecords) const LinearProgressIndicator(),
                    if (records.isNotEmpty) Card(child: Padding(padding: const EdgeInsets.all(12), child: GrowthChart(records: records))),
                    SectionTitle(t('growthRecords', 'Growth records')),
                    Card(
                      child: records.isEmpty
                          ? EmptyState('${t('noRecords', 'No records')}\nTap "${t('growthEntry', 'Growth entry')}" to add the first record.')
                          : SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                columnSpacing: 14,
                                columns: [
                                  DataColumn(label: Text(t('date', 'Date'))),
                                  DataColumn(label: Text('${t('weight', 'Weight')} (kg)')),
                                  DataColumn(label: Text('${t('height', 'Height')} (cm)')),
                                  const DataColumn(label: Text('Head Circ.')),
                                  DataColumn(label: Text('${t('weight', 'Weight')} Z')),
                                  DataColumn(label: Text('${t('height', 'Height')} Z')),
                                  DataColumn(label: Text(t('status', 'Status'))),
                                ],
                                rows: [
                                  for (final r in records.reversed)
                                    DataRow(cells: [
                                      DataCell(Text(fmtDate(r['date'] ?? r['recordedDate'] ?? r['createdAt']))),
                                      DataCell(Text(str(r['weight']))),
                                      DataCell(Text(str(r['height']))),
                                      DataCell(Text(str(r['headCircumference']))),
                                      DataCell(Text(_z(r, 'weightForAgeZ', 'wazScore')?.toStringAsFixed(2) ?? '—')),
                                      DataCell(Text(_z(r, 'heightForAgeZ', 'hazScore')?.toStringAsFixed(2) ?? '—')),
                                      DataCell(StatusBadge(statusFromZ(_z(r, 'weightForAgeZ', 'wazScore')))),
                                    ]),
                                ],
                              ),
                            ),
                    ),
                  ],
                ]),
    );
  }
}

// ── Malnutrition report ────────────────────────────────────────────────────
const _severeSteps = ['Immediately refer to PHC / CMAM centre', 'Initiate RUTF (Ready-to-Use Therapeutic Food)', 'Visit family DAILY for 7 days', 'Report to District Health Officer', 'Document in MCPC register within 24 hours'];
const _moderateSteps = ['Counsel mother on nutrition & breastfeeding', 'Add energy-dense foods: dal, egg, ghee, ragi', 'Visit WEEKLY for 4 weeks', 'Enrol in ICDS supplementary nutrition programme', 'Monitor weight every 2 weeks'];

class MalnutritionReportScreen extends StatelessWidget {
  const MalnutritionReportScreen({super.key});

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/malnutrition-report',
        child: Loader<List>(
          load: () async => await api.get('/asha/children') as List,
          builder: (context, kids, _) {
            final severe = kids.where((c) => c['nutritionStatus'] == 'severe').toList();
            final moderate = kids.where((c) => c['nutritionStatus'] == 'moderate').toList();
            final healthy = kids.length - severe.length - moderate.length;
            return ListView(padding: const EdgeInsets.all(16), children: [
              Text('Active malnutrition cases in your area — ${kids.length} children monitored', style: const TextStyle(color: C.muted)),
              gap,
              if (severe.isNotEmpty) NoticeBox('${severe.length} ${t('severe', 'severe')} case${severe.length > 1 ? 's' : ''} — Immediate Action Required\n${severe.map((c) => c['name']).join(', ')} require urgent referral today.', tone: badTone),
              StatGrid([
                StatTile(label: t('severeCases', 'Severe cases'), value: '${severe.length}', sub: severe.isNotEmpty ? t('urgentAction', 'Urgent action') : null, color: const Color(0xFFB5452F)),
                StatTile(label: t('moderateCases', 'Moderate cases'), value: '${moderate.length}', sub: moderate.isNotEmpty ? 'Weekly monitoring' : null, color: const Color(0xFFB7791F)),
                StatTile(label: t('healthy', 'Healthy'), value: '$healthy', color: C.green),
                StatTile(label: t('phcReferralNeeded', 'PHC referral needed'), value: '${severe.length}', sub: severe.isNotEmpty ? 'Pending referrals' : 'None pending', color: C.primary),
              ]),
              if (severe.isNotEmpty) ...[SectionTitle('${t('severeCases', 'Severe cases')} (${severe.length})'), const Text('Requires immediate referral and daily home visits', style: TextStyle(color: C.muted)), for (final c in severe) _CaseCard(c: c, type: 'severe')],
              if (moderate.isNotEmpty) ...[SectionTitle('${t('moderateCases', 'Moderate cases')} (${moderate.length})'), const Text('Weekly home visits and enhanced nutrition counselling', style: TextStyle(color: C.muted)), for (final c in moderate) _CaseCard(c: c, type: 'moderate')],
              if (severe.isEmpty && moderate.isEmpty) Card(child: EmptyState('No Active Malnutrition Cases\nAll ${kids.length} children in your area are healthy. Keep up the great work!', icon: Icons.verified)),
              const SectionTitle('ASHA Action Protocol'),
              for (final (title, steps, color) in [('Severe Malnutrition Protocol', _severeSteps, const Color(0xFFB5452F)), ('Moderate Malnutrition Protocol', _moderateSteps, const Color(0xFFB7791F))])
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: color, width: 1.5)),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(title, style: TextStyle(fontWeight: FontWeight.w800, color: color)),
                      const SizedBox(height: 6),
                      for (var i = 0; i < steps.length; i++) Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Text('${i + 1}. ${steps[i]}')),
                    ]),
                  ),
                ),
            ]);
          },
        ),
      );
}

class _CaseCard extends StatelessWidget {
  const _CaseCard({required this.c, required this.type});
  final Map c;
  final String type;
  @override
  Widget build(BuildContext context) {
    final tone = nutritionTone[type]!;
    final phone = c['parentId'] is Map ? c['parentId']['phone'] : c['phone'];
    final months = c['ageInMonths'] ?? (c['dateOfBirth'] != null ? ageMonths(c['dateOfBirth']) : null);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: tone.fg.withValues(alpha: .5), width: 1.5)),
      child: ExpansionTile(
        shape: const Border(),
        leading: CircleAvatar(backgroundColor: tone.bg, child: Icon(type == 'severe' ? Icons.priority_high_rounded : Icons.warning_amber_rounded, color: tone.fg, size: 20)),
        title: Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text([months != null ? '$months months' : '—', if (c['gender'] != null) '${c['gender']}', if (c['parentId'] is Map) 'Parent: ${c['parentId']['name']}'].join(' · ')),
        trailing: StatusBadge(type),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${t('weight', 'Weight')}: ${c['currentWeight'] ?? c['weight'] ?? '—'} kg · ${t('height', 'Height')}: ${c['currentHeight'] ?? c['height'] ?? '—'} cm · Blood: ${c['bloodGroup'] ?? '—'} · Village: ${c['village'] ?? c['address'] ?? '—'}'),
          const SizedBox(height: 6),
          NoticeBox('Nutrition Status: ${type.toUpperCase()} — ${type == 'severe' ? 'This child requires immediate medical attention and PHC referral.' : 'This child needs enhanced nutrition support and weekly monitoring.'}', tone: tone),
          Wrap(spacing: 8, runSpacing: 8, children: [
            FilledButton.icon(style: FilledButton.styleFrom(backgroundColor: C.red), onPressed: () => Navigator.pushNamed(context, '/asha/referrals', arguments: {'childId': c['_id']}), icon: const Icon(Icons.local_hospital, size: 18), label: const Text('PHC Referral')),
            OutlinedButton.icon(onPressed: () => Navigator.pushNamed(context, '/asha/log-visit', arguments: {'childId': c['_id']}), icon: const Icon(Icons.assignment_add, size: 18), label: const Text('Log Follow-up')),
            if (phone != null) OutlinedButton.icon(onPressed: () => callPhone(phone), icon: const Icon(Icons.call, size: 18), label: const Text('Call Family')),
            OutlinedButton.icon(onPressed: () => Navigator.pushNamed(context, '/asha/growth-records', arguments: {'childId': c['_id']}), icon: const Icon(Icons.trending_up, size: 18), label: const Text('Growth Records')),
          ]),
        ],
      ),
    );
  }
}
