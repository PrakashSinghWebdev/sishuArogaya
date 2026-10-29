import 'dart:async';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

/// Block status from case counts (same thresholds as the website).
(String, Tone) blockStatus(Map b) {
  final severe = (b['severe'] ?? 0) as num, moderate = (b['moderate'] ?? 0) as num;
  if (severe >= 5) return (t('blockCritical', 'Critical'), badTone);
  if (severe * 2 + moderate >= 8) return (t('blockWatchlist', 'Watchlist'), warnTone);
  return (t('blockStable', 'Stable'), goodTone);
}

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});
  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  final _loader = GlobalKey<LoaderState<Map>>();
  DateTime refreshed = DateTime.now();
  List ashaResults = [];
  Timer? _debounce;

  void searchAsha(String q) {
    _debounce?.cancel();
    if (q.trim().length < 2) return setState(() => ashaResults = []);
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      final r = await api.get('/admin/search/asha', {'q': q.trim()}).catchError((_) => {});
      if (mounted) setState(() => ashaResults = ((r as Map?)?['results'] as List?) ?? []);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/dashboard',
        actions: [
          IconButton(
            tooltip: t('refresh', 'Refresh'),
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => refreshed = DateTime.now());
              _loader.currentState?.reload();
            },
          ),
        ],
        child: Loader<Map>(
          key: _loader,
          load: () async => await api.get('/admin/dashboard') as Map,
          builder: (context, s, _) {
            final blocks = (s['blockStats'] as List?) ?? [];
            num sum(String k) => blocks.fold<num>(0, (n, b) => n + ((b[k] as num?) ?? 0));
            final moderate = sum('moderate'), severe = sum('severe');
            final total = (s['totalChildren'] as num?) ?? 0;
            final healthy = (total - moderate - severe).clamp(0, double.infinity);
            void go(String r) => Navigator.pushReplacementNamed(context, r);

            return ListView(padding: const EdgeInsets.all(16), children: [
              Text('● Live data · Last refreshed ${fmtDateTime(refreshed.toIso8601String()).split(', ').last}', style: const TextStyle(color: C.green, fontSize: 12, fontWeight: FontWeight.w600)),
              const Text('District Health Overview', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800, color: C.text)),
              gap,
              TextField(onChanged: searchAsha, decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search ASHA workers by ID, name or region')),
              for (final a in ashaResults)
                Card(
                  child: ListTile(
                    leading: glyph('👩‍⚕️', size: 22),
                    title: Text('${a['name']} · ${a['ashaId']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text('${a['region'] ?? ''} · ${a['totalChildren'] ?? 0} children · ${a['totalVisits'] ?? 0} visits'),
                    onTap: () => go('/admin/asha-workers'),
                  ),
                ),
              gap,
              StatGrid([
                StatTile(icon: Icons.child_care, label: t('totalChildren', 'Total children'), value: inr(total), color: C.primary, onTap: () => go('/admin/children')),
                StatTile(icon: Icons.health_and_safety_outlined, label: t('ashaWorkers', 'ASHA workers'), value: inr(s['totalAshaWorkers'] ?? 0), color: C.green, onTap: () => go('/admin/asha-workers')),
                StatTile(icon: Icons.report_outlined, label: t('malnutrition', 'Malnutrition cases'), value: inr(s['malnutritionCases'] ?? 0), color: C.red, onTap: () => go('/admin/malnutrition')),
                StatTile(icon: Icons.vaccines_outlined, label: t('missedVaccinations', 'Missed vaccinations'), value: inr(s['missedVaccinations'] ?? 0), color: C.amber, onTap: () => go('/admin/vaccination-data')),
              ]),
              SectionTitle(t('blockMalnutrition', 'Block-wise malnutrition'), trailing: Text('${blocks.length} blocks', style: const TextStyle(color: C.muted))),
              Card(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
                  child: blocks.isEmpty ? const EmptyState('No block data yet. Register children to see district stats.') : BlockBarChart(blocks: blocks),
                ),
              ),
              SectionTitle(t('nutritionDist', 'Nutrition distribution')),
              Card(child: Padding(padding: const EdgeInsets.all(16), child: NutritionPie(healthy: healthy, moderate: moderate, severe: severe))),
              SectionTitle(t('priorityBlocks', 'Priority blocks')),
              Card(
                child: blocks.isEmpty
                    ? const EmptyState('No block data available')
                    : Column(children: [
                        for (final b in blocks)
                          ListTile(
                            dense: true,
                            title: Text('${b['_id'] ?? 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text('${t('totalChildren', 'Total')}: ${b['total'] ?? 0} · ${t('moderate', 'Moderate')}: ${b['moderate'] ?? 0} · ${t('severe', 'Severe')}: ${b['severe'] ?? 0}'),
                            trailing: Badge2(blockStatus(b).$1, tone: blockStatus(b).$2),
                          ),
                      ]),
              ),
              SectionTitle(t('quickAccess', 'Quick access')),
              StatGrid(columns: 2, [
                for (final (r, e, title, hint) in [
                  ('/admin/children', '👦', t('childrenRegistry', 'Children registry'), 'Live child records'),
                  ('/admin/asha-workers', '👩‍⚕️', t('ashaWorkers', 'ASHA workers'), 'Assignment & capacity'),
                  ('/admin/malnutrition', '🚨', t('malnutritionCasesAdmin', 'Malnutrition'), 'Moderate & severe cases'),
                  ('/admin/users', '⚙️', t('userManagement', 'User management'), 'Account roles & status'),
                  ('/admin/heatmap', '🗺️', t('districtHeatmap', 'District heatmap'), 'Spatial case intensity'),
                  ('/admin/block-reports', '📊', t('blockwiseReports', 'Blockwise reports'), 'Download Excel summaries'),
                  ('/admin/audit-logs', '📋', t('auditLogs', 'Audit logs'), 'Full system trail'),
                  ('/admin/notifications', '🔔', t('notificationsPanel', 'Notifications'), 'Broadcast alerts'),
                ])
                  Card(
                    margin: EdgeInsets.zero,
                    child: ListTile(leading: glyph(e, size: 22), title: Text(lang.plain(title), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)), subtitle: Text(hint, style: const TextStyle(fontSize: 11.5)), onTap: () => go(r)),
                  ),
              ]),
            ]);
          },
        ),
      );
}

/// Moderate / severe cases per block.
class BlockBarChart extends StatelessWidget {
  const BlockBarChart({super.key, required this.blocks, this.height = 240});
  final List blocks;
  final double height;
  @override
  Widget build(BuildContext context) {
    final maxY = blocks.fold<double>(1, (m, b) => [m, ((b['moderate'] ?? 0) as num).toDouble(), ((b['severe'] ?? 0) as num).toDouble()].reduce((a, c) => a > c ? a : c));
    return Column(children: [
      const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        _Legend(Color(0xD9F59E0B), 'Moderate'),
        SizedBox(width: 14),
        _Legend(Color(0xD9DC2626), 'Severe'),
      ]),
      const SizedBox(height: 10),
      SizedBox(
        height: height,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SizedBox(
            width: (blocks.length * 64.0).clamp(MediaQuery.of(context).size.width - 80, 4000),
            child: BarChart(BarChartData(
              maxY: maxY * 1.15,
              gridData: FlGridData(drawVerticalLine: false, getDrawingHorizontalLine: (_) => const FlLine(color: Color(0xFFEFECE6), strokeWidth: 1)),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (v, _) => v % 1 == 0 ? Text('${v.toInt()}', style: const TextStyle(fontSize: 10)) : const SizedBox.shrink())),
                bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 34, getTitlesWidget: (v, _) => Padding(padding: const EdgeInsets.only(top: 6), child: SizedBox(width: 60, child: Text('${blocks[v.toInt()]['_id'] ?? 'Unknown'}', textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 9.5)))))),
              ),
              barGroups: [
                for (var i = 0; i < blocks.length; i++)
                  BarChartGroupData(x: i, barsSpace: 4, barRods: [
                    BarChartRodData(toY: ((blocks[i]['moderate'] ?? 0) as num).toDouble(), color: const Color(0xD9F59E0B), width: 14, borderRadius: BorderRadius.circular(4)),
                    BarChartRodData(toY: ((blocks[i]['severe'] ?? 0) as num).toDouble(), color: const Color(0xD9DC2626), width: 14, borderRadius: BorderRadius.circular(4)),
                  ]),
              ],
            )),
          ),
        ),
      ),
    ]);
  }
}

class _Legend extends StatelessWidget {
  const _Legend(this.color, this.label);
  final Color color;
  final String label;
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [Container(width: 12, height: 12, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))), const SizedBox(width: 5), Text(label, style: const TextStyle(fontSize: 12))]);
}

/// Healthy / moderate / severe doughnut with counts.
class NutritionPie extends StatelessWidget {
  const NutritionPie({super.key, required this.healthy, required this.moderate, required this.severe});
  final num healthy, moderate, severe;
  @override
  Widget build(BuildContext context) {
    final items = [(t('healthy', 'Healthy'), healthy, const Color(0xFF2F855A)), (t('moderate', 'Moderate'), moderate, const Color(0xFFB7791F)), (t('severe', 'Severe'), severe, const Color(0xFFB5452F))];
    final empty = healthy + moderate + severe == 0;
    return Row(children: [
      SizedBox(
        width: 140,
        height: 140,
        child: PieChart(PieChartData(
          centerSpaceRadius: 42,
          sectionsSpace: 2,
          sections: empty
              ? [PieChartSectionData(value: 1, color: C.border, showTitle: false, radius: 22)]
              : [for (final (_, v, c) in items) if (v > 0) PieChartSectionData(value: v.toDouble(), color: c, showTitle: false, radius: 22)],
        )),
      ),
      const SizedBox(width: 18),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          for (final (label, v, c) in items)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(children: [
                Container(width: 12, height: 12, decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Expanded(child: Text(label)),
                Text(inr(v), style: TextStyle(fontWeight: FontWeight.w800, color: c, fontSize: 16)),
              ]),
            ),
        ]),
      ),
    ]);
  }
}
