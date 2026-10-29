import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/ui.dart';
import '../screens/parent/parent_common.dart';

// WHO reference medians, 0–24 months (same tables as the website's GrowthLineChart.jsx)
const whoWeight = [
  3.3,
  4.5,
  5.6,
  6.4,
  7.0,
  7.5,
  7.9,
  8.3,
  8.6,
  8.9,
  9.2,
  9.4,
  9.6,
  9.8,
  10.0,
  10.1,
  10.3,
  10.4,
  10.6,
  10.7,
  10.8,
  10.9,
  11.0,
  11.1,
  11.2,
];
const whoHeight = [
  49.9,
  54.7,
  58.4,
  61.4,
  63.9,
  65.9,
  67.6,
  69.2,
  70.6,
  72.0,
  73.3,
  74.5,
  75.7,
  76.9,
  78.0,
  79.1,
  80.2,
  81.2,
  82.3,
  83.2,
  84.1,
  84.9,
  85.7,
  86.5,
  87.2,
];
const whoHead = [
  35.5,
  38.1,
  40.2,
  41.8,
  43.1,
  43.9,
  44.6,
  45.2,
  45.7,
  46.1,
  46.5,
  46.8,
  47.1,
  47.4,
  47.6,
  47.9,
  48.1,
  48.3,
  48.5,
  48.6,
  48.8,
  48.9,
  49.1,
  49.2,
  49.3,
];

double? _d(dynamic v) =>
    v is num ? v.toDouble() : double.tryParse('${v ?? ''}');

/// Child's measurements against the WHO median (dashed amber). Green while within 85–115% of the median, red otherwise.
class GrowthChart extends StatelessWidget {
  const GrowthChart({
    super.key,
    required this.records,
    this.type = 'weight',
    this.maxAge = 24,
  });
  final List records;
  final String type; // weight | height | headCircumference
  final int maxAge;

  @override
  Widget build(BuildContext context) {
    final who = type == 'weight'
        ? whoWeight
        : type == 'height'
        ? whoHeight
        : whoHead;
    final unit = type == 'weight' ? 'kg' : 'cm';
    final label = type == 'weight'
        ? 'Weight'
        : type == 'height'
        ? 'Height'
        : 'Head Circumference';
    final points = [
      for (final r in records)
        if (_d(r[type]) != null && _d(r[type])! > 0)
          FlSpot(
            (_d(r['ageMonths']) ?? 0).clamp(0, maxAge.toDouble()),
            _d(r[type])!,
          ),
    ]..sort((a, b) => a.x.compareTo(b.x));
    var healthy = true;
    if (points.length >= 2) {
      final last = points.last;
      final m = who[last.x.floor().clamp(0, who.length - 1)];
      healthy = last.y >= m * 0.85 && last.y <= m * 1.15;
    }
    final color = healthy ? C.green : C.red;
    final whoSpots = [
      for (var i = 0; i <= maxAge && i < who.length; i++)
        FlSpot(i.toDouble(), who[i]),
    ];
    final all = [...whoSpots.map((s) => s.y), ...points.map((s) => s.y)];
    final minY = all.reduce((a, b) => a < b ? a : b) * 0.85;
    final maxY = all.reduce((a, b) => a > b ? a : b) * 1.1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$label ($unit) by age',
          style: const TextStyle(fontWeight: FontWeight.w700, color: C.text),
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 14,
          children: [
            _legend(const Color(0xFFB7791F), 'WHO median', dashed: true),
            _legend(
              color,
              healthy
                  ? 'Your child (on track)'
                  : 'Your child (needs attention)',
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 220,
          child: LineChart(
            LineChartData(
              minX: 0,
              maxX: maxAge.toDouble(),
              minY: minY,
              maxY: maxY,
              gridData: FlGridData(
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) =>
                    const FlLine(color: Color(0x140891B2), strokeWidth: 1),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: 3,
                    reservedSize: 22,
                    getTitlesWidget: (v, _) => Text(
                      '${v.toInt()}m',
                      style: const TextStyle(fontSize: 10, color: C.muted),
                    ),
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 34,
                    getTitlesWidget: (v, _) => Text(
                      v.toStringAsFixed(0),
                      style: const TextStyle(fontSize: 10, color: C.muted),
                    ),
                  ),
                ),
              ),
              lineBarsData: [
                LineChartBarData(
                  spots: whoSpots,
                  isCurved: true,
                  color: const Color(0xFFB7791F),
                  barWidth: 2,
                  dashArray: [6, 4],
                  dotData: const FlDotData(show: false),
                ),
                if (points.isNotEmpty)
                  LineChartBarData(
                    spots: points,
                    color: color,
                    barWidth: 3,
                    dotData: const FlDotData(show: true),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _legend(Color c, String text, {bool dashed = false}) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 18,
        height: 3,
        color: dashed ? c.withValues(alpha: 0.7) : c,
      ),
      const SizedBox(width: 5),
      Text(text, style: const TextStyle(fontSize: 11.5, color: C.muted)),
    ],
  );
}

/// WHO z-score gauge: -3 (severe) … 0 (median) … +3.
class ZGauge extends StatelessWidget {
  const ZGauge({super.key, required this.value, required this.label});
  final num? value;
  final String label;
  @override
  Widget build(BuildContext context) {
    final v = (value ?? 0).toDouble();
    final pct = ((v + 3) / 6).clamp(0.0, 1.0);
    final color = v >= -1
        ? C.green
        : v >= -2
        ? const Color(0xFFB7791F)
        : const Color(0xFFB5452F);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
              Text(
                value == null ? '-' : v.toStringAsFixed(1),
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: color,
                  fontSize: 15,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          LayoutBuilder(
            builder: (context, c) => Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 12,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFFEBB8AC),
                        Color(0xFFB5452F),
                        Color(0xFFF3D9A4),
                        Color(0xFFB7DCC4),
                        Color(0xFFB7DCC4),
                        Color(0xFFF3D9A4),
                        Color(0xFFEBB8AC),
                      ],
                      stops: [0, .2, .35, .5, .65, .8, 1],
                    ),
                  ),
                ),
                Positioned(
                  left: (c.maxWidth * pct - 1.5).clamp(0, c.maxWidth - 3),
                  top: 0,
                  bottom: 0,
                  child: Container(width: 3, color: C.text),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '-3 Severe',
                style: TextStyle(fontSize: 9.5, color: C.muted),
              ),
              Text('-1', style: TextStyle(fontSize: 9.5, color: C.muted)),
              Text('0 Median', style: TextStyle(fontSize: 9.5, color: C.muted)),
              Text('+3', style: TextStyle(fontSize: 9.5, color: C.muted)),
            ],
          ),
        ],
      ),
    );
  }
}

/// Growth section of My Child (parent): stats, tabs (trend / weight / height / z-scores / records), advice.
class GrowthSection extends StatefulWidget {
  const GrowthSection({super.key, required this.child, required this.version});
  final Map child;
  final int version; // bump to reload after a new record
  @override
  State<GrowthSection> createState() => _GrowthSectionState();
}

class _GrowthSectionState extends State<GrowthSection> {
  List records = [];
  Prediction? prediction;
  bool loading = true;
  String tab = 'trend';

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void didUpdateWidget(GrowthSection old) {
    super.didUpdateWidget(old);
    if (old.child['_id'] != widget.child['_id'] ||
        old.version != widget.version) {
      load();
    }
  }

  Future<void> load() async {
    setState(() => loading = true);
    final id = widget.child['_id'];
    final r = await Future.wait([
      api.get('/growth/$id').catchError((_) => []),
      api
          .get('/growth/$id/predict', {'insights': 'false'})
          .catchError((_) => null),
    ]);
    if (!mounted) return;
    setState(() {
      records = (r[0] as List?) ?? [];
      prediction = r[1] is Map ? Prediction(r[1] as Map) : null;
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final latest = records.lastOrNull;
    final prev = records.length > 1 ? records[records.length - 2] : null;
    String? gain(String k) =>
        latest != null &&
            prev != null &&
            _d(latest[k]) != null &&
            _d(prev[k]) != null
        ? (_d(latest[k])! - _d(prev[k])!).toStringAsFixed(1)
        : null;
    final p = prediction;
    final waz = p?.waz ?? _d(latest?['wazScore']);
    final age = (_d(latest?['ageMonths']) ?? 0).toInt();
    final whoW = whoWeight[age.clamp(0, 18)];
    final whoH = whoHeight[age.clamp(0, 18)];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionTitle('Growth Monitoring'),
        StatGrid([
          StatTile(
            label: 'Current Weight',
            value: latest?['weight'] != null ? '${latest['weight']} kg' : '—',
            sub: gain('weight') != null
                ? '+${gain('weight')} kg since last'
                : 'No prior record',
            color: C.primary,
          ),
          StatTile(
            label: 'Current Height',
            value: latest?['height'] != null ? '${latest['height']} cm' : '—',
            sub: gain('height') != null
                ? '+${gain('height')} cm since last'
                : 'No prior record',
            color: C.green,
          ),
          StatTile(
            label: 'WAZ Score',
            value: waz != null ? waz.toStringAsFixed(1) : '—',
            sub: p?.wazStatus ?? 'Weight for age',
            color: const Color(0xFFB7791F),
          ),
          StatTile(
            label: 'Health Status',
            value:
                p?.status ?? '${widget.child['nutritionStatus'] ?? 'Normal'}',
            sub: p?.advice != null
                ? '${p!.advice!.substring(0, p.advice!.length.clamp(0, 40))}…'
                : 'Based on latest record',
            color: const Color(0xFF3B6E8F),
          ),
        ]),
        const SizedBox(height: 14),
        ChoiceRow(
          value: tab,
          onChanged: (v) => setState(() => tab = v),
          options: const [
            ('trend', 'Growth Trend'),
            ('weight', 'Weight'),
            ('height', 'Height'),
            ('zscore', 'Z-Scores'),
            ('records', 'Records'),
          ],
        ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: loading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(30),
                      child: CircularProgressIndicator(),
                    ),
                  )
                : switch (tab) {
                    'trend' =>
                      records.isEmpty
                          ? const EmptyState(
                              "No growth records available. Start by recording your baby's measurements!",
                            )
                          : Column(
                              children: [
                                GrowthChart(records: records),
                                const SizedBox(height: 20),
                                GrowthChart(records: records, type: 'height'),
                              ],
                            ),
                    'weight' => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (records.isEmpty)
                          const EmptyState('No growth records available.')
                        else
                          GrowthChart(records: records),
                        gap,
                        NoticeBox(
                          'Weight insight: Current weight records show ${latest?['weight'] ?? '—'} kg. WHO median for $age months is $whoW kg.',
                          tone: infoTone,
                        ),
                      ],
                    ),
                    'height' => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (records.isEmpty)
                          const EmptyState('No growth records available.')
                        else
                          GrowthChart(records: records, type: 'height'),
                        gap,
                        NoticeBox(
                          'Height insight: Current height records show ${latest?['height'] ?? '—'} cm. WHO median for $age months is $whoH cm.',
                          tone: const Tone(
                            Color(0xFF3B6E8F),
                            Color(0xFFE5ECF2),
                          ),
                        ),
                      ],
                    ),
                    'zscore' => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'WHO Z-Score Gauges',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 14),
                        ZGauge(
                          value: p?.waz ?? _d(latest?['wazScore']),
                          label: 'Weight for Age (WAZ)',
                        ),
                        ZGauge(
                          value: p?.haz ?? _d(latest?['hazScore']),
                          label: 'Height for Age (HAZ)',
                        ),
                        ZGauge(
                          value: p?.whz ?? _d(latest?['whzScore']),
                          label: 'Weight for Height (WHZ)',
                        ),
                        const NoticeBox(
                          "Z-scores compare your child's measurements to the WHO global median. A score between -2 and +2 is considered normal.",
                          tone: infoTone,
                        ),
                      ],
                    ),
                    _ =>
                      records.isEmpty
                          ? const EmptyState('No growth records available.')
                          : SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                columnSpacing: 16,
                                columns: const [
                                  DataColumn(label: Text('Date')),
                                  DataColumn(label: Text('Age (mo)')),
                                  DataColumn(label: Text('Weight')),
                                  DataColumn(label: Text('Height')),
                                  DataColumn(label: Text('WAZ')),
                                  DataColumn(label: Text('HAZ')),
                                  DataColumn(label: Text('Status')),
                                ],
                                rows: [
                                  for (final r in records.reversed)
                                    DataRow(
                                      cells: [
                                        DataCell(
                                          Text(fmtDate(r['recordedDate'])),
                                        ),
                                        DataCell(Text(str(r['ageMonths']))),
                                        DataCell(
                                          Text('${str(r['weight'])} kg'),
                                        ),
                                        DataCell(
                                          Text('${str(r['height'])} cm'),
                                        ),
                                        DataCell(
                                          Text(
                                            _d(r['wazScore'])
                                                    ?.toStringAsFixed(1) ??
                                                '-',
                                          ),
                                        ),
                                        DataCell(
                                          Text(
                                            _d(r['hazScore'])
                                                    ?.toStringAsFixed(1) ??
                                                '-',
                                          ),
                                        ),
                                        DataCell(
                                          StatusBadge(
                                            r['prediction'] is String &&
                                                    '${r['prediction']}'
                                                        .isNotEmpty
                                                ? r['prediction']
                                                : 'healthy',
                                          ),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                            ),
                  },
          ),
        ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'What the numbers mean',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: C.dark,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 8),
                for (final (label, val, status, desc) in [
                  (
                    'WAZ',
                    p?.waz ?? _d(latest?['wazScore']),
                    p?.wazStatus ?? 'Weight for Age',
                    "Compares your child's weight to peers of the same age globally.",
                  ),
                  (
                    'HAZ',
                    p?.haz ?? _d(latest?['hazScore']),
                    p?.hazStatus ?? 'Height for Age',
                    'Reflects long-term nutritional history and linear growth.',
                  ),
                  (
                    'WHZ',
                    p?.whz ?? _d(latest?['whzScore']),
                    p?.whzStatus ?? 'Weight for Height',
                    'Indicates current nutritional status — acute wasting indicator.',
                  ),
                ])
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      '$label · $status',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13.5,
                      ),
                    ),
                    subtitle: Text(desc, style: const TextStyle(fontSize: 12)),
                    trailing: Text(
                      val == null ? '—' : val.toStringAsFixed(1),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: val == null
                            ? C.primary
                            : val >= -1
                            ? C.green
                            : val >= -2
                            ? const Color(0xFFB7791F)
                            : const Color(0xFFB5452F),
                      ),
                    ),
                  ),
                if (p?.advice != null)
                  NoticeBox('Advice: ${p!.advice}', tone: goodTone),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Bottom sheet to record weight / height / head circumference. Returns true when saved.
Future<bool> showRecordGrowth(BuildContext context, Map child) async {
  final weight = TextEditingController(),
      height = TextEditingController(),
      head = TextEditingController(),
      notes = TextEditingController();
  final maxW = child['gender'] == 'female' ? 13 : 14;
  String msg = '';
  bool saving = false;
  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (c) => StatefulBuilder(
      builder: (c, setS) {
        final w = double.tryParse(weight.text);
        final invalid = w != null && w > maxW;
        Future<void> save() async {
          if (weight.text.isEmpty && height.text.isEmpty) {
            return setS(() => msg = 'Enter at least weight or height.');
          }
          if (invalid) {
            return setS(
              () => msg =
                  'Invalid: Weight exceeds max $maxW kg for ${child['gender'] == 'female' ? 'girls' : 'boys'}.',
            );
          }
          setS(() {
            saving = true;
            msg = '';
          });
          try {
            await api.post('/growth/add', {
              'childId': child['_id'],
              'weight': ?w,
              if (double.tryParse(height.text) != null)
                'height': double.parse(height.text),
              if (double.tryParse(head.text) != null)
                'headCircumference': double.parse(head.text),
              'ageMonths': ageMonths(child['dob']) > 0
                  ? ageMonths(child['dob'])
                  : (child['ageInMonths'] ?? 0),
              'notes': notes.text,
            });
            if (c.mounted) Navigator.pop(c, true);
          } catch (e) {
            setS(() {
              msg = errText(e);
              saving = false;
            });
          }
        }

        return Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            MediaQuery.of(c).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Record Growth',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
              ),
              Text(
                "Capture ${child['name']}'s current metrics.",
                style: const TextStyle(color: C.muted),
              ),
              gap,
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: weight,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      onChanged: (_) => setS(() {}),
                      decoration: InputDecoration(
                        labelText: 'Weight (kg)',
                        errorText: invalid ? 'Max $maxW kg' : null,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: height,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      decoration: const InputDecoration(
                        labelText: 'Height (cm)',
                      ),
                    ),
                  ),
                ],
              ),
              gap,
              TextField(
                controller: head,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Head Circumference (cm) - Optional',
                ),
              ),
              gap,
              TextField(
                controller: notes,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Notes'),
              ),
              if (msg.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    msg,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: C.red,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              gap,
              FilledButton(
                onPressed: saving ? null : save,
                child: Text(saving ? 'Saving...' : 'Save Record'),
              ),
            ],
          ),
        );
      },
    ),
  );
  return saved == true;
}
