import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/auth.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';

/// Pick a date and time (both in the future when [future] is set). Returns null if cancelled.
Future<DateTime?> pickDateTime(BuildContext context, {DateTime? initial, bool future = false}) async {
  final now = DateTime.now();
  final date = await showDatePicker(context: context, initialDate: initial ?? now, firstDate: future ? DateTime(now.year, now.month, now.day) : DateTime(now.year - 5), lastDate: DateTime(now.year + 3));
  if (date == null || !context.mounted) return null;
  final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(initial ?? now.add(const Duration(hours: 1))));
  if (time == null) return null;
  return DateTime(date.year, date.month, date.day, time.hour, time.minute);
}

// ── Messages (admin ↔ ASHA; parents write to support) ─────────────────────
const _kindStyle = {
  'instruction': ('📋', Color(0xFFE6F0EA), Color(0xFF1B4332)),
  'announcement': ('📢', Color(0xFFE5ECF2), Color(0xFF35556E)),
  'training': ('🎓', Color(0xFFE3F1E8), Color(0xFF276749)),
  'meeting': ('📅', Color(0xFFFBEFD9), Color(0xFF8A5A12)),
  'correction': ('✏️', Color(0xFFF8E3DD), Color(0xFF9B3A26)),
  'query': ('❓', Color(0xFFEFECE6), Color(0xFF55605B)),
};
const _senderKinds = ['instruction', 'announcement', 'training', 'meeting', 'correction'];

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key, required this.route});
  final String route;
  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  late String tab = widget.route.endsWith('/notifications') ? 'alerts' : 'inbox';
  final _loader = GlobalKey<LoaderState<List>>();
  bool get fixedRecipient => auth.role == 'asha' || auth.role == 'parent';

  Future<List> load() async => tab == 'alerts' ? await api.get('/notifications') as List : await api.get('/messages', {'box': tab}) as List;

  Future<void> compose() async {
    final sent = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => _Compose(fixedRecipient: fixedRecipient)));
    if (sent == true && mounted) {
      toast(context, t('messageSent', 'Message sent'));
      setState(() => tab = 'sent');
      _loader.currentState?.reload();
    }
  }

  @override
  Widget build(BuildContext context) => RoleShell(
        route: widget.route,
        fab: FloatingActionButton.extended(
          onPressed: compose,
          icon: const Icon(Icons.edit_outlined),
          label: Text(auth.role == 'parent' ? t('contactSupport', 'Contact support') : fixedRecipient ? t('messageSupervisor', 'Message admin') : t('newMessage', 'New message')),
        ),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: ChoiceRow(
              value: tab,
              onChanged: (v) => setState(() {
                tab = v;
                _loader.currentState?.reload();
              }),
              options: [('inbox', t('inbox', 'Inbox')), ('sent', t('sentBox', 'Sent')), ('alerts', t('alertsTab', 'Alerts'))],
            ),
          ),
          Expanded(
            child: Loader<List>(
              key: _loader,
              load: load,
              builder: (context, rows, reload) {
                if (rows.isEmpty) return ListView(children: [EmptyState(t('noRecords', 'No records'))]);
                if (tab == 'alerts') {
                  return ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 90), children: [
                    for (final n in rows)
                      Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: n['type'] == 'health_alert' ? C.red : C.primary)),
                        child: ListTile(title: Text('${n['message']}'), subtitle: Text(fmtDateTime(n['createdAt']))),
                      ),
                  ]);
                }
                return ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 90), children: [for (final m in rows) _MessageCard(m: m, sent: tab == 'sent', onChanged: reload)]);
              },
            ),
          ),
        ]),
      );
}

class _MessageCard extends StatefulWidget {
  const _MessageCard({required this.m, required this.sent, required this.onChanged});
  final Map m;
  final bool sent;
  final VoidCallback onChanged;
  @override
  State<_MessageCard> createState() => _MessageCardState();
}

class _MessageCardState extends State<_MessageCard> {
  final reply = TextEditingController();
  bool busy = false;

  @override
  Widget build(BuildContext context) {
    final m = widget.m;
    final (icon, bg, fg) = _kindStyle[m['kind']] ?? _kindStyle['instruction']!;
    final replies = (m['replies'] as List?) ?? [];
    final to = (m['to'] as List?) ?? [];
    final canResolve = m['resolvedAt'] == null && ['correction', 'query'].contains(m['kind']);
    final meta = widget.sent
        ? '${t('toLabel', 'To')}: ${(m['recipientCount'] ?? 0) > 1 ? '${m['recipientCount']} ${t('people', 'people')}' : (to.isNotEmpty && to.first is Map ? to.first['name'] : '—')} · ${t('readBy', 'Read by')} ${m['readCount'] ?? 0}/${m['recipientCount'] ?? 0}'
        : '${t('fromLabel', 'From')}: ${m['from'] is Map ? m['from']['name'] : '—'}';
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: fg.withValues(alpha: .5))),
      child: ExpansionTile(
        shape: const Border(),
        onExpansionChanged: (open) {
          if (open && m['unread'] == true) {
            api.post('/messages/${m['_id']}/read').then((_) => setState(() => m['unread'] = false)).catchError((_) {});
          }
        },
        title: Row(children: [
          Expanded(child: Text('${m['subject']}', style: TextStyle(fontWeight: m['unread'] == true ? FontWeight.w800 : FontWeight.w600))),
          if (m['unread'] == true) Badge2(t('newBadge', 'New'), tone: const Tone(Colors.white, C.red)),
        ]),
        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('$meta · ${fmtDateTime(m['createdAt'])}${replies.isNotEmpty ? ' · ${replies.length} ${replies.length == 1 ? 'reply' : 'replies'}' : ''}', style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 4),
          Wrap(spacing: 6, children: [
            Badge2(t('kind_${m['kind']}', '${m['kind']}'), tone: Tone(fg, bg)),
            if (m['resolvedAt'] != null) Badge2('✓ ${t('done', 'Done')}', tone: goodTone),
          ]),
        ]),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (m['meetingAt'] != null) Text(fmtDateTime(m['meetingAt']), style: const TextStyle(fontWeight: FontWeight.w600)),
          if (m['related'] is Map && m['related']['label'] != null) Text('${m['related']['label']}'),
          if (m['body'] != null && '${m['body']}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text('${m['body']}')),
          for (final r in replies)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(top: 6),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: C.bg, borderRadius: BorderRadius.circular(8)),
              child: Text.rich(TextSpan(children: [
                TextSpan(text: '${r['by'] is Map ? r['by']['name'] : '—'} ', style: const TextStyle(fontWeight: FontWeight.w700)),
                TextSpan(text: fmtDateTime(r['at']), style: const TextStyle(color: C.muted, fontSize: 12)),
                TextSpan(text: '\n${r['text']}'),
              ])),
            ),
          const SizedBox(height: 8),
          TextField(controller: reply, maxLength: 2000, minLines: 1, maxLines: 3, onChanged: (_) => setState(() {}), decoration: InputDecoration(hintText: t('writeReply', 'Write a reply'))),
          Row(children: [
            FilledButton(
              onPressed: busy || reply.text.trim().isEmpty
                  ? null
                  : () async {
                      setState(() => busy = true);
                      if (await runAction(context, () => api.post('/messages/${m['_id']}/reply', {'text': reply.text.trim()}))) {
                        reply.clear();
                        widget.onChanged();
                      }
                      if (mounted) setState(() => busy = false);
                    },
              child: Text(t('send', 'Send')),
            ),
            const SizedBox(width: 8),
            if (canResolve)
              OutlinedButton(
                onPressed: busy
                    ? null
                    : () async {
                        setState(() => busy = true);
                        if (await runAction(context, () => api.post('/messages/${m['_id']}/resolve', {'note': reply.text.trim()}))) widget.onChanged();
                        if (mounted) setState(() => busy = false);
                      },
                child: Text('✓ ${t('markDone', 'Mark done')}'),
              ),
          ]),
        ],
      ),
    );
  }
}

class _Compose extends StatefulWidget {
  const _Compose({required this.fixedRecipient});
  final bool fixedRecipient;
  @override
  State<_Compose> createState() => _ComposeState();
}

class _ComposeState extends State<_Compose> {
  final subject = TextEditingController(), body = TextEditingController();
  String to = 'all', kind = 'instruction';
  final picked = <String>{};
  DateTime? meetingAt;
  List recipients = [];
  bool busy = false;

  @override
  void initState() {
    super.initState();
    if (!widget.fixedRecipient) {
      api.get('/messages/recipients').then((r) {
        if (mounted) setState(() => recipients = r as List);
      }).catchError((_) {});
    }
  }

  Future<void> send() async {
    if (subject.text.trim().isEmpty) return toast(context, 'Subject is required', error: true);
    if (!widget.fixedRecipient && to != 'all' && picked.isEmpty) return toast(context, t('chooseRecipients', 'Choose recipients'), error: true);
    setState(() => busy = true);
    final ok = await runAction(context, () => api.post('/messages', {
          'kind': kind,
          'subject': subject.text.trim(),
          'body': body.text.trim(),
          if (meetingAt != null) 'meetingAt': meetingAt!.toUtc().toIso8601String(),
          'to': to == 'all' ? 'all' : picked.toList(),
        }));
    if (!mounted) return;
    setState(() => busy = false);
    if (ok) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(auth.role == 'parent' ? t('contactSupport', 'Contact support') : widget.fixedRecipient ? t('messageSupervisor', 'Message admin') : t('newMessage', 'New message'))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          if (!widget.fixedRecipient) ...[
            Text(t('sendTo', 'Send to'), style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'all', label: Text('${t('allMyAshas', 'All ASHAs')} (${recipients.length})')),
                ButtonSegment(value: 'some', label: Text(t('chooseAshas', 'Choose ASHAs'))),
              ],
              selected: {to},
              onSelectionChanged: (s) => setState(() => to = s.first),
            ),
            if (to == 'some')
              Card(
                child: Column(children: [
                  if (recipients.isEmpty) Padding(padding: const EdgeInsets.all(12), child: Text(t('noRecords', 'No records'))),
                  for (final r in recipients)
                    CheckboxListTile(
                      dense: true,
                      value: picked.contains(r['_id']),
                      onChanged: (_) => setState(() => picked.contains(r['_id']) ? picked.remove(r['_id']) : picked.add(r['_id'])),
                      title: Text('${r['name']} ${r['username'] != null ? '(${r['username']})' : ''}'),
                      subtitle: r['block'] == null ? null : Text('${r['block']}'),
                    ),
                ]),
              ),
            gap,
            Pick<String>(label: t('messageType', 'Type'), value: kind, items: [for (final k in _senderKinds) (k, t('kind_$k', k))], onChanged: (v) => setState(() => kind = v ?? 'instruction')),
            if (kind == 'meeting' || kind == 'training') ...[
              gap,
              OutlinedButton.icon(
                onPressed: () async {
                  final d = await pickDateTime(context, initial: meetingAt, future: true);
                  if (d != null) setState(() => meetingAt = d);
                },
                icon: const Icon(Icons.event),
                label: Text(meetingAt == null ? t('meetingWhen', 'When?') : fmtDateTime(meetingAt!.toIso8601String())),
              ),
            ],
            gap,
          ],
          TextField(controller: subject, maxLength: 150, decoration: InputDecoration(labelText: t('subject', 'Subject'))),
          TextField(controller: body, maxLength: 3000, maxLines: 5, decoration: InputDecoration(labelText: t('messageBody', 'Message'))),
          gap,
          FilledButton(onPressed: busy ? null : send, child: Text(busy ? '…' : t('send', 'Send'))),
        ]),
      );
}

// ── Health camps / immunisation sessions ───────────────────────────────────
const _campKinds = {
  'immunisation': ('💉', 'campImmunisation'),
  'health': ('🩺', 'campHealth'),
  'nutrition': ('🥗', 'campNutrition'),
  'awareness': ('📢', 'campAwareness'),
  'other': ('📅', 'campOther'),
};
const _campStatus = {'scheduled': Tone(Color(0xFF3B6E8F), Color(0xFFE5ECF2)), 'completed': Tone(Color(0xFF276749), Color(0xFFE3F1E8)), 'cancelled': Tone(Color(0xFF66706B), Color(0xFFEFECE6))};

class CampsScreen extends StatefulWidget {
  const CampsScreen({super.key, required this.route});
  final String route;
  @override
  State<CampsScreen> createState() => _CampsScreenState();
}

class _CampsScreenState extends State<CampsScreen> {
  String when = 'upcoming';
  final _loader = GlobalKey<LoaderState<List>>();

  bool canChange(Map c) => auth.role == 'admin' || (c['createdBy'] is Map && '${c['createdBy']['_id']}' == auth.id);

  @override
  Widget build(BuildContext context) => RoleShell(
        route: widget.route,
        fab: FloatingActionButton.extended(
          icon: const Icon(Icons.add),
          label: Text(t('scheduleCamp', 'Schedule camp')),
          onPressed: () async {
            final msg = await Navigator.push<String>(context, MaterialPageRoute(builder: (_) => const _CampForm()));
            if (msg != null && context.mounted) {
              toast(context, msg);
              setState(() => when = 'upcoming');
              _loader.currentState?.reload();
            }
          },
        ),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: ChoiceRow(
              value: when,
              onChanged: (v) => setState(() {
                when = v;
                _loader.currentState?.reload();
              }),
              options: [('upcoming', t('upcoming', 'Upcoming')), ('past', t('pastCamps', 'Past'))],
            ),
          ),
          Expanded(
            child: Loader<List>(
              key: _loader,
              load: () async => await api.get('/camps', {'when': when}) as List,
              builder: (context, camps, reload) => camps.isEmpty
                  ? ListView(children: [EmptyState(t('noCampScheduled', 'No camps scheduled.'))])
                  : ListView(padding: const EdgeInsets.fromLTRB(16, 0, 16, 90), children: [
                      for (final c in camps)
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Expanded(child: Text('${c['title']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
                                Badge2(t('camp_${c['status']}', '${c['status']}'), tone: _campStatus[c['status']] ?? neutralTone),
                              ]),
                              const SizedBox(height: 4),
                              Text('${fmtDateTime(c['date'])}${c['venue'] != null ? ' · ${c['venue']}' : ''}${c['village'] != null ? ' · ${c['village']}' : ''} · ${c['block'] ?? ''}', style: const TextStyle(color: C.muted, fontSize: 13)),
                              if (c['notes'] != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text('${c['notes']}')),
                              Text('${t('scheduledBy', 'Scheduled by')} ${c['createdBy'] is Map ? c['createdBy']['name'] : '—'}${(c['notifiedParents'] ?? 0) > 0 ? ' · ${c['notifiedParents']} ${t('parentsNotified', 'parents notified')}' : ''}', style: const TextStyle(color: C.muted, fontSize: 12)),
                              if (c['status'] == 'scheduled' && canChange(c))
                                Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                                  TextButton(onPressed: () => runAction(context, () => api.patch('/camps/${c['_id']}', {'status': 'cancelled'})).then((ok) => ok ? reload() : null), child: Text(t('cancel', 'Cancel'))),
                                  FilledButton(onPressed: () => runAction(context, () => api.patch('/camps/${c['_id']}', {'status': 'completed'})).then((ok) => ok ? reload() : null), child: Text(t('markHeld', 'Mark held'))),
                                ]),
                            ]),
                          ),
                        ),
                    ]),
            ),
          ),
        ]),
      );
}

class _CampForm extends StatefulWidget {
  const _CampForm();
  @override
  State<_CampForm> createState() => _CampFormState();
}

class _CampFormState extends State<_CampForm> {
  final title = TextEditingController(), venue = TextEditingController(), village = TextEditingController(), notes = TextEditingController();
  String kind = 'immunisation';
  DateTime? date;
  bool notify = true, busy = false;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(t('scheduleCamp', 'Schedule camp'))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          Pick<String>(label: t('messageType', 'Type'), value: kind, items: [for (final e in _campKinds.entries) (e.key, t(e.value.$2))], onChanged: (v) => setState(() => kind = v ?? 'immunisation')),
          gap,
          TextField(controller: title, maxLength: 150, decoration: InputDecoration(labelText: '${t('subject', 'Title')} *', hintText: t('campTitlePlaceholder', ''))),
          OutlinedButton.icon(
            onPressed: () async {
              final d = await pickDateTime(context, initial: date, future: true);
              if (d != null) setState(() => date = d);
            },
            icon: const Icon(Icons.event),
            label: Text(date == null ? '${t('meetingWhen', 'When?')} *' : fmtDateTime(date!.toIso8601String())),
          ),
          gap,
          TextField(controller: venue, maxLength: 200, decoration: InputDecoration(labelText: t('venue', 'Venue'), hintText: 'Anganwadi centre / Sub-centre')),
          TextField(controller: village, maxLength: 100, decoration: InputDecoration(labelText: t('village', 'Village'))),
          TextField(controller: notes, maxLength: 1000, maxLines: 2, decoration: InputDecoration(labelText: t('campNotesPlaceholder', 'Notes'))),
          CheckboxListTile(contentPadding: EdgeInsets.zero, value: notify, onChanged: (v) => setState(() => notify = v ?? true), title: Text(t('notifyParents', 'Notify parents'))),
          FilledButton(
            onPressed: busy
                ? null
                : () async {
                    if (title.text.trim().isEmpty || date == null) return toast(context, 'Title and date are required', error: true);
                    setState(() => busy = true);
                    try {
                      final data = await api.post('/camps', {
                        'kind': kind,
                        'title': title.text.trim(),
                        'date': date!.toUtc().toIso8601String(),
                        'venue': venue.text.trim(),
                        'village': village.text.trim(),
                        'notes': notes.text.trim(),
                        'notify': notify,
                        'block': '',
                      });
                      final n = data is Map ? data['notifiedParents'] : null;
                      if (context.mounted) Navigator.pop(context, '${t('campScheduled', 'Camp scheduled.')}${n != null && n > 0 ? ' $n ${t('parentsNotified', 'parents notified')}' : ''}');
                    } catch (e) {
                      if (context.mounted) toast(context, errText(e), error: true);
                      setState(() => busy = false);
                    }
                  },
            child: Text(busy ? '…' : t('scheduleCamp', 'Schedule camp')),
          ),
        ]),
      );
}
