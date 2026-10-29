import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/files.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../../widgets/growth.dart';
import 'parent_common.dart';

String _calcAge(dynamic dob) {
  final d = parseDate(dob);
  if (d == null) return '';
  final now = DateTime.now();
  final months = (now.year - d.year) * 12 + (now.month - d.month);
  return months < 24 ? '$months months' : '${months ~/ 12} years ${months % 12}m';
}

/// My Child: profile, ASHA worker, upcoming vaccines, feeding now, growth monitoring.
class ChildProfileScreen extends StatefulWidget {
  const ChildProfileScreen({super.key});
  @override
  State<ChildProfileScreen> createState() => _ChildProfileScreenState();
}

class _Data {
  late Children children;
  List vaccines = [];
  Map? plan;
}

class _ChildProfileScreenState extends State<ChildProfileScreen> {
  final _loader = GlobalKey<LoaderState<_Data>>();
  int growthVersion = 0;

  Future<_Data> load() async {
    final d = _Data()..children = await Children.load();
    final child = d.children.selected;
    if (child != null) {
      d.vaccines = await api.get('/vaccination/${child['_id']}').catchError((_) => []) as List;
      final diet = await DietData.load();
      final months = child['ageInMonths'] is num ? (child['ageInMonths'] as num).toInt() : ageMonths(child['dob']);
      final group = DietData.ageGroup(diet, months);
      d.plan = group == null ? null : diet['plans'][group['tag']];
    }
    return d;
  }

  Future<void> addChild() async {
    final added = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const AddChildScreen()));
    if (added == true) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/parent/child-profile',
        actions: [IconButton(tooltip: t('addChild', 'Add Child'), icon: const Icon(Icons.person_add_alt), onPressed: addChild)],
        child: Loader<_Data>(
          key: _loader,
          load: load,
          builder: (context, d, reload) {
            final child = d.children.selected;
            if (child == null) {
              return ListView(padding: const EdgeInsets.all(16), children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      glyph('👶', size: 56),
                      Text(t('noRecords', 'No records'), style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      Text('${t('addChild')} ${t('myChild').toLowerCase()} to start tracking ${t('growth').toLowerCase()}, ${t('vaccines').toLowerCase()}, and ${t('reports').toLowerCase()}.', textAlign: TextAlign.center, style: const TextStyle(color: C.muted)),
                      gap,
                      FilledButton.icon(onPressed: addChild, icon: const Icon(Icons.add), label: Text(t('addChild', 'Add Child'))),
                    ]),
                  ),
                ),
              ]);
            }
            final asha = child['ashaId'] is Map ? child['ashaId'] as Map : null;
            final ashaUser = asha?['userId'] is Map ? asha!['userId'] as Map : null;
            final done = d.vaccines.where((v) => v['status'] == 'done').length;
            final next = d.vaccines.where((v) => v['status'] != 'done').toList()
              ..sort((a, b) => (parseDate(a['dueDate']) ?? DateTime(3000)).compareTo(parseDate(b['dueDate']) ?? DateTime(3000)));
            final meals = (d.plan?['meals'] as List?) ?? [];
            final nowMeal = currentMealIndex(meals);
            final feedNow = meals.isEmpty
                ? []
                : nowMeal == -1
                    ? [meals.first]
                    : {meals[nowMeal], meals[(nowMeal + 1) % meals.length]}.toList();

            return ListView(padding: const EdgeInsets.all(16), children: [
              ChildPicker(children: d.children, onChanged: reload),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), gradient: const LinearGradient(colors: [C.dark, C.primary])),
                child: Row(children: [
                  const CircleAvatar(radius: 34, backgroundColor: Colors.white24, child: Icon(Icons.child_care_outlined, color: Colors.white, size: 36)),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('${child['name']}', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 6),
                      Wrap(spacing: 6, runSpacing: 6, children: [
                        for (final v in [_calcAge(child['dob']), child['gender'], child['bloodGroup']])
                          if (v != null && '$v'.isNotEmpty) Badge2('$v', tone: const Tone(Colors.white, Colors.white24)),
                      ]),
                    ]),
                  ),
                ]),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () async {
                      if (await showRecordGrowth(context, child)) {
                        if (!context.mounted) return;
                        toast(context, 'Growth record saved!');
                        setState(() => growthVersion++);
                        reload(); // recording growth updates the child's current weight / status
                      }
                    },
                    icon: const Icon(Icons.straighten),
                    label: const Text('Record Growth'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => downloadAndOpen(context, '/reports/child/${child['_id']}', '${child['name']}-health-report.pdf', {'type': 'comprehensive'}),
                    icon: const Icon(Icons.download),
                    label: Text(lang.plain('downloadReport', 'Download Report'), overflow: TextOverflow.ellipsis),
                  ),
                ),
              ]),
              const SizedBox(height: 14),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(t('childInfoTitle', 'Child Information'), style: const TextStyle(fontWeight: FontWeight.w700, color: C.dark, fontSize: 16)),
                    const SizedBox(height: 8),
                    InfoRow(t('dateOfBirth', 'Date of Birth'), fmtDate(child['dob'])),
                    InfoRow(t('age', 'Age'), _calcAge(child['dob'])),
                    InfoRow(t('gender', 'Gender'), str(child['gender'])),
                    InfoRow(t('bloodGroup', 'Blood Group'), str(child['bloodGroup'])),
                    InfoRow(t('address', 'Address'), str(child['location'] ?? child['village'])),
                    InfoRow("Mother's Name", str(child['motherName'])),
                    InfoRow("Father's Name", str(child['parentId'] is Map ? child['parentId']['name'] : child['fatherName'])),
                    InfoRow('Contact', str(child['contactPhone'])),
                  ]),
                ),
              ),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Assigned ASHA Worker', style: TextStyle(fontWeight: FontWeight.w700, color: C.dark, fontSize: 16)),
                    const SizedBox(height: 8),
                    if (asha != null)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const IconWell(Icons.health_and_safety_outlined),
                        title: Text('${ashaUser?['name'] ?? 'ASHA Worker'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text('ID: ${asha['ashaId']} · ${asha['block'] ?? ''}${asha['village'] != null ? ', ${asha['village']}' : ''}'),
                        trailing: ashaUser?['phone'] == null ? null : FilledButton.icon(onPressed: () => callPhone(ashaUser!['phone']), icon: const Icon(Icons.call, size: 16), label: const Text('Call')),
                      )
                    else
                      const NoticeBox('No ASHA Worker Assigned\nAn ASHA worker will be assigned by your health centre admin.', tone: Tone(Color(0xFFA4541E), Color(0xFFFBEFD9))),
                  ]),
                ),
              ),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      const Expanded(child: Text('Upcoming Vaccines', style: TextStyle(fontWeight: FontWeight.w700, color: C.dark, fontSize: 16))),
                      TextButton(onPressed: () => Navigator.pushReplacementNamed(context, '/parent/vaccination'), child: Text(d.vaccines.isEmpty ? 'View all →' : '$done/${d.vaccines.length} done →')),
                    ]),
                    if (next.isEmpty)
                      Text(d.vaccines.isNotEmpty ? 'All vaccines given' : 'No schedule yet.', style: const TextStyle(color: C.muted))
                    else
                      for (final v in next.take(4))
                        ListTile(dense: true, contentPadding: EdgeInsets.zero, title: Text('${v['vaccineName']}', style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(fmtDate(v['dueDate'])), trailing: VaccineBadge(v['status'])),
                  ]),
                ),
              ),
              if (feedNow.isNotEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        const Expanded(child: Text('Feeding Now', style: TextStyle(fontWeight: FontWeight.w700, color: C.dark, fontSize: 16))),
                        TextButton(onPressed: () => Navigator.pushReplacementNamed(context, '/parent/diet-plan'), child: const Text('Full plan →')),
                      ]),
                      for (var i = 0; i < feedNow.length; i++)
                        Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: i == 0 ? C.bg : Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: i == 0 ? C.primary : C.border)),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Expanded(child: Text('${feedNow[i]['icon'] ?? ''} ${feedNow[i]['name']}', style: const TextStyle(fontWeight: FontWeight.w600))),
                              Text(nowMeal == -1 ? '${feedNow[i]['time']}' : '${i == 0 ? 'Now' : 'Next'} · ${feedNow[i]['time']}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: C.dark)),
                            ]),
                            Text(mealItemsText(feedNow[i]), style: const TextStyle(fontSize: 12, color: C.muted)),
                          ]),
                        ),
                      for (final tip in ((d.plan?['tips'] as List?) ?? []).take(3)) Padding(padding: const EdgeInsets.only(top: 4), child: Text('• $tip', style: const TextStyle(fontSize: 12.5))),
                      if (((d.plan?['avoidFoods'] as List?) ?? []).isNotEmpty) ...[
                        const SizedBox(height: 10),
                        const Text('Avoid', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFB5452F), fontSize: 12)),
                        const SizedBox(height: 6),
                        Wrap(spacing: 6, runSpacing: 6, children: [for (final f in d.plan!['avoidFoods']) Badge2('$f', tone: badTone)]),
                      ],
                    ]),
                  ),
                ),
              const SizedBox(height: 8),
              GrowthSection(child: child, version: growthVersion),
            ]);
          },
        ),
      );
}

/// Register a new child (parent).
class AddChildScreen extends StatefulWidget {
  const AddChildScreen({super.key});
  @override
  State<AddChildScreen> createState() => _AddChildScreenState();
}

class _AddChildScreenState extends State<AddChildScreen> {
  final name = TextEditingController(), birthWeight = TextEditingController(), birthHeight = TextEditingController();
  final mother = TextEditingController(), phone = TextEditingController();
  String dob = '', gender = 'male', blood = 'Unknown', error = '';
  bool saving = false;

  Future<void> submit() async {
    if (name.text.trim().isEmpty || dob.isEmpty) return setState(() => error = 'Child name and date of birth are required.');
    setState(() {
      saving = true;
      error = '';
    });
    try {
      final data = await api.post('/child/add', {
        'name': name.text.trim(),
        'dob': dob,
        'gender': gender,
        'bloodGroup': blood,
        'birthWeight': birthWeight.text,
        'birthHeight': birthHeight.text,
        'motherName': mother.text.trim(),
        'fatherName': '',
        'contactPhone': phone.text.trim(),
      });
      final id = data is Map && data['child'] is Map ? data['child']['_id'] : null;
      if (id != null) await Children().select('$id');
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() {
        error = e is ApiException ? e.message : 'Failed to add child.';
        saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Register New Child')),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          if (error.isNotEmpty) ErrorBox(error),
          TextField(controller: name, decoration: const InputDecoration(labelText: 'Child Name *', hintText: 'Full name')),
          gap,
          DateField(label: 'Date of Birth *', value: dob, last: DateTime.now(), onChanged: (v) => setState(() => dob = v)),
          gap,
          Row(children: [
            Expanded(child: Pick<String>(label: 'Gender', value: gender, items: const [('male', 'Male'), ('female', 'Female')], onChanged: (v) => setState(() => gender = v ?? 'male'))),
            const SizedBox(width: 10),
            Expanded(child: Pick<String>(label: t('bloodGroup', 'Blood Group'), value: blood, items: [for (final g in ['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']) (g, g)], onChanged: (v) => setState(() => blood = v ?? 'Unknown'))),
          ]),
          gap,
          Row(children: [
            Expanded(child: TextField(controller: birthWeight, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Birth Weight (kg)', hintText: '3.2'))),
            const SizedBox(width: 10),
            Expanded(child: TextField(controller: birthHeight, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Birth Height (cm)', hintText: '50'))),
          ]),
          gap,
          TextField(controller: mother, decoration: const InputDecoration(labelText: "Mother's Name")),
          gap,
          TextField(controller: phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Contact Phone', hintText: '10-digit mobile')),
          const SizedBox(height: 18),
          FilledButton(onPressed: saving ? null : submit, child: Text(saving ? '${t('loading', 'Loading')}...' : '✓ ${t('addChild', 'Add Child')}')),
        ]),
      );
}
