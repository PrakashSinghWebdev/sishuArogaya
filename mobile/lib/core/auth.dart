import 'package:flutter/foundation.dart';

import 'api.dart';

/// Who is signed in. The server is the source of truth: on launch we ask /auth/me.
class Auth extends ChangeNotifier {
  Auth._();
  static final instance = Auth._();

  Map<String, dynamic>? user;
  bool loading = true;

  String get role => user?['role']?.toString() ?? '';
  String get name => user?['name']?.toString() ?? '';
  String get id => (user?['id'] ?? user?['_id'])?.toString() ?? '';
  bool get mustChangePassword => user?['mustChangePassword'] == true;

  Future<void> init() async {
    api.onUnauthorized = () {
      if (user != null) {
        user = null;
        notifyListeners();
      }
    };
    await api.loadSession();
    try {
      final res = await api.get('/auth/me');
      user = Map<String, dynamic>.from(res['user']);
    } catch (_) {
      user = null;
    }
    loading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>> login(String email, String password, String role) async {
    final res = await api.post('/auth/login', {'email': email, 'password': password, 'role': role});
    user = Map<String, dynamic>.from(res['user']);
    notifyListeners();
    return user!;
  }

  void setUser(Map<String, dynamic> next) {
    user = {...?user, ...next};
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    await api.clearSession();
    user = null;
    notifyListeners();
  }

  static String homeFor(String role) =>
      const {'parent': '/parent/dashboard', 'asha': '/asha/dashboard', 'admin': '/admin/dashboard'}[role] ?? '/login';
}

final auth = Auth.instance;
