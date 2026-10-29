import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shishu_aarogya/core/ui.dart';
import 'package:shishu_aarogya/screens/parent/parent_common.dart';
import 'package:shishu_aarogya/screens/shared/chatbot.dart';

// Checks for the logic ported by hand from the website (same inputs → same outputs).
void main() {
  test('Indian digit grouping', () {
    expect(inr(0), '0');
    expect(inr(999), '999');
    expect(inr(1234567), '12,34,567');
    expect(rupees(49), '₹49');
  });

  test('meal slot start hours', () {
    expect(mealStartHour('7:00 – 8:00 AM'), 7);
    expect(mealStartHour('12:00 – 1:00 PM'), 12);
    expect(mealStartHour('10:30 AM'), 10.5);
    expect(mealStartHour('During night'), isNull);
  });

  test('prediction: both server shapes flatten to the same fields', () {
    final flat = Prediction({'prediction': 'moderate', 'waz': -2.4, 'advice': 'Eat well'});
    expect(flat.status, 'moderate');
    expect(flat.wazStatus, 'moderate');
    expect(flat.advice, 'Eat well');

    final gnn = Prediction({
      'prediction': {'riskLevel': 'low', 'recommendation': 'Keep going', 'prediction': {'predictedWeight': 8.1}},
      'zScores': {'waz': -0.5},
    });
    expect(gnn.status, 'healthy'); // GNN "low" risk = healthy
    expect(gnn.riskLevel, 'low');
    expect(gnn.predictedWeight, 8.1);
    expect(gnn.waz, -0.5);
    expect(gnn.recommendation, 'Keep going');
  });

  test('offline chatbot answers from the bundled knowledge base', () {
    final data = jsonDecode(File('assets/chatbot.json').readAsStringSync()) as Map;
    final unknown = (data['knowledge'] as List).firstWhere((k) => k['intent'] == 'unknown')['response'];
    expect(findOfflineAnswer(data, 'hello'), isNot(unknown));
    expect(findOfflineAnswer(data, 'vaccination schedule'), contains('BCG'));
    expect(findOfflineAnswer(data, 'zzzz qqqq'), unknown);
  });

  test('open-app warnings: missed vaccine first, due today, food time', () {
    final now = DateTime(2026, 10, 28, 8, 30);
    final w = parentWarnings(
      child: {'name': 'Asha', 'nutritionStatus': 'healthy'},
      vaccines: [
        {'vaccineName': 'BCG', 'status': 'done', 'dueDate': '2026-09-01'},
        {'vaccineName': 'OPV-1', 'status': 'due', 'dueDate': '2026-10-28'},
        {'vaccineName': 'Penta-1', 'status': 'due', 'dueDate': '2026-10-20'},
      ],
      meals: [
        {'name': 'Breakfast', 'time': '8:00 – 9:00 AM', 'items': []},
        {'name': 'Lunch', 'time': '12:00 – 1:00 PM', 'items': []},
      ],
      lastGrowth: DateTime(2026, 10, 20),
      now: now,
    );
    expect(w.first.text, startsWith('Missed vaccine: Penta-1'));
    expect(w.first.urgent, true);
    expect(w.any((x) => x.text == 'Vaccine due today: OPV-1'), true);
    expect(w.any((x) => x.text.startsWith('Food time: Breakfast')), true);
    expect(w.any((x) => x.text.contains('BCG')), false);
    expect(w.any((x) => x.icon == '📏'), false);
  });

  test('emoji are removed from text, and every icon key in the shared data has a line icon', () {
    expect(noEmoji('💉 Vaccine due today'), 'Vaccine due today');
    expect(noEmoji('Breast Milk 🤱 / Formula'), 'Breast Milk / Formula');
    final diet = jsonDecode(File('assets/diet_plans.json').readAsStringSync());
    final shopData = jsonDecode(File('assets/shop.json').readAsStringSync());
    final keys = {
      for (final p in (diet['plans'] as Map).values)
        for (final m in p['meals']) m['icon'],
      for (final f in diet['superfoods']) f['emoji'],
      for (final c in shopData['categories']) c['emoji'],
    }.whereType<String>();
    for (final k in keys) {
      expect(glyphIcon(k), isNot(Icons.circle_outlined), reason: 'no icon for $k');
    }
  });
}
