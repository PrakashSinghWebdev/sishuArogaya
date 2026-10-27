import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/files.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import 'parent_common.dart';

class _Data {
  late Children children;
  List vaccines = [];
}

class VaccinationScheduleScreen extends StatefulWidget {
  const VaccinationScheduleScreen({super.key});
  @override
  State<VaccinationScheduleScreen> createState() => _VaccinationScheduleScreenState();
}

class _VaccinationScheduleScreenState extends State<VaccinationScheduleScreen> {
  String filter = 'all';
  String? updating;

  Future<_Data> load() async {
    final d = _Data()..children = await Children.load();
    final c = d.children.selected;
    if (c != null) d.vaccines = await api.get('/vaccination/${c['_id']}').catchError((_) => []) as List;
    return d;
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/parent/vaccination',
        child: Loader<_Data>(
          load: load,
          builder: (context, d, reload) {
            final child = d.children.selected;
            final v = d.vaccines;
            final done = v.where((x) => x['status'] == 'done' || x['status'] == 'completed').length;
            final due = v.where((x) => x['status'] == 'due').length;
            final upcoming = v.where((x) => x['status'] == 'upcoming').length;
            final pct = v.isEmpty ? 0 : (done / v.length * 100).round();
            final firstDue = v.where((x) => x['status'] == 'due').firstOrNull;
            final shown = filter == 'all' ? v : v.where((x) => x['status'] == filter).toList();
            final asha = child?['ashaId'] is Map ? child!['ashaId'] as Map : null;
            final ashaPhone = asha?['userId'] is Map ? asha!['userId']['phone'] : null;

            return ListView(padding: const EdgeInsets.all(16), children: [
              ChildPicker(children: d.children, onChanged: reload),
              if (child != null) Text('${child['name']}', style: const TextStyle(color: C.muted)),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(child: FilledButton.icon(onPressed: () => Navigator.pushReplacementNamed(context, '/parent/notifications'), icon: const Icon(Icons.event), label: const Text('Book Appointment'))),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: child == null ? null : () => downloadAndOpen(context, '/reports/child/${child['_id']}', 'vaccine-card-${child['name']}.pdf', {'type': 'vaccination'}),
                    icon: const Icon(Icons.badge_outlined),
                    label: const Text('Vaccine Card'),
                  ),
                ),
              ]),
              const SizedBox(height: 14),
              StatGrid([
                StatTile(icon: Icons.check_circle_outline, label: 'Completed', value: '$done', color: C.primary),
                StatTile(icon: Icons.alarm, label: 'Due Soon', value: '$due', color: C.amber),
                StatTile(icon: Icons.event_outlined, label: 'Upcoming', value: '$upcoming', color: const Color(0xFF16A34A)),
                StatTile(icon: Icons.vaccines_outlined, label: 'Coverage Rate', value: '$pct%', color: const Color(0xFF2563EB)),
              ]),
              const SizedBox(height: 14),
              if (firstDue != null)
                Card(
                  color: const Color(0xFFFEF3C7),
                  child: ListTile(
                    leading: const Text('⚠️', style: TextStyle(fontSize: 26)),
                    title: Text('${firstDue['vaccineName']} is due!', style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF92400E))),
                    subtitle: Text('Due date: ${fmtDate(firstDue['dueDate'])}', style: const TextStyle(color: Color(0xFFB45309))),
                  ),
                ),
              const SectionTitle('📋 Complete Vaccine Timeline'),
              ChoiceRow(
                value: filter,
                onChanged: (x) => setState(() => filter = x),
                options: const [('all', 'All'), ('done', 'Done'), ('due', 'Due'), ('upcoming', 'Upcoming'), ('missed', 'Missed')],
              ),
              if (v.isEmpty)
                const Card(child: EmptyState('No vaccination records found. This is normal for new child profiles.\nThe schedule fills in as your child grows. Mark vaccines as "Done" when given.', icon: Icons.vaccines_outlined))
              else if (shown.isEmpty)
                const Card(child: EmptyState('No vaccines match this filter.'))
              else
                for (final x in shown)
                  Card(
                    child: ListTile(
                      leading: VaccineBadge(x['status']),
                      title: Text('${x['vaccineName']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text([
                        x['givenDate'] != null ? 'Given: ${fmtDate(x['givenDate'])}' : 'Due: ${fmtDate(x['dueDate'])}',
                        if (x['centre'] != null) '${x['centre']}',
                        if (x['ageMonths'] != null) '${x['ageMonths']} mo',
                      ].join(' · ')),
                      trailing: x['status'] == 'done'
                          ? const Text('✓ Completed', style: TextStyle(color: C.green, fontWeight: FontWeight.w700, fontSize: 12))
                          : updating == x['_id']
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                              : TextButton(
                                  onPressed: () async {
                                    setState(() => updating = x['_id']);
                                    final ok = await runAction(context, () => api.put('/vaccination/parent-mark-done', {'vaccineId': x['_id']}));
                                    if (!mounted) return;
                                    setState(() {
                                      updating = null;
                                      if (ok) {
                                        x['status'] = 'done';
                                        x['givenDate'] = DateTime.now().toIso8601String();
                                      }
                                    });
                                  },
                                  child: const Text('Mark Done'),
                                ),
                    ),
                  ),
              const SizedBox(height: 10),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('🏥 Vaccination Centre', style: TextStyle(fontWeight: FontWeight.w700, color: C.dark, fontSize: 15)),
                    const SizedBox(height: 6),
                    InfoRow('🏛️ Centre Name', asha?['block'] != null ? 'PHC – ${asha!['block']}' : 'Primary Health Centre'),
                    InfoRow('📍 Address', [asha?['village'], asha?['block'], asha?['district']].where((e) => e != null).join(', ').ifEmpty('Block PHC, Main Road')),
                    const InfoRow('⏰ Timings', 'Mon–Sat: 9 AM – 1 PM'),
                    if (ashaPhone != null)
                      ListTile(contentPadding: EdgeInsets.zero, dense: true, leading: const Icon(Icons.call, color: C.primary), title: Text('ASHA Contact: $ashaPhone', style: const TextStyle(fontWeight: FontWeight.w700, color: C.primary)), onTap: () => callPhone(ashaPhone))
                    else
                      const InfoRow('📞 ASHA Contact', 'Contact your ASHA worker'),
                  ]),
                ),
              ),
              Card(
                color: C.bg,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('💡 After Vaccination Tips', style: TextStyle(fontWeight: FontWeight.w700, color: C.dark, fontSize: 15)),
                    const SizedBox(height: 6),
                    for (final tip in const [
                      'Mild fever is normal – give paracetamol if needed',
                      'Keep the injection site clean and dry',
                      'Monitor child for 30 minutes after vaccination',
                      'Comfort the child with breastfeeding or cuddles',
                    ])
                      Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Text('• $tip')),
                    const SizedBox(height: 6),
                    const NoticeBox('Emergency: Seek care if breathing difficulty or high fever persists', tone: badTone),
                  ]),
                ),
              ),
              Card(
                color: C.dark,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('COVERAGE PROGRESS', style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
                    Text('$pct%', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(value: pct / 100, color: Colors.white, backgroundColor: Colors.white24, minHeight: 8, borderRadius: BorderRadius.circular(4)),
                    const SizedBox(height: 8),
                    Text('$done/${v.length} vaccines done · Target: 100%', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  ]),
                ),
              ),
            ]);
          },
        ),
      );
}

extension on String {
  String ifEmpty(String fallback) => isEmpty ? fallback : this;
}
