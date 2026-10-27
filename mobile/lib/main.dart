import 'package:flutter/material.dart';

import 'core/auth.dart';
import 'core/i18n.dart';
import 'core/ui.dart';
import 'routes.dart';
import 'shell.dart';

final navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await lang.load();
  runApp(const ShishuApp());
  await auth.init();
}

class ShishuApp extends StatefulWidget {
  const ShishuApp({super.key});
  @override
  State<ShishuApp> createState() => _ShishuAppState();
}

class _ShishuAppState extends State<ShishuApp> {
  String? _shownFor; // "<user id>:<role>:<must change>" the stack was last built for

  @override
  void initState() {
    super.initState();
    auth.addListener(_onAuth);
    WidgetsBinding.instance.addPostFrameCallback((_) => _onAuth());
  }

  @override
  void dispose() {
    auth.removeListener(_onAuth);
    super.dispose();
  }

  // Log in / out / forced password change: replace the whole stack with the right first screen
  void _onAuth() {
    if (auth.loading) return;
    final key = auth.user == null ? 'out' : '${auth.id}:${auth.role}:${auth.mustChangePassword}';
    if (key == _shownFor) return;
    _shownFor = key;
    final first = auth.user == null ? '/' : (auth.mustChangePassword ? '/change-password' : Auth.homeFor(auth.role));
    navigatorKey.currentState?.pushNamedAndRemoveUntil(first, (_) => false);
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: lang,
        builder: (context, _) => MaterialApp(
          title: 'Shishu Aarogya',
          debugShowCheckedModeBanner: false,
          theme: appTheme(),
          navigatorKey: navigatorKey,
          initialRoute: '/splash',
          onGenerateRoute: onGenerateRoute,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(MediaQuery.textScalerOf(context).scale(1) * lang.textScale)),
            child: _FirstRunLanguage(child: child!),
          ),
        ),
      );
}

/// First launch: ask for a language, like the website's picker.
class _FirstRunLanguage extends StatefulWidget {
  const _FirstRunLanguage({required this.child});
  final Widget child;
  @override
  State<_FirstRunLanguage> createState() => _FirstRunLanguageState();
}

class _FirstRunLanguageState extends State<_FirstRunLanguage> {
  @override
  void initState() {
    super.initState();
    if (!lang.chosen) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final ctx = navigatorKey.currentContext;
        if (ctx != null && !lang.chosen) showLanguagePicker(ctx);
      });
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
