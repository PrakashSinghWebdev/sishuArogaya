import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import 'admin_lists.dart';

// ── ASHA workers and child assignment ──────────────────────────────────────
class AshaWorkersScreen extends StatelessWidget {
  const AshaWorkersScreen({super.key});

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/asha-workers',
        fab: FloatingActionButton.extended(onPressed: () => Navigator.pushNamed(context, '/admin/asha-workers/new'), icon: const Icon(Icons.person_add_alt), label: const Text('Add ASHA Worker')),
        child: Loader<List>(
          load: () async => await api.get('/asha/workers') as List,
          builder: (context, workers, reload) => ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
            if (workers.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
            for (final w in workers)
              Card(
                child: ListTile(
                  title: Row(children: [
                    Expanded(child: Text('${w['userId'] is Map ? w['userId']['name'] : '—'}', style: const TextStyle(fontWeight: FontWeight.w700))),
                    Badge2(w['isActive'] == true ? 'Active' : 'Suspended', tone: w['isActive'] == true ? goodTone : neutralTone),
                  ]),
                  subtitle: Text([
                    '${w['ashaId']}${w['userId'] is Map && w['userId']['username'] != null && w['userId']['username'] != w['ashaId'] ? ' · Login: ${w['userId']['username']}' : ''}',
                    '${w['district'] ?? ''} / ${w['block'] ?? ''}',
                    '👶 ${w['assignedCount'] ?? (w['assignedChildren'] as List?)?.length ?? 0} children · ✅ ${w['totalVisits'] ?? 0} visits',
                  ].join('\n')),
                  isThreeLine: true,
                  trailing: const Icon(Icons.settings_outlined),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _AssignChildren(worker: w))).then((_) => reload()),
                ),
              ),
          ]),
        ),
      );
}

class _AssignChildren extends StatefulWidget {
  const _AssignChildren({required this.worker});
  final Map worker;
  @override
  State<_AssignChildren> createState() => _AssignChildrenState();
}

class _AssignChildrenState extends State<_AssignChildren> {
  List assigned = [], available = [];
  int availableTotal = 0;
  String q = '';
  String? busy;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  // Only this worker's children and a searchable page of unassigned ones (the registry can be huge)
  Future<void> load() async {
    final r = await Future.wait([
      api.get('/child', {'ashaWorker': widget.worker['_id'], 'limit': 500}).catchError((_) => []),
      api.page('/child', {'unassigned': 'true', 'q': q, 'limit': 50}).catchError((_) => Paged([], 0)),
    ]);
    if (!mounted) return;
    setState(() {
      assigned = (r[0] as List?) ?? [];
      available = (r[1] as Paged).rows;
      availableTotal = (r[1] as Paged).total;
    });
  }

  Future<void> change(String childId, bool assign) async {
    setState(() => busy = childId);
    await runAction(context, () => api.post(assign ? '/asha/assign' : '/asha/unassign', {'childId': childId, if (assign) 'ashaWorkerId': widget.worker['_id']}), success: assign ? 'Child assigned successfully' : 'Child unassigned successfully');
    await load();
    if (mounted) setState(() => busy = null);
  }

  Widget _child(Map c, bool isAssigned) => ListTile(
        dense: true,
        title: Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${c['ageInMonths'] ?? '—'} mo · ${c['gender'] ?? ''} · ${c['village'] ?? c['block'] ?? '—'}${!isAssigned && c['parentId'] is Map ? ' · ${c['parentId']['name']}' : ''}'),
        leading: StatusBadge(c['nutritionStatus']),
        trailing: busy == c['_id']
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : isAssigned
                ? TextButton(style: TextButton.styleFrom(foregroundColor: C.red), onPressed: () => change(c['_id'], false), child: const Text('✕ Remove'))
                : FilledButton(onPressed: () => change(c['_id'], true), child: const Text('+ Assign')),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text('Assign children — ${widget.worker['userId'] is Map ? widget.worker['userId']['name'] : ''} (${widget.worker['ashaId']})', overflow: TextOverflow.ellipsis)),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          SectionTitle('👥 Currently Assigned (${assigned.length})'),
          Card(child: assigned.isEmpty ? const EmptyState('No children assigned yet.') : Column(children: [for (final c in assigned) _child(c, true)])),
          const SectionTitle('🔎 Find Unassigned Children'),
          TextField(
            onChanged: (v) {
              _debounce?.cancel();
              _debounce = Timer(const Duration(milliseconds: 300), () {
                q = v.trim();
                load();
              });
            },
            decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: '${t('search', 'Search')} name, village...'),
          ),
          gap,
          Card(child: available.isEmpty ? EmptyState(q.isNotEmpty ? 'No matching unassigned children.' : 'All children are currently assigned to an ASHA worker.') : Column(children: [for (final c in available) _child(c, false)])),
          if (availableTotal > available.length) Text('Showing ${available.length} of ${inr(availableTotal)}. Use the search bar to narrow down.', style: const TextStyle(color: C.muted, fontSize: 12.5)),
        ]),
      );
}

// ── District risk by block ─────────────────────────────────────────────────
class DistrictHeatmapScreen extends StatelessWidget {
  const DistrictHeatmapScreen({super.key});

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/heatmap',
        child: Loader<List>(
          load: () async => await api.get('/admin/heatmap') as List,
          builder: (context, blocks, _) {
            (String, Tone) risk(Map b) {
              final total = ((b['total'] ?? 0) as num), atRisk = ((b['severe'] ?? 0) as num) + ((b['moderate'] ?? 0) as num);
              final weighted = (((b['severe'] ?? 0) as num) + ((b['moderate'] ?? 0) as num) * 0.5) / (total == 0 ? 1 : total);
              final pct = total == 0 ? 0 : (atRisk / total * 100).round();
              final tone = weighted > .3 ? badTone : weighted > .1 ? warnTone : goodTone;
              return ('$pct%', tone);
            }

            final sorted = [...blocks]..sort((a, b) {
                num w(Map x) => (((x['severe'] ?? 0) as num) + ((x['moderate'] ?? 0) as num) * 0.5) / (((x['total'] ?? 0) as num) == 0 ? 1 : (x['total'] as num));
                return w(b).compareTo(w(a));
              });
            return ListView(padding: const EdgeInsets.all(16), children: [
              const Wrap(spacing: 8, runSpacing: 6, children: [
                Badge2('Healthy (<10% at risk)', tone: goodTone),
                Badge2('At Risk (10–30%)', tone: warnTone),
                Badge2('Critical (>30% at risk)', tone: badTone),
              ]),
              gap,
              if (sorted.isEmpty) Card(child: EmptyState(t('noData', 'No data'))),
              for (final b in sorted)
                Builder(builder: (context) {
                  final (pct, tone) = risk(b);
                  final id = b['_id'] is Map ? b['_id'] as Map : {};
                  return Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: tone.fg.withValues(alpha: .6), width: 1.5)),
                    child: ListTile(
                      leading: CircleAvatar(backgroundColor: tone.bg, child: Text(pct, style: TextStyle(color: tone.fg, fontWeight: FontWeight.w800, fontSize: 12))),
                      title: Text('${id['block'] ?? 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text('District: ${id['district'] ?? 'Unknown'} · ${t('totalChildren', 'Total')}: ${b['total'] ?? 0}'),
                      trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Badge2('M ${b['moderate'] ?? 0}', tone: warnTone),
                        const SizedBox(height: 4),
                        Badge2('S ${b['severe'] ?? 0}', tone: badTone),
                      ]),
                    ),
                  );
                }),
            ]);
          },
        ),
      );
}

// ── Health centre directory ────────────────────────────────────────────────
class HealthCentresScreen extends StatefulWidget {
  const HealthCentresScreen({super.key});
  @override
  State<HealthCentresScreen> createState() => _HealthCentresScreenState();
}

class _HealthCentresScreenState extends State<HealthCentresScreen> {
  String district = '', state = '', type = 'all';
  bool emergency = false;
  int version = 0;

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/health-centres',
        child: ListView(padding: const EdgeInsets.all(16), children: [
          SearchField(hint: 'Search district', onChanged: (v) => setState(() => district = v)),
          const SizedBox(height: 8),
          SearchField(hint: 'Search state', onChanged: (v) => setState(() => state = v)),
          const SizedBox(height: 8),
          ChoiceRow(value: type, onChanged: (v) => setState(() => type = v), options: const [('all', 'All Types'), ('hospital', 'Hospitals'), ('health_post', 'PHC / CHC'), ('clinic', 'Clinics'), ('ambulance_station', 'Ambulance Stations')]),
          CheckboxListTile(contentPadding: EdgeInsets.zero, value: emergency, onChanged: (v) => setState(() => emergency = v ?? false), title: const Text('Show emergency-ready centres only')),
          FutureBuilder(
            key: ValueKey('$district|$state|$type|$emergency'),
            future: api.get('/hospitals', {'district': district, 'state': state, 'type': type, 'emergency': emergency ? 'true' : null}),
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) return const Padding(padding: EdgeInsets.all(30), child: Center(child: CircularProgressIndicator()));
              if (snap.hasError) return ErrorBox('${snap.error}');
              final data = snap.data as Map? ?? {};
              final centres = (data['hospitals'] as List?) ?? [];
              final stats = data['stats'] as Map? ?? {
                'total': centres.length,
                'emergency': centres.where((c) => c['hasEmergency'] == true).length,
                'government': centres.where((c) => c['isGovernment'] == true).length,
                'icu': centres.where((c) => c['hasICU'] == true).length,
              };
              return Column(children: [
                StatGrid([
                  StatTile(label: 'Total Centres', value: inr(stats['total'] ?? 0), color: C.primary),
                  StatTile(label: 'Emergency Ready', value: inr(stats['emergency'] ?? 0), color: C.red),
                  StatTile(label: 'Government', value: inr(stats['government'] ?? 0), color: C.green),
                  StatTile(label: 'ICU Support', value: inr(stats['icu'] ?? 0), color: const Color(0xFF7C3AED)),
                ]),
                gap,
                if (centres.isEmpty) const Card(child: EmptyState('No health centres found for the selected filters.')),
                for (final c in centres)
                  Card(
                    child: ListTile(
                      title: Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${c['address'] ?? 'Address unavailable'}\n${'${c['type'] ?? ''}'.split('_').map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1)).join(' ')} · ${c['district'] ?? '—'}, ${c['state'] ?? '—'}'),
                        const SizedBox(height: 4),
                        Wrap(spacing: 4, runSpacing: 4, children: [
                          Badge2(c['isGovernment'] == true ? 'Govt' : 'Private', tone: c['isGovernment'] == true ? goodTone : neutralTone),
                          if (c['hasEmergency'] == true) const Badge2('Emergency', tone: badTone),
                          if (c['hasICU'] == true) const Badge2('ICU', tone: Tone(Colors.white, C.text)),
                          Badge2(c['isActive'] == false ? 'Inactive' : 'Active', tone: c['isActive'] == false ? neutralTone : goodTone),
                        ]),
                      ]),
                      trailing: c['phone'] == null ? null : IconButton(icon: const Icon(Icons.call, color: C.primary), onPressed: () => callPhone(c['phone'])),
                    ),
                  ),
              ]);
            },
          ),
        ]),
      );
}
