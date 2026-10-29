import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/auth.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../../widgets/warning_popup.dart';
import 'parent_common.dart';

class ParentDashboard extends StatefulWidget {
  const ParentDashboard({super.key});
  @override
  State<ParentDashboard> createState() => _ParentDashboardState();
}

class _DashData {
  Children children = Children();
  List notifications = [], schemes = [], vaccines = [], growth = [];
  Prediction? prediction;
  Map? diet;
  String? ageLabel;
}

class _ParentDashboardState extends State<ParentDashboard> {
  final _loader = GlobalKey<LoaderState<_DashData>>();
  // the popup shows once per app launch (per user), not on every refresh
  static Object? _warnedUser;

  void _warnOnce(_DashData d) {
    final child = d.children.selected;
    final user = auth.user?['_id'] ?? auth.name;
    if (child == null || _warnedUser == user) return;
    _warnedUser = user;
    final latest = d.growth.firstOrNull;
    final warnings = parentWarnings(
      child: child,
      vaccines: d.vaccines,
      meals: (d.diet?['meals'] as List?) ?? [],
      prediction: d.prediction,
      lastGrowth: latest == null ? null : DateTime.tryParse('${latest['recordedDate'] ?? latest['createdAt']}'),
      unread: d.notifications.where((n) => n['isRead'] != true).length,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) showWarningPopup(context, warnings);
    });
  }

  Future<_DashData> load() async {
    final d = _DashData();
    final results = await Future.wait([
      Children.load(),
      api.get('/notifications').catchError((_) => []),
      api.get('/schemes').catchError((_) => []),
    ]);
    d.children = results[0] as Children;
    d.notifications = (results[1] as List).take(6).toList();
    d.schemes = (results[2] as List).take(6).toList();
    final child = d.children.selected;
    if (child == null) return d;
    final id = child['_id'];
    final months = child['ageInMonths'] is num ? (child['ageInMonths'] as num).toInt() : null;
    final dietData = await DietData.load();
    final group = DietData.ageGroup(dietData, months);
    final more = await Future.wait([
      api.get('/vaccination/$id').catchError((_) => []),
      api.get('/growth/$id').catchError((_) => []),
      api.get('/growth/$id/predict', {'insights': 'false'}).catchError((_) => null),
      months == null ? Future.value(null) : api.get('/diet/age/$months').catchError((_) => null),
    ]);
    d.vaccines = more[0] as List? ?? [];
    d.growth = ((more[1] as List?) ?? []).reversed.take(6).toList();
    d.prediction = more[2] is Map ? Prediction(more[2] as Map) : null;
    // server plan if it has meals, else the built-in plan (same fallback as the website)
    final server = more[3];
    d.diet = server is Map && (server['meals'] as List?)?.isNotEmpty == true ? server : (group == null ? null : dietData['plans'][group['tag']]);
    d.ageLabel = group?['label'];
    _warnOnce(d);
    return d;
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/parent/dashboard',
        title: '',
        child: Loader<_DashData>(
          key: _loader,
          load: load,
          builder: (context, d, reload) {
            final child = d.children.selected;
            return ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 96), children: [
              _Greeting(first: auth.name.split(' ').first),
              ChildPicker(children: d.children, onChanged: reload),
              if (child == null) ..._noChild(context) else ..._full(context, d, child),
            ]);
          },
        ),
      );

  List<Widget> _noChild(BuildContext context) => [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const IconWell(Icons.child_care_outlined, size: 52),
              const SizedBox(height: 14),
              Text(t('dash_addTitle', "Add your child's details"), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text(
                t('dash_addText', 'Name and date of birth are enough to start. The vaccine schedule and meal plan are made from the date of birth.'),
                style: const TextStyle(color: C.muted, height: 1.45),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(onPressed: () => Navigator.pushReplacementNamed(context, '/parent/child-profile'), icon: const Icon(Icons.add), label: Text(t('addChild', 'Add child'))),
            ]),
          ),
        ),
      ];

  List<Widget> _full(BuildContext context, _DashData d, Map child) {
    final done = d.vaccines.where((v) => v['status'] == 'done').length;
    final pending = d.vaccines.where((v) => v['status'] != 'done').toList()
      ..sort((a, b) => '${a['dueDate']}'.compareTo('${b['dueDate']}'));
    final next = pending.firstOrNull;
    final latest = d.growth.firstOrNull;
    final meals = (d.diet?['meals'] as List?) ?? [];
    final nowIdx = currentMealIndex(meals);
    final meal = (nowIdx >= 0 ? meals[nowIdx] : meals.firstOrNull) as Map?;
    final p = d.prediction;
    final unreadFirst = [...d.notifications]..sort((a, b) => (a['isRead'] == true ? 1 : 0) - (b['isRead'] == true ? 1 : 0));
    final weight = latest?['weight'] ?? child['currentWeight'];
    final height = latest?['height'] ?? child['currentHeight'];
    final late = next != null && next['status'] == 'missed' || (next?['status'] == 'due' && (parseDate(next?['dueDate'])?.isBefore(DateUtils.dateOnly(DateTime.now())) ?? false));

    return [
      // the child
      Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => Navigator.pushReplacementNamed(context, '/parent/child-profile'),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const IconWell(Icons.child_care_outlined, size: 48),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('${child['name']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                    Text([ageText(child['dob']), if (child['gender'] != null) child['gender']].join(' · '), style: const TextStyle(color: C.muted)),
                  ]),
                ),
                if (child['nutritionStatus'] != null) StatusBadge(child['nutritionStatus']),
              ]),
              const Padding(padding: EdgeInsets.symmetric(vertical: 14), child: Divider()),
              Row(children: [
                _Measure(t('weight', 'Weight'), weight == null ? '—' : '$weight kg'),
                _Measure(t('height', 'Height'), height == null ? '—' : '$height cm'),
                _Measure(t('vaccines', 'Vaccines'), '$done of ${d.vaccines.length}'),
              ]),
              if (latest != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text('Last measured ${fmtDate(latest['recordedDate'] ?? latest['createdAt'])}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
                ),
            ]),
          ),
        ),
      ),

      // what needs doing
      SectionTitle(t('dash_next', 'Coming up')),
      Card(
        child: Column(children: [
          ListTile(
            leading: IconWell(Icons.vaccines_outlined, color: late ? C.red : C.primary),
            title: Text(next == null ? t('dash_allDone', 'All vaccines given so far') : '${next['vaccineName']}', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: next == null ? null : Text(late ? 'Was due ${fmtDate(next['dueDate'])}. Visit your health centre.' : 'Due ${fmtDate(next['dueDate'])}'),
            trailing: const Icon(Icons.chevron_right, color: C.muted),
            onTap: () => Navigator.pushReplacementNamed(context, '/parent/vaccination'),
          ),
          if (meal != null) ...[
            const Divider(indent: 72),
            ListTile(
              leading: IconWell(glyphIcon('${meal['icon']}'), color: C.amber),
              title: Text('${meal['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('${meal['time']}\n${mealItemsText(meal)}', maxLines: 3, overflow: TextOverflow.ellipsis),
              isThreeLine: true,
              trailing: const Icon(Icons.chevron_right, color: C.muted),
              onTap: () => Navigator.pushReplacementNamed(context, '/parent/diet-plan'),
            ),
          ],
        ]),
      ),

      // growth
      SectionTitle(t('growth', 'Growth'), trailing: _viewAll(context, '/parent/child-profile')),
      Card(
        child: d.growth.isEmpty
            ? const EmptyState('No measurements yet. Your ASHA worker records them at home visits, or you can add one from My Child.', icon: Icons.straighten)
            : Column(children: [
                for (final g in d.growth.take(3))
                  ListTile(
                    dense: true,
                    title: Text('${str(g['weight'])} kg · ${str(g['height'])} cm', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5)),
                    subtitle: Text(fmtDate(g['recordedDate'] ?? g['createdAt'])),
                    trailing: g['prediction'] == null ? null : StatusBadge(g['prediction']),
                  ),
              ]),
      ),
      if (p != null)
        Card(
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => Navigator.pushReplacementNamed(context, '/parent/ai-prediction'),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Expanded(child: Text('Growth outlook', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                  Badge2('${p.riskLevel[0].toUpperCase()}${p.riskLevel.substring(1)} risk', tone: p.riskLevel == 'low' ? goodTone : p.riskLevel == 'moderate' ? warnTone : badTone),
                ]),
                if (p.predictedWeight != null || p.predictedHeight != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Expected next month: ${[if (p.predictedWeight != null) '${p.predictedWeight} kg', if (p.predictedHeight != null) '${p.predictedHeight} cm'].join(', ')}',
                      style: const TextStyle(color: C.muted),
                    ),
                  ),
                if (p.recommendation != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(p.recommendation!, style: const TextStyle(height: 1.4))),
              ]),
            ),
          ),
        ),

      // messages and help
      if (d.notifications.isNotEmpty) ...[
        SectionTitle(t('alerts', 'Alerts'), trailing: _viewAll(context, '/parent/notifications')),
        Card(
          child: Column(children: [
            for (final n in unreadFirst.take(3))
              ListTile(
                dense: true,
                leading: glyph(n['type'] == 'vaccine' ? '💉' : n['type'] == 'growth' ? '📈' : n['type'] == 'diet' ? '🥗' : '📣', size: 18),
                title: Text('${n['title'] ?? n['message']}', style: TextStyle(fontWeight: n['isRead'] == true ? FontWeight.w500 : FontWeight.w700)),
                subtitle: Text(fmtDate(n['createdAt'])),
              ),
          ]),
        ),
      ],
      const SizedBox(height: 6),
      Card(
        child: Column(children: [
          ListTile(
            leading: const IconWell(Icons.local_hospital_outlined, color: C.red),
            title: Text(lang.plain('nearbyHospitals', 'Nearby hospitals'), style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: const Text('Map, directions and emergency numbers'),
            trailing: const Icon(Icons.chevron_right, color: C.muted),
            onTap: () => Navigator.pushNamed(context, '/parent/hospitals'),
          ),
          if (d.schemes.isNotEmpty) ...[
            const Divider(indent: 72),
            ListTile(
              leading: const IconWell(Icons.account_balance_outlined, color: Color(0xFF3B6E8F)),
              title: Text(t('schemes', 'Government schemes'), style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('${d.schemes.length} you may be eligible for'),
              trailing: const Icon(Icons.chevron_right, color: C.muted),
              onTap: () => Navigator.pushReplacementNamed(context, '/parent/schemes'),
            ),
          ],
          const Divider(indent: 72),
          ListTile(
            leading: const IconWell(Icons.description_outlined, color: C.muted),
            title: Text(t('reports', 'Reports'), style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: const Text('Download the health record or vaccine card'),
            trailing: const Icon(Icons.chevron_right, color: C.muted),
            onTap: () => Navigator.pushReplacementNamed(context, '/parent/reports'),
          ),
        ]),
      ),
    ];
  }

  Widget _viewAll(BuildContext context, String route) => TextButton(onPressed: () => Navigator.pushReplacementNamed(context, route), child: const Text('See all'));
}

/// "Good morning, Asha" and today's date.
class _Greeting extends StatelessWidget {
  const _Greeting({required this.first});
  final String first;
  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final part = now.hour < 12 ? 'Good morning' : now.hour < 17 ? 'Good afternoon' : 'Good evening';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('$part, $first', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
        const SizedBox(height: 2),
        Text('${days[now.weekday - 1]}, ${fmtDate(now.toIso8601String())}', style: const TextStyle(color: C.muted)),
      ]),
    );
  }
}

class _Measure extends StatelessWidget {
  const _Measure(this.label, this.value);
  final String label, value;
  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: C.muted, fontSize: 12.5)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
        ]),
      );
}
