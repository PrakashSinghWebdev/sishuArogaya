import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class Language {
  Language(this.code, this.label, this.locale);
  final String code; // the key used by the website and the server (e.g. 'हिंदी')
  final String label;
  final String locale;
}

/// The website's 23 translation tables (assets/i18n.json, extracted from LanguageContext.jsx).
/// Missing keys fall back to English, then to the given fallback, then to the key itself.
class Lang extends ChangeNotifier {
  Lang._();
  static final instance = Lang._();

  List<Language> languages = [];
  Map<String, Map<String, String>> _strings = {};
  String language = 'English';
  bool chosen = false; // false until the user picks a language once

  /// Accessibility: larger text for the whole app (same three sizes as the website).
  static const textSizes = {'normal': 1.0, 'large': 1.125, 'xlarge': 1.25};
  String textSize = 'normal';
  double get textScale => textSizes[textSize] ?? 1.0;

  Future<void> load() async {
    final j = jsonDecode(await rootBundle.loadString('assets/i18n.json')) as Map<String, dynamic>;
    languages = [for (final l in j['languages'] as List) Language(l['code'], l['label'], l['locale'])];
    _strings = {
      for (final e in (j['strings'] as Map<String, dynamic>).entries)
        e.key: (e.value as Map<String, dynamic>).map((k, v) => MapEntry(k, v.toString())),
    };
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString('sa_language');
      if (saved != null && languages.any((l) => l.code == saved)) {
        language = saved;
        chosen = true;
      }
      final size = prefs.getString('sa_text_size');
      if (size != null && textSizes.containsKey(size)) textSize = size;
    } catch (_) {}
  }

  Future<void> setTextSize(String size) async {
    textSize = size;
    notifyListeners();
    try {
      (await SharedPreferences.getInstance()).setString('sa_text_size', size);
    } catch (_) {}
  }

  Future<void> setLanguage(String code) async {
    language = code;
    chosen = true;
    notifyListeners();
    try {
      (await SharedPreferences.getInstance()).setString('sa_language', code);
    } catch (_) {}
  }

  String t(String key, [String? fallback]) =>
      _strings[language]?[key] ?? _strings['English']?[key] ?? fallback ?? key;

  /// Nav labels in the tables carry a leading emoji ("🏠 Dashboard"); menus show plain text.
  String plain(String key, [String? fallback]) =>
      t(key, fallback).replaceFirst(RegExp(r'^[^\p{L}\p{N}]+', unicode: true), '').trim();
}

final lang = Lang.instance;
String t(String key, [String? fallback]) => lang.t(key, fallback);
