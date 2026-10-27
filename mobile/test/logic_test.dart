import 'dart:convert';
import 'dart:io';

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
}
