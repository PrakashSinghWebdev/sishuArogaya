import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

/// Immunisation for the ASHA's children: who is overdue, what is due soon, and recording doses given.
class VaccinationTrackerScreen extends StatefulWidget {
  const VaccinationTrackerScreen({super.key});
  @override
  State<VaccinationTrackerScreen> createState() => _VaccinationTrackerScreenState();
}

class _VaccinationTrackerScreenState extends State<VaccinationTrackerScreen> {
  String tab = 'due', search = '';

  Future<(Map, List)> load() async {
    final r = await Future.wait([api.get('/asha/vaccination-status'), api.get('/camps', {'when': 'upcoming'}).catchError((_) => [])]);
    return (r[0] as Map, ((r[1] as List?) ?? []).where((c) => c['status'] == 'scheduled').toList());
  }

  Future<void> markGiven(BuildContext context, Map dose, String childName, VoidCallback reload) async {
    final now = DateTime.now();
    final d = await showDatePicker(context: context, helpText: t('dateGiven', 'Date given'), initialDate: now, firstDate: DateTime(now.year - 6), lastDate: now);
    if (d == null || !context.mounted) return;
    if (await runAction(context, () => api.put('/vaccination/update', {'vaccineId': dose['_id'], 'givenDate': isoOf(d)}), success: '✓ ${dose['vaccineName']} — $childName')) reload();
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/vaccination-tracker',
        actions: [IconButton(tooltip: t('healthCampaigns', 'Camps'), icon: const Icon(Icons.campaign_outlined), onPressed: () => Navigator.pushNamed(context, '/asha/camps'))],
        child: Loader<(Map, List)>(
          load: load,
          builder: (context, data, reload) {
            final (status, camps) = data;
            final q = search.trim().toLowerCase();
            final rows = ((status['children'] as List?) ?? []).where((r) => q.isEmpty || [r['child']['name'], r['child']['village'], r['child']['motherName']].any((v) => '${v ?? ''}'.toLowerCase().contains(q))).toList();
            final due = rows.where((r) => ((r['pending'] as List?) ?? []).isNotEmpty).toList();
            final sum = (status['summary'] as Map?) ?? {};
            final nextCamp = camps.where((c) => c['kind'] == 'immunisation').firstOrNull ?? camps.firstOrNull;
            return ListView(padding: const EdgeInsets.all(16), children: [
              StatGrid([
                StatTile(label: t('upToDate', 'Up to date'), value: '${sum['upToDate'] ?? 0}/${sum['children'] ?? 0}', sub: '${sum['coveragePct'] ?? 0}% ${t('coverage', 'coverage')}', color: const Color(0xFF15803D)),
                StatTile(label: t('childrenOverdue', 'Children overdue'), value: '${sum['overdueChildren'] ?? 0}', sub: t('followUpThisWeek', 'Follow up this week'), color: const Color(0xFFB91C1C)),
                StatTile(label: t('vaccinesDueWeek', 'Due this week'), value: '${sum['dueThisWeek'] ?? 0}', sub: t('dosesLabel', 'doses'), color: const Color(0xFFA16207)),
                StatTile(label: t('nextCamp', 'Next camp'), value: nextCamp != null ? fmtDate(nextCamp['date']) : '—', sub: nextCamp != null ? '${nextCamp['village'] ?? nextCamp['venue'] ?? nextCamp['title']}' : t('noCampScheduled', 'No camp scheduled'), color: const Color(0xFF1D4ED8)),
              ]),
              gap,
              ChoiceRow(value: tab, onChanged: (v) => setState(() => tab = v), options: [('due', '${t('dueAndOverdue', 'Due & overdue')} (${due.length})'), ('all', '${t('allChildren', 'All children')} (${rows.length})'), ('camps', '${t('healthCampaigns', 'Camps')} (${camps.length})')]),
              if (tab != 'camps') ...[TextField(onChanged: (v) => setState(() => search = v), decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: t('search', 'Search'))), gap],
              if (tab == 'due') ...[
                if (due.isEmpty) Card(child: EmptyState('✅ ${t('allUpToDate', 'All children are up to date')}')),
                for (final r in due)
                  Builder(builder: (context) {
                    final c = r['child'] as Map;
                    final phone = c['parentId'] is Map ? c['parentId']['phone'] : c['contactPhone'];
                    return Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: (r['overdue'] ?? 0) > 0 ? C.red : const Color(0xFFF59E0B), width: 1.5)),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(
                              child: InkWell(
                                onTap: () => Navigator.pushNamed(context, '/asha/child', arguments: {'id': c['_id']}),
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w800, color: C.dark)),
                                  Text('${ageText(c['dob'])}${c['village'] != null ? ' · ${c['village']}' : ''} · ${c['parentId'] is Map ? c['parentId']['name'] : c['motherName'] ?? ''}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
                                ]),
                              ),
                            ),
                            if (phone != null) IconButton(icon: const Icon(Icons.call, color: C.primary), onPressed: () => callPhone(phone)),
                            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                              Text('${r['given']} ${t('dosesGiven', 'given')}', style: const TextStyle(fontSize: 12)),
                              if ((r['overdue'] ?? 0) > 0) Text('${r['overdue']} ${t('visitsOverdue', 'overdue')}', style: const TextStyle(color: C.red, fontWeight: FontWeight.w700, fontSize: 12)),
                            ]),
                          ]),
                          for (final d in r['pending'] as List)
                            Container(
                              margin: const EdgeInsets.only(top: 6),
                              padding: const EdgeInsets.fromLTRB(10, 2, 2, 2),
                              decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(10)),
                              child: Row(children: [
                                Expanded(child: Text('💉 ${d['vaccineName']}', style: const TextStyle(fontWeight: FontWeight.w600))),
                                Badge2('${d['overdue'] == true ? t('visitsOverdue', 'Overdue') : t('due', 'Due')} · ${fmtDate(d['dueDate'])}', tone: d['overdue'] == true ? badTone : warnTone),
                                TextButton(onPressed: () => markGiven(context, d, '${c['name']}', reload), child: Text('✓ ${t('markGiven', 'Given')}')),
                              ]),
                            ),
                        ]),
                      ),
                    );
                  }),
              ],
              if (tab == 'all')
                for (final r in rows)
                  Card(
                    child: ListTile(
                      title: Text('${r['child']['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text([
                        ageText(r['child']['dob']),
                        if (r['child']['village'] != null) '${r['child']['village']}',
                        '${r['given']}${(r['dueByNow'] ?? 0) > 0 ? ' / ${r['dueByNow']} ${t('dueByNow', 'due by now')}' : ''} ${t('dosesGiven', 'given')}',
                        if (r['next'] is Map) '${t('nextDose', 'Next')}: ${r['next']['vaccineName']} ${fmtDate(r['next']['dueDate'])}',
                      ].join(' · ')),
                      trailing: r['upToDate'] == true ? Badge2('✓ ${t('upToDate', 'Up to date')}', tone: goodTone) : Badge2('${r['overdue']} ${t('visitsOverdue', 'overdue')}', tone: badTone),
                      onTap: () => Navigator.pushNamed(context, '/asha/child', arguments: {'id': r['child']['_id']}),
                    ),
                  ),
              if (tab == 'camps') ...[
                if (camps.isEmpty) Card(child: EmptyState(t('noCampScheduled', 'No camp scheduled'))),
                for (final c in camps)
                  Card(
                    child: ListTile(
                      title: Text('${c['title']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text('📅 ${fmtDateTime(c['date'])}${c['venue'] != null ? ' · 📍 ${c['venue']}' : ''}${c['village'] != null ? ' · ${c['village']}' : ''}'),
                      onTap: () => Navigator.pushNamed(context, '/asha/camps'),
                    ),
                  ),
              ],
            ]);
          },
        ),
      );
}

/// Complete log of home visits, newest first, with outcome filter and search.
class VisitHistoryScreen extends StatefulWidget {
  const VisitHistoryScreen({super.key});
  @override
  State<VisitHistoryScreen> createState() => _VisitHistoryScreenState();
}

class _VisitHistoryScreenState extends State<VisitHistoryScreen> {
  String filter = 'all', search = '';

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/visit-history',
        child: Loader<List>(
          load: () async => await api.get('/asha/visits') as List,
          builder: (context, visits, _) {
            String outcome(Map v) => '${v['outcome'] ?? 'healthy'}'.toLowerCase();
            int count(String o) => visits.where((v) => outcome(v) == o).length;
            final q = search.toLowerCase();
            final shown = visits.reversed.where((v) => filter == 'all' || outcome(v) == filter).where((v) => q.isEmpty || '${v['childId'] is Map ? v['childId']['name'] : v['childName'] ?? ''} ${v['visitType'] ?? ''} ${v['notes'] ?? ''}'.toLowerCase().contains(q)).toList();
            return ListView(padding: const EdgeInsets.all(16), children: [
              StatGrid([
                StatTile(label: t('visitHistory', 'Visits'), value: '${visits.length}', color: C.primary),
                StatTile(label: '${t('healthy', 'Healthy')} outcomes', value: '${count('healthy')}', color: C.green),
                StatTile(label: '${t('moderate', 'Moderate')} outcomes', value: '${count('moderate')}', color: const Color(0xFFF59E0B)),
                StatTile(label: '${t('severe', 'Severe')} outcomes', value: '${count('severe')}', color: const Color(0xFFEF4444)),
              ]),
              gap,
              TextField(onChanged: (v) => setState(() => search = v), decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: t('searchByName', 'Search by name'))),
              gap,
              ChoiceRow(value: filter, onChanged: (v) => setState(() => filter = v), options: [('all', '${t('all', 'All')} (${visits.length})'), ('healthy', '✓ ${t('healthy', 'Healthy')} (${count('healthy')})'), ('moderate', '⚠ ${t('moderate', 'Moderate')} (${count('moderate')})'), ('severe', '🚨 ${t('severe', 'Severe')} (${count('severe')})')]),
              Text('Showing ${shown.length} of ${visits.length} visits', style: const TextStyle(color: C.muted, fontSize: 12.5)),
              const SizedBox(height: 8),
              if (shown.isEmpty) Card(child: EmptyState(visits.isEmpty ? '${t('noVisitsYet', 'No visits yet')}\nStart logging home visits to see them appear here.' : '${t('noRecords', 'No records')}\nTry a different search term or filter.')),
              for (final v in shown)
                Builder(builder: (context) {
                  final d = parseDate(v['visitDate'] ?? v['createdAt']);
                  final vaccines = v['vaccinesGiven'] is List ? (v['vaccinesGiven'] as List).join(', ') : '${v['vaccinesGiven'] ?? ''}';
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(
                          width: 52,
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), gradient: const LinearGradient(colors: [C.primary, C.dark])),
                          child: Column(children: [
                            Text(d == null ? '—' : d.day.toString().padLeft(2, '0'), style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                            Text(d == null ? '' : const ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.month - 1], style: const TextStyle(color: Colors.white70, fontSize: 10.5)),
                            Text(d == null ? '' : '${d.year}', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                          ]),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Expanded(child: Text('${v['childId'] is Map ? v['childId']['name'] : v['childName'] ?? 'Unknown Child'}', style: const TextStyle(fontWeight: FontWeight.w700))),
                              StatusBadge(outcome(v)),
                            ]),
                            const SizedBox(height: 4),
                            Badge2('${v['visitType'] ?? 'Routine'}', tone: infoTone),
                            const SizedBox(height: 4),
                            Text([if (v['weight'] != null) '⚖️ ${v['weight']} kg', if (v['height'] != null) '📏 ${v['height']} cm', if (vaccines.isNotEmpty) '💉 $vaccines'].join('   ')),
                            if (v['notes'] != null && '${v['notes']}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text('${v['notes']}', style: const TextStyle(color: C.muted, fontSize: 12.5))),
                          ]),
                        ),
                      ]),
                    ),
                  );
                }),
            ]);
          },
        ),
      );
}
