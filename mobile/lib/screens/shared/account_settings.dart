import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/api.dart';
import '../../core/auth.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../auth/auth_screens.dart';

const _roleLabel = {'parent': 'roleParent', 'asha': 'ashaWorkerRole', 'admin': 'roleAdmin'};
const _notifTypes = [
  ('vaccine_reminder', 'prefVaccines', Icons.vaccines_outlined),
  ('visit_reminder', 'prefVisits', Icons.event_available_outlined),
  ('scheme_update', 'prefSchemes', Icons.account_balance_outlined),
  ('system', 'prefMessages', Icons.chat_outlined),
];
const _helplines = [('104', 'helpline104'), ('108', 'ambulance108'), ('102', 'transport102'), ('1098', 'childline1098'), ('14416', 'teleManas')];
const _faq = {
  'parent': [('faqParentAddQ', 'faqParentAddA'), ('faqParentVaccQ', 'faqParentVaccA'), ('faqParentAshaQ', 'faqParentAshaA'), ('faqForgotQ', 'faqForgotParentA')],
  'asha': [('faqAshaVisitQ', 'faqAshaVisitA'), ('faqAshaVaccQ', 'faqAshaVaccA'), ('faqAshaReferQ', 'faqAshaReferA'), ('faqForgotQ', 'faqForgotStaffA')],
  'admin': [('faqAdminCreateQ', 'faqAdminCreateA'), ('faqSupClaimsQ', 'faqSupClaimsA'), ('faqSupMsgQ', 'faqSupMsgA'), ('faqAdminResetQ', 'faqAdminResetA')],
};

String _initials(String n) => n.trim().isEmpty ? '?' : n.trim().split(RegExp(r'\s+')).map((w) => w[0]).take(2).join().toUpperCase();

/// One settings screen for every role: profile, security, notifications, language, text size, about, help.
class AccountSettingsScreen extends StatelessWidget {
  const AccountSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final role = auth.role;
    return RoleShell(
      route: '/$role/settings',
      child: Loader<(Map, Map?)>(
        load: () async {
          final me = Map<String, dynamic>.from((await api.get('/auth/me'))['user']);
          final asha = role == 'asha' ? await api.get('/asha/profile').catchError((_) => null) as Map? : null;
          return (me, asha);
        },
        builder: (context, data, reload) {
          final (me, asha) = data;
          void open(Widget page) => Navigator.push(context, MaterialPageRoute(builder: (_) => page)).then((_) => reload());
          return ListenableBuilder(
            listenable: lang,
            builder: (context, _) => ListView(padding: const EdgeInsets.all(16), children: [
              Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.all(14),
                  leading: CircleAvatar(radius: 28, backgroundColor: C.primary, child: Text(_initials('${me['name'] ?? auth.name}'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18))),
                  title: Text('${me['name'] ?? auth.name}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                  subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('${me['username'] ?? me['email'] ?? ''}'),
                    const SizedBox(height: 4),
                    Badge2(t(_roleLabel[role] ?? role), tone: goodTone),
                  ]),
                ),
              ),
              _section(t('accountSection', 'Account')),
              Card(
                child: Column(children: [
                  _row(Icons.account_circle_outlined, t('manageProfile', 'Manage profile'), onTap: () => open(_ProfilePanel(me: me, asha: asha))),
                  _row(Icons.lock_outline, t('passwordSecurity', 'Password & security'), onTap: () => open(const _SecurityPanel())),
                  _row(Icons.notifications_outlined, t('notificationsNav', 'Notifications'), onTap: () => open(_NotificationPrefsPanel(me: me))),
                  _row(Icons.translate, t('languageNav', 'Language'), value: lang.languages.where((l) => l.code == lang.language).firstOrNull?.label, onTap: () => showLanguagePicker(context)),
                ]),
              ),
              _section(t('preferencesSection', 'Preferences')),
              Card(
                child: Column(children: [
                  _row(Icons.info_outline, t('aboutUs', 'About us'), onTap: () => open(const _AboutPanel())),
                  _row(Icons.format_size, t('textSize', 'Text size'), value: t('textSize_${lang.textSize}', lang.textSize), onTap: () => open(const _TextSizePanel())),
                ]),
              ),
              _section(t('supportSection', 'Support')),
              Card(
                child: Column(children: [
                  _row(Icons.help_outline, t('helpCenter', 'Help centre'), onTap: () => open(const _HelpPanel())),
                  _row(Icons.logout, lang.plain('logout', 'Logout'), danger: true, onTap: () => auth.logout()),
                ]),
              ),
            ]),
          );
        },
      ),
    );
  }

  Widget _section(String s) => Padding(padding: const EdgeInsets.fromLTRB(4, 12, 4, 6), child: Text(s, style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)));

  Widget _row(IconData icon, String label, {String? value, VoidCallback? onTap, bool danger = false}) => ListTile(
        leading: Icon(icon, color: danger ? C.red : const Color(0xFF334155)),
        title: Text(label, style: TextStyle(color: danger ? C.red : null)),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          if (value != null) Text(value, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13.5)),
          const Icon(Icons.chevron_right),
        ]),
        onTap: onTap,
      );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.title, required this.children});
  final String title;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: Text(title)), body: SafeArea(child: ListView(padding: const EdgeInsets.all(16), children: children)));
}

class _ProfilePanel extends StatefulWidget {
  const _ProfilePanel({required this.me, this.asha});
  final Map me;
  final Map? asha;
  @override
  State<_ProfilePanel> createState() => _ProfilePanelState();
}

class _ProfilePanelState extends State<_ProfilePanel> {
  late final name = TextEditingController(text: '${widget.me['name'] ?? ''}');
  late final phone = TextEditingController(text: '${widget.me['phone'] ?? ''}');
  bool busy = false;

  @override
  Widget build(BuildContext context) {
    final role = auth.role;
    final a = widget.asha;
    final area = role == 'asha' && a != null
        ? [(t('ashaIdLabel', 'ASHA ID'), a['ashaId']), (t('block', 'Block'), a['block']), (t('district', 'District'), a['district']), (t('village', 'Village'), a['village'])]
        : role == 'parent'
            ? [(t('district', 'District'), widget.me['district']), (t('block', 'Block'), widget.me['block'])]
            : <(String, dynamic)>[];
    return _Panel(title: t('manageProfile', 'Manage profile'), children: [
      TextField(controller: name, maxLength: 100, decoration: InputDecoration(labelText: t('fullName', 'Full name'))),
      TextField(controller: phone, keyboardType: TextInputType.phone, maxLength: 10, inputFormatters: [FilteringTextInputFormatter.digitsOnly], decoration: InputDecoration(labelText: t('phone2', 'Phone'))),
      TextField(controller: TextEditingController(text: '${widget.me['email'] ?? ''}'), enabled: false, decoration: InputDecoration(labelText: t('email2', 'Email'))),
      gap,
      for (final (label, value) in area)
        if (value != null && '$value'.isNotEmpty) InfoRow(label, '$value'),
      if (role != 'admin') Text(t('areaManagedByAdmin', 'Your area is managed by the admin.'), style: const TextStyle(color: C.muted, fontSize: 12.5)),
      gap,
      FilledButton(
        onPressed: busy
            ? null
            : () async {
                if (name.text.trim().length < 2) return toast(context, 'Enter your full name', error: true);
                if (phone.text.length != 10) return toast(context, '10-digit mobile number', error: true);
                setState(() => busy = true);
                await runAction(context, () async {
                  final data = await api.put('/auth/profile', {'name': name.text.trim(), 'phone': phone.text});
                  auth.setUser({'name': data['user']?['name'] ?? name.text.trim()});
                }, success: t('profileSaved', 'Profile saved'));
                if (mounted) setState(() => busy = false);
              },
        child: Text(busy ? '…' : t('save2', 'Save')),
      ),
    ]);
  }
}

class _SecurityPanel extends StatefulWidget {
  const _SecurityPanel();
  @override
  State<_SecurityPanel> createState() => _SecurityPanelState();
}

class _SecurityPanelState extends State<_SecurityPanel> {
  final current = TextEditingController(), next = TextEditingController(), confirmCtrl = TextEditingController();
  bool busy = false;

  @override
  Widget build(BuildContext context) => _Panel(title: t('passwordSecurity', 'Password & security'), children: [
        PasswordField(controller: current, label: t('pwCurrent', 'Current password')),
        gap,
        PasswordField(controller: next, label: t('pwNew', 'New password')),
        gap,
        PasswordField(controller: confirmCtrl, label: t('pwConfirm', 'Confirm new password')),
        gap,
        Text('${t('pwRuleLength', 'At least 8 characters.')} ${t('pwSignsOutOthers', '')}', style: const TextStyle(color: C.muted, fontSize: 12.5)),
        gap,
        FilledButton(
          onPressed: busy
              ? null
              : () async {
                  if (next.text.length < 8) return toast(context, t('pwTooShort', 'Password too short'), error: true);
                  if (next.text != confirmCtrl.text) return toast(context, t('pwMismatch', 'Passwords do not match'), error: true);
                  if (next.text == current.text) return toast(context, t('pwSameAsOld', 'Choose a new password'), error: true);
                  setState(() => busy = true);
                  final ok = await runAction(context, () => api.put('/auth/change-password', {'currentPassword': current.text, 'newPassword': next.text}), success: t('passwordChanged', 'Password changed'));
                  if (ok) {
                    current.clear();
                    next.clear();
                    confirmCtrl.clear();
                  }
                  if (mounted) setState(() => busy = false);
                },
          child: Text(busy ? '…' : t('setNewPassword', 'Set a new password')),
        ),
        const Divider(height: 40),
        Text(t('signOutAll', 'Sign out everywhere'), style: const TextStyle(fontWeight: FontWeight.w700)),
        Text(t('signOutAllHint', ''), style: const TextStyle(color: C.muted, fontSize: 12.5)),
        gap,
        OutlinedButton(
          style: OutlinedButton.styleFrom(foregroundColor: C.red),
          onPressed: () async {
            if (await confirm(context, t('signOutAllConfirm', 'Sign out on all devices?'))) await auth.logout(); // the server revokes every session
          },
          child: Text(t('signOutAll', 'Sign out everywhere')),
        ),
      ]);
}

class _NotificationPrefsPanel extends StatefulWidget {
  const _NotificationPrefsPanel({required this.me});
  final Map me;
  @override
  State<_NotificationPrefsPanel> createState() => _NotificationPrefsPanelState();
}

class _NotificationPrefsPanelState extends State<_NotificationPrefsPanel> {
  late final Map<String, bool> prefs = {
    for (final (k, _, _) in _notifTypes) k: true,
    ...((widget.me['notificationPrefs'] as Map?) ?? {}).map((k, v) => MapEntry('$k', v == true)),
  };
  bool busy = false;

  @override
  Widget build(BuildContext context) => _Panel(title: t('notificationsNav', 'Notifications'), children: [
        for (final (key, label, icon) in _notifTypes)
          SwitchListTile(
            secondary: Icon(icon),
            title: Text(t(label)),
            value: prefs[key] ?? true,
            onChanged: busy
                ? null
                : (v) async {
                    setState(() {
                      prefs[key] = v;
                      busy = true;
                    });
                    await runAction(context, () => api.put('/auth/preferences', {'notificationPrefs': {key: v}}), success: t('saved', 'Saved'));
                    if (mounted) setState(() => busy = false);
                  },
          ),
        SwitchListTile(
          secondary: const Icon(Icons.warning_amber, color: C.red),
          title: Text(t('prefEmergency', 'Emergency alerts')),
          subtitle: Text(t('prefEmergencyHint', 'Always on')),
          value: true,
          onChanged: null,
        ),
        gap,
        OutlinedButton(onPressed: () => Navigator.pushNamed(context, '/${auth.role}/notifications'), child: Text(t('openNotifications', 'Open notifications'))),
      ]);
}

class _TextSizePanel extends StatelessWidget {
  const _TextSizePanel();
  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: lang,
        builder: (context, _) => _Panel(title: t('textSize', 'Text size'), children: [
          for (final e in Lang.textSizes.entries)
            Card(
              color: e.key == lang.textSize ? const Color(0xFFF0FDF4) : Colors.white,
              child: ListTile(
                title: Text(t('textSize_${e.key}', e.key), style: TextStyle(fontSize: 15 * e.value, fontWeight: e.key == lang.textSize ? FontWeight.w700 : null)),
                trailing: e.key == lang.textSize ? const Icon(Icons.check, color: Color(0xFF16A34A)) : null,
                onTap: () => lang.setTextSize(e.key),
              ),
            ),
          Text(t('textSizeHint', ''), style: const TextStyle(color: C.muted, fontSize: 12.5)),
        ]),
      );
}

class _AboutPanel extends StatelessWidget {
  const _AboutPanel();
  @override
  Widget build(BuildContext context) => _Panel(title: t('aboutUs', 'About us'), children: [
        Text(t('aboutText', '')),
        gap,
        InfoRow(t('appVersion', 'App version'), '1.0'),
        if (auth.role == 'admin') ...[
          const InfoRow('Stack', 'Flutter app · Node.js / Express / MongoDB API'),
          const InfoRow('University', 'Dev Bhoomi Uttarakhand University'),
        ],
        gap,
        OutlinedButton(onPressed: () => Navigator.pushNamed(context, '/about'), child: Text('${t('aboutUs', 'About us')} →')),
        TextButton(onPressed: () => Navigator.pushNamed(context, '/privacy'), child: const Text('Privacy Policy')),
        TextButton(onPressed: () => Navigator.pushNamed(context, '/terms'), child: const Text('Terms of Use')),
      ]);
}

class _HelpPanel extends StatefulWidget {
  const _HelpPanel();
  @override
  State<_HelpPanel> createState() => _HelpPanelState();
}

class _HelpPanelState extends State<_HelpPanel> {
  final subject = TextEditingController(), body = TextEditingController();
  bool busy = false;

  @override
  Widget build(BuildContext context) => _Panel(title: t('helpCenter', 'Help centre'), children: [
        Text(t('faqTitle', 'Frequently asked questions'), style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        for (final (q, a) in _faq[auth.role] ?? const <(String, String)>[])
          Card(child: ExpansionTile(title: Text(t(q), style: const TextStyle(fontWeight: FontWeight.w600)), childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12), children: [Text(t(a), style: const TextStyle(color: C.muted))])),
        gap,
        Text(t('freeHelplines', 'Free helplines'), style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final (n, k) in _helplines) OutlinedButton.icon(style: OutlinedButton.styleFrom(foregroundColor: C.red), onPressed: () => callPhone(n), icon: const Icon(Icons.call, size: 16), label: Text('$n · ${t(k)}')),
        ]),
        if (auth.role != 'admin') ...[
          const SizedBox(height: 20),
          Text(t('reportProblem', 'Report a problem'), style: const TextStyle(fontWeight: FontWeight.w700)),
          Text(t('reportProblemHint', ''), style: const TextStyle(color: C.muted, fontSize: 12.5)),
          gap,
          TextField(controller: subject, maxLength: 120, decoration: InputDecoration(labelText: t('subject', 'Subject'))),
          TextField(controller: body, maxLength: 2000, maxLines: 3, decoration: InputDecoration(labelText: t('reportProblemBody', 'Describe the problem'))),
          gap,
          FilledButton(
            onPressed: busy
                ? null
                : () async {
                    if (subject.text.trim().isEmpty || body.text.trim().isEmpty) return toast(context, 'Fill in the subject and the problem', error: true);
                    setState(() => busy = true);
                    final ok = await runAction(context, () => api.post('/messages', {'support': true, 'subject': '[Problem] ${subject.text.trim()}', 'body': body.text.trim()}), success: t('problemReported', 'Sent to support'));
                    if (ok) {
                      subject.clear();
                      body.clear();
                    }
                    if (mounted) setState(() => busy = false);
                  },
            child: Text(busy ? '…' : t('send', 'Send')),
          ),
          TextButton(onPressed: () => Navigator.pushNamed(context, '/${auth.role}/messages'), child: Text(t('myRequests', 'My requests'))),
        ],
      ]);
}
