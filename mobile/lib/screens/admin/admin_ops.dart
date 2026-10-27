import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../asha/maternal.dart';
import '../asha/referrals_register.dart';
import '../asha/report_incentives.dart' show ClaimCard;
import 'admin_lists.dart';

/// New login details for an ASHA (after creating her or resetting her password),
/// with what the server could deliver and buttons to send them from the admin's own phone.
class CredentialsCard extends StatelessWidget {
  const CredentialsCard({super.key, required this.result, required this.title, this.onClose});
  final Map result;
  final String title;
  final VoidCallback? onClose;
  @override
  Widget build(BuildContext context) {
    final delivery = (result['delivery'] as Map?) ?? {};
    final phone = '${result['phone'] ?? ''}';
    final text = Uri.encodeComponent('${result['text'] ?? ''}');
    return Card(
      color: const Color(0xFFF0FDF4),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF15803D)))),
            if (onClose != null) IconButton(icon: const Icon(Icons.close), onPressed: onClose),
          ]),
          SelectableText('Username: ${result['username']}\nPassword: ${result['password']}', style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          for (final e in delivery.entries) Text('${e.value == 'sent' ? '✓' : '✕'} ${'${e.key}'.toUpperCase()}${e.value == 'sent' ? '' : ': ${e.value}'}', style: const TextStyle(fontSize: 12.5)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, children: [
            FilledButton.icon(style: FilledButton.styleFrom(backgroundColor: const Color(0xFF16A34A)), onPressed: () => openLink('https://wa.me/91$phone?text=$text'), icon: const Icon(Icons.chat, size: 18), label: const Text('WhatsApp')),
            OutlinedButton.icon(onPressed: () => openLink('sms:+91$phone?body=$text'), icon: const Icon(Icons.sms, size: 18), label: const Text('SMS')),
            OutlinedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: 'Username: ${result['username']}\nPassword: ${result['password']}'));
                toast(context, 'Copied');
              },
              icon: const Icon(Icons.copy, size: 18),
              label: const Text('Copy'),
            ),
          ]),
        ]),
      ),
    );
  }
}

// ── User management ────────────────────────────────────────────────────────
class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});
  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  String role = 'all', q = '';
  Map? reset;
  final _key = GlobalKey();

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/users',
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(children: [
              ChoiceRow(value: role, onChanged: (v) => setState(() => role = v), options: [for (final r in ['all', 'parent', 'asha', 'admin']) (r, r[0].toUpperCase() + r.substring(1))]),
              SearchField(onChanged: (v) => setState(() => q = v), hint: '${t('search', 'Search')}... (name, email, phone, ASHA ID)'),
              if (reset != null) CredentialsCard(result: reset!, title: 'New one-time password for ${reset!['name']}', onClose: () => setState(() => reset = null)),
            ]),
          ),
          Expanded(
            child: PagedList(
              key: _key,
              path: '/admin/users',
              query: {'role': role == 'all' ? null : role, 'q': q},
              header: (total) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('${t('userManagement', 'Users')} (${inr(total)})', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16))),
              itemBuilder: (context, u, reload) => Card(
                child: ListTile(
                  title: Row(children: [
                    Expanded(child: Text('${u['name']}', style: const TextStyle(fontWeight: FontWeight.w700))),
                    Badge2('${u['role']}', tone: u['role'] == 'admin' ? const Tone(Color(0xFF6B21A8), Color(0xFFF3E8FF)) : u['role'] == 'asha' ? infoTone : goodTone),
                  ]),
                  subtitle: Text('${u['email'] ?? ''}\n${u['phone'] ?? '—'} · ${fmtDate(u['createdAt'])} · ${u['isActive'] == true ? t('activate', 'Active') : t('suspend', 'Suspended')}'),
                  isThreeLine: true,
                  trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                    if (u['role'] == 'asha')
                      IconButton(
                        tooltip: 'Reset password',
                        icon: const Icon(Icons.key),
                        onPressed: () async {
                          if (!await confirm(context, 'Reset the password of ${u['name']}? They will be signed out and must set a new password.')) return;
                          try {
                            final data = await api.post('/admin/user/${u['_id']}/reset-password');
                            setState(() => reset = {...data as Map, 'name': u['name']});
                          } catch (e) {
                            if (context.mounted) toast(context, errText(e), error: true);
                          }
                        },
                      ),
                    Switch(
                      value: u['isActive'] == true,
                      onChanged: (_) async {
                        if (await runAction(context, () => api.put('/admin/user/${u['_id']}/toggle'))) reload();
                      },
                    ),
                  ]),
                ),
              ),
            ),
          ),
        ]),
      );
}

// ── Incentive claims (admin approves / rejects / marks paid) ───────────────
class AdminClaimsScreen extends StatefulWidget {
  const AdminClaimsScreen({super.key});
  @override
  State<AdminClaimsScreen> createState() => _AdminClaimsScreenState();
}

class _AdminClaimsScreenState extends State<AdminClaimsScreen> {
  String status = 'submitted';
  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/claims',
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: ChoiceRow(value: status, onChanged: (v) => setState(() => status = v), options: [('submitted', t('toReview', 'To review')), ('approved', t('claimApproved', 'Approved')), ('rejected', t('claimRejected', 'Rejected')), ('all', t('visitsAll', 'All'))]),
          ),
          Expanded(
            child: PagedList(
              path: '/incentives',
              limit: 50,
              query: {'status': status == 'all' ? null : status},
              itemBuilder: (context, c, reload) {
                final asha = c['ashaId'] is Map ? c['ashaId'] as Map : null;
                final user = asha?['userId'] is Map ? asha!['userId'] as Map : null;
                Future<void> act(String action, [String? note]) async {
                  if (await runAction(context, () => api.patch('/incentives/${c['_id']}', {'action': action, 'note': ?note}))) reload();
                }

                return ClaimCard(
                  c: c,
                  subtitle: 'ASHA: ${user?['name'] ?? asha?['ashaId'] ?? '—'}${user?['phone'] != null ? ' · ${user!['phone']}' : ''} · ${asha?['block'] ?? ''}',
                  actions: [
                    if (user?['phone'] != null) IconButton(icon: const Icon(Icons.call, color: C.primary), onPressed: () => callPhone(user!['phone'])),
                    if (c['status'] == 'submitted') ...[
                      TextButton(
                        style: TextButton.styleFrom(foregroundColor: C.red),
                        onPressed: () async {
                          final note = await askText(context, t('reject', 'Reject'), hint: t('rejectReason', 'Reason (the ASHA will see it)'), required: true);
                          if (note != null && note.isNotEmpty) await act('reject', note);
                        },
                        child: Text(t('reject', 'Reject')),
                      ),
                      FilledButton(style: FilledButton.styleFrom(backgroundColor: C.green), onPressed: () => act('approve'), child: Text('✓ ${t('approve', 'Approve')}')),
                    ],
                    if (c['status'] == 'approved') FilledButton(onPressed: () => act('paid'), child: Text(t('claimPaid', 'Mark paid'))),
                  ],
                );
              },
            ),
          ),
        ]),
      );
}

// ── Referrals (admin oversight) ────────────────────────────────────────────
class AdminReferralsScreen extends StatefulWidget {
  const AdminReferralsScreen({super.key, this.escalated = false});
  final bool escalated;
  @override
  State<AdminReferralsScreen> createState() => _AdminReferralsScreenState();
}

class _AdminReferralsScreenState extends State<AdminReferralsScreen> {
  late String tab = widget.escalated ? 'escalated' : 'open';
  static const tabs = {
    'escalated': ('escalated', {'escalated': 'true', 'status': 'pending,reached'}),
    'open': ('refOpen', {'status': 'pending,reached'}),
    'all': ('visitsAll', <String, String>{}),
  };

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/referrals',
        child: Column(children: [
          Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 0), child: ChoiceRow(value: tab, onChanged: (v) => setState(() => tab = v), options: [for (final e in tabs.entries) (e.key, t(e.value.$1))])),
          Expanded(
            child: PagedList(
              path: '/referrals',
              limit: 50,
              query: tabs[tab]!.$2,
              itemBuilder: (context, r, reload) => ReferralCard(
                r: r,
                admin: true,
                onUpdate: (body) async {
                  if (await runAction(context, () => api.patch('/referrals/${r['_id']}', body))) reload();
                },
              ),
            ),
          ),
        ]),
      );
}

// ── High-risk mothers ──────────────────────────────────────────────────────
class HighRiskMothersScreen extends StatefulWidget {
  const HighRiskMothersScreen({super.key});
  @override
  State<HighRiskMothersScreen> createState() => _HighRiskMothersScreenState();
}

class _HighRiskMothersScreenState extends State<HighRiskMothersScreen> {
  bool onlyHigh = true;
  String q = '';

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/admin/mothers',
        child: Loader<List>(
          // ponytail: one page of up to 500 pregnancies (as on the website); add paging when there are more
          load: () async => await api.get('/maternal', {'status': 'pregnant', 'limit': 500}) as List,
          builder: (context, rows, _) {
            final high = rows.where((p) => riskHigh(p).isNotEmpty).length;
            final query = q.toLowerCase();
            final shown = rows
                .where((p) => !onlyHigh || riskHigh(p).isNotEmpty)
                .where((p) => query.isEmpty || [p['womanName'], p['village'], p['ashaId']?['userId']?['name'], p['ashaId']?['ashaId']].any((v) => '${v ?? ''}'.toLowerCase().contains(query)))
                .toList()
              ..sort((a, b) {
                final r = riskHigh(b).length.compareTo(riskHigh(a).length);
                return r != 0 ? r : (parseDate(a['summary']?['edd']) ?? DateTime(3000)).compareTo(parseDate(b['summary']?['edd']) ?? DateTime(3000));
              });
            return ListView(padding: const EdgeInsets.all(16), children: [
              ChoiceRow(value: onlyHigh ? 'high' : 'all', onChanged: (v) => setState(() => onlyHigh = v == 'high'), options: [('high', '${t('highRisk', 'High risk')} ($high)'), ('all', '${t('pregnantWomen', 'Pregnant women')} (${rows.length})')]),
              TextField(onChanged: (v) => setState(() => q = v), decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: t('search', 'Search'))),
              gap,
              if (shown.isEmpty) Card(child: EmptyState(t('noRecords', 'No records'))),
              for (final p in shown)
                Builder(builder: (context) {
                  final s = (p['summary'] as Map?) ?? {};
                  final asha = p['ashaId'] is Map ? p['ashaId'] as Map : null;
                  final user = asha?['userId'] is Map ? asha!['userId'] as Map : null;
                  return Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: riskHigh(p).isNotEmpty ? C.red : C.border, width: 1.5)),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('${p['womanName']}${p['age'] != null ? ' · ${p['age']} ${t('years', 'years')}' : ''}', style: const TextStyle(fontWeight: FontWeight.w800)),
                              Text('${p['village'] ?? '—'} · ASHA: ${user?['name'] ?? asha?['ashaId'] ?? '—'}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
                            ]),
                          ),
                          if (user?['phone'] != null) IconButton(icon: const Icon(Icons.call, color: C.primary), onPressed: () => callPhone(user!['phone'])),
                        ]),
                        Text('${s['weeks']} ${t('weeks', 'weeks')} · ${t('edd', 'EDD')} ${fmtDate(s['edd'])}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        pregnancyChips(p),
                      ]),
                    ),
                  );
                }),
            ]);
          },
        ),
      );
}

// ── Add an ASHA worker ─────────────────────────────────────────────────────
class AddAshaWorkerScreen extends StatefulWidget {
  const AddAshaWorkerScreen({super.key});
  @override
  State<AddAshaWorkerScreen> createState() => _AddAshaWorkerScreenState();
}

class _AddAshaWorkerScreenState extends State<AddAshaWorkerScreen> {
  final c = {for (final k in ['name', 'email', 'phone', 'aadhar', 'block', 'village']) k: TextEditingController()};
  String dob = '', state = '', district = '', error = '';
  Map<String, List<String>> districts = {};
  Map? result;
  bool saving = false;

  @override
  void initState() {
    super.initState();
    rootBundle.loadString('assets/india_districts.json').then((s) => setState(() => districts = (jsonDecode(s)['districts'] as Map).map((k, v) => MapEntry('$k', List<String>.from(v)))));
  }

  Future<void> submit() async {
    final phone = c['phone']!.text.trim(), aadhar = c['aadhar']!.text.trim();
    if (c['name']!.text.trim().isEmpty || dob.isEmpty || c['email']!.text.trim().isEmpty || district.isEmpty || c['block']!.text.trim().isEmpty) return setState(() => error = 'Fill in all required fields.');
    if (!RegExp(r'^\d{10}$').hasMatch(phone)) return setState(() => error = '10-digit mobile number');
    if (aadhar.isNotEmpty && !RegExp(r'^\d{12}$').hasMatch(aadhar)) return setState(() => error = '12-digit Aadhaar number');
    setState(() {
      saving = true;
      error = '';
    });
    try {
      final data = await api.post('/admin/asha', {for (final e in c.entries) e.key: e.value.text.trim(), 'dob': dob, 'state': state, 'district': district});
      setState(() {
        result = data as Map;
        for (final x in c.values) {
          x.clear();
        }
        dob = state = district = '';
      });
    } catch (e) {
      setState(() => error = e is ApiException ? e.message : 'Failed to create ASHA worker');
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final adult = DateTime(DateTime.now().year - 18, DateTime.now().month, DateTime.now().day);
    return RoleShell(
      route: '/admin/asha-workers/new',
      title: '👩‍⚕️ Add ASHA Worker',
      child: ListView(padding: const EdgeInsets.all(16), children: [
        if (result != null) ...[
          CredentialsCard(result: result!, title: '✅ ASHA worker created — share these login details if any message failed'),
          Row(children: [
            FilledButton(onPressed: () => setState(() => result = null), child: const Text('+ Add another')),
            const SizedBox(width: 8),
            OutlinedButton(onPressed: () => Navigator.pushReplacementNamed(context, '/admin/asha-workers'), child: const Text('Done')),
          ]),
        ] else ...[
          if (error.isNotEmpty) ErrorBox(error),
          TextField(controller: c['name'], decoration: const InputDecoration(labelText: 'Full name *')),
          gap,
          DateField(label: 'Date of birth *', value: dob, first: DateTime(1940), last: adult, onChanged: (v) => setState(() => dob = v)),
          gap,
          TextField(controller: c['phone'], keyboardType: TextInputType.phone, maxLength: 10, decoration: const InputDecoration(labelText: 'Mobile number *')),
          TextField(controller: c['email'], keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email *')),
          gap,
          TextField(controller: c['aadhar'], keyboardType: TextInputType.number, maxLength: 12, decoration: const InputDecoration(labelText: 'Aadhaar number')),
          Pick<String>(label: 'State / UT', value: state.isEmpty ? null : state, items: [for (final s in districts.keys) (s, s)], onChanged: (v) => setState(() {
                state = v ?? '';
                district = '';
              })),
          gap,
          Pick<String>(key: ValueKey(state), label: 'District *', value: district.isEmpty ? null : district, items: [for (final d in districts[state] ?? const <String>[]) (d, d)], onChanged: state.isEmpty ? null : (v) => setState(() => district = v ?? '')),
          gap,
          TextField(controller: c['block'], decoration: const InputDecoration(labelText: 'Block *')),
          gap,
          TextField(controller: c['village'], decoration: const InputDecoration(labelText: 'Village')),
          gap,
          const Text('A username (ASHA ID) and a random one-time password are generated and sent to the worker by SMS, WhatsApp and email. She must set her own password at first login.', style: TextStyle(color: C.muted, fontSize: 12.5)),
          const SizedBox(height: 16),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: C.green), onPressed: saving ? null : submit, child: Text(saving ? 'Creating…' : 'Create ASHA Worker')),
        ],
      ]),
    );
  }
}
