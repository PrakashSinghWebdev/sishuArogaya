import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import 'parent_common.dart';

Color _hex(String? s, Color fallback) {
  final v = int.tryParse((s ?? '').replaceFirst('#', ''), radix: 16);
  return v == null ? fallback : Color(0xFF000000 | v);
}

class _Data {
  late Children children;
  Map? plan;
  Map? group;
  int? months;
  List<String> checks = [];
  String notes = '';
  int streak = 0;
}

/// Diet plan for the child's age group, with today's meal checklist (saved to the server).
class DietPlanScreen extends StatefulWidget {
  const DietPlanScreen({super.key});
  @override
  State<DietPlanScreen> createState() => _DietPlanScreenState();
}

class _DietPlanScreenState extends State<DietPlanScreen> {
  String tab = 'plan';
  bool saving = false;
  Timer? _notesDebounce;
  final notesCtrl = TextEditingController();

  @override
  void dispose() {
    _notesDebounce?.cancel();
    super.dispose();
  }

  Future<_Data> load() async {
    final d = _Data()..children = await Children.load();
    final c = d.children.selected;
    if (c == null) return d;
    final diet = await DietData.load();
    d.months = c['ageInMonths'] is num ? (c['ageInMonths'] as num).toInt() : ageMonths(c['dob']);
    d.group = DietData.ageGroup(diet, d.months);
    if (d.group == null) return d;
    final builtIn = diet['plans'][d.group!['tag']] as Map?;
    try {
      final server = await api.get('/diet/${d.group!['tag']}');
      final ok = server is Map && server['intro'] is String && (server['meals'] as List?)?.any((m) => (m['items'] as List?)?.isNotEmpty == true) == true;
      d.plan = ok ? server : builtIn;
    } catch (_) {
      d.plan = builtIn;
    }
    try {
      final today = isoDay();
      final r = await Future.wait([
        api.get('/diet/checklist', {'childId': c['_id'], 'date': today}),
        api.get('/diet/checklist/streak', {'childId': c['_id']}),
      ]);
      d.checks = List<String>.from((r[0] as Map?)?['checks'] ?? []);
      d.notes = '${(r[0] as Map?)?['notes'] ?? ''}';
      d.streak = ((r[1] as Map?)?['streak'] as num?)?.toInt() ?? 0;
    } catch (_) {
      // the checklist is optional
    }
    notesCtrl.text = d.notes;
    return d;
  }

  int totalSlots(Map plan) => (plan['meals'] as List).fold(0, (s, m) => s + (m['items'] as List).length);

  int doneSlots(Map plan, List<String> checks) {
    var n = 0;
    final meals = plan['meals'] as List;
    for (var mi = 0; mi < meals.length; mi++) {
      final items = meals[mi]['items'] as List;
      for (var ii = 0; ii < items.length; ii++) {
        final slot = '$mi-$ii';
        if (items[ii]['type'] == 'options' ? checks.any((k) => k.startsWith('$slot:')) : checks.contains(slot)) n++;
      }
    }
    return n;
  }

  Future<void> save(_Data d) async {
    final c = d.children.selected;
    if (c == null || d.group == null) return;
    setState(() => saving = true);
    try {
      await api.put('/diet/checklist', {
        'childId': c['_id'],
        'date': isoDay(),
        'ageGroup': d.group!['tag'],
        'checks': d.checks,
        'notes': d.notes,
        'totalItems': totalSlots(d.plan!),
      });
    } catch (_) {
      // silent, like the website
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  void toggle(_Data d, String key, {String? slotPrefix}) {
    setState(() {
      if (slotPrefix != null) {
        final already = d.checks.contains(key);
        d.checks = d.checks.where((k) => !k.startsWith('$slotPrefix:')).toList();
        if (!already) d.checks.add(key);
      } else {
        d.checks.contains(key) ? d.checks.remove(key) : d.checks.add(key);
      }
    });
    save(d);
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/parent/diet-plan',
        child: Loader<_Data>(
          load: load,
          builder: (context, d, reload) {
            final c = d.children.selected;
            if (c == null) {
              return ListView(padding: const EdgeInsets.all(16), children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      glyph('👶', size: 48),
                      Text('${t('noRecords', 'No records')}.', style: const TextStyle(color: C.muted)),
                      TextButton(onPressed: () => Navigator.pushReplacementNamed(context, '/parent/child-profile'), child: Text(t('addChild', 'Add Child'))),
                    ]),
                  ),
                ),
              ]);
            }
            final plan = d.plan;
            if (plan == null) return ListView(padding: const EdgeInsets.all(16), children: [ErrorBox('Diet data unavailable for age group', onRetry: reload)]);
            final color = _hex(plan['color'], C.bg);
            final meals = plan['meals'] as List;
            final total = totalSlots(plan);
            final done = doneSlots(plan, d.checks);

            return ListView(padding: const EdgeInsets.all(16), children: [
              ChildPicker(children: d.children, onChanged: reload),
              Text.rich(TextSpan(style: const TextStyle(color: C.muted), children: [
                TextSpan(text: '${t('dietPlanFor', 'Diet plan for')} '),
                TextSpan(text: '${c['name']}', style: const TextStyle(fontWeight: FontWeight.w700, color: C.text)),
                TextSpan(text: ' — ${d.group?['label']} (${d.months} ${t('ageMonths', 'months')})'),
              ])),
              gap,
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(14), border: Border.all(color: C.border)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${d.group?['label']} — ${meals.length} feeding sessions per day', style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text('${plan['intro']}'),
                ]),
              ),
              gap,
              ChoiceRow(value: tab, onChanged: (v) => setState(() => tab = v), options: const [('plan', 'Daily Meal Plan'), ('superfoods', 'Superfoods & Tips')]),
              if (tab == 'plan') ...[
                for (final meal in meals) _MealCard(meal: meal, color: color),
                if (plan['warning'] != null) NoticeBox('${plan['warning']}', tone: warnTone),
                Card(
                  color: const Color(0xFFFBEFD9),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Foods to Avoid', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFA4541E))),
                      const SizedBox(height: 8),
                      Wrap(spacing: 6, runSpacing: 6, children: [for (final f in (plan['avoidFoods'] as List? ?? [])) Badge2('✕ $f', tone: badTone)]),
                    ]),
                  ),
                ),
                const SizedBox(height: 8),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Row(children: [
                        const Expanded(child: Text('Daily Meal Checklist', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
                        Text('$done / $total done', style: const TextStyle(color: C.dark, fontWeight: FontWeight.w700, fontSize: 12)),
                      ]),
                      if (done == total && total > 0) NoticeBox('Day complete! Well done.${d.streak > 0 ? '\n${d.streak}-day streak' : ''}', tone: goodTone),
                      const SizedBox(height: 10),
                      LinearProgressIndicator(value: total == 0 ? 0 : done / total, minHeight: 10, borderRadius: BorderRadius.circular(99), backgroundColor: const Color(0xFFE6F0EA)),
                      const SizedBox(height: 8),
                      for (var mi = 0; mi < meals.length; mi++) _checklistMeal(d, mi, meals[mi], color),
                      gap,
                      TextField(
                        controller: notesCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(labelText: 'Notes for today', hintText: 'Any observations about meals today...'),
                        onChanged: (v) {
                          d.notes = v;
                          _notesDebounce?.cancel();
                          _notesDebounce = Timer(const Duration(milliseconds: 600), () => save(d));
                        },
                      ),
                      if (saving) const Padding(padding: EdgeInsets.only(top: 4), child: Text('Saving...', style: TextStyle(fontSize: 11, color: C.muted))),
                    ]),
                  ),
                ),
              ] else ...[
                FutureBuilder<Map<String, dynamic>>(
                  future: DietData.load(),
                  builder: (context, s) => Column(children: [
                    for (final sf in (s.data?['superfoods'] as List? ?? []))
                      Card(child: ListTile(leading: glyph('${sf['emoji']}', size: 28), title: Text('${sf['name']}', style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text('${sf['desc']}'))),
                  ]),
                ),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Feeding Tips for ${d.group?['label']}', style: const TextStyle(fontWeight: FontWeight.w700, color: C.dark, fontSize: 15)),
                      const SizedBox(height: 6),
                      for (final tip in (plan['tips'] as List? ?? [])) Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Text('• $tip')),
                    ]),
                  ),
                ),
              ],
            ]);
          },
        ),
      );

  Widget _checklistMeal(_Data d, int mi, Map meal, Color color) {
    final items = meal['items'] as List;
    final mealDone = [for (var ii = 0; ii < items.length; ii++) items[ii]['type'] == 'options' ? d.checks.any((k) => k.startsWith('$mi-$ii:')) : d.checks.contains('$mi-$ii')].where((x) => x).length;
    return Container(
      margin: const EdgeInsets.only(top: 10),
      decoration: BoxDecoration(border: Border.all(color: C.border), borderRadius: BorderRadius.circular(12)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: color, borderRadius: const BorderRadius.vertical(top: Radius.circular(11))),
          child: Row(children: [
            glyph('${meal['icon'] ?? '🍽️'}', size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text('${meal['name']}\n${meal['time']}', style: const TextStyle(fontWeight: FontWeight.w600))),
            Text('$mealDone/${items.length}', style: const TextStyle(color: C.primary, fontWeight: FontWeight.w700)),
          ]),
        ),
        for (var ii = 0; ii < items.length; ii++)
          if (items[ii]['type'] == 'options') ...[
            Padding(padding: const EdgeInsets.fromLTRB(12, 10, 12, 2), child: Text('${items[ii]['label']}'.toUpperCase(), style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: C.dark))),
            for (var oi = 0; oi < (items[ii]['options'] as List).length; oi++)
              ListTile(
                dense: true,
                leading: Icon(d.checks.contains('$mi-$ii:$oi') ? Icons.radio_button_checked : Icons.radio_button_unchecked, color: C.primary),
                onTap: () => toggle(d, '$mi-$ii:$oi', slotPrefix: '$mi-$ii'),
                title: Text('${items[ii]['options'][oi]['name']}'),
                subtitle: Text('${items[ii]['options'][oi]['qty'] ?? ''}${items[ii]['options'][oi]['note'] != null ? ' · ${items[ii]['options'][oi]['note']}' : ''}'),
              ),
          ] else
            CheckboxListTile(
              dense: true,
              value: d.checks.contains('$mi-$ii'),
              onChanged: (_) => toggle(d, '$mi-$ii'),
              title: Text('${items[ii]['name']}', style: TextStyle(decoration: d.checks.contains('$mi-$ii') ? TextDecoration.lineThrough : null)),
              subtitle: Text('${items[ii]['qty'] ?? ''}${items[ii]['note'] != null ? '\nTip: ${items[ii]['note']}' : ''}'),
            ),
      ]),
    );
  }
}

class _MealCard extends StatelessWidget {
  const _MealCard({required this.meal, required this.color});
  final Map meal;
  final Color color;
  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Container(
            color: color,
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              glyph('${meal['icon'] ?? '🍽️'}', size: 22),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('${meal['name']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)), Text('${meal['time']}', style: const TextStyle(color: C.muted, fontSize: 12))])),
            ]),
          ),
          for (final item in meal['items'] as List)
            if (item['type'] == 'options')
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${item['label']}'.toUpperCase(), style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: C.dark)),
                  const SizedBox(height: 6),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    for (final o in item['options'] as List)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.border)),
                        child: Text('${o['name']}\n${o['qty'] ?? ''}', style: const TextStyle(fontSize: 12.5)),
                      ),
                  ]),
                ]),
              )
            else
              ListTile(
                leading: const Icon(Icons.circle, size: 8, color: C.accent),
                title: Text('${item['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('${item['qty'] ?? ''}${item['note'] != null ? '\nTip: ${item['note']}' : ''}'),
              ),
        ]),
      );
}
