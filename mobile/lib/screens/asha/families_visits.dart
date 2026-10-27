import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

/// Households in the ASHA's area: each family with its children, contacts and last visit.
class FamiliesScreen extends StatefulWidget {
  const FamiliesScreen({super.key});
  @override
  State<FamiliesScreen> createState() => _FamiliesScreenState();
}

class _FamiliesScreenState extends State<FamiliesScreen> {
  String search = '';
  bool onlyFollowUp = false;

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/families',
        fab: FloatingActionButton.extended(onPressed: () => Navigator.pushNamed(context, '/asha/register-child'), icon: const Icon(Icons.person_add_alt), label: Text(t('registerChild', 'Register child'))),
        child: Loader<Map>(
          load: () async => await api.get('/asha/families') as Map,
          builder: (context, data, _) {
            final all = (data['families'] as List?) ?? [];
            final dups = (data['duplicates'] as List?) ?? [];
            final q = search.trim().toLowerCase();
            final families = all.where((f) {
              if (onlyFollowUp && f['needsFollowUp'] != true) return false;
              if (q.isEmpty) return true;
              return [f['familyId'], f['headName'], f['phone'], f['motherName'], f['fatherName'], f['village'], ...((f['children'] as List?) ?? []).map((c) => c['name'])].any((v) => '${v ?? ''}'.toLowerCase().contains(q));
            }).toList();
            return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
              Text('${t('families', 'Families')} (${all.length})', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              gap,
              if (dups.isNotEmpty)
                Card(
                  color: const Color(0xFFFFFBEB),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('⚠️ ${t('possibleDuplicates', 'Possible duplicate records')}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      for (final pair in dups)
                        TextButton(
                          style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
                          onPressed: () => Navigator.pushNamed(context, '/asha/child', arguments: {'id': pair[0]['_id']}),
                          child: Text('${pair[0]['name']} (${pair[0]['childId']}) ↔ ${pair[1]['name']} (${pair[1]['childId']})'),
                        ),
                      Text(t('duplicatesHint', ''), style: const TextStyle(color: C.muted, fontSize: 12)),
                    ]),
                  ),
                ),
              TextField(onChanged: (v) => setState(() => search = v), decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: t('familySearch', 'Search name, phone, village'))),
              CheckboxListTile(contentPadding: EdgeInsets.zero, value: onlyFollowUp, onChanged: (v) => setState(() => onlyFollowUp = v ?? false), title: Text(t('needsFollowUpOnly', 'Only families needing follow-up'))),
              if (families.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
              for (final f in families)
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: f['needsFollowUp'] == true ? const Color(0xFFF59E0B) : C.border, width: 1.5)),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('${f['headName']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                            Text('${f['familyId']}${f['village'] != null ? ' · ${f['village']}' : ''}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
                          ]),
                        ),
                        if (f['needsFollowUp'] == true) Badge2(t('needsFollowUp', 'Needs follow-up'), tone: warnTone),
                      ]),
                      const SizedBox(height: 6),
                      if (f['motherName'] != null) Text('👩 ${t('mother', 'Mother')}: ${f['motherName']}'),
                      if (f['fatherName'] != null) Text('👨 ${t('father', 'Father')}: ${f['fatherName']}'),
                      if (f['phone'] != null) InkWell(onTap: () => callPhone(f['phone']), child: Text('📞 ${f['phone']}', style: const TextStyle(color: C.primary, fontWeight: FontWeight.w600))),
                      Text('${t('lastVisit', 'Last visit')}: ${f['lastVisit'] != null ? fmtDate(f['lastVisit']) : t('never', 'Never')}', style: const TextStyle(color: C.muted)),
                      const SizedBox(height: 6),
                      for (final c in (f['children'] as List?) ?? [])
                        ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          title: Text('${c['name']}  ${ageText(c['dob'])}${c['openReferral'] == true ? '  🏥' : ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          trailing: StatusBadge(c['nutritionStatus'] ?? 'healthy'),
                          onTap: () => Navigator.pushNamed(context, '/asha/child', arguments: {'id': c['_id']}),
                        ),
                    ]),
                  ),
                ),
            ]);
          },
        ),
      );
}

// ── My visits: the daily work list ─────────────────────────────────────────
const _bucket = {
  'overdue': ('visitsOverdue', badTone),
  'today': ('visitsToday', warnTone),
  'week': ('visitsThisWeek', infoTone),
  'later': ('visitsLater', neutralTone),
};

class MyVisitsScreen extends StatefulWidget {
  const MyVisitsScreen({super.key});
  @override
  State<MyVisitsScreen> createState() => _MyVisitsScreenState();
}

class _MyVisitsScreenState extends State<MyVisitsScreen> {
  String tab = 'now';

  bool _match(String tab, String? b) => tab == 'all' || (tab == 'now' ? (b == 'overdue' || b == 'today') : b == 'week');

  Future<void> missed(BuildContext context, Map child, VoidCallback reload) async {
    final now = DateTime.now();
    final d = await showDatePicker(context: context, helpText: t('rescheduleTo', 'Reschedule to'), initialDate: now.add(const Duration(days: 1)), firstDate: now, lastDate: now.add(const Duration(days: 365)));
    if (d == null || !context.mounted) return;
    if (await runAction(context, () => api.post('/asha/visit', {'childId': child['_id'], 'status': 'missed', 'followUpDate': isoOf(d), 'visitType': 'Missed visit'}))) reload();
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/my-visits',
        fab: FloatingActionButton.extended(onPressed: () => Navigator.pushNamed(context, '/asha/log-visit'), icon: const Icon(Icons.assignment_add), label: Text(t('logVisit', 'Log visit'))),
        child: Loader<Map>(
          load: () async => await api.get('/asha/visit-plan') as Map,
          builder: (context, plan, reload) {
            final items = (plan['items'] as List?) ?? [];
            final counts = (plan['counts'] as Map?) ?? {};
            final shown = items.where((i) => _match(tab, i['bucket'])).toList();
            return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
              Row(children: [
                for (final b in ['overdue', 'today', 'week'])
                  Expanded(child: Padding(padding: const EdgeInsets.only(right: 6), child: StatTile(label: t(_bucket[b]!.$1), value: '${counts[b] ?? 0}', color: _bucket[b]!.$2.fg))),
              ]),
              gap,
              ChoiceRow(
                value: tab,
                onChanged: (v) => setState(() => tab = v),
                options: [for (final k in ['now', 'week', 'all']) (k, '${t(k == 'now' ? 'visitsDueNow' : k == 'week' ? 'visitsThisWeek' : 'visitsAll')} (${items.where((i) => _match(k, i['bucket'])).length})')],
              ),
              if (shown.isEmpty) Card(child: EmptyState('✅ ${t('visitsNoneDue', 'No visits due')}', icon: Icons.event_available)),
              for (final item in shown)
                Builder(builder: (context) {
                  final c = item['child'] as Map;
                  final (label, tone) = _bucket[item['bucket']] ?? _bucket['later']!;
                  final phone = c['parentId'] is Map ? c['parentId']['phone'] : c['contactPhone'];
                  return Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: tone.fg.withValues(alpha: .5), width: 1.5)),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Expanded(
                            child: InkWell(
                              onTap: () => Navigator.pushNamed(context, '/asha/child', arguments: {'id': c['_id']}),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text('${c['name']}  ${ageText(c['dob'])} · ${c['gender'] == 'female' ? '♀' : '♂'}', style: const TextStyle(fontWeight: FontWeight.w800, color: C.dark)),
                                Text('${c['parentId'] is Map ? c['parentId']['name'] : c['motherName'] ?? '—'}${c['village'] != null ? ' · ${c['village']}' : ''}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
                              ]),
                            ),
                          ),
                          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                            Badge2('${t(label)} · ${fmtDate(item['dueDate'])}', tone: tone),
                            Text('${t('lastVisit', 'Last visit')}: ${item['lastVisit'] != null ? fmtDate(item['lastVisit']) : t('never', 'Never')}', style: const TextStyle(fontSize: 11.5, color: C.muted)),
                          ]),
                        ]),
                        const SizedBox(height: 6),
                        Wrap(spacing: 6, runSpacing: 6, children: [
                          if (c['nutritionStatus'] != null && c['nutritionStatus'] != 'healthy') StatusBadge(c['nutritionStatus']),
                          for (final r in ((item['reasons'] as List?) ?? []).where((r) => !RegExp('malnutrition', caseSensitive: false).hasMatch('$r'))) Badge2('$r'),
                        ]),
                        const SizedBox(height: 8),
                        Wrap(spacing: 8, children: [
                          FilledButton.icon(onPressed: () => Navigator.pushNamed(context, '/asha/log-visit', arguments: {'childId': c['_id']}).then((_) => reload()), icon: const Icon(Icons.check_circle_outline, size: 18), label: Text(t('logVisit', 'Log visit'))),
                          if (phone != null) OutlinedButton.icon(onPressed: () => callPhone(phone), icon: const Icon(Icons.call, size: 18), label: Text(t('call', 'Call'))),
                          OutlinedButton.icon(onPressed: () => missed(context, c, reload), icon: const Icon(Icons.cancel_outlined, size: 18), label: Text(t('visitMissed', 'Missed'))),
                        ]),
                      ]),
                    ),
                  );
                }),
            ]);
          },
        ),
      );
}
