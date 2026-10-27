import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/auth.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
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
    return d;
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/parent/dashboard',
        child: Loader<_DashData>(
          key: _loader,
          load: load,
          builder: (context, d, reload) {
            final child = d.children.selected;
            final first = auth.name.split(' ').first;
            return ListView(padding: const EdgeInsets.all(16), children: [
              _Hero(first: first, child: child, vaccines: d.vaccines),
              const SizedBox(height: 14),
              ChildPicker(children: d.children, onChanged: reload),
              if (child == null) ..._noChild(context) else ..._full(context, d, child),
            ]);
          },
        ),
      );

  List<Widget> _noChild(BuildContext context) => [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${t('registerTitle')}. ${t('childInfoTitle')} to track ${t('vaccines').toLowerCase()}, ${t('growth').toLowerCase()}, ${t('dietPlan').toLowerCase()} and ${t('reports').toLowerCase()}.'),
              gap,
              FilledButton.icon(onPressed: () => Navigator.pushReplacementNamed(context, '/parent/child-profile'), icon: const Icon(Icons.add), label: Text(t('addChild', 'Add Child'))),
            ]),
          ),
        ),
        _QuickGrid(),
        NoticeBox('Logged in as: ${auth.name} (${auth.user?['email'] ?? ''}) · Role: Parent\nAdd your child\'s profile to unlock vaccination schedules, growth charts, diet plans and more.', tone: infoTone),
      ];

  List<Widget> _full(BuildContext context, _DashData d, Map child) {
    final due = d.vaccines.where((v) => v['status'] == 'due').toList();
    final done = d.vaccines.where((v) => v['status'] == 'done').length;
    final unread = d.notifications.where((n) => n['isRead'] != true).length;
    final latest = d.growth.firstOrNull;
    final info = [
      ageText(child['dob']),
      child['gender'],
      if (child['bloodGroup'] != null) 'Blood: ${child['bloodGroup']}',
      if (child['nutritionStatus'] != null) 'Nutrition: ${child['nutritionStatus']}',
    ].where((e) => e != null && '$e' != '—').join(' · ');
    final meals = (d.diet?['meals'] as List?) ?? [];
    final nowIdx = currentMealIndex(meals);
    final p = d.prediction;

    return [
      Card(
        child: ListTile(
          contentPadding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
          leading: const CircleAvatar(radius: 24, backgroundColor: Color(0xFFE0F7FA), child: Text('👶', style: TextStyle(fontSize: 24))),
          title: Text('${child['name']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          subtitle: Text(info),
          trailing: IconButton(icon: const Icon(Icons.description_outlined, color: C.dark), tooltip: 'Download Report', onPressed: () => Navigator.pushReplacementNamed(context, '/parent/reports')),
          onTap: () => Navigator.pushReplacementNamed(context, '/parent/child-profile'),
        ),
      ),
      StatGrid([
        StatTile(icon: Icons.vaccines, label: 'Vaccines Done', value: '$done/${d.vaccines.length}', sub: due.isNotEmpty ? '${due.length} due now' : 'All up to date', color: C.primary),
        StatTile(icon: Icons.monitor_weight_outlined, label: 'Current Weight', value: latest?['weight'] != null ? '${latest['weight']} kg' : (child['currentWeight'] != null ? '${child['currentWeight']} kg' : 'N/A'), sub: latest != null ? 'Recorded ${fmtDate(latest['recordedDate'] ?? latest['createdAt'])}' : 'No record yet', color: C.green),
        StatTile(icon: Icons.height, label: 'Current Height', value: latest?['height'] != null ? '${latest['height']} cm' : (child['currentHeight'] != null ? '${child['currentHeight']} cm' : 'N/A'), sub: child['ageInMonths'] != null ? 'Age: ${child['ageInMonths']} months' : '${child['gender'] ?? '—'}', color: C.amber),
        StatTile(icon: Icons.notifications_active_outlined, label: 'Unread Alerts', value: '$unread', sub: '${d.schemes.length} govt schemes', color: const Color(0xFF1D4ED8)),
      ]),
      const SizedBox(height: 16),
      SectionTitle('💉 Vaccination Schedule', trailing: _viewAll(context, '/parent/vaccination')),
      Card(
        child: d.vaccines.isEmpty
            ? const EmptyState('No vaccination records yet.')
            : Column(children: [
                for (final v in d.vaccines.take(8))
                  ListTile(dense: true, title: Text('${v['vaccineName']}', style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(fmtDate(v['dueDate'])), trailing: VaccineBadge(v['status'])),
              ]),
      ),
      Card(
        child: ListTile(
          leading: const Icon(Icons.local_hospital, color: C.red),
          title: Text(lang.plain('nearbyHospitals', 'Nearby Hospitals'), style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Text(t('realtimeGps', 'Real-time GPS')),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.pushNamed(context, '/parent/hospitals'),
        ),
      ),
      SectionTitle('📈 Growth Monitoring', trailing: _viewAll(context, '/parent/child-profile')),
      Card(
        child: d.growth.isEmpty
            ? const EmptyState('No growth records yet.')
            : SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columnSpacing: 18,
                  headingTextStyle: const TextStyle(color: C.muted, fontWeight: FontWeight.w700, fontSize: 12),
                  columns: const [DataColumn(label: Text('Date')), DataColumn(label: Text('Weight (kg)')), DataColumn(label: Text('Height (cm)')), DataColumn(label: Text('Age (mo)')), DataColumn(label: Text('Weight Z')), DataColumn(label: Text('Height Z')), DataColumn(label: Text('Status'))],
                  rows: [
                    for (final g in d.growth)
                      DataRow(cells: [
                        DataCell(Text(fmtDate(g['recordedDate'] ?? g['createdAt']))),
                        DataCell(Text(str(g['weight']), style: const TextStyle(color: C.green, fontWeight: FontWeight.w600))),
                        DataCell(Text(str(g['height']), style: const TextStyle(color: C.primary, fontWeight: FontWeight.w600))),
                        DataCell(Text(str(g['ageMonths']))),
                        DataCell(Text(g['wazScore'] is num ? (g['wazScore'] as num).toStringAsFixed(2) : '—')),
                        DataCell(Text(g['hazScore'] is num ? (g['hazScore'] as num).toStringAsFixed(2) : '—')),
                        DataCell(g['prediction'] == null ? const Text('—') : StatusBadge(g['prediction'])),
                      ]),
                  ],
                ),
              ),
      ),
      if (p != null)
        Card(
          color: C.dark,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('AI-POWERED PREDICTION', style: TextStyle(color: Color(0xFFCFFAFE), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
              const SizedBox(height: 4),
              Text('🤖 Growth Forecast for ${child['name']}', style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              Wrap(spacing: 24, runSpacing: 8, children: [
                if (p.predictedWeight != null) _forecast('Predicted Weight', '${p.predictedWeight} kg', const Color(0xFFF7C948)),
                if (p.predictedHeight != null) _forecast('Predicted Height', '${p.predictedHeight} cm', const Color(0xFFF7C948)),
                _forecast('Risk Level', p.riskLevel[0].toUpperCase() + p.riskLevel.substring(1),
                    p.riskLevel == 'low' ? const Color(0xFF86EFAC) : p.riskLevel == 'moderate' ? const Color(0xFFFDE68A) : const Color(0xFFFCA5A5)),
              ]),
              if (p.recommendation != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text(p.recommendation!, style: const TextStyle(color: Colors.white70))),
            ]),
          ),
        ),
      SectionTitle('🔔 Recent Alerts', trailing: _viewAll(context, '/parent/notifications')),
      Card(
        child: d.notifications.isEmpty
            ? const EmptyState('No alerts yet.')
            : Column(children: [
                for (final n in d.notifications)
                  ListTile(
                    dense: true,
                    leading: Text(n['type'] == 'vaccine' ? '💉' : n['type'] == 'growth' ? '📈' : n['type'] == 'diet' ? '🥗' : '📣', style: const TextStyle(fontSize: 20)),
                    title: Text('${n['title'] ?? n['message']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text([if (n['title'] != null && n['message'] != null) n['message'], fmtDate(n['createdAt'])].join('\n')),
                    trailing: n['isRead'] == true ? null : const CircleAvatar(radius: 4, backgroundColor: C.primary),
                  ),
              ]),
      ),
      SectionTitle('🥗 Diet Plan', trailing: _viewAll(context, '/parent/diet-plan')),
      Card(
        child: d.diet == null
            ? const EmptyState('Set child age to view diet plan.')
            : Padding(
                padding: const EdgeInsets.all(12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  if (d.ageLabel != null) Badge2(d.ageLabel!, tone: infoTone),
                  for (var i = 0; i < meals.length; i++)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        SizedBox(width: 86, child: Text('${meals[i]['time']}', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: C.dark))),
                        Text('${meals[i]['icon'] ?? '🍽️'}', style: const TextStyle(fontSize: 20)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Flexible(child: Text('${meals[i]['name']}', style: const TextStyle(fontWeight: FontWeight.w600))),
                              if (i == nowIdx) const Padding(padding: EdgeInsets.only(left: 6), child: Badge2('Now', tone: Tone(Colors.white, C.primary))),
                            ]),
                            Text(mealItemsText(meals[i]), style: const TextStyle(fontSize: 12, color: C.muted)),
                          ]),
                        ),
                      ]),
                    ),
                ]),
              ),
      ),
      if (d.schemes.isNotEmpty) ...[
        SectionTitle('🏛️ Government Schemes', trailing: _viewAll(context, '/parent/schemes')),
        for (final s in d.schemes)
          Card(
            child: ListTile(
              leading: const Text('🏛️', style: TextStyle(fontSize: 22)),
              title: Text('${s['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: s['description'] == null ? null : Text('${s['description']}', maxLines: 3, overflow: TextOverflow.ellipsis),
              onTap: () => Navigator.pushReplacementNamed(context, '/parent/schemes'),
            ),
          ),
      ],
      _QuickGrid(),
    ];
  }

  Widget _forecast(String label, String value, Color color) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: Color(0xFFCFFAFE), fontSize: 11)),
        Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w800)),
      ]);

  Widget _viewAll(BuildContext context, String route) => TextButton(onPressed: () => Navigator.pushReplacementNamed(context, route), child: const Text('View all →'));
}

class _Hero extends StatelessWidget {
  const _Hero({required this.first, required this.child, required this.vaccines});
  final String first;
  final Map? child;
  final List vaccines;

  @override
  Widget build(BuildContext context) {
    final due = vaccines.where((v) => v['status'] == 'due').firstOrNull;
    final text = child == null
        ? '${t('addChild')} ${t('myChild').toLowerCase()} to start tracking ${t('vaccines').toLowerCase()}, ${t('growth').toLowerCase()}, and ${t('nutrition').toLowerCase()} updates.'
        : due != null
            ? '${child!['name']} has ${due['vaccineName']} ${t('due').toLowerCase()} soon.'
            : "${child!['name']}'s ${t('healthScore').toLowerCase()} and records are up to date.";
    final status = child?['nutritionStatus'];
    final score = child == null ? 0 : (status == 'healthy' ? 86 : status == 'moderate' ? 62 : 42);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), gradient: const LinearGradient(colors: [C.primary, C.dark])),
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(lang.plain('dashboard', 'Dashboard').toUpperCase(), style: const TextStyle(color: Color(0xFFCFFAFE), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
            const SizedBox(height: 6),
            Text('${t('welcome', 'Welcome')}, $first', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(text, style: const TextStyle(color: Colors.white70, fontSize: 13.5)),
          ]),
        ),
        if (child != null) ...[const SizedBox(width: 12), _ScoreCircle(score)],
      ]),
    );
  }
}

class _ScoreCircle extends StatelessWidget {
  const _ScoreCircle(this.score);
  final int score;
  @override
  Widget build(BuildContext context) {
    final color = score >= 75 ? const Color(0xFF22C55E) : score >= 50 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444);
    return SizedBox(
      width: 88,
      height: 88,
      child: CustomPaint(
        painter: _Ring(score / 100, color),
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text('$score', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
            const Text('Health Score', style: TextStyle(color: Colors.white70, fontSize: 9)),
          ]),
        ),
      ),
    );
  }
}

class _Ring extends CustomPainter {
  _Ring(this.fraction, this.color);
  final double fraction;
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final bg = Paint()
      ..color = Colors.white24
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7;
    final fg = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect.deflate(5), 0, 2 * math.pi, false, bg);
    canvas.drawArc(rect.deflate(5), -math.pi / 2, 2 * math.pi * fraction, false, fg);
  }

  @override
  bool shouldRepaint(_Ring old) => old.fraction != fraction || old.color != color;
}

class _QuickGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final items = [
      ('💉', t('vaccines', 'Vaccines'), '/parent/vaccination'),
      ('👶', t('myChild', 'My Child'), '/parent/child-profile'),
      ('🥗', t('dietPlan', 'Diet Plan'), '/parent/diet-plan'),
      ('🏛️', t('schemes', 'Schemes'), '/parent/schemes'),
      ('📋', t('reports', 'Reports'), '/parent/reports'),
      ('🔔', t('notifications', 'Notifications'), '/parent/notifications'),
      ('⚙️', t('settings', 'Settings'), '/parent/settings'),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: StatGrid(columns: 3, [
        for (final (e, label, route) in items)
          Card(
            margin: EdgeInsets.zero,
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => Navigator.pushReplacementNamed(context, route),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
                child: Column(children: [Text(e, style: const TextStyle(fontSize: 26)), const SizedBox(height: 6), Text(lang.plain(label), textAlign: TextAlign.center, maxLines: 2, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))]),
              ),
            ),
          ),
      ]),
    );
  }
}
