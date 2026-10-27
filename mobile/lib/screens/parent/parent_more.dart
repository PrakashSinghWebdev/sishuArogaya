import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/auth.dart';
import '../../core/files.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import 'parent_common.dart';

// ── Government schemes ─────────────────────────────────────────────────────
const schemeCategoryColor = {
  'nutrition': Color(0xFF059669),
  'vaccination': Color(0xFF1D4ED8),
  'financial': Color(0xFFF59E0B),
  'education': Color(0xFF7C3AED),
  'other': Color(0xFF0891B2),
};
const schemeCategoryLabel = {
  'nutrition': '🥗 Nutrition',
  'vaccination': '💉 Vaccination',
  'financial': '💰 Financial',
  'education': '📚 Education',
  'other': '🏛️ Other',
};

class SchemesScreen extends StatefulWidget {
  const SchemesScreen({super.key});
  @override
  State<SchemesScreen> createState() => _SchemesScreenState();
}

class _SchemesScreenState extends State<SchemesScreen> {
  String filter = 'all';

  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/parent/schemes',
        child: Loader<List>(
          load: () async => await api.get('/schemes') as List,
          builder: (context, schemes, _) {
            final shown = filter == 'all' ? schemes : schemes.where((s) => s['category'] == filter).toList();
            return ListView(padding: const EdgeInsets.all(16), children: [
              Text('🏛️ ${schemes.length} Government Welfare Schemes', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const Text('Live data from database', style: TextStyle(color: C.muted, fontSize: 12)),
              gap,
              ChoiceRow(
                value: filter,
                onChanged: (v) => setState(() => filter = v),
                options: const [('all', '📍 All Schemes'), ('nutrition', '🥗 Nutrition'), ('vaccination', '💉 Vaccination'), ('financial', '💰 Financial'), ('education', '📚 Education'), ('other', '🏛️ Other')],
              ),
              if (shown.isEmpty) const Card(child: EmptyState('No schemes found for this category.')),
              for (final s in shown) SchemeCard(scheme: s),
            ]);
          },
        ),
      );
}

class SchemeCard extends StatelessWidget {
  const SchemeCard({super.key, required this.scheme, this.trailing});
  final Map scheme;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) {
    final color = schemeCategoryColor[scheme['category']] ?? C.primary;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: color.withValues(alpha: .5))),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => showSchemeDetails(context, scheme),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              CircleAvatar(backgroundColor: color.withValues(alpha: .12), child: Text('${scheme['icon'] ?? '🏛️'}', style: const TextStyle(fontSize: 20))),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${scheme['name']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 4),
                  Wrap(spacing: 6, children: [
                    if (scheme['shortName'] != null) Badge2('${scheme['shortName']}', tone: Tone(color, color.withValues(alpha: .12))),
                    Badge2(schemeCategoryLabel[scheme['category']] ?? '${scheme['category'] ?? ''}'),
                  ]),
                ]),
              ),
              if (trailing != null) trailing!,
            ]),
            const SizedBox(height: 8),
            Text('${scheme['description'] ?? ''}', maxLines: 4, overflow: TextOverflow.ellipsis),
            if ((scheme['tags'] as List?)?.isNotEmpty == true) ...[
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 6, children: [for (final tag in scheme['tags']) Badge2('$tag', tone: infoTone)]),
            ],
            const SizedBox(height: 8),
            Row(children: [
              TextButton(onPressed: () => showSchemeDetails(context, scheme), child: const Text('Details')),
              const Spacer(),
              if (scheme['applyLink'] != null && '${scheme['applyLink']}'.isNotEmpty)
                FilledButton.icon(onPressed: () => openLink('${scheme['applyLink']}'), icon: const Icon(Icons.open_in_new, size: 16), label: const Text('Apply / Check Online')),
            ]),
          ]),
        ),
      ),
    );
  }
}

void showSchemeDetails(BuildContext context, Map s) => showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (c) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: .7,
        builder: (c, scroll) => ListView(controller: scroll, padding: const EdgeInsets.all(20), children: [
          Text('${s['icon'] ?? '🏛️'} ${s['name']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(schemeCategoryLabel[s['category']] ?? '', style: const TextStyle(color: C.muted)),
          gap,
          Text('${s['description'] ?? ''}'),
          if (s['eligibilityCriteria'] != null) ...[gap, const Text('Eligibility', style: TextStyle(fontWeight: FontWeight.w700)), Text('${s['eligibilityCriteria']}')],
          if (s['benefits'] != null) ...[gap, const Text('Benefits', style: TextStyle(fontWeight: FontWeight.w700)), Text('${s['benefits']}')],
          gap,
          if (s['applyLink'] != null && '${s['applyLink']}'.isNotEmpty)
            FilledButton.icon(onPressed: () => openLink('${s['applyLink']}'), icon: const Icon(Icons.open_in_new), label: const Text('Apply / Check Online'))
          else
            const NoticeBox('Apply at your nearest Anganwadi centre or PHC, or ask your ASHA worker.', tone: infoTone),
        ]),
      ),
    );

// ── Health reports ─────────────────────────────────────────────────────────
class HealthReportsScreen extends StatelessWidget {
  const HealthReportsScreen({super.key});
  @override
  Widget build(BuildContext context) => RoleShell(
        route: '/parent/reports',
        child: Loader<Children>(
          load: Children.load,
          builder: (context, children, reload) {
            final c = children.selected;
            if (c == null) {
              return ListView(padding: const EdgeInsets.all(16), children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      const Text('📂', style: TextStyle(fontSize: 48)),
                      const Text('No Child Profile Detected', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      const Text('Please register your child in the "My Child" section to begin generating detailed health reports.', textAlign: TextAlign.center, style: TextStyle(color: C.muted)),
                      gap,
                      FilledButton(onPressed: () => Navigator.pushReplacementNamed(context, '/parent/child-profile'), child: const Text('Add Child Profile')),
                    ]),
                  ),
                ),
              ]);
            }
            const types = [
              ('comprehensive', '📄', 'Comprehensive Health Report', 'Complete Health Summary', Color(0xFF0891B2)),
              ('vaccination', '💉', 'Vaccination Report', 'Vaccine Summary', Color(0xFF1D4ED8)),
              ('growth', '📉', 'Growth Report', 'Health Growth Snapshot', Color(0xFF059669)),
            ];
            return ListView(padding: const EdgeInsets.all(16), children: [
              ChildPicker(children: children, onChanged: reload),
              const Text('📑 Health Reports', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
              const Text('Generate reports from the active health records.', style: TextStyle(color: C.muted)),
              gap,
              for (final (type, icon, title, subtitle, color) in types)
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: color.withValues(alpha: .5))),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: CircleAvatar(radius: 24, backgroundColor: color.withValues(alpha: .12), child: Text(icon, style: const TextStyle(fontSize: 22))),
                    title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text('$subtitle · ${c['name']}'),
                    trailing: IconButton.filled(
                      style: IconButton.styleFrom(backgroundColor: color),
                      icon: const Icon(Icons.download),
                      onPressed: () => downloadAndOpen(context, '/reports/child/${c['_id']}', '${c['name']}_${type}_Report.pdf', {'type': type}),
                    ),
                  ),
                ),
            ]);
          },
        ),
      );
}

// ── Notifications (parent and ASHA) ────────────────────────────────────────
const notificationType = {
  'vaccine_reminder': ('💉', 'Vaccine Reminder', Color(0xFFF59E0B), false),
  'health_alert': ('⚡', 'Health Alert', Color(0xFFEF4444), true),
  'visit_reminder': ('🏥', 'Visit Reminder', Color(0xFFF59E0B), false),
  'scheme_update': ('💰', 'Scheme Update', Color(0xFF059669), false),
  'system': ('💡', 'System', Color(0xFF0891B2), false),
};

String relativeDate(dynamic d) {
  final dt = parseDate(d);
  if (dt == null) return '—';
  final now = DateTime.now();
  final day = DateTime(dt.year, dt.month, dt.day);
  final today = DateTime(now.year, now.month, now.day);
  final time = '${dt.hour % 12 == 0 ? 12 : dt.hour % 12}:${dt.minute.toString().padLeft(2, '0')} ${dt.hour < 12 ? 'am' : 'pm'}';
  if (day == today) return 'Today, $time';
  if (day == today.subtract(const Duration(days: 1))) return 'Yesterday, $time';
  return fmtDate(d);
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key, required this.route});
  final String route;

  @override
  Widget build(BuildContext context) => RoleShell(
        route: route,
        child: Loader<List>(
          load: () async => await api.get('/notifications') as List,
          builder: (context, rows, reload) {
            final urgent = rows.where((n) => n['type'] == 'health_alert').length;
            final reminders = rows.where((n) => n['type'] == 'vaccine_reminder' || n['type'] == 'visit_reminder').length;
            final good = rows.where((n) => n['type'] == 'scheme_update').length;
            return StatefulBuilder(builder: (context, setS) {
              return ListView(padding: const EdgeInsets.all(16), children: [
                Row(children: [
                  Expanded(child: Text('Updates and alerts for ${auth.name}', style: const TextStyle(color: C.muted))),
                  TextButton.icon(
                    onPressed: () async {
                      if (await runAction(context, () => api.put('/notifications/read-all'))) setS(() => [for (final n in rows) n['isRead'] = true]);
                    },
                    icon: const Icon(Icons.done_all),
                    label: const Text('Mark all as read'),
                  ),
                ]),
                StatGrid([
                  StatTile(label: 'Urgent Alerts', value: '$urgent', icon: Icons.bolt, color: const Color(0xFFEF4444)),
                  StatTile(label: 'Reminders', value: '$reminders', icon: Icons.notifications_active_outlined, color: const Color(0xFFF59E0B)),
                  StatTile(label: 'Good News', value: '$good', icon: Icons.celebration_outlined, color: C.green),
                  StatTile(label: 'Total', value: '${rows.length}', icon: Icons.bar_chart, color: C.primary),
                ]),
                const SizedBox(height: 14),
                if (rows.isEmpty) const Card(child: EmptyState("No Notifications\nYou're all caught up! No new alerts or reminders.", icon: Icons.notifications_off_outlined)),
                for (final n in rows)
                  Builder(builder: (context) {
                    final (icon, label, color, isUrgent) = notificationType[n['type']] ?? notificationType['system']!;
                    final unread = n['isRead'] != true;
                    return Card(
                      color: unread ? Colors.white : const Color(0xFFF8FAFC),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: unread ? color.withValues(alpha: .6) : C.border)),
                      child: ListTile(
                        leading: CircleAvatar(backgroundColor: color.withValues(alpha: .12), child: Text(icon)),
                        title: Row(children: [
                          Expanded(child: Text('${n['title'] ?? (('${n['message'] ?? 'Notification'}').length > 60 ? '${n['message']}'.substring(0, 60) : n['message'] ?? 'Notification')}', style: TextStyle(fontWeight: unread ? FontWeight.w700 : FontWeight.w500))),
                          if (isUrgent) const Badge2('Urgent', tone: badTone),
                        ]),
                        subtitle: Text('${n['message'] ?? ''}\n${relativeDate(n['createdAt'])} · $label'),
                        isThreeLine: true,
                        trailing: unread
                            ? IconButton(
                                tooltip: 'Mark read',
                                icon: const Icon(Icons.check_circle_outline, color: C.primary),
                                onPressed: () async {
                                  await api.put('/notifications/${n['_id']}/read').catchError((_) => null);
                                  setS(() => n['isRead'] = true);
                                },
                              )
                            : null,
                        onTap: n['link'] is String && '${n['link']}'.startsWith('/${auth.role}/') ? () => Navigator.pushNamed(context, '${n['link']}'.split('?').first) : null,
                      ),
                    );
                  }),
              ]);
            });
          },
        ),
      );
}
