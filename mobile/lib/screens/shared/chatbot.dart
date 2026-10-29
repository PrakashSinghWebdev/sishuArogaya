import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';

/// Greetings, suggestions, speech codes and the offline knowledge base (assets/chatbot.json,
/// exported from the website's ChatBot.jsx and data/chatbotKnowledge.js).
class _Bot {
  static Map<String, dynamic>? _data;
  static Future<Map<String, dynamic>> load() async => _data ??= jsonDecode(await rootBundle.loadString('assets/chatbot.json'));

  /// Offline answer: exact > phrase > word match, same scoring as the website.
  static String findAnswer(Map data, String query) {
    final kb = (data['knowledge'] as List).cast<Map>();
    final unknown = '${kb.firstWhere((k) => k['intent'] == 'unknown')['response']}';
    final q = query.toLowerCase().trim();
    if (q.isEmpty) return unknown;
    var best = 0;
    Map? bestEntry;
    for (final e in kb) {
      if (e['intent'] == 'unknown') continue;
      var score = 0;
      for (final p in (e['patterns'] as List).cast<String>()) {
        if (q == p) {
          score += 20;
          break;
        }
        if (q.contains(p)) {
          score += 8;
          continue;
        }
        if (p.contains(q)) {
          score += 6;
          continue;
        }
        for (final pw in p.split(RegExp(r'\s+'))) {
          if (pw.length < 3) continue;
          for (final qw in q.split(RegExp(r'\s+'))) {
            if (qw.length < 3) continue;
            if (qw == pw) {
              score += 3;
            } else if (qw.contains(pw) || pw.contains(qw)) {
              score += 1;
            }
          }
        }
      }
      if (score > best) {
        best = score;
        bestEntry = e;
      }
    }
    return best >= 2 && bestEntry != null ? '${bestEntry['response']}' : unknown;
  }
}

/// The offline matcher, exposed for tests.
String findOfflineAnswer(Map data, String query) => _Bot.findAnswer(data, query);

// script → language, for replying in the language the question was typed in
const _scripts = [
  ('हिंदी', r'[ऀ-ॿ]'), ('বাংলা', r'[ঀ-৿]'), ('ਪੰਜਾਬੀ', r'[਀-੿]'), ('தமிழ்', r'[஀-௿]'), //
  ('తెలుగు', r'[ఀ-౿]'), ('ಕನ್ನಡ', r'[ಀ-೿]'), ('മലയാളം', r'[ഀ-ൿ]'), ('ગુજરાતી', r'[઀-૿]'),
  ('ଓଡ଼ିଆ', r'[଀-୿]'), ('اردو', r'[؀-ۿ]'),
];

class _Msg {
  _Msg(this.role, this.text) : ts = DateTime.now();
  final String role; // user | bot
  final String text;
  final DateTime ts;
  Map toJson() => {'role': role, 'text': text, 'ts': ts.millisecondsSinceEpoch};
}

class ChatBotScreen extends StatefulWidget {
  const ChatBotScreen({super.key});
  @override
  State<ChatBotScreen> createState() => _ChatBotScreenState();
}

class _ChatBotScreenState extends State<ChatBotScreen> {
  Map<String, dynamic>? data;
  late String chatLang = lang.language;
  final messages = <_Msg>[];
  final input = TextEditingController();
  final scroll = ScrollController();
  final tts = FlutterTts();
  final stt = SpeechToText();
  bool loading = false, listening = false;
  int speaking = -1;

  @override
  void initState() {
    super.initState();
    _init();
    tts.setCompletionHandler(() => mounted ? setState(() => speaking = -1) : null);
  }

  Future<void> _init() async {
    final d = await _Bot.load();
    try {
      final saved = (await SharedPreferences.getInstance()).getString('sa_chat_language');
      if (saved != null && (d['greetings'] as Map).containsKey(saved)) chatLang = saved;
    } catch (_) {}
    setState(() {
      data = d;
      messages.add(_Msg('bot', _greeting()));
    });
  }

  @override
  void dispose() {
    tts.stop();
    stt.stop();
    super.dispose();
  }

  String _greeting() => '${(data!['greetings'] as Map)[chatLang] ?? data!['greetings']['English']}';
  List<String> get _suggestions => List<String>.from((data!['suggestions'] as Map)[chatLang] ?? data!['suggestions']['English']);
  String get _speechCode => '${(data!['speech'] as Map)[chatLang] ?? 'en-IN'}';

  Future<void> setChatLang(String code) async {
    setState(() {
      chatLang = code;
      messages
        ..clear()
        ..add(_Msg('bot', _greeting()));
    });
    try {
      (await SharedPreferences.getInstance()).setString('sa_chat_language', code);
    } catch (_) {}
  }

  Future<Map<String, double>?> _location() async {
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return null;
      final p = await Geolocator.getLastKnownPosition();
      return p == null ? null : {'lat': p.latitude, 'lng': p.longitude};
    } catch (_) {
      return null;
    }
  }

  Future<void> send([String? text]) async {
    final msg = (text ?? input.text).trim();
    if (msg.isEmpty || loading) return;
    final detected = _scripts.where((s) => RegExp(s.$2).hasMatch(msg)).firstOrNull?.$1;
    if (detected != null && detected != chatLang) chatLang = detected;
    input.clear();
    setState(() {
      messages.add(_Msg('user', msg));
      loading = true;
    });
    _toEnd();
    String answer;
    try {
      final res = await api.post('/chatbot/query', {
        'message': msg,
        'history': [for (final m in messages) m.toJson()],
        'language': chatLang,
        'location': await _location(),
      });
      answer = '${res['answer'] ?? _Bot.findAnswer(data!, msg)}';
    } catch (_) {
      answer = _Bot.findAnswer(data!, msg); // offline: built-in knowledge
    }
    if (!mounted) return;
    setState(() {
      messages.add(_Msg('bot', answer));
      loading = false;
    });
    _toEnd();
  }

  void _toEnd() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (scroll.hasClients) scroll.animateTo(scroll.position.maxScrollExtent + 200, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      });

  Future<void> speak(int i) async {
    if (speaking == i) {
      await tts.stop();
      return setState(() => speaking = -1);
    }
    final clean = messages[i].text.replaceAll(RegExp(r'\*\*|\*|•|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]', unicode: true), '').trim();
    await tts.setLanguage(_speechCode);
    setState(() => speaking = i);
    await tts.speak(clean);
  }

  Future<void> toggleVoice() async {
    if (listening) {
      await stt.stop();
      return setState(() => listening = false);
    }
    final ok = await stt.initialize(onError: (e) {
      if (!mounted) return;
      setState(() => listening = false);
      toast(context, e.errorMsg == 'error_no_match' || e.errorMsg == 'error_speech_timeout' ? "I didn't hear anything. Tap and speak again." : 'Voice input error: ${e.errorMsg}', error: true);
    });
    if (!ok) {
      if (mounted) toast(context, 'Voice input is not available on this phone.', error: true);
      return;
    }
    setState(() => listening = true);
    await stt.listen(
      localeId: _speechCode.replaceAll('-', '_'),
      onResult: (r) {
        input.text = r.recognizedWords;
        if (r.finalResult) {
          setState(() => listening = false);
          if (r.recognizedWords.trim().isNotEmpty) send(r.recognizedWords);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (data == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Health Assistant'),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Chat language',
            icon: const Icon(Icons.translate),
            onSelected: setChatLang,
            itemBuilder: (_) => [for (final l in lang.languages) PopupMenuItem(value: l.code, child: Text(l.label, style: TextStyle(fontWeight: l.code == chatLang ? FontWeight.w800 : null)))],
          ),
          IconButton(tooltip: 'Clear chat', icon: const Icon(Icons.delete_sweep_outlined), onPressed: () => setChatLang(chatLang)),
        ],
      ),
      body: SafeArea(
        child: Column(children: [
          Expanded(
            child: ListView.builder(
              controller: scroll,
              padding: const EdgeInsets.all(12),
              itemCount: messages.length + (loading ? 1 : 0),
              itemBuilder: (context, i) {
                if (i == messages.length) return const Align(alignment: Alignment.centerLeft, child: Padding(padding: EdgeInsets.all(12), child: Text('…', style: TextStyle(fontSize: 26, color: C.muted))));
                final m = messages[i];
                final bot = m.role == 'bot';
                return Align(
                  alignment: bot ? Alignment.centerLeft : Alignment.centerRight,
                  child: Container(
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .82),
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
                    decoration: BoxDecoration(color: bot ? Colors.white : C.primary, borderRadius: BorderRadius.circular(14), border: bot ? Border.all(color: C.border) : null),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      SelectableText.rich(_markdown(m.text, bot)),
                      Row(mainAxisSize: MainAxisSize.min, children: [
                        Text('${m.ts.hour.toString().padLeft(2, '0')}:${m.ts.minute.toString().padLeft(2, '0')}', style: TextStyle(fontSize: 10.5, color: bot ? C.muted : Colors.white70)),
                        if (bot) IconButton(visualDensity: VisualDensity.compact, iconSize: 18, tooltip: 'Read aloud', icon: Icon(speaking == i ? Icons.stop_circle_outlined : Icons.volume_up_outlined, color: C.primary), onPressed: () => speak(i)),
                      ]),
                    ]),
                  ),
                );
              },
            ),
          ),
          if (messages.length <= 1)
            SizedBox(
              height: 44,
              child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [
                for (final s in _suggestions) Padding(padding: const EdgeInsets.only(right: 8), child: ActionChip(label: Text(noEmoji(s)), onPressed: () => send(s))),
              ]),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
            child: Row(children: [
              IconButton(tooltip: 'Speak', icon: Icon(listening ? Icons.mic : Icons.mic_none, color: listening ? C.red : C.dark), onPressed: toggleVoice),
              Expanded(child: TextField(controller: input, minLines: 1, maxLines: 4, textInputAction: TextInputAction.send, onSubmitted: (_) => send(), decoration: InputDecoration(hintText: listening ? 'Listening…' : 'Type your question…'))),
              IconButton.filled(style: IconButton.styleFrom(backgroundColor: C.dark), icon: const Icon(Icons.send), onPressed: loading ? null : send),
            ]),
          ),
        ]),
      ),
    );
  }

  /// **bold**, *italic*; alert lines (marked with an alarm emoji in the data) in red, helpline lines in green.
  /// The emoji markers themselves are not shown.
  TextSpan _markdown(String text, bool bot) {
    final base = TextStyle(color: bot ? C.text : Colors.white, height: 1.45, fontSize: 14.5);
    final spans = <InlineSpan>[];
    for (final raw in text.split('\n')) {
      final line = noEmoji(raw);
      final style = raw.startsWith('🚨') ? base.copyWith(color: const Color(0xFFB5452F), fontWeight: FontWeight.w600) : raw.startsWith('📞') ? base.copyWith(color: C.green, fontWeight: FontWeight.w600) : base;
      final re = RegExp(r'\*\*(.+?)\*\*|\*(.+?)\*');
      var last = 0;
      for (final m in re.allMatches(line)) {
        if (m.start > last) spans.add(TextSpan(text: line.substring(last, m.start), style: style));
        spans.add(TextSpan(text: m[1] ?? m[2], style: style.copyWith(fontWeight: m[1] != null ? FontWeight.w700 : null, fontStyle: m[2] != null ? FontStyle.italic : null)));
        last = m.end;
      }
      spans.add(TextSpan(text: '${line.substring(last)}\n', style: style));
    }
    return TextSpan(children: spans);
  }
}
