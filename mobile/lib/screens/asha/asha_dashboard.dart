import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/auth.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

const visitStatus = {
  'completed': ('refCompleted', goodTone),
  'pending': ('refPending', warnTone),
  'overdue': ('visitsOverdue', badTone),
  'missed': ('visitMissed', neutralTone),
};
const _alertEmoji = {'vaccine': '💉', 'nutrition': '📊', 'anc': '🤰', 'pnc': '🏠', 'mother': '❤️‍🩹', 'referral': '🏥', 'camp': '⛺', 'message': '✉️'};
const _quickActions = [
  ('/asha/register-child', '👶', 'registerChild', null),
  ('/asha/maternal-care', '🤰', 'registerPregnancy', {'new': '1'}),
  ('/asha/log-visit', '🏠', 'logVisit', null),
  ('/asha/vaccination-tracker', '💉', 'updateVaccination', null),
  ('/asha/growth-records', '🩺', 'healthScreening', null),
  ('/asha/referrals', '🏥', 'newReferral', {'new': '1'}),
  ('/asha/generate-report', '📄', 'viewReports', null),
  ('/asha/incentives', '₹', 'incentiveClaims', null),
  ('/asha/camps', '👥', 'healthCampaigns', null),
];

String initials(dynamic name) {
  final parts = '${name ?? '?'}'.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
  return parts.isEmpty ? '?' : parts.map((w) => w[0]).take(2).join().toUpperCase();
}

String timeOf(dynamic d) {
  final dt = parseDate(d);
  if (dt == null) return '';
  return '${dt.hour % 12 == 0 ? 12 : dt.hour % 12}:${dt.minute.toString().padLeft(2, '0')} ${dt.hour < 12 ? 'am' : 'pm'}';
}

String relativeDay(dynamic d) {
  final dt = parseDate(d);
  if (dt == null) return t('visitsToday', 'Today');
  final now = DateTime.now();
  final days = DateTime(dt.year, dt.month, dt.day).difference(DateTime(now.year, now.month, now.day)).inDays;
  if (days == 0) return t('visitsToday', 'Today');
  if (days == 1) return t('tomorrow', 'Tomorrow');
  if (days == -1) return t('yesterday', 'Yesterday');
  return days < 0 ? '${-days} ${t('daysAgo', 'days ago')}' : fmtDate(d);
}

String _change(dynamic pct) => pct == null ? t('noLastMonthData', 'No data last month') : '${pct >= 0 ? '↑' : '↓'} ${(pct as num).abs()}% ${t('fromLastMonth', 'from last month')}';

class _Data {
  Map? profile, dash;
  List children = [], visits = [], overdue = [];
}

class AshaDashboard extends StatelessWidget {
  const AshaDashboard({super.key});

  Future<_Data> load() async {
    final r = await Future.wait([
      api.get('/asha/profile').catchError((_) => null),
      api.get('/asha/children').catchError((_) => []),
      api.get('/asha/visits').catchError((_) => []),
      api.get('/vaccination/overdue').catchError((_) => []),
      api.get('/asha/dashboard').catchError((_) => null),
    ]);
    final d = _Data()
      ..profile = r[0] as Map?
      ..children = (r[1] as List?) ?? []
      ..visits = [...((r[2] as List?) ?? [])]
      ..overdue = ((r[3] as List?) ?? []).take(5).toList()
      ..dash = r[4] as Map?;
    d.visits.sort((a, b) => (parseDate(b['visitDate'] ?? b['createdAt']) ?? DateTime(0)).compareTo(parseDate(a['visitDate'] ?? a['createdAt']) ?? DateTime(0)));
    return d;
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/asha/dashboard',
        child: Loader<_Data>(
          load: load,
          builder: (context, d, reload) {
            final kids = d.children;
            final severe = kids.where((c) => c['nutritionStatus'] == 'severe').length;
            final moderate = kids.where((c) => c['nutritionStatus'] == 'moderate').length;
            final healthy = kids.where((c) => c['nutritionStatus'] == 'healthy').length;
            final monthStart = DateTime(DateTime.now().year, DateTime.now().month);
            final monthVisits = d.visits.where((v) => v['status'] != 'missed' && (parseDate(v['visitDate'] ?? v['createdAt'])?.isAfter(monthStart) ?? false)).length;
            final st = d.dash?['stats'] as Map?;
            final work = (st?['workload'] as Map?) ?? const {};
            final tv = st?['todaysVisits'] as Map?;
            final visitPct = tv != null && (tv['planned'] ?? 0) > 0 ? ((tv['done'] / tv['planned']) * 100).round() : 0;
            final p = d.profile;
            void go(String route, [Map? args]) => Navigator.pushNamed(context, route, arguments: args);

            return ListView(padding: const EdgeInsets.all(16), children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), gradient: const LinearGradient(colors: [C.dark, C.primary])),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t('ashaPortal', 'ASHA Portal').toUpperCase(), style: const TextStyle(color: Color(0xFFCFFAFE), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                  const SizedBox(height: 4),
                  Text('Namaste, ${auth.name.split(' ').first}!', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text('${p?['block'] != null ? '${p!['block']}, ${p['district']}' : t('ashaPortal', 'ASHA Portal')} · ${kids.length} ${t('childrenAssignedLabel', 'children assigned')}', style: const TextStyle(color: Colors.white70)),
                  const SizedBox(height: 12),
                  Row(children: [
                    for (final (v, label, icon) in [(kids.length, t('myChildren', 'My children'), '👶'), (monthVisits, t('visitsThisMonth', 'Visits this month'), '✅'), (d.overdue.length, t('overdue', 'Overdue'), '⏰'), (severe, t('severe', 'Severe'), '🚨')])
                      Expanded(
                        child: Container(
                          margin: const EdgeInsets.only(right: 6),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: .15), borderRadius: BorderRadius.circular(10)),
                          child: Column(children: [
                            Text(icon),
                            Text('$v', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                            Text(label, textAlign: TextAlign.center, maxLines: 2, style: const TextStyle(color: Colors.white70, fontSize: 10)),
                          ]),
                        ),
                      ),
                  ]),
                ]),
              ),
              const SizedBox(height: 14),
              if (st != null) ...[
                StatGrid([
                  StatTile(label: t('assignedFamilies', 'Families'), value: '${st['families']?['value'] ?? 0}', sub: _change(st['families']?['changePct']), color: const Color(0xFF16A34A), onTap: () => go('/asha/families')),
                  StatTile(label: t('registeredChildren', 'Children'), value: '${st['children']?['value'] ?? 0}', sub: _change(st['children']?['changePct']), color: C.primary, onTap: () => go('/asha/children')),
                  StatTile(label: t('pregnantWomen', 'Pregnant women'), value: '${st['pregnant']?['value'] ?? 0}', sub: '↑ ${st['pregnant']?['newThisMonth'] ?? 0} ${t('newThisMonth', 'new this month')}', color: const Color(0xFFDB2777), onTap: () => go('/asha/maternal-care')),
                  StatTile(label: t('vaccinesDueWeek', 'Vaccines due this week'), value: '${st['vaccinesDueThisWeek']?['value'] ?? 0}', sub: '⏱ ${st['vaccinesDueThisWeek']?['overdue'] ?? 0} ${t('visitsOverdue', 'overdue')}', color: const Color(0xFFF59E0B), onTap: () => go('/asha/vaccination-tracker')),
                  StatTile(label: t('todaysVisits', "Today's visits"), value: '${tv?['done'] ?? 0}/${tv?['planned'] ?? 0}', sub: '$visitPct%', color: const Color(0xFF7C3AED), onTap: () => go('/asha/my-visits')),
                  StatTile(
                    label: t('highRiskCases', 'High-risk cases'),
                    value: '${st['highRisk']?['value'] ?? 0}',
                    sub: '${st['highRisk']?['children'] ?? 0} children · ${st['highRisk']?['mothers'] ?? 0} mothers',
                    color: const Color(0xFFEF4444),
                    onTap: () => go((st['highRisk']?['mothers'] ?? 0) > 0 && (st['highRisk']?['children'] ?? 0) == 0 ? '/asha/maternal-care' : '/asha/malnutrition-report'),
                  ),
                ]),
                const SizedBox(height: 10),
              ],
              StatGrid([
                StatTile(label: t('myVisits', 'My visits'), value: '${work['due'] ?? 0}', sub: (work['overdue'] ?? 0) > 0 ? '${work['overdue']} ${t('visitsOverdue', 'overdue')}' : t('visitsDueNow', 'due now'), color: (work['overdue'] ?? 0) > 0 ? C.red : C.dark, onTap: () => go('/asha/my-visits')),
                StatTile(label: t('referrals', 'Referrals'), value: '${work['referrals'] ?? 0}', sub: (work['emergencies'] ?? 0) > 0 ? '${work['emergencies']} ${t('urgencyEmergency', 'emergency')}' : t('refPending', 'pending'), color: (work['emergencies'] ?? 0) > 0 ? C.red : C.dark, onTap: () => go('/asha/referrals')),
                StatTile(label: t('families', 'Families'), value: '→', sub: t('familySearch', 'Search households'), color: C.dark, onTap: () => go('/asha/families')),
                StatTile(label: t('maternalCare', 'Maternal care'), value: '${work['mothersDue'] ?? 0}', sub: (work['highRiskMothers'] ?? 0) > 0 ? '${work['highRiskMothers']} ${t('highRisk', 'high risk')}' : t('checkupsDue', 'check-ups due'), color: (work['highRiskMothers'] ?? 0) > 0 ? C.red : C.dark, onTap: () => go('/asha/maternal-care')),
              ]),
              const SizedBox(height: 14),
              if (severe > 0)
                Card(
                  color: const Color(0xFFFEF2F2),
                  child: ListTile(
                    leading: const Text('🚨', style: TextStyle(fontSize: 26)),
                    title: Text('Urgent Action: $severe ${severe > 1 ? t('severeCases', 'severe cases') : t('severe', 'severe')} - ${t('malnutrition', 'malnutrition')}', style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF991B1B))),
                    subtitle: Text('${t('phcReferralNeeded', 'PHC referral needed')}. ${t('logVisit', 'Log a visit')}.'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => go('/asha/malnutrition-report'),
                  ),
                ),
              if (d.dash != null) ...[
                SectionTitle('🗓️ ${t('todaysSchedule', "Today's schedule")}', trailing: TextButton(onPressed: () => go('/asha/my-visits'), child: Text('${t('viewAll', 'View all')} →'))),
                Card(
                  child: ((d.dash!['schedule'] as List?) ?? []).isEmpty
                      ? EmptyState('✅ ${t('visitsNoneDue', 'No visits due')}', icon: Icons.event_available)
                      : Column(children: [
                          for (final v in d.dash!['schedule'])
                            Builder(builder: (context) {
                              final (labelKey, tone) = visitStatus[v['status']] ?? visitStatus['pending']!;
                              final done = v['status'] == 'completed' || v['status'] == 'missed';
                              final c = v['child'] as Map;
                              return ListTile(
                                leading: CircleAvatar(backgroundColor: const Color(0xFFE0F7FA), child: Text(initials(c['name']), style: const TextStyle(color: C.dark, fontWeight: FontWeight.w700))),
                                title: Text('${c['name']} (${ageText(c['dob'])})', style: const TextStyle(fontWeight: FontWeight.w600)),
                                subtitle: Text([done ? timeOf(v['at']) : v['status'] == 'overdue' ? fmtDate(v['at']) : t('visitsToday', 'Today'), if (c['village'] != null) '${t('village', 'Village')}: ${c['village']}' else ((v['reasons'] as List?) ?? []).join(', ')].join(' · ')),
                                trailing: Badge2(t(labelKey), tone: tone),
                                onTap: () => done ? go('/asha/child', {'id': c['_id']}) : go('/asha/log-visit', {'childId': c['_id']}),
                              );
                            }),
                          if ((d.dash!['scheduleTotal'] ?? 0) > (d.dash!['schedule'] as List).length) Padding(padding: const EdgeInsets.all(10), child: Text('+${d.dash!['scheduleTotal'] - (d.dash!['schedule'] as List).length} ${t('more', 'more')}')),
                        ]),
                ),
                SectionTitle('🔔 ${t('importantAlerts', 'Important alerts')}', trailing: TextButton(onPressed: () => go('/asha/notifications'), child: Text('${t('viewAll', 'View all')} →'))),
                Card(
                  child: ((d.dash!['alerts'] as List?) ?? []).isEmpty
                      ? EmptyState('✅ ${t('noAlerts', 'No alerts')}', icon: Icons.notifications_none)
                      : Column(children: [
                          for (final a in d.dash!['alerts'])
                            ListTile(
                              leading: Text(_alertEmoji[a['kind']] ?? '✉️', style: const TextStyle(fontSize: 22)),
                              title: Text('${a['title']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: a['subtitle'] == null ? null : Text('${a['subtitle']}'),
                              trailing: Text('${relativeDay(a['at'])} ›', style: const TextStyle(fontSize: 12, color: C.muted)),
                              onTap: a['link'] == null ? null : () => go('${a['link']}'),
                            ),
                        ]),
                ),
              ],
              SectionTitle('⚡ ${t('quickActions', 'Quick actions')}'),
              StatGrid(columns: 3, [
                for (final (route, emoji, key, args) in _quickActions)
                  Card(
                    margin: EdgeInsets.zero,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => go(route, args),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                        child: Column(children: [Text(emoji, style: const TextStyle(fontSize: 24)), const SizedBox(height: 4), Text(t(key), textAlign: TextAlign.center, maxLines: 2, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600))]),
                      ),
                    ),
                  ),
              ]),
              SectionTitle('👶 ${t('myChildren', 'My children')}', trailing: TextButton(onPressed: () => go('/asha/children'), child: Text('${t('viewAll', 'View all')} →'))),
              Card(
                child: kids.isEmpty
                    ? EmptyState('${t('noChildrenAssigned', 'No children assigned')}.')
                    : Column(children: [
                        for (final c in kids.take(6))
                          ListTile(
                            leading: const Text('👶', style: TextStyle(fontSize: 22)),
                            title: Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('${ageText(c['dob'])} · Weight ${c['currentWeight'] ?? '-'} kg'),
                            trailing: StatusBadge(c['nutritionStatus'] ?? 'healthy'),
                            onTap: () => go('/asha/child', {'id': c['_id']}),
                          ),
                      ]),
              ),
              SectionTitle('💉 ${t('overdueVaccines', 'Overdue vaccines')}', trailing: TextButton(onPressed: () => go('/asha/vaccination-tracker'), child: Text('${t('viewAll', 'View all')} →'))),
              Card(
                child: d.overdue.isEmpty
                    ? EmptyState(t('noOverdueVaccines', 'No overdue vaccines'))
                    : Column(children: [
                        for (final v in d.overdue)
                          ListTile(
                            leading: const Text('💉', style: TextStyle(fontSize: 20)),
                            title: Text('${v['childId'] is Map ? v['childId']['name'] : 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('${v['vaccineName']} · Due: ${fmtDate(v['dueDate'])}'),
                            trailing: Badge2(t('overdue', 'Overdue'), tone: warnTone),
                          ),
                      ]),
              ),
              Card(
                color: C.dark,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(t('blockHealthSummary', 'Block health summary'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    Row(children: [
                      for (final (icon, n, label) in [('✅', healthy, t('healthy', 'Healthy')), ('⚠️', moderate, t('moderate', 'Moderate')), ('🚨', severe, t('severe', 'Severe'))])
                        Expanded(child: Column(children: [Text(icon), Text('$n', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)), Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12))])),
                    ]),
                    if (kids.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      LinearProgressIndicator(value: healthy / kids.length, color: const Color(0xFFCFFAFE), backgroundColor: Colors.white24, minHeight: 8, borderRadius: BorderRadius.circular(4)),
                      const SizedBox(height: 6),
                      Text('${(healthy / kids.length * 100).round()}% ${t('healthyChildren', 'healthy children')}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  ]),
                ),
              ),
              SectionTitle('📋 ${t('recentVisitLog', 'Recent visits')}', trailing: TextButton(onPressed: () => go('/asha/visit-history'), child: Text('${t('fullHistory', 'Full history')} →'))),
              Card(
                child: d.visits.isEmpty
                    ? EmptyState('${t('noVisitsYet', 'No visits yet')}.')
                    : Column(children: [
                        for (final v in d.visits.take(8))
                          ListTile(
                            dense: true,
                            title: Text('👶 ${v['childId'] is Map ? v['childId']['name'] : '-'} · ${fmtDate(v['visitDate'] ?? v['createdAt'])}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('${v['visitType'] ?? '-'} · ${v['weight'] ?? '-'} kg · ${v['height'] ?? '-'} cm${(v['observations'] ?? v['notes']) != null ? '\n${'${v['observations'] ?? v['notes']}'.substring(0, ('${v['observations'] ?? v['notes']}').length.clamp(0, 60))}' : ''}'),
                            trailing: v['outcome'] == null ? null : StatusBadge(v['outcome']),
                          ),
                      ]),
              ),
            ]);
          },
        ),
      );
}
