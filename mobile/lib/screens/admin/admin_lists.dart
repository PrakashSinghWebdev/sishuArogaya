import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/files.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../parent/parent_more.dart';
import 'admin_dashboard.dart';

const _limit = 100;

/// Server-paged list with a pager under it; [query] changes reset to page 1.
class PagedList extends StatefulWidget {
  const PagedList({super.key, required this.path, required this.query, required this.itemBuilder, this.header, this.onTotals, this.limit = _limit});
  final String path;
  final Map<String, dynamic> query;
  final Widget Function(BuildContext context, Map row, VoidCallback reload) itemBuilder;
  final Widget Function(int total)? header;
  final void Function(Map<String, String> headers)? onTotals;
  final int limit;
  @override
  State<PagedList> createState() => _PagedListState();
}

class _PagedListState extends State<PagedList> {
  int page = 1;
  late Future<(List, int)> _future = _load();

  Future<(List, int)> _load() async {
    final (data, headers) = await api.getWithHeaders(widget.path, {...widget.query, 'page': page, 'limit': widget.limit});
    widget.onTotals?.call(headers);
    final rows = data is List ? data : const [];
    return (rows, int.tryParse(headers['x-total-count'] ?? '') ?? rows.length);
  }

  void reload() => setState(() { _future = _load(); });

  @override
  void didUpdateWidget(PagedList old) {
    super.didUpdateWidget(old);
    if ('${old.query}' != '${widget.query}') {
      page = 1;
      reload();
    }
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<(List, int)>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()));
          if (snap.hasError) return ListView(padding: const EdgeInsets.all(16), children: [ErrorBox('${snap.error}', onRetry: reload)]);
          final (rows, total) = snap.data!;
          return RefreshIndicator(
            onRefresh: () async => reload(),
            child: ListView(padding: const EdgeInsets.all(16), children: [
              if (widget.header != null) widget.header!(total),
              if (rows.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
              for (final r in rows) widget.itemBuilder(context, r, reload),
              Pager(page: page, limit: widget.limit, total: total, onPage: (p) {
                page = p;
                reload();
              }),
            ]),
          );
        },
      );
}

/// Search field with a short debounce.
class SearchField extends StatefulWidget {
  const SearchField({super.key, required this.onChanged, this.hint});
  final ValueChanged<String> onChanged;
  final String? hint;
  @override
  State<SearchField> createState() => _SearchFieldState();
}

class _SearchFieldState extends State<SearchField> {
  Timer? _t;
  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
        onChanged: (v) {
          _t?.cancel();
          _t = Timer(const Duration(milliseconds: 300), () => widget.onChanged(v.trim()));
        },
        decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: widget.hint ?? '${t('search', 'Search')}...'),
      );
}

// ── Children registry ──────────────────────────────────────────────────────
class ChildrenRegistryScreen extends StatefulWidget {
  const ChildrenRegistryScreen({super.key});
  @override
  State<ChildrenRegistryScreen> createState() => _ChildrenRegistryScreenState();
}

class _ChildrenRegistryScreenState extends State<ChildrenRegistryScreen> {
  String q = '', filter = 'all';
  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/children',
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(children: [
              SearchField(onChanged: (v) => setState(() => q = v)),
              const SizedBox(height: 8),
              ChoiceRow(value: filter, onChanged: (v) => setState(() => filter = v), options: [for (final s in ['all', 'healthy', 'moderate', 'severe']) (s, s == 'all' ? 'All' : t(s))]),
            ]),
          ),
          Expanded(
            child: PagedList(
              path: '/child',
              query: {'q': q, 'status': filter == 'all' ? null : filter},
              header: (total) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('${t('childrenRegistry', 'Children registry')} (${inr(total)})', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16))),
              itemBuilder: (context, c, _) => Card(
                child: ListTile(
                  title: Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text([
                    '${c['ageInMonths'] ?? '—'}mo · ${c['gender'] ?? ''}',
                    '${c['block'] ?? '—'}, ${c['district'] ?? '—'}',
                    '${c['currentWeight'] != null ? '${c['currentWeight']}kg' : '—'} · ${c['currentHeight'] != null ? '${c['currentHeight']}cm' : '—'}',
                    'Parent: ${c['parentId'] is Map ? c['parentId']['name'] : '—'}',
                  ].join('\n')),
                  isThreeLine: true,
                  trailing: StatusBadge(c['nutritionStatus']),
                ),
              ),
            ),
          ),
        ]),
      );
}

// ── Malnutrition cases ─────────────────────────────────────────────────────
class MalnutritionCasesScreen extends StatefulWidget {
  const MalnutritionCasesScreen({super.key});
  @override
  State<MalnutritionCasesScreen> createState() => _MalnutritionCasesScreenState();
}

class _MalnutritionCasesScreenState extends State<MalnutritionCasesScreen> {
  String filter = 'all';
  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/malnutrition',
        child: Column(children: [
          Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 0), child: ChoiceRow(value: filter, onChanged: (v) => setState(() => filter = v), options: [for (final s in ['all', 'moderate', 'severe']) (s, s == 'all' ? 'All' : t(s))])),
          Expanded(
            child: PagedList(
              path: '/admin/malnutrition',
              query: {'status': filter == 'all' ? null : filter},
              header: (total) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('${t('malnutritionCases', 'Malnutrition cases')} (${inr(total)})', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16))),
              itemBuilder: (context, c, _) => Card(
                color: c['nutritionStatus'] == 'severe' ? const Color(0xFFF8E3DD) : null,
                child: ListTile(
                  title: Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text([
                    '${c['ageInMonths'] ?? '—'}mo · ${c['block'] ?? '—'}, ${c['district'] ?? '—'}',
                    '${c['currentWeight'] != null ? '${c['currentWeight']}kg' : '—'} · ${c['currentHeight'] != null ? '${c['currentHeight']}cm' : '—'}',
                    'Parent: ${c['parentId'] is Map ? c['parentId']['name'] : '—'} · ASHA: ${c['ashaId'] is Map ? c['ashaId']['ashaId'] : '—'}',
                  ].join('\n')),
                  isThreeLine: true,
                  trailing: StatusBadge(c['nutritionStatus']),
                ),
              ),
            ),
          ),
        ]),
      );
}

// ── Vaccination data (due / overdue across the district) ───────────────────
class VaccinationDataScreen extends StatefulWidget {
  const VaccinationDataScreen({super.key});
  @override
  State<VaccinationDataScreen> createState() => _VaccinationDataScreenState();
}

class _VaccinationDataScreenState extends State<VaccinationDataScreen> {
  (int, int, int) counts = (0, 0, 0);
  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/vaccination-data',
        child: PagedList(
          path: '/vaccination/overdue',
          query: const {},
          onTotals: (h) => WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => counts = (int.tryParse(h['x-due-count'] ?? '') ?? 0, int.tryParse(h['x-missed-count'] ?? '') ?? 0, int.tryParse(h['x-total-count'] ?? '') ?? 0));
          }),
          header: (_) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(children: [
              for (final (label, v, color) in [('Due Now', counts.$1, C.red), (t('overdue', 'Overdue'), counts.$2, C.text), (t('pending', 'Pending'), counts.$3, C.red)])
                Expanded(child: Padding(padding: const EdgeInsets.only(right: 6), child: StatTile(label: label, value: inr(v), color: color))),
            ]),
          ),
          itemBuilder: (context, v, _) => Card(
            child: ListTile(
              title: Text('${v['childId'] is Map ? v['childId']['name'] : '—'} · ${v['vaccineName']}', style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('Due ${fmtDate(v['dueDate'])} · ${v['childId'] is Map ? '${v['childId']['block'] ?? '—'}, ${v['childId']['district'] ?? '—'}' : ''}'),
              trailing: Badge2('${v['status']}', tone: v['status'] == 'missed' ? badTone : warnTone),
            ),
          ),
        ),
      );
}

// ── Analytics ──────────────────────────────────────────────────────────────
class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});
  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/analytics',
        child: Loader<Map>(
          load: () async => await api.get('/admin/dashboard') as Map,
          builder: (context, s, _) {
            final blocks = (s['blockStats'] as List?) ?? [];
            return ListView(padding: const EdgeInsets.all(16), children: [
              const SectionTitle('Block-wise Health Overview'),
              Card(child: Padding(padding: const EdgeInsets.fromLTRB(8, 16, 16, 8), child: blocks.isEmpty ? EmptyState(t('noData', 'No data')) : BlockBarChart(blocks: blocks, height: 300))),
              if (blocks.isNotEmpty)
                Card(
                  child: Column(children: [
                    for (final b in blocks)
                      ListTile(dense: true, title: Text('${b['_id'] ?? 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.w600)), trailing: Text('${t('totalChildren', 'Total')}: ${b['total'] ?? 0} · M ${b['moderate'] ?? 0} · S ${b['severe'] ?? 0}')),
                  ]),
                ),
              const SectionTitle('KPI Summary'),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(children: [
                    InfoRow(t('totalChildren', 'Total children'), inr(s['totalChildren'] ?? 0)),
                    InfoRow('ASHA Workers', inr(s['totalAshaWorkers'] ?? 0)),
                    InfoRow(t('malnutrition', 'Malnutrition'), inr(s['malnutritionCases'] ?? 0)),
                    InfoRow('Missed Vaccines', inr(s['missedVaccinations'] ?? 0)),
                  ]),
                ),
              ),
            ]);
          },
        ),
      );
}

// ── Blockwise Excel reports ────────────────────────────────────────────────
class BlockReportsScreen extends StatelessWidget {
  const BlockReportsScreen({super.key});
  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/block-reports',
        child: Loader<Map>(
          load: () async => await api.get('/admin/dashboard') as Map,
          builder: (context, s, _) {
            final blocks = (s['blockStats'] as List?) ?? [];
            return ListView(padding: const EdgeInsets.all(16), children: [
              if (blocks.isEmpty) Card(child: EmptyState(t('noData', 'No data'))),
              for (final b in blocks)
                Card(
                  child: ListTile(
                    title: Text('${b['_id'] ?? 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Row(children: [
                      Text('${t('totalChildren', 'Total')}: ${b['total'] ?? 0}  '),
                      Badge2('${b['moderate'] ?? 0}', tone: warnTone),
                      const SizedBox(width: 6),
                      Badge2('${b['severe'] ?? 0}', tone: badTone),
                    ]),
                    trailing: IconButton.filledTonal(
                      tooltip: t('download', 'Download'),
                      icon: const Icon(Icons.download, color: C.green),
                      onPressed: () => downloadAndOpen(context, '/reports/district/${Uri.encodeComponent('${b['_id']}')}', '${b['_id']}-report.xlsx'),
                    ),
                  ),
                ),
            ]);
          },
        ),
      );
}

// ── Audit logs ─────────────────────────────────────────────────────────────
class AuditLogsScreen extends StatelessWidget {
  const AuditLogsScreen({super.key});
  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/audit-logs',
        child: PagedList(
          path: '/admin/audit-logs',
          query: const {},
          itemBuilder: (context, log, _) {
            final role = '${log['actorRole'] ?? ''}';
            final tone = role == 'admin' ? const Tone(Color(0xFF5E4B7D), Color(0xFFEEEAF3)) : role == 'asha' ? infoTone : role == 'parent' ? goodTone : neutralTone;
            return Card(
              child: ListTile(
                dense: true,
                title: Row(children: [
                  Expanded(child: Text('${log['actorName'] ?? (log['actorId'] is Map ? log['actorId']['name'] : 'System')}', style: const TextStyle(fontWeight: FontWeight.w700))),
                  Badge2(role.isEmpty ? '—' : role, tone: tone),
                ]),
                subtitle: Text('${log['action']} · ${log['entityType'] ?? ''}${log['entityId'] != null ? ' #${'${log['entityId']}'.substring(('${log['entityId']}').length.clamp(6, 999) - 6)}' : ''}\n${log['details'] ?? '—'}\n${fmtDateTime(log['createdAt'])}'),
                isThreeLine: true,
              ),
            );
          },
        ),
      );
}

// ── Send a notification to one user ────────────────────────────────────────
class NotificationsPanelScreen extends StatefulWidget {
  const NotificationsPanelScreen({super.key});
  @override
  State<NotificationsPanelScreen> createState() => _NotificationsPanelScreenState();
}

class _NotificationsPanelScreenState extends State<NotificationsPanelScreen> {
  static const types = ['vaccine_reminder', 'health_alert', 'visit_reminder', 'scheme_update', 'system'];
  List users = [];
  String? userId;
  String type = 'system';
  final message = TextEditingController();
  bool sending = false;

  @override
  void initState() {
    super.initState();
    search('');
  }

  Future<void> search(String q) async {
    final r = await api.get('/admin/users', {'q': q, 'limit': 50}).catchError((_) => []);
    if (mounted) setState(() => users = (r as List?) ?? []);
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/notifications',
        child: ListView(padding: const EdgeInsets.all(16), children: [
          const Text('Send Notification', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          gap,
          SearchField(onChanged: search, hint: 'Search by name, email or phone'),
          gap,
          Pick<String>(label: 'Target User *', value: userId, items: [for (final u in users) ('${u['_id']}', '${u['name']} (${u['role']})')], onChanged: (v) => setState(() => userId = v)),
          gap,
          Pick<String>(label: '${t('notifications', 'Notification')} type', value: type, items: [for (final x in types) (x, x.replaceAll('_', ' '))], onChanged: (v) => setState(() => type = v ?? 'system')),
          gap,
          TextField(controller: message, maxLines: 3, decoration: const InputDecoration(labelText: 'Message *', hintText: 'Enter notification message...')),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: sending
                ? null
                : () async {
                    if (userId == null || message.text.trim().isEmpty) return toast(context, 'Choose a user and write a message', error: true);
                    setState(() => sending = true);
                    final ok = await runAction(context, () => api.post('/notifications/send', {'userId': userId, 'message': message.text.trim(), 'type': type}), success: 'Notification sent!');
                    if (!mounted) return;
                    setState(() {
                      sending = false;
                      if (ok) {
                        userId = null;
                        message.clear();
                      }
                    });
                  },
            child: Text(sending ? '${t('loading', 'Sending')}...' : 'Send ${lang.plain('notifications', 'notification')}'),
          ),
        ]),
      );
}

// ── Government schemes (admin: list + add) ─────────────────────────────────
class AdminSchemesScreen extends StatelessWidget {
  const AdminSchemesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final loader = GlobalKey<LoaderState<List>>();
    return RoleShell(
      route: '/admin/schemes',
      fab: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('Add scheme'),
        onPressed: () async {
          final ok = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const _SchemeForm()));
          if (ok == true) loader.currentState?.reload();
        },
      ),
      child: Loader<List>(
        key: loader,
        load: () async => await api.get('/schemes') as List,
        builder: (context, schemes, _) => ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), children: [
          if (schemes.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
          for (final s in schemes) SchemeCard(scheme: s, trailing: Badge2(s['isActive'] == false ? 'Inactive' : 'Active', tone: s['isActive'] == false ? neutralTone : goodTone)),
        ]),
      ),
    );
  }
}

class _SchemeForm extends StatefulWidget {
  const _SchemeForm();
  @override
  State<_SchemeForm> createState() => _SchemeFormState();
}

class _SchemeFormState extends State<_SchemeForm> {
  final c = {for (final k in ['name', 'shortName', 'description', 'eligibilityCriteria', 'benefits', 'applyLink']) k: TextEditingController()};
  String category = 'nutrition';
  bool saving = false;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Add New Scheme')),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          TextField(controller: c['name'], decoration: const InputDecoration(labelText: 'Scheme Name *')),
          gap,
          TextField(controller: c['shortName'], decoration: const InputDecoration(labelText: 'Short Name', hintText: 'PMMVY')),
          gap,
          Pick<String>(label: 'Category', value: category, items: [for (final e in schemeCategoryLabel.entries) (e.key, e.value)], onChanged: (v) => setState(() => category = v ?? 'nutrition')),
          gap,
          TextField(controller: c['description'], maxLines: 3, decoration: const InputDecoration(labelText: 'Description *')),
          gap,
          TextField(controller: c['eligibilityCriteria'], maxLines: 2, decoration: const InputDecoration(labelText: 'Eligibility')),
          gap,
          TextField(controller: c['benefits'], maxLines: 2, decoration: const InputDecoration(labelText: 'Benefits')),
          gap,
          TextField(controller: c['applyLink'], keyboardType: TextInputType.url, decoration: const InputDecoration(labelText: 'Apply Link', hintText: 'https://...')),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: saving
                ? null
                : () async {
                    if (c['name']!.text.trim().isEmpty || c['description']!.text.trim().isEmpty) return toast(context, 'Name and description are required', error: true);
                    setState(() => saving = true);
                    final ok = await runAction(context, () => api.post('/schemes', {for (final e in c.entries) e.key: e.value.text.trim(), 'category': category}));
                    if (!context.mounted) return;
                    setState(() => saving = false);
                    if (ok) Navigator.pop(context, true);
                  },
            child: Text(saving ? 'Saving...' : 'Save Scheme'),
          ),
        ]),
      );
}
