import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/api.dart';
import '../../core/ui.dart';

/// The parent's children and which one is selected (remembered across launches, like the website).
class Children {
  static const _key = 'sa_selected_child_id';
  List<Map<String, dynamic>> list = [];
  String selectedId = '';

  Map<String, dynamic>? get selected => list.where((c) => c['_id'] == selectedId).firstOrNull ?? list.firstOrNull;

  static Future<Children> load() async {
    final c = Children();
    final rows = await api.get('/child') as List;
    c.list = rows.map((e) => Map<String, dynamic>.from(e)).toList();
    String? stored;
    try {
      stored = (await SharedPreferences.getInstance()).getString(_key);
    } catch (_) {}
    c.selectedId = c.list.any((x) => x['_id'] == stored) ? stored! : (c.list.firstOrNull?['_id'] ?? '');
    return c;
  }

  Future<void> select(String id) async {
    selectedId = id;
    try {
      (await SharedPreferences.getInstance()).setString(_key, id);
    } catch (_) {}
  }
}

/// Dropdown to switch child; hidden with one child.
class ChildPicker extends StatelessWidget {
  const ChildPicker({super.key, required this.children, required this.onChanged});
  final Children children;
  final VoidCallback onChanged;
  @override
  Widget build(BuildContext context) {
    if (children.list.length < 2) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Pick<String>(
        label: 'Child',
        value: children.selected?['_id'],
        items: [for (final c in children.list) (c['_id'] as String, '${c['name']}')],
        onChanged: (v) async {
          if (v == null) return;
          await children.select(v);
          onChanged();
        },
      ),
    );
  }
}

// ── Built-in diet plans (assets/diet_plans.json, same data as the website's DietPlan.jsx) ──
class DietData {
  static Map<String, dynamic>? _cache;
  static Future<Map<String, dynamic>> load() async => _cache ??= jsonDecode(await rootBundle.loadString('assets/diet_plans.json'));

  static Map<String, dynamic>? ageGroup(Map<String, dynamic> data, int? months) {
    if (months == null) return null;
    final groups = (data['ageGroups'] as List).cast<Map<String, dynamic>>();
    return groups.where((g) => months >= g['minMonths'] && months <= g['maxMonths']).firstOrNull ?? groups.last;
  }
}

/// Start hour of a meal slot like "7:00 – 8:00 AM"; null for "During night".
double? mealStartHour(String? time) {
  final m = RegExp(r'(\d{1,2})(?::(\d{2}))?[^AP]*?(AM|PM)', caseSensitive: false).firstMatch(time ?? '');
  if (m == null) return null;
  final h = int.parse(m[1]!) % 12 + (m[3]!.toUpperCase() == 'PM' ? 12 : 0);
  return h + int.parse(m[2] ?? '0') / 60;
}

/// Index of the meal happening now (the last one whose start time has passed).
int currentMealIndex(List meals) {
  final now = DateTime.now();
  final hour = now.hour + now.minute / 60;
  var idx = -1, lastTimed = -1;
  var latest = -1.0;
  for (var i = 0; i < meals.length; i++) {
    final start = mealStartHour(meals[i]['time']);
    if (start == null) continue;
    lastTimed = i;
    if (start <= hour && start >= latest) {
      latest = start;
      idx = i;
    }
  }
  return idx == -1 ? lastTimed : idx;
}

String mealItemsText(Map meal) => ((meal['items'] as List?) ?? [])
    .map((item) => item['type'] == 'options'
        ? (item['options'] as List).take(2).map((o) => '${o['emoji']} ${o['name']}').join(' / ')
        : '${item['emoji'] ?? ''} ${item['name']}${item['qty'] != null ? ' (${item['qty']})' : ''}')
    .join(' + ');

// ── AI prediction: flattens the two shapes GET /growth/:id/predict can return ──
num? _num(dynamic v) => v is num ? v : (v is String ? num.tryParse(v) : null);
String? _str(dynamic v) => v is String && v.trim().isNotEmpty ? v.trim() : (v is num ? '$v' : null);
String? classifyZ(num? z) => z == null ? null : (z < -3 ? 'severe' : z < -2 ? 'moderate' : 'healthy');
String? _status(dynamic v) {
  final s = _str(v)?.toLowerCase();
  if (s == null) return null;
  return s == 'low' || s == 'normal' || s == 'healthy' ? 'healthy' : s;
}

class Prediction {
  Prediction(this.raw);
  final Map raw;

  Map get _gnn => raw['prediction'] is Map ? raw['prediction'] : const {};
  Map get current => raw['currentStatus'] is Map ? raw['currentStatus'] : (_gnn['currentStatus'] is Map ? _gnn['currentStatus'] : const {});
  Map get _forecast => _gnn['prediction'] is Map ? _gnn['prediction'] : (raw['forecast'] is Map ? raw['forecast'] : const {});
  Map get _z => raw['zScores'] is Map ? raw['zScores'] : const {};

  String get status => _status(raw['prediction'] is String ? raw['prediction'] : null) ?? _status(_z['prediction']) ?? _status(raw['riskLevel']) ?? _status(_gnn['riskLevel']) ?? 'healthy';
  String get riskLevel => _str(raw['riskLevel'])?.toLowerCase() ?? _str(_gnn['riskLevel'])?.toLowerCase() ?? status;
  num? get waz => _num(raw['waz']) ?? _num(_z['waz']) ?? _num(current['weightForAgeZ']);
  num? get haz => _num(raw['haz']) ?? _num(_z['haz']) ?? _num(current['heightForAgeZ']);
  num? get whz => _num(raw['whz']) ?? _num(_z['whz']) ?? _num(current['whzScore'] ?? current['weightForHeightZ']);
  String? get wazStatus => _status(raw['wazStatus']) ?? _status(_z['wazStatus']) ?? classifyZ(waz);
  String? get hazStatus => _status(raw['hazStatus']) ?? _status(_z['hazStatus']) ?? classifyZ(haz);
  String? get whzStatus => _status(raw['whzStatus']) ?? _status(_z['whzStatus']) ?? classifyZ(whz);
  String? get advice => _str(raw['advice']) ?? _str(_z['advice']) ?? _str(raw['recommendation']) ?? _str(_gnn['recommendation']);
  String? get recommendation => _str(raw['recommendation']) ?? _str(_gnn['recommendation']) ?? advice;
  num? get confidence => _num(raw['confidence']) ?? _num(_gnn['confidence']);
  num? get predictedWeight => _num(raw['predictedWeight']) ?? _num(_forecast['predictedWeight']);
  num? get predictedHeight => _num(raw['predictedHeight']) ?? _num(_forecast['predictedHeight']);
  num? get nextMonthAge => _num(_forecast['nextMonthAge']);
  String? get insights => _str(raw['insights']);
  String? get error => _str(raw['error']);
  Map? get graph => raw['graph'] is Map ? raw['graph'] : null;
}

/// Vaccine status pill: done / due / upcoming / missed.
class VaccineBadge extends StatelessWidget {
  const VaccineBadge(this.status, {super.key});
  final String? status;
  @override
  Widget build(BuildContext context) {
    final s = status ?? 'upcoming';
    final tone = s == 'done' ? goodTone : s == 'due' ? warnTone : s == 'missed' ? badTone : infoTone;
    return Badge2(s, tone: tone);
  }
}
