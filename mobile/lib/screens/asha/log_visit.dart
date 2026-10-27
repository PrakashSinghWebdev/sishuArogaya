import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

const _visitTypes = ['Growth Check', 'Vaccination', 'Growth + Vaccination', 'Nutrition Counselling', 'Emergency Visit', 'Follow-up Visit', 'PHC Referral Follow-up'];
const _vaccines = [
  'BCG', 'OPV-0', 'Hepatitis B (1st)', 'DPT-1', 'OPV-1', 'Hib-1', 'PCV-1', 'Rota-1', 'DPT-2', 'OPV-2', 'Hib-2', 'PCV-2', 'Rota-2', //
  'DPT-3', 'OPV-3', 'Hib-3', 'IPV', 'Hepatitis B (3rd)', 'MMR-1', 'JE-1', 'MMR-2', 'DPT Booster', 'OPV Booster', 'Typhoid',
];
const _outcomes = [('healthy', 'Healthy — No concerns'), ('monitor', 'Monitor — Mild concern'), ('follow-up', 'Follow-up Required'), ('referred', 'Referred to PHC / CHC')];

/// Rough WAZ estimate from weight alone — a quick field flag, not a WHO lookup (same as the website).
double? _estimateWaz(String w) {
  final kg = double.tryParse(w);
  return kg == null ? null : double.parse(((kg - 8.2) / 1.1).toStringAsFixed(1));
}

/// Four-step home visit form: child + type, measurements, vaccines, notes / outcome / referral.
class LogVisitScreen extends StatefulWidget {
  const LogVisitScreen({super.key, this.childId});
  final String? childId;
  @override
  State<LogVisitScreen> createState() => _LogVisitScreenState();
}

class _LogVisitScreenState extends State<LogVisitScreen> {
  List children = [];
  bool loadingChildren = true, submitting = false;
  int step = 1;
  late String childId = widget.childId ?? '';
  String visitType = '', outcome = 'healthy', urgency = 'urgent', followUp = '', error = '';
  final weight = TextEditingController(), height = TextEditingController(), head = TextEditingController(), temp = TextEditingController(), muac = TextEditingController();
  final notes = TextEditingController(), facility = TextEditingController();
  final vaccines = <String>{};
  bool referral = false;

  @override
  void initState() {
    super.initState();
    api.get('/asha/children').then((r) => setState(() => children = r as List)).catchError((_) {}).whenComplete(() {
      if (mounted) setState(() => loadingChildren = false);
    });
  }

  Map? get child => children.where((c) => c['_id'] == childId).firstOrNull;
  int get maxWeight => child?['gender'] == 'female' ? 13 : 14;
  bool get weightInvalid => (double.tryParse(weight.text) ?? 0) > maxWeight;

  Future<void> submit() async {
    if (weightInvalid) return setState(() => error = 'Invalid weight: ${weight.text} kg exceeds max $maxWeight kg for ${child?['gender'] == 'female' ? 'girls' : 'boys'}.');
    setState(() {
      submitting = true;
      error = '';
    });
    double? n(TextEditingController c) => double.tryParse(c.text);
    try {
      await api.post('/asha/visit', {
        'childId': childId,
        'visitType': visitType,
        'weight': ?n(weight),
        'height': ?n(height),
        'headCircumference': ?n(head),
        'temperature': ?n(temp),
        'muac': ?n(muac),
        'vaccinesGiven': vaccines.toList(),
        'notes': notes.text,
        'outcome': outcome,
        'referralRequired': referral,
        'referralUrgency': urgency,
        if (facility.text.trim().isNotEmpty) 'facility': facility.text.trim(),
        if (followUp.isNotEmpty) 'followUpDate': followUp,
      });
      if (!mounted) return;
      toast(context, '✅ Visit saved');
      Navigator.pushReplacementNamed(context, '/asha/visit-history');
    } catch (e) {
      setState(() {
        error = errText(e);
        submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final waz = _estimateWaz(weight.text);
    final wazStatus = waz == null ? null : (waz >= -1 ? 'healthy' : waz >= -2 ? 'moderate' : 'severe');
    const labels = ['Select Child', 'Measurements', 'Vaccines', 'Notes & Save'];
    return RoleShell(
      route: '/asha/log-visit',
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: Row(children: [
            for (var i = 1; i <= 4; i++)
              Expanded(
                child: Column(children: [
                  CircleAvatar(radius: 13, backgroundColor: i <= step ? C.primary : C.border, child: Text(i < step ? '✓' : '$i', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700))),
                  const SizedBox(height: 4),
                  Text(labels[i - 1], style: TextStyle(fontSize: 10.5, color: i == step ? C.dark : C.muted, fontWeight: i == step ? FontWeight.w700 : FontWeight.w500)),
                ]),
              ),
          ]),
        ),
        Expanded(
          child: ListView(padding: const EdgeInsets.all(16), children: [
            if (error.isNotEmpty) ErrorBox('⚠️ $error'),
            if (step == 1) ...[
              const Text('Step 1 — Select Child & Visit Type', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              gap,
              if (loadingChildren)
                const LinearProgressIndicator()
              else
                Pick<String>(
                  label: '${t('selectChild', 'Select child')} *',
                  value: childId.isEmpty ? null : childId,
                  items: [for (final c in children) ('${c['_id']}', '${c['name']} (${c['ageInMonths'] ?? ageMonths(c['dob'])} months) — ${c['village'] ?? c['block'] ?? ''}')],
                  onChanged: (v) => setState(() => childId = v ?? ''),
                ),
              if (child != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(children: [
                      InfoRow('Gender', str(child!['gender'])),
                      InfoRow('Block', str(child!['block'])),
                      InfoRow('Guardian', str(child!['motherName'] ?? child!['fatherName'] ?? (child!['parentId'] is Map ? child!['parentId']['name'] : null))),
                      InfoRow('Village', str(child!['village'])),
                    ]),
                  ),
                ),
              gap,
              Text('${t('visitType', 'Visit type')} *', style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Wrap(spacing: 8, runSpacing: 8, children: [for (final v in _visitTypes) ChoiceChip(label: Text(v), selected: visitType == v, onSelected: (_) => setState(() => visitType = v))]),
            ],
            if (step == 2) ...[
              const Text('Step 2 — Measurements', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              gap,
              _num(weight, 'Weight', 'kg', 'e.g. 7.5', error: weightInvalid ? 'Max weight for ${child?['gender'] == 'female' ? 'girls' : 'boys'} is $maxWeight kg' : null),
              _num(height, 'Height', 'cm', 'e.g. 68.5'),
              _num(head, 'Head Circumference', 'cm', 'e.g. 42'),
              _num(temp, 'Temperature', '°F', 'e.g. 98.6'),
              _num(muac, 'MUAC', 'cm', 'e.g. 12.5'),
              if (wazStatus != null)
                NoticeBox(
                  '${wazStatus == 'healthy' ? '✅' : wazStatus == 'moderate' ? '⚠️' : '🚨'} AI Assessment: ${wazStatus == 'healthy' ? 'Normal Weight-for-Age' : wazStatus == 'moderate' ? 'Moderate Underweight' : 'Severe Underweight'}\n'
                  'WAZ Score: $waz | ${wazStatus == 'healthy' ? 'Child is growing well.' : wazStatus == 'moderate' ? 'Enhanced nutrition counselling recommended.' : 'Immediate PHC referral advised.'}',
                  tone: nutritionTone[wazStatus]!,
                ),
            ],
            if (step == 3) ...[
              const Text('Step 3 — Vaccines Given', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              Text('Select all vaccines given during this visit. (${vaccines.length} selected)', style: const TextStyle(color: C.muted)),
              gap,
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final v in _vaccines) FilterChip(label: Text(v), selected: vaccines.contains(v), onSelected: (s) => setState(() => s ? vaccines.add(v) : vaccines.remove(v))),
              ]),
              if (vaccines.isEmpty) const Padding(padding: EdgeInsets.only(top: 10), child: Text('No vaccines selected — skip this step if no vaccination was done today.', style: TextStyle(color: C.muted))),
            ],
            if (step == 4) ...[
              const Text('Step 4 — Notes, Outcome & Save', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              gap,
              TextField(controller: notes, maxLines: 4, decoration: InputDecoration(labelText: t('visitNotes', 'Visit notes'), hintText: "Describe child's condition, observations, counselling given, family concerns…")),
              gap,
              Text(t('visitOutcome', 'Visit outcome'), style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Wrap(spacing: 8, runSpacing: 8, children: [for (final (v, l) in _outcomes) ChoiceChip(label: Text(l), selected: outcome == v, onSelected: (_) => setState(() => outcome = v))]),
              gap,
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: referral,
                onChanged: (v) => setState(() => referral = v ?? false),
                title: Text('🏥 ${t('phcReferralNeeded', 'PHC referral needed')}'),
                subtitle: const Text('Check if this child needs to be referred to Primary Health Centre'),
              ),
              if (referral) ...[
                Pick<String>(label: 'Urgency', value: urgency, items: const [('routine', 'Routine'), ('urgent', 'Urgent'), ('emergency', 'Emergency — call 108')], onChanged: (v) => setState(() => urgency = v ?? 'urgent')),
                gap,
                TextField(controller: facility, maxLength: 200, decoration: const InputDecoration(labelText: 'Refer to (facility)', hintText: 'PHC / CHC / District Hospital')),
              ],
              DateField(label: '📅 Next visit / follow-up date (optional)', value: followUp, first: DateTime.now(), onChanged: (v) => setState(() => followUp = v)),
              gap,
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(children: [
                    InfoRow(t('visitType', 'Visit type'), visitType.isEmpty ? '—' : visitType),
                    InfoRow(t('weight', 'Weight'), weight.text.isEmpty ? '—' : '${weight.text} kg'),
                    InfoRow(t('height', 'Height'), height.text.isEmpty ? '—' : '${height.text} cm'),
                    InfoRow('MUAC', muac.text.isEmpty ? '—' : '${muac.text} cm'),
                    InfoRow(t('vaccination', 'Vaccination'), vaccines.isEmpty ? '—' : '${vaccines.length} selected'),
                    InfoRow(t('visitOutcome', 'Outcome'), outcome),
                  ]),
                ),
              ),
            ],
          ]),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Row(children: [
              if (step > 1) OutlinedButton(onPressed: () => setState(() => step--), child: Text('← ${t('back', 'Back')}')),
              const Spacer(),
              Text('Step $step / 4', style: const TextStyle(color: C.muted)),
              const Spacer(),
              if (step < 4)
                FilledButton(onPressed: step == 1 && (childId.isEmpty || visitType.isEmpty) ? null : () => setState(() => step++), child: Text('${t('next', 'Next')} →'))
              else
                FilledButton(onPressed: submitting ? null : submit, child: Text(submitting ? t('loading', 'Saving…') : '💾 Save visit')),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _num(TextEditingController c, String label, String unit, String hint, {String? error}) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
          controller: c,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(labelText: label, hintText: hint, suffixText: unit, errorText: error),
        ),
      );
}
