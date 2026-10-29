import 'package:flutter/material.dart';

import 'core/auth.dart';
import 'core/ui.dart';
import 'screens/auth/auth_screens.dart';
import 'screens/public/public_screens.dart';
import 'screens/public/shop.dart';
import 'screens/admin/admin_dashboard.dart';
import 'screens/admin/admin_lists.dart';
import 'screens/admin/admin_ops.dart';
import 'screens/admin/admin_workers.dart';
import 'screens/asha/asha_children.dart';
import 'screens/asha/asha_dashboard.dart';
import 'screens/asha/asha_search.dart';
import 'screens/asha/families_visits.dart';
import 'screens/asha/growth_malnutrition.dart';
import 'screens/asha/log_visit.dart';
import 'screens/asha/maternal.dart';
import 'screens/asha/referrals_register.dart';
import 'screens/asha/report_incentives.dart';
import 'screens/asha/vaccines_history.dart';
import 'screens/parent/ai_prediction.dart';
import 'screens/parent/child_profile.dart';
import 'screens/parent/diet_plan.dart';
import 'screens/parent/parent_more.dart';
import 'screens/parent/vaccination_schedule.dart';
import 'screens/shared/account_settings.dart';
import 'screens/shared/chatbot.dart';
import 'screens/shared/messages_camps.dart';
import 'widgets/hospital_map.dart';
import 'screens/parent/parent_dashboard.dart';
import 'shell.dart';

typedef PageBuilder = Widget Function(Object? args);

/// Same paths as the website (client/src/App.jsx). Signed-in pages are wrapped in RoleShell.
final Map<String, PageBuilder> publicPages = {
  '/splash': (_) => const Scaffold(body: Center(child: CircularProgressIndicator())),
  '/': (_) => const HomeScreen(),
  '/about': (_) => const AboutScreen(),
  '/privacy': (_) => const LegalScreen(privacy: true),
  '/terms': (_) => const LegalScreen(privacy: false),
  '/credits': (_) => const CreditsScreen(),
  '/login': (_) => const LoginScreen(),
  '/register': (_) => const RegisterScreen(),
  '/change-password': (_) => const ChangePasswordScreen(),
  '/language': (_) => const _LanguageScreen(),
  '/chat': (_) => const ChatBotScreen(),
  '/shop': (_) => const ShopScreen(),
  '/shop/products': (a) => ProductsScreen(args: argsOf(a)),
  '/shop/product': (a) => ProductDetailScreen(id: argsOf(a)['id']),
  '/shop/cart': (_) => const CartScreen(),
  '/shop/checkout': (_) => const CheckoutScreen(),
  '/shop/orders': (_) => const OrdersScreen(),
  '/shop/order': (a) => OrderDetailScreen(id: '${argsOf(a)['id']}', justPlaced: argsOf(a)['justPlaced'] == true),
  '/shop/wishlist': (_) => const WishlistScreen(),
};

final Map<String, PageBuilder> rolePages = {
  '/parent/dashboard': (_) => const ParentDashboard(),
  '/parent/child-profile': (_) => const ChildProfileScreen(),
  '/parent/growth': (_) => const ChildProfileScreen(),
  '/parent/vaccination': (_) => const VaccinationScheduleScreen(),
  '/parent/diet-plan': (_) => const DietPlanScreen(),
  '/parent/ai-prediction': (_) => const AIPredictionScreen(),
  '/parent/schemes': (_) => const SchemesScreen(),
  '/parent/reports': (_) => const HealthReportsScreen(),
  '/parent/hospitals': (_) => const RoleShell(route: '/parent/hospitals', child: HospitalMap()),
  '/parent/notifications': (_) => const NotificationsScreen(route: '/parent/notifications'),
  '/parent/messages': (_) => const MessagesScreen(route: '/parent/messages'),
  '/parent/settings': (_) => const AccountSettingsScreen(),
  '/asha/dashboard': (_) => const AshaDashboard(),
  '/asha/search': (_) => const AshaSearchScreen(),
  '/asha/children': (_) => const MyChildrenScreen(),
  '/asha/child': (a) => ChildDetailScreen(id: '${argsOf(a)['id']}'),
  '/asha/log-visit': (a) => LogVisitScreen(childId: argsOf(a)['childId']?.toString()),
  '/asha/families': (_) => const FamiliesScreen(),
  '/asha/my-visits': (_) => const MyVisitsScreen(),
  '/asha/referrals': (a) => ReferralsScreen(args: argsOf(a)),
  '/asha/register-child': (_) => const RegisterChildScreen(),
  '/asha/maternal-care': (a) => MaternalCareScreen(openForm: argsOf(a)['new'] == '1'),
  '/asha/pregnancy': (a) => PregnancyDetailScreen(id: '${argsOf(a)['id']}'),
  '/asha/vaccination-tracker': (_) => const VaccinationTrackerScreen(),
  '/asha/growth-records': (a) => GrowthRecordsScreen(childId: argsOf(a)['childId']?.toString()),
  '/asha/malnutrition-report': (_) => const MalnutritionReportScreen(),
  '/asha/visit-history': (_) => const VisitHistoryScreen(),
  '/asha/notifications': (_) => const NotificationsScreen(route: '/asha/notifications'),
  '/asha/generate-report': (_) => const GenerateReportScreen(),
  '/asha/incentives': (_) => const IncentivesScreen(),
  '/asha/area-map': (_) => const AshaDashboard(),
  '/asha/settings': (_) => const AccountSettingsScreen(),
  '/asha/messages': (_) => const MessagesScreen(route: '/asha/messages'),
  '/asha/camps': (_) => const CampsScreen(route: '/asha/camps'),
  '/admin/dashboard': (_) => const AdminDashboard(),
  '/admin/heatmap': (_) => const DistrictHeatmapScreen(),
  '/admin/analytics': (_) => const AnalyticsScreen(),
  '/admin/children': (_) => const ChildrenRegistryScreen(),
  '/admin/asha-workers': (_) => const AshaWorkersScreen(),
  '/admin/asha-workers/new': (_) => const AddAshaWorkerScreen(),
  '/admin/referrals': (a) => AdminReferralsScreen(escalated: argsOf(a)['escalated'] != null),
  '/admin/mothers': (_) => const HighRiskMothersScreen(),
  '/admin/claims': (_) => const AdminClaimsScreen(),
  '/admin/health-centres': (_) => const HealthCentresScreen(),
  '/admin/vaccination-data': (_) => const VaccinationDataScreen(),
  '/admin/malnutrition': (_) => const MalnutritionCasesScreen(),
  '/admin/schemes': (_) => const AdminSchemesScreen(),
  '/admin/block-reports': (_) => const BlockReportsScreen(),
  '/admin/notifications': (_) => const NotificationsPanelScreen(),
  '/admin/users': (_) => const UserManagementScreen(),
  '/admin/audit-logs': (_) => const AuditLogsScreen(),
  '/admin/settings': (_) => const AccountSettingsScreen(),
  '/admin/messages': (_) => const MessagesScreen(route: '/admin/messages'),
};

/// Route arguments: a Map. Website-style links work too — "/asha/log-visit?childId=x" passes
/// {childId: x}, and "/asha/child/<id>" opens the '/asha/child' page with {id: <id>}.
Map<String, dynamic> argsOf(Object? a) => a is Map ? Map<String, dynamic>.from(a) : const {};

Route<dynamic> onGenerateRoute(RouteSettings settings) {
  final uri = Uri.parse(settings.name ?? '/');
  var name = uri.path.isEmpty ? '/' : uri.path;
  Object? args = settings.arguments ?? (uri.queryParameters.isEmpty ? null : Map<String, dynamic>.from(uri.queryParameters));
  if (!publicPages.containsKey(name) && !rolePages.containsKey(name) && name.lastIndexOf('/') > 0) {
    final parent = name.substring(0, name.lastIndexOf('/'));
    if (rolePages.containsKey(parent)) {
      args = {...argsOf(args), 'id': name.substring(parent.length + 1)};
      name = parent;
    }
  }
  Widget page;
  final public = publicPages[name];
  if (public != null) {
    page = public(args);
  } else if (auth.user == null) {
    page = const LoginScreen();
  } else {
    final role = name.split('/').length > 1 ? name.split('/')[1] : '';
    final builder = rolePages[name];
    if (role != auth.role) {
      page = rolePages[Auth.homeFor(auth.role)]?.call(null) ?? const _NotReady();
    } else {
      page = builder?.call(args) ?? RoleShell(route: name, child: const _NotReady());
    }
  }
  return MaterialPageRoute(settings: RouteSettings(name: name, arguments: args), builder: (_) => page);
}

class _NotReady extends StatelessWidget {
  const _NotReady();
  @override
  Widget build(BuildContext context) => const EmptyState('This page is coming soon.', icon: Icons.construction);
}

class _LanguageScreen extends StatelessWidget {
  const _LanguageScreen();
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Language')),
        body: Builder(builder: (context) {
          WidgetsBinding.instance.addPostFrameCallback((_) async {
            await showLanguagePicker(context);
            if (context.mounted) Navigator.maybePop(context);
          });
          return const SizedBox.shrink();
        }),
      );
}
