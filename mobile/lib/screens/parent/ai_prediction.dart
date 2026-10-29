import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/api.dart';
import '../../core/files.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../../widgets/growth.dart';
import 'parent_common.dart';

class _Data {
  late Children children;
  Prediction? prediction;
}

({String emoji, String label, String desc, int score, String scoreLabel, Color color}) _meta(String status) => switch (status) {
      'moderate' => (emoji: '⚠️', label: 'Moderate — Monitor Closely', desc: 'Your child shows signs of moderate nutritional risk. Consult your ASHA worker and follow the dietary recommendations.', score: 62, scoreLabel: 'Monitor', color: const Color(0xFF8A5A12)),
      'severe' => (emoji: '🚨', label: 'Severe — Immediate Attention', desc: 'Your child is at risk of severe malnutrition. Please visit the nearest PHC or contact your ASHA worker immediately.', score: 42, scoreLabel: 'Urgent', color: const Color(0xFFB5452F)),
      _ => (emoji: '✅', label: 'Healthy — Normal Growth', desc: 'Your child is growing well within normal WHO standards. Keep up the good nutrition and regular check-ups.', score: 80, scoreLabel: 'Excellent ✓', color: const Color(0xFF3B6E8F)),
    };

Color _statusColor(String? s) => switch ((s ?? '').toLowerCase()) {
      'healthy' || 'normal' => C.green,
      'moderate' => const Color(0xFFB7791F),
      '' => const Color(0xFF66706B),
      _ => const Color(0xFFB5452F),
    };

class AIPredictionScreen extends StatelessWidget {
  const AIPredictionScreen({super.key});

  Future<_Data> load() async {
    final d = _Data()..children = await Children.load();
    final c = d.children.selected;
    if (c != null) {
      final raw = await api.get('/growth/${c['_id']}/predict').catchError((_) => null);
      d.prediction = raw is Map ? Prediction(raw) : null;
    }
    return d;
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/parent/ai-prediction',
        child: Loader<_Data>(
          load: load,
          builder: (context, d, reload) {
            final c = d.children.selected;
            final p = d.prediction;
            final children = <Widget>[ChildPicker(children: d.children, onChanged: reload)];
            if (p == null) {
              children.add(const Card(
                child: EmptyState('No growth data available yet.\nGrowth records must be entered by your ASHA worker first. Please contact your assigned ASHA worker to log the latest measurements.', icon: Icons.insights),
              ));
              return ListView(padding: const EdgeInsets.all(16), children: children);
            }
            final m = _meta(p.status);
            final share = 'Shishu Aarogya Health Report — ${c?['name'] ?? 'Child'}: ${p.status} nutritional status.';
            final tips = p.advice != null
                ? p.advice!.split(RegExp(r'\.\s+')).where((s) => s.trim().isNotEmpty).map((s) => s.trim().replaceAll(RegExp(r'\.$'), '')).toList()
                : const [
                    'Maintain a balanced diet rich in proteins and micronutrients',
                    'Ensure regular breastfeeding for infants under 6 months',
                    'Schedule follow-up visits with your ASHA worker',
                    'Monitor weight and height monthly',
                    'Complete all vaccination schedules on time',
                  ];
            final buttons = Row(children: [
              Expanded(child: OutlinedButton.icon(onPressed: c == null ? null : () => downloadAndOpen(context, '/reports/child/${c['_id']}', '${c['name']}-health-report.pdf'), icon: const Icon(Icons.download), label: const Text('Download Report'))),
              const SizedBox(width: 10),
              Expanded(child: FilledButton.icon(onPressed: () => SharePlus.instance.share(ShareParams(text: share, subject: 'Child Health Report')), icon: const Icon(Icons.share), label: const Text('Share'))),
            ]);

            children.addAll([
              buttons,
              gap,
              Card(
                color: const Color(0xFFE5ECF2),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('AI PREDICTION RESULT · LAST UPDATED TODAY', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: C.muted, letterSpacing: .5)),
                        const SizedBox(height: 6),
                        glyph(m.emoji, size: 30),
                        Text(m.label, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: m.color)),
                        const SizedBox(height: 4),
                        Text(m.desc, style: const TextStyle(fontSize: 13)),
                      ]),
                    ),
                    const SizedBox(width: 10),
                    Column(children: [
                      SizedBox(
                        width: 90,
                        height: 90,
                        child: Stack(alignment: Alignment.center, children: [
                          SizedBox(width: 90, height: 90, child: CircularProgressIndicator(value: m.score / 100, strokeWidth: 8, color: const Color(0xFF3B6E8F), backgroundColor: const Color(0xFFD3DEE7))),
                          Text('${m.score}\n/100', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF35556E))),
                        ]),
                      ),
                      const SizedBox(height: 6),
                      Text(m.scoreLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF3B6E8F))),
                    ]),
                  ]),
                ),
              ),
              if (p.graph != null && (p.graph!['nodes'] as List?)?.isNotEmpty == true) _GnnCard(graph: p.graph!),
              _Insights(insights: p.insights, error: p.error),
              for (final z in [
                ('WAZ', 'Weight-for-Age Z-Score', p.waz, p.wazStatus, 'Reflects body weight relative to age. Indicates underweight if below -2.', C.green),
                ('HAZ', 'Height-for-Age Z-Score', p.haz, p.hazStatus, 'Reflects linear growth. A value below -2 indicates stunting.', const Color(0xFF3B6E8F)),
                ('WHZ', 'Weight-for-Height Z-Score', p.whz, p.whzStatus, 'Reflects acute malnutrition. A value below -2 indicates wasting.', const Color(0xFFB7791F)),
              ])
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: z.$6, width: 1.5)),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Text(z.$1, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                        const Spacer(),
                        Badge2(z.$4 ?? 'N/A', tone: Tone(_statusColor(z.$4), _statusColor(z.$4).withValues(alpha: .12))),
                      ]),
                      Text(z.$2, style: const TextStyle(color: C.muted, fontSize: 12.5)),
                      Text(z.$3 == null ? '—' : z.$3!.toStringAsFixed(2), style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: _statusColor(z.$4))),
                      ZGauge(value: z.$3, label: ''),
                      Text(z.$5, style: const TextStyle(fontSize: 12.5, color: C.muted)),
                    ]),
                  ),
                ),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                    Text('Z-Score Classification Guide', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    SizedBox(height: 8),
                    NoticeBox("Healthy (z ≥ −1) · Normal\nChild's growth is within normal WHO standards. Continue current feeding and care practices.", tone: goodTone),
                    NoticeBox('Moderate (−2 to −1) · Monitor\nAt-risk zone. Increase nutritious food intake, schedule ASHA follow-up, and monitor monthly.', tone: warnTone),
                    NoticeBox('Severe (z < −2) · Urgent\nImmediate referral to PHC or NRC required. This indicates severe acute or chronic malnutrition.', tone: badTone),
                  ]),
                ),
              ),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text("Doctor's Recommendations", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 6),
                    for (final tip in tips) Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Text('• $tip')),
                  ]),
                ),
              ),
            ]);
            return ListView(padding: const EdgeInsets.all(16), children: children);
          },
        ),
      );
}

class _Insights extends StatelessWidget {
  const _Insights({this.insights, this.error});
  final String? insights;
  final String? error;
  @override
  Widget build(BuildContext context) {
    if (insights == null && error == null) return const SizedBox.shrink();
    return Card(
      color: const Color(0xFFEEEAF3),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('AI Health Insights (Gemini)', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF5E4B7D))),
          const SizedBox(height: 8),
          Text(insights ?? 'AI insights are unavailable right now: $error', style: TextStyle(color: insights == null ? const Color(0xFF66706B) : C.text, height: 1.5)),
        ]),
      ),
    );
  }
}

/// Growth prediction network: nodes on a circle, edges between them (as on the website).
class _GnnCard extends StatelessWidget {
  const _GnnCard({required this.graph});
  final Map graph;
  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Growth Prediction Network (GNN)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 8),
            AspectRatio(aspectRatio: 1.6, child: CustomPaint(painter: _GnnPainter(graph))),
            Text('Nodes: ${graph['nodeCount'] ?? (graph['nodes'] as List).length}   ·   Edges: ${graph['edgeCount'] ?? (graph['edges'] as List? ?? []).length}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
          ]),
        ),
      );
}

class _GnnPainter extends CustomPainter {
  _GnnPainter(this.graph);
  final Map graph;
  @override
  void paint(Canvas canvas, Size size) {
    final nodes = graph['nodes'] as List;
    final edges = (graph['edges'] as List?) ?? [];
    final c = size.center(Offset.zero);
    final r = math.min(size.width, size.height) * 0.38;
    final pos = <String, Offset>{};
    for (var i = 0; i < nodes.length; i++) {
      final a = i / nodes.length * 2 * math.pi;
      pos['${nodes[i]['id'] ?? 'node_$i'}'] = c + Offset(math.cos(a) * r, math.sin(a) * r);
    }
    final line = Paint()
      ..color = C.primary.withValues(alpha: .6)
      ..strokeWidth = 1.5;
    for (final e in edges) {
      final a = pos['${e['source']}'], b = pos['${e['target']}'];
      if (a != null && b != null) canvas.drawLine(a, b, line);
    }
    for (var i = 0; i < nodes.length; i++) {
      final n = nodes[i];
      final id = '${n['id'] ?? 'node_$i'}';
      final p = pos[id]!;
      final color = n['type'] == 'child' ? C.dark : n['type'] == 'reference' ? C.green : C.primary;
      canvas.drawCircle(p, 8, Paint()..color = Colors.white);
      canvas.drawCircle(p, 6.5, Paint()..color = color);
      final tp = TextPainter(text: TextSpan(text: id.split('_').first, style: const TextStyle(fontSize: 9.5, color: C.text, fontWeight: FontWeight.w600)), textDirection: TextDirection.ltr)..layout();
      tp.paint(canvas, p + Offset(-tp.width / 2, 10));
    }
  }

  @override
  bool shouldRepaint(_GnnPainter old) => old.graph != graph;
}
