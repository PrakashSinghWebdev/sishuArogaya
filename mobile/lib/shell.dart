import 'package:flutter/material.dart';

import 'core/api.dart';
import 'core/auth.dart';
import 'core/i18n.dart';
import 'core/ui.dart';
import 'widgets/logo.dart';

class NavItem {
  const NavItem(this.route, this.icon, this.key, this.fallback);
  final String route;
  final IconData icon;
  final String key;
  final String fallback;
  String get label => lang.plain(key, fallback);
}

/// Menus, same order as the website (Layout.jsx / MobileTabBar.jsx). The first four become bottom tabs.
const navByRole = <String, List<NavItem>>{
  'parent': [
    NavItem('/parent/dashboard', Icons.home_outlined, 'dashboard', 'Home'),
    NavItem('/parent/vaccination', Icons.vaccines_outlined, 'vaccines', 'Vaccines'),
    NavItem('/parent/diet-plan', Icons.restaurant_outlined, 'dietPlan', 'Diet'),
    NavItem('/parent/child-profile', Icons.child_care, 'myChild', 'My Child'),
    NavItem('/parent/ai-prediction', Icons.psychology_outlined, 'aiPrediction', 'AI Prediction'),
    NavItem('/parent/schemes', Icons.account_balance_outlined, 'schemes', 'Schemes'),
    NavItem('/parent/reports', Icons.description_outlined, 'reports', 'Reports'),
    NavItem('/parent/hospitals', Icons.local_hospital_outlined, 'nearbyHospitals', 'Nearby Hospitals'),
    NavItem('/parent/notifications', Icons.notifications_outlined, 'notifications', 'Notifications'),
    NavItem('/parent/messages', Icons.chat_outlined, 'supervisorMessages', 'Messages'),
    NavItem('/parent/settings', Icons.settings_outlined, 'settings', 'Settings'),
  ],
  'asha': [
    NavItem('/asha/dashboard', Icons.home_outlined, 'dashboard', 'Dashboard'),
    NavItem('/asha/families', Icons.house_outlined, 'families', 'Families'),
    NavItem('/asha/my-visits', Icons.event_available_outlined, 'myVisits', 'My Visits'),
    NavItem('/asha/children', Icons.people_outline, 'myChildren', 'My Children'),
    NavItem('/asha/maternal-care', Icons.pregnant_woman, 'maternalCare', 'Maternal Care'),
    NavItem('/asha/referrals', Icons.local_hospital_outlined, 'referrals', 'Referrals'),
    NavItem('/asha/log-visit', Icons.assignment_add, 'logVisit', 'Log Visit'),
    NavItem('/asha/register-child', Icons.person_add_alt, 'registerChild', 'Register Child'),
    NavItem('/asha/vaccination-tracker', Icons.verified_user_outlined, 'vaccinationTracker', 'Vaccination Tracker'),
    NavItem('/asha/growth-records', Icons.trending_up, 'growthRecords', 'Growth Records'),
    NavItem('/asha/malnutrition-report', Icons.warning_amber_outlined, 'malnutritionReport', 'Malnutrition Report'),
    NavItem('/asha/visit-history', Icons.history, 'visitHistory', 'Visit History'),
    NavItem('/asha/camps', Icons.campaign_outlined, 'healthCampaigns', 'Health Campaigns'),
    NavItem('/asha/incentives', Icons.currency_rupee, 'incentiveClaims', 'Incentive Claims'),
    NavItem('/asha/messages', Icons.chat_outlined, 'supervisorMessages', 'Messages'),
    NavItem('/asha/notifications', Icons.notifications_outlined, 'notificationsNav', 'Notifications'),
    NavItem('/asha/generate-report', Icons.bar_chart, 'generateReport', 'Generate Report'),
    NavItem('/asha/settings', Icons.settings_outlined, 'settings', 'Settings'),
  ],
  'admin': [
    NavItem('/admin/dashboard', Icons.speed, 'dashboard', 'Dashboard'),
    NavItem('/admin/children', Icons.people, 'childrenRegistry', 'Children Registry'),
    NavItem('/admin/analytics', Icons.insert_chart_outlined, 'analyticsReports', 'Analytics Reports'),
    NavItem('/admin/heatmap', Icons.map_outlined, 'districtHeatmap', 'District Heatmap'),
    NavItem('/admin/asha-workers', Icons.badge_outlined, 'ashaWorkers', 'ASHA Workers'),
    NavItem('/admin/referrals', Icons.local_hospital_outlined, 'referrals', 'Referrals'),
    NavItem('/admin/mothers', Icons.pregnant_woman, 'highRiskMothers', 'High-risk Mothers'),
    NavItem('/admin/claims', Icons.currency_rupee, 'incentiveClaims', 'Incentive Claims'),
    NavItem('/admin/health-centres', Icons.local_hospital, 'healthCentreDirectory', 'Health Centres'),
    NavItem('/admin/vaccination-data', Icons.shield_outlined, 'vaccinationData', 'Vaccination Data'),
    NavItem('/admin/malnutrition', Icons.report_outlined, 'malnutritionCasesAdmin', 'Malnutrition Cases'),
    NavItem('/admin/schemes', Icons.account_balance_outlined, 'governmentSchemes', 'Government Schemes'),
    NavItem('/admin/block-reports', Icons.table_chart_outlined, 'blockwiseReports', 'Blockwise Reports'),
    NavItem('/admin/notifications', Icons.campaign_outlined, 'notificationsPanel', 'Notifications'),
    NavItem('/admin/messages', Icons.chat_outlined, 'supervisorMessages', 'Messages'),
    NavItem('/admin/users', Icons.manage_accounts_outlined, 'userManagement', 'User Management'),
    NavItem('/admin/audit-logs', Icons.receipt_long_outlined, 'auditLogs', 'Audit Logs'),
    NavItem('/admin/settings', Icons.tune, 'settingsConfig', 'Settings'),
  ],
};

/// Every signed-in page: app bar, side menu with all pages, bottom tabs for the main four.
class RoleShell extends StatelessWidget {
  const RoleShell({super.key, required this.route, required this.child, this.title, this.actions, this.fab});
  final String route;
  final Widget child;
  final String? title;
  final List<Widget>? actions;
  final Widget? fab;

  @override
  Widget build(BuildContext context) {
    final items = navByRole[auth.role] ?? const <NavItem>[];
    final current = items.where((i) => route == i.route || route.startsWith('${i.route}/')).firstOrNull;
    final tabs = items.take(4).toList();
    final tabIndex = tabs.indexWhere((i) => i.route == current?.route);
    final isTop = items.any((i) => i.route == route);
    final canPop = Navigator.of(context).canPop() && !isTop;

    return Scaffold(
      appBar: AppBar(
        title: Text(title ?? current?.label ?? 'Shishu Aarogya', overflow: TextOverflow.ellipsis),
        actions: [
          ...?actions,
          IconButton(tooltip: 'Shop', icon: const Icon(Icons.shopping_bag_outlined), onPressed: () => Navigator.pushNamed(context, '/shop')),
          if (auth.role == 'asha') IconButton(tooltip: t('search', 'Search'), icon: const Icon(Icons.search), onPressed: () => Navigator.pushNamed(context, '/asha/search')),
          if (auth.role != 'admin') _Bell(route: '/${auth.role}/notifications'),
        ],
      ),
      drawer: canPop ? null : _Menu(items: items, current: current?.route),
      body: SafeArea(child: child),
      floatingActionButton: fab ?? const ChatFab(),
      bottomNavigationBar: isTop && tabs.length == 4
          ? Builder(builder: (context) => NavigationBar(
              height: 64,
              selectedIndex: tabIndex < 0 ? 4 : tabIndex,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              onDestinationSelected: (i) {
                if (i == 4) {
                  Scaffold.of(context).openDrawer();
                } else if (tabs[i].route != route) {
                  Navigator.pushReplacementNamed(context, tabs[i].route);
                }
              },
              destinations: [
                for (final tab in tabs) NavigationDestination(icon: Icon(tab.icon), label: tab.label),
                NavigationDestination(icon: const Icon(Icons.menu), label: t('navMore', 'More')),
              ],
            ))
          : null,
    );
  }
}

/// Button that opens the health assistant, like the website's chat bubble.
class ChatFab extends StatelessWidget {
  const ChatFab({super.key});
  @override
  Widget build(BuildContext context) => FloatingActionButton(
    heroTag: 'chat',
    tooltip: 'Ask a health question',
    onPressed: () => Navigator.pushNamed(context, '/chat'),
    child: const Icon(Icons.chat_bubble_outline_rounded),
  );
}

class _Bell extends StatefulWidget {
  const _Bell({required this.route});
  final String route;
  @override
  State<_Bell> createState() => _BellState();
}

class _BellState extends State<_Bell> {
  int unread = 0;
  @override
  void initState() {
    super.initState();
    api.get('/notifications').then((rows) {
      if (mounted && rows is List) setState(() => unread = rows.where((n) => n['isRead'] != true).length);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) => IconButton(
        tooltip: t('notifications', 'Notifications'),
        onPressed: () => Navigator.pushNamed(context, widget.route),
        icon: Badge(isLabelVisible: unread > 0, label: Text(unread > 99 ? '99+' : '$unread'), child: const Icon(Icons.notifications_none)),
      );
}

class _Menu extends StatelessWidget {
  const _Menu({required this.items, required this.current});
  final List<NavItem> items;
  final String? current;

  @override
  Widget build(BuildContext context) {
    const portal = {'parent': 'Parent', 'asha': 'ASHA worker', 'admin': 'Administrator'};
    Widget tile(IconData icon, String label, VoidCallback onTap, {bool selected = false, Color? color}) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 1),
          child: ListTile(
            dense: true,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            leading: Icon(icon, color: color ?? (selected ? C.primary : C.muted), size: 22),
            title: Text(label, style: TextStyle(fontSize: 14.5, color: color ?? C.text, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
            selected: selected,
            selectedTileColor: C.soft,
            onTap: onTap,
          ),
        );
    return Drawer(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: EdgeInsets.fromLTRB(24, MediaQuery.of(context).padding.top + 20, 16, 16),
          child: const Logo(size: 30),
        ),
        Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: C.border)),
          child: Row(children: [
            CircleAvatar(
              backgroundColor: C.soft,
              child: Text(auth.name.isEmpty ? 'U' : auth.name[0].toUpperCase(), style: const TextStyle(color: C.primary, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(auth.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15), overflow: TextOverflow.ellipsis),
                Text(portal[auth.role] ?? '', style: const TextStyle(color: C.muted, fontSize: 12.5)),
              ]),
            ),
          ]),
        ),
        Expanded(
          child: ListView(padding: EdgeInsets.zero, children: [
            for (final item in items)
              tile(item.icon, item.label, selected: item.route == current, () {
                Navigator.pop(context);
                if (item.route != current) Navigator.pushReplacementNamed(context, item.route);
              }),
            const Padding(padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8), child: Divider()),
            tile(Icons.chat_bubble_outline_rounded, 'Ask a health question', () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/chat');
            }),
            tile(Icons.shopping_bag_outlined, 'Shop', () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/shop');
            }),
            tile(Icons.translate, lang.languages.where((l) => l.code == lang.language).firstOrNull?.label ?? lang.language, () {
              Navigator.pop(context);
              showLanguagePicker(context);
            }),
            tile(Icons.logout, lang.plain('logout', 'Log out'), color: C.red, () async {
              Navigator.pop(context);
              await auth.logout();
            }),
          ]),
        ),
        SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
      ]),
    );
  }
}

Future<void> showLanguagePicker(BuildContext context) => showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Choose your language', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: C.text)),
            const Text('अपनी भाषा चुनें', style: TextStyle(color: C.muted)),
            const SizedBox(height: 12),
            Flexible(
              child: SingleChildScrollView(
                child: Wrap(spacing: 8, runSpacing: 8, children: [
                  for (final l in lang.languages)
                    ChoiceChip(
                      label: Text(l.label),
                      selected: l.code == lang.language,
                      onSelected: (_) {
                        lang.setLanguage(l.code);
                        Navigator.pop(c);
                      },
                    ),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
