import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

/// Server address. Set at build time: flutter build apk --dart-define=API_URL=https://api.example.in
/// Without it, the app reaches a dev server on this computer (port 5002): the Android emulator
/// sees the computer as 10.0.2.2, the iOS simulator as localhost.
const _apiUrlOverride = String.fromEnvironment('API_URL');
final apiUrl = _apiUrlOverride.isNotEmpty
    ? _apiUrlOverride
    : (defaultTargetPlatform == TargetPlatform.android ? 'http://10.0.2.2:5002' : 'http://localhost:5002');

class ApiException implements Exception {
  ApiException(this.message, {this.status = 0, this.code});
  final String message;
  final int status;
  final String? code;
  @override
  String toString() => message;
}

/// A list page plus the X-Total-Count header the server sends for paged lists.
class Paged {
  Paged(this.rows, this.total);
  final List rows;
  final int total;
}

/// JSON client for the Sishu Arogaya API. The server keeps the session in an httpOnly cookie;
/// the app stores that cookie in the phone's secure storage and sends it back on every call.
class Api {
  Api._();
  static final instance = Api._();

  static const _storage = FlutterSecureStorage();
  static const _cookieKey = 'session_cookie';
  final _client = http.Client();
  String? _cookie;

  /// Called when the server rejects the session (expired, logged out elsewhere).
  VoidCallback? onUnauthorized;

  Future<void> loadSession() async {
    try {
      _cookie = await _storage.read(key: _cookieKey);
    } catch (_) {
      _cookie = null;
    }
  }

  Future<void> clearSession() async {
    _cookie = null;
    try {
      await _storage.delete(key: _cookieKey);
    } catch (_) {}
  }

  Uri _uri(String path, Map<String, dynamic>? query) {
    final q = <String, String>{};
    query?.forEach((k, v) {
      if (v != null && v.toString().isNotEmpty) q[k] = v.toString();
    });
    return Uri.parse('$apiUrl/api$path')
        .replace(queryParameters: q.isEmpty ? null : q);
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // the server's CSRF guard: plain HTML forms can't set this header
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': ?_cookie,
  };

  Future<void> _keepCookie(http.BaseResponse res) async {
    final raw = res.headers['set-cookie'];
    if (raw == null) return;
    final pair = raw.split(';').first.trim();
    final eq = pair.indexOf('=');
    if (eq <= 0) return;
    final value = pair.substring(eq + 1);
    final cleared = value.isEmpty || raw.contains('Expires=Thu, 01 Jan 1970');
    if (cleared) {
      await clearSession();
    } else {
      _cookie = pair;
      try {
        await _storage.write(key: _cookieKey, value: pair);
      } catch (_) {}
    }
  }

  Future<http.Response> _send(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Object? body,
  }) async {
    final req = http.Request(method, _uri(path, query))
      ..headers.addAll(_headers);
    if (body != null) req.body = jsonEncode(body);
    http.Response res;
    try {
      res = await http.Response.fromStream(
        await _client.send(req).timeout(const Duration(seconds: 60)),
      );
    } catch (_) {
      throw ApiException(
        'Cannot reach the server. Check your internet connection.',
      );
    }
    await _keepCookie(res);
    if (res.statusCode >= 400) {
      String message = 'Something went wrong (${res.statusCode})';
      String? code;
      try {
        final j = jsonDecode(utf8.decode(res.bodyBytes));
        if (j is Map && j['message'] != null) message = j['message'].toString();
        if (j is Map && j['code'] != null) code = j['code'].toString();
      } catch (_) {}
      if (res.statusCode == 401 && !path.startsWith('/auth/login')) {
        await clearSession();
        onUnauthorized?.call();
      }
      throw ApiException(message, status: res.statusCode, code: code);
    }
    return res;
  }

  dynamic _decode(http.Response res) {
    if (res.bodyBytes.isEmpty) return null;
    return jsonDecode(utf8.decode(res.bodyBytes));
  }

  Future<dynamic> get(String path, [Map<String, dynamic>? query]) async =>
      _decode(await _send('GET', path, query: query));
  Future<dynamic> post(String path, [Object? body]) async =>
      _decode(await _send('POST', path, body: body ?? {}));
  Future<dynamic> put(String path, [Object? body]) async =>
      _decode(await _send('PUT', path, body: body ?? {}));
  Future<dynamic> patch(String path, [Object? body]) async =>
      _decode(await _send('PATCH', path, body: body ?? {}));
  Future<dynamic> delete(String path) async =>
      _decode(await _send('DELETE', path));

  /// GET a paged list: rows plus the total from X-Total-Count (falls back to the row count).
  Future<Paged> page(String path, [Map<String, dynamic>? query]) async {
    final res = await _send('GET', path, query: query);
    final data = _decode(res);
    final rows = data is List
        ? data
        : (data is Map && data['data'] is List
              ? data['data'] as List
              : const []);
    final total =
        int.tryParse(res.headers['x-total-count'] ?? '') ?? rows.length;
    return Paged(rows, total);
  }

  /// GET with response headers (for the few screens that read X-Due-Count etc.).
  Future<(dynamic, Map<String, String>)> getWithHeaders(
    String path, [
    Map<String, dynamic>? query,
  ]) async {
    final res = await _send('GET', path, query: query);
    return (_decode(res), res.headers);
  }

  /// Download a file (PDF / Excel report).
  Future<Uint8List> bytes(String path, [Map<String, dynamic>? query]) async =>
      (await _send('GET', path, query: query)).bodyBytes;
}

final api = Api.instance;
