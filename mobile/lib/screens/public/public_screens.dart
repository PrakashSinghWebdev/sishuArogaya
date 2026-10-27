import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';

/// Live platform numbers ('—' until loaded or if the server is down, never invented).
class _PublicStats extends StatefulWidget {
  const _PublicStats();
  @override
  State<_PublicStats> createState() => _PublicStatsState();
}

class _PublicStatsState extends State<_PublicStats> {
  Map? stats;
  @override
  void initState() {
    super.initState();
    api.get('/stats/public').then((s) {
      if (mounted) setState(() => stats = s as Map?);
    }).catchError((_) {});
  }

  String fmt(dynamic n) {
    if (n is! num) return '—';
    if (n >= 10000000) return '${(n / 10000000).toStringAsFixed(1).replaceAll('.0', '')}Cr';
    if (n >= 100000) return '${(n / 100000).toStringAsFixed(1).replaceAll('.0', '')}L';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1).replaceAll('.0', '')}K';
    return '$n';
  }

  @override
  Widget build(BuildContext context) => StatGrid([
        StatTile(label: t('aboutStat1Label', 'Children'), value: fmt(stats?['children']), icon: Icons.child_care),
        StatTile(label: t('aboutStat2Label', 'ASHA Workers'), value: fmt(stats?['ashaWorkers']), icon: Icons.health_and_safety_outlined),
        StatTile(label: t('aboutStat3Label', 'Districts'), value: fmt(stats?['districts']), icon: Icons.map_outlined),
        StatTile(label: t('aboutStat4Label', 'Languages'), value: '${lang.languages.length}', icon: Icons.translate),
      ]);
}

// ── Home (public landing) ──────────────────────────────────────────────────
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _pages = PageController();
  int slide = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (_pages.hasClients) _pages.animateToPage((slide + 1) % 3, duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pages.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const images = ['assets/hero_mom_child.png', 'assets/hero_growth_chart.png', 'assets/hero_health_worker.png'];
    final features = [
      (Icons.trending_up, t('homeFeature1_title'), t('homeFeature1_text')),
      (Icons.event_available, t('homeFeature2_title'), t('homeFeature2_text')),
      (Icons.smart_toy_outlined, t('homeFeature3_title'), t('homeFeature3_text')),
      (Icons.assignment_outlined, t('homeFeature4_title'), t('homeFeature4_text')),
    ];
    final platform = [
      ('📊', t('aboutFeature1'), t('homeFeature1_desc_long')),
      ('💉', t('aboutFeature2'), t('homeFeature2_desc_long')),
      ('📍', t('aboutFeature3'), t('homeFeature3_desc_long')),
      ('🤖', t('aboutFeature4'), t('homeFeature4_desc_long')),
      ('📋', t('aboutFeature5'), t('homeFeature5_desc_long')),
      ('🔔', t('aboutFeature6'), t('homeFeature6_desc_long')),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shishu Aarogya'),
        actions: [
          IconButton(tooltip: 'Health assistant', icon: const Icon(Icons.chat_bubble_outline), onPressed: () => Navigator.pushNamed(context, '/chat')),
          IconButton(tooltip: 'Shop', icon: const Icon(Icons.shopping_bag_outlined), onPressed: () => Navigator.pushNamed(context, '/shop')),
          IconButton(tooltip: 'Language', icon: const Icon(Icons.translate), onPressed: () => Navigator.pushNamed(context, '/language')),
        ],
      ),
      body: ListView(children: [
        SizedBox(
          height: 260,
          child: Stack(children: [
            PageView(
              controller: _pages,
              onPageChanged: (i) => setState(() => slide = i),
              children: [
                for (var i = 0; i < 3; i++)
                  Stack(fit: StackFit.expand, children: [
                    Image.asset(images[i], fit: BoxFit.cover),
                    Container(color: const Color(0x990C2340)),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
                      child: Column(mainAxisAlignment: MainAxisAlignment.end, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Badge2(t('homeHero${i + 1}_badge'), tone: const Tone(Colors.white, Color(0x33FFFFFF))),
                        const SizedBox(height: 10),
                        Text(t('homeHero${i + 1}_headline'), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 6),
                        Text(t('homeHero${i + 1}_desc'), maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white70)),
                      ]),
                    ),
                  ]),
              ],
            ),
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                for (var i = 0; i < 3; i++)
                  Container(width: i == slide ? 18 : 8, height: 8, margin: const EdgeInsets.symmetric(horizontal: 3), decoration: BoxDecoration(color: i == slide ? Colors.white : Colors.white54, borderRadius: BorderRadius.circular(4))),
              ]),
            ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Row(children: [
              Expanded(child: FilledButton(onPressed: () => Navigator.pushNamed(context, '/login'), child: Text(t('login', 'Login')))),
              const SizedBox(width: 10),
              Expanded(child: OutlinedButton(onPressed: () => Navigator.pushNamed(context, '/register'), child: Text(t('register', 'Register')))),
            ]),
            const SizedBox(height: 20),
            SectionTitle(t('homeServices_title')),
            Text(t('homeServices_subtitle'), style: const TextStyle(color: C.muted)),
            gap,
            for (final (icon, title, text) in features)
              Card(child: ListTile(leading: CircleAvatar(backgroundColor: const Color(0xFFE0F7FA), child: Icon(icon, color: C.dark)), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(text))),
            gap,
            const _PublicStats(),
            const SizedBox(height: 20),
            Badge2(t('homeAbout_badge'), tone: infoTone),
            const SizedBox(height: 8),
            Text(t('homeAbout_headline'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: C.text)),
            const SizedBox(height: 6),
            Text(t('homeAbout_desc'), style: const TextStyle(color: C.muted)),
            gap,
            for (var i = 1; i <= 4; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.check_circle, color: C.green, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(t('homeAbout_feat${i}_title'), style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text(t('homeAbout_feat${i}_desc'), style: const TextStyle(color: C.muted, fontSize: 13)),
                    ]),
                  ),
                ]),
              ),
            const SizedBox(height: 12),
            SectionTitle(t('homePlatform_title')),
            Text(t('homePlatform_subtitle'), style: const TextStyle(color: C.muted)),
            gap,
            for (final (e, title, desc) in platform)
              Card(child: ListTile(leading: Text(e, style: const TextStyle(fontSize: 26)), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(desc))),
            const SizedBox(height: 12),
            Card(
              color: C.dark,
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t('homeCTA_title'), style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(t('homeCTA_desc'), style: const TextStyle(color: Colors.white70)),
                  const SizedBox(height: 12),
                  FilledButton(style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: C.dark), onPressed: () => Navigator.pushNamed(context, '/register'), child: Text(t('homeCTA_btn'))),
                ]),
              ),
            ),
            const SizedBox(height: 12),
            Text(t('homeFooter_contact'), style: const TextStyle(fontWeight: FontWeight.w700, color: C.text)),
            const SizedBox(height: 6),
            const ListTile(dense: true, contentPadding: EdgeInsets.zero, leading: Icon(Icons.place_outlined, color: C.primary), title: Text('Health Dept, New Delhi')),
            ListTile(dense: true, contentPadding: EdgeInsets.zero, leading: const Icon(Icons.email_outlined, color: C.primary), title: const Text('support@shishuaarogya.gov.in'), onTap: () => openLink('mailto:support@shishuaarogya.gov.in')),
            ListTile(dense: true, contentPadding: EdgeInsets.zero, leading: const Icon(Icons.phone_outlined, color: C.primary), title: const Text('+91 1800 123 4567'), onTap: () => callPhone('18001234567')),
            Wrap(alignment: WrapAlignment.center, children: [
              TextButton(onPressed: () => Navigator.pushNamed(context, '/about'), child: Text(t('homeFooter_linkAbout', 'About'))),
              TextButton(onPressed: () => Navigator.pushNamed(context, '/privacy'), child: const Text('Privacy Policy')),
              TextButton(onPressed: () => Navigator.pushNamed(context, '/terms'), child: const Text('Terms of Use')),
            ]),
            Text('© ${DateTime.now().year} ${t('homeFooter_copyright')}', textAlign: TextAlign.center, style: const TextStyle(color: C.muted, fontSize: 12)),
          ]),
        ),
      ]),
    );
  }
}

// ── About ──────────────────────────────────────────────────────────────────
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(t('homeNav_about', 'About'))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          const Badge2('Shishu Aarogya', tone: infoTone),
          const SizedBox(height: 10),
          Text(t('aboutTitle'), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: C.text)),
          const SizedBox(height: 6),
          Text(t('aboutTagline'), style: const TextStyle(fontSize: 16, color: C.dark, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(t('aboutDesc'), style: const TextStyle(color: C.muted)),
          gap,
          FilledButton(onPressed: () => Navigator.pushNamed(context, '/register'), child: Text(t('register', 'Register'))),
          const SizedBox(height: 20),
          Text(t('aboutPilotTitle'), style: const TextStyle(fontWeight: FontWeight.w700, color: C.text)),
          Text(t('aboutPilotDesc'), style: const TextStyle(color: C.muted)),
          gap,
          const _PublicStats(),
          const SizedBox(height: 16),
          Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(t('aboutMission'), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)), const SizedBox(height: 6), Text(t('aboutDesc'))]))),
          Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(t('aboutVision'), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)), const SizedBox(height: 6), Text(t('homeAbout_headline'))]))),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t('aboutTeam'), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                for (var i = 1; i <= 6; i++) Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Text('• ${t('aboutFeature$i')}')),
              ]),
            ),
          ),
        ]),
      );
}

// ── Privacy Policy / Terms of Use (text shared with the website: assets/legal.json) ──
class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key, required this.privacy});
  final bool privacy;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(privacy ? 'Privacy Policy' : 'Terms of Use')),
        body: FutureBuilder<String>(
          future: rootBundle.loadString('assets/legal.json'),
          builder: (context, snap) {
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final j = jsonDecode(snap.data!);
            final sections = j[privacy ? 'privacy' : 'terms'] as List;
            return ListView(padding: const EdgeInsets.all(16), children: [
              Text('Last updated: ${j['updated']}', style: const TextStyle(color: C.muted)),
              for (final s in sections) ...[
                const SizedBox(height: 18),
                Text('${s[0]}', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: C.text)),
                for (final p in (s as List).skip(1))
                  if (p is List)
                    for (final li in p) Padding(padding: const EdgeInsets.only(left: 8, top: 6), child: Text('•  $li', style: const TextStyle(height: 1.5)))
                  else
                    Padding(padding: const EdgeInsets.only(top: 6), child: Text('$p', style: const TextStyle(height: 1.5))),
              ],
            ]);
          },
        ),
      );
}
