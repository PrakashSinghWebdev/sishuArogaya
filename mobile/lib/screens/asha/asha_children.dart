import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../../widgets/growth.dart';
import '../parent/parent_common.dart';

String childAge(Map c) {
  final m = c['ageInMonths'];
  if (m is num && m > 0) return m < 24 ? '$m mo' : '${m ~/ 12} yr ${m % 12} mo';
  return ageText(c['dob']);
}

/// Children assigned to this ASHA: counts, search, status filter, quick actions per child.
class MyChildrenScreen extends StatefulWidget {
  const MyChildrenScreen({super.key});
  @override
  State<MyChildrenScreen> createState() => _MyChildrenScreenState();
}

class _MyChildrenScreenState extends State<MyChildrenScreen> {
  String filter = 'all', search = '';

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/children',
        fab: FloatingActionButton.extended(onPressed: () => Navigator.pushNamed(context, '/asha/log-visit'), icon: const Icon(Icons.add), label: Text(t('logVisit', 'Log visit'))),
        child: Loader<List>(
          load: () async => await api.get('/asha/children') as List,
          builder: (context, kids, _) {
            int count(String s) => kids.where((c) => c['nutritionStatus'] == s).length;
            final shown = kids.where((c) => (filter == 'all' || c['nutritionStatus'] == filter) && '${c['name'] ?? ''}'.toLowerCase().contains(search.toLowerCase())).toList();
            return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
              StatGrid([
                StatTile(label: t('totalChildren', 'Total children'), value: '${kids.length}', sub: t('assignedChildren', 'Assigned'), color: C.primary),
                StatTile(label: t('healthy', 'Healthy'), value: '${count('healthy')}', sub: 'WAZ ≥ −1', color: C.green),
                StatTile(label: t('moderate', 'Moderate'), value: '${count('moderate')}', sub: t('followUpNeeded', 'Follow-up needed'), color: const Color(0xFFF59E0B)),
                StatTile(label: t('severe', 'Severe'), value: '${count('severe')}', sub: t('phcReferralNeeded', 'PHC referral needed'), color: const Color(0xFFEF4444)),
              ]),
              gap,
              TextField(onChanged: (v) => setState(() => search = v), decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: t('searchByName', 'Search by name'))),
              gap,
              ChoiceRow(
                value: filter,
                onChanged: (v) => setState(() => filter = v),
                options: [('all', '👥 ${t('viewAll', 'All')} ${kids.length}'), ('healthy', '✅ ${t('healthy', 'Healthy')} ${count('healthy')}'), ('moderate', '⚠️ ${t('moderate', 'Moderate')} ${count('moderate')}'), ('severe', '🚨 ${t('severe', 'Severe')} ${count('severe')}')],
              ),
              if (shown.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
              for (final c in shown) _ChildCard(c: c),
            ]);
          },
        ),
      );
}

class _ChildCard extends StatelessWidget {
  const _ChildCard({required this.c});
  final Map c;
  @override
  Widget build(BuildContext context) {
    final status = '${c['nutritionStatus'] ?? 'healthy'}';
    final tone = nutritionTone[status] ?? nutritionTone['healthy']!;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: tone.fg.withValues(alpha: .4))),
      child: ExpansionTile(
        shape: const Border(),
        leading: CircleAvatar(backgroundColor: tone.bg, child: const Text('👶')),
        title: Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text('${childAge(c)} · ${c['currentWeight'] ?? '—'} kg · ${c['currentHeight'] ?? '—'} cm · ${c['gender'] ?? '—'}'),
        trailing: StatusBadge(status),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('🩸 ${c['bloodGroup'] ?? '—'}${c['dob'] != null ? ' · 📅 DOB: ${fmtDate(c['dob'])}' : ''}', style: const TextStyle(color: C.muted)),
          const SizedBox(height: 6),
          Text(status == 'healthy'
              ? '✅ Normal growth — continue current plan'
              : status == 'moderate'
                  ? '⚠️ Moderate risk — increase nutrients + weekly follow-up'
                  : '🚨 Severe malnutrition — PHC referral required TODAY'),
          const SizedBox(height: 8),
          Wrap(spacing: 8, children: [
            FilledButton.icon(onPressed: () => Navigator.pushNamed(context, '/asha/log-visit', arguments: {'childId': c['_id']}), icon: const Icon(Icons.assignment_add, size: 18), label: Text(t('logVisit', 'Log visit'))),
            OutlinedButton.icon(onPressed: () => Navigator.pushNamed(context, '/asha/growth-records', arguments: {'childId': c['_id']}), icon: const Icon(Icons.trending_up, size: 18), label: const Text('Growth')),
            OutlinedButton(onPressed: () => Navigator.pushNamed(context, '/asha/child', arguments: {'id': c['_id']}), child: const Text('Profile')),
          ]),
        ],
      ),
    );
  }
}

/// One child: profile, actions, overdue vaccines, growth and vaccination records.
class ChildDetailScreen extends StatelessWidget {
  const ChildDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/child',
        title: 'Child profile',
        child: Loader<List>(
          load: () => Future.wait([api.get('/child/$id'), api.get('/growth/$id').catchError((_) => []), api.get('/vaccination/$id').catchError((_) => [])]),
          builder: (context, r, reload) {
            final c = r[0] as Map;
            final growth = (r[1] as List?) ?? [];
            final vaccines = (r[2] as List?) ?? [];
            final latest = growth.lastOrNull;
            final due = vaccines.where((v) => v['status'] == 'due' || v['status'] == 'missed').length;
            void go(String route, [Map? args]) => Navigator.pushNamed(context, route, arguments: args).then((_) => reload());
            return ListView(padding: const EdgeInsets.all(16), children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(children: [
                    const CircleAvatar(radius: 32, backgroundColor: Color(0xFFE0F2FE), child: Icon(Icons.person, size: 36, color: C.primary)),
                    const SizedBox(height: 8),
                    Text('${c['name']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                    Text('${c['gender'] ?? ''} · ${c['ageInMonths'] ?? ageMonths(c['dob'])} months', style: const TextStyle(color: C.muted)),
                    const SizedBox(height: 6),
                    StatusBadge(c['nutritionStatus']),
                    const SizedBox(height: 10),
                    StatGrid([
                      StatTile(label: 'DOB', value: fmtDate(c['dob'])),
                      StatTile(label: 'Blood Grp', value: '${c['bloodGroup'] ?? '—'}'),
                      StatTile(label: 'Weight', value: latest != null ? '${latest['weight']} kg' : '—'),
                      StatTile(label: 'Height', value: latest != null ? '${latest['height']} cm' : '—'),
                    ]),
                  ]),
                ),
              ),
              Wrap(spacing: 8, runSpacing: 8, children: [
                FilledButton.icon(onPressed: () => go('/asha/log-visit', {'childId': id}), icon: const Icon(Icons.assignment_add), label: const Text('Log Visit')),
                OutlinedButton.icon(onPressed: () => go('/asha/growth-records', {'childId': id}), icon: const Icon(Icons.trending_up), label: const Text('Add Growth Data')),
                OutlinedButton.icon(onPressed: () => go('/asha/vaccination-tracker'), icon: const Icon(Icons.vaccines), label: const Text('Record Vaccine')),
                OutlinedButton.icon(style: OutlinedButton.styleFrom(foregroundColor: C.red), onPressed: () => go('/asha/referrals', {'childId': id, 'new': '1'}), icon: const Icon(Icons.local_hospital), label: const Text('Refer to Health Centre')),
              ]),
              gap,
              if (due > 0) NoticeBox('⚠️ $due vaccine(s) overdue! Immediate action required.', tone: badTone),
              if (growth.isNotEmpty) Card(child: Padding(padding: const EdgeInsets.all(12), child: GrowthChart(records: growth))),
              const SectionTitle('Recent Growth Records'),
              Card(
                child: growth.isEmpty
                    ? const EmptyState('No growth records.')
                    : Column(children: [
                        for (final g in growth.reversed.take(5))
                          ListTile(dense: true, title: Text('${fmtDate(g['recordedDate'])} · ${g['ageMonths']} mo'), subtitle: Text('${g['weight']} kg · ${g['height']} cm'), trailing: StatusBadge(g['prediction'])),
                      ]),
              ),
              const SectionTitle('Vaccination Status'),
              Card(
                child: vaccines.isEmpty
                    ? const EmptyState('No vaccination schedule.')
                    : Column(children: [
                        for (final v in vaccines) ListTile(dense: true, title: Text('${v['vaccineName']}'), subtitle: Text(fmtDate(v['dueDate'])), trailing: VaccineBadge(v['status'])),
                      ]),
              ),
            ]);
          },
        ),
      );
}
