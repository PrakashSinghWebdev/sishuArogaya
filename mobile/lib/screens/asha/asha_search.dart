import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';

/// Record search across the ASHA's children and mothers (the website's navbar search).
class AshaSearchScreen extends StatefulWidget {
  const AshaSearchScreen({super.key});
  @override
  State<AshaSearchScreen> createState() => _AshaSearchScreenState();
}

class _AshaSearchScreenState extends State<AshaSearchScreen> {
  Timer? _debounce;
  Map? results;
  bool loading = false;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void onChanged(String q) {
    _debounce?.cancel();
    if (q.trim().length < 2) return setState(() => results = null);
    _debounce = Timer(const Duration(milliseconds: 250), () async {
      setState(() => loading = true);
      final r = await api.get('/asha/search', {'q': q.trim()}).catchError((_) => {'children': [], 'mothers': []});
      if (mounted) {
        setState(() {
          results = r as Map;
          loading = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final kids = (results?['children'] as List?) ?? [];
    final mothers = (results?['mothers'] as List?) ?? [];
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          autofocus: true,
          onChanged: onChanged,
          style: const TextStyle(color: Colors.white),
          cursorColor: Colors.white,
          decoration: InputDecoration(hintText: t('navSearch', 'Search children, mothers…'), hintStyle: const TextStyle(color: Colors.white70), filled: false, border: InputBorder.none, enabledBorder: InputBorder.none),
        ),
      ),
      body: loading
          ? const LinearProgressIndicator()
          : results == null
              ? const EmptyState('Type at least 2 letters: name, child ID, mother or phone.', icon: Icons.search)
              : kids.isEmpty && mothers.isEmpty
                  ? EmptyState(t('noRecords', 'No records'))
                  : ListView(children: [
                      for (final c in kids)
                        ListTile(
                          leading: glyph(c['gender'] == 'female' ? '👧' : '👦', size: 24),
                          title: Text('${c['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text([c['childId'], if (c['motherName'] != null) '${t('mother', 'Mother')}: ${c['motherName']}', c['village']].where((e) => e != null).join(' · ')),
                          onTap: () => Navigator.pushReplacementNamed(context, '/asha/child', arguments: {'id': c['_id']}),
                        ),
                      for (final m in mothers)
                        ListTile(
                          leading: glyph('🤰', size: 24),
                          title: Text('${m['womanName']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text([t(m['status'] == 'pregnant' ? 'tabPregnant' : m['status'] == 'delivered' ? 'tabPostnatal' : 'refClosed'), m['village']].where((e) => e != null).join(' · ')),
                          onTap: () => Navigator.pushReplacementNamed(context, '/asha/pregnancy', arguments: {'id': m['_id']}),
                        ),
                    ]),
    );
  }
}
