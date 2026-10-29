import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/api.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../shell.dart';
import '../../widgets/logo.dart';
import 'shop.dart';

/// Live platform numbers. Hidden until loaded (and if the server is down), never invented.
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
    if (n >= 10000000) return '${(n / 10000000).toStringAsFixed(1).replaceAll('.0', '')} Cr';
    if (n >= 100000) return '${(n / 100000).toStringAsFixed(1).replaceAll('.0', '')} L';
    return inr(n);
  }

  @override
  Widget build(BuildContext context) {
    if (stats == null) return const SizedBox.shrink();
    Widget cell(String value, String label) => Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
            Text(label, style: const TextStyle(color: C.muted, fontSize: 13)),
          ]),
        );
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Row(children: [
        cell(fmt(stats?['children']), t('land_statChildren', 'children registered')),
        cell(fmt(stats?['ashaWorkers']), t('land_statAsha', 'ASHA workers')),
        cell(fmt(stats?['districts']), t('land_statDistricts', 'districts')),
      ]),
    );
  }
}

/// Icon, title and one line of text, used for the "what you can do" list.
class _Point extends StatelessWidget {
  const _Point(this.icon, this.title, this.text);
  final IconData icon;
  final String title, text;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          IconWell(icon, size: 44),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(text, style: const TextStyle(color: C.muted, height: 1.4)),
            ]),
          ),
        ]),
      );
}

/// Photo with rounded corners (assets/photos, credits in assets/photo_credits.json).
class _Photo extends StatelessWidget {
  const _Photo(this.file, {this.height = 240});
  final String file;
  final double height;
  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Image.asset('assets/photos/$file.jpg', height: height, width: double.infinity, fit: BoxFit.cover),
      );
}

/// Landing photos that slide every 5 seconds (or by swiping), with dots for the current one.
class _HeroCarousel extends StatefulWidget {
  const _HeroCarousel();
  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel> {
  static const photos = ['photo_mother', 'photo_health_worker', 'photo_anganwadi'];
  final _pages = PageController();
  int index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_pages.hasClients) {
        _pages.animateToPage((index + 1) % photos.length, duration: const Duration(milliseconds: 600), curve: Curves.easeInOut);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pages.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(children: [
        SizedBox(
          height: 280,
          child: PageView(
            controller: _pages,
            onPageChanged: (i) => setState(() => index = i),
            children: [
              for (final p in photos) Padding(padding: const EdgeInsets.symmetric(horizontal: 2), child: _Photo(p, height: 280)),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          for (var i = 0; i < photos.length; i++)
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: i == index ? 20 : 7,
              height: 7,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(color: i == index ? C.primary : C.border, borderRadius: BorderRadius.circular(4)),
            ),
        ]),
      ]);
}

// ── Home (public landing) ──────────────────────────────────────────────────
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final current = lang.languages.where((l) => l.code == lang.language).firstOrNull?.label ?? 'English';
    return Scaffold(
      floatingActionButton: const ChatFab(),
      body: SafeArea(
        child: ListView(padding: EdgeInsets.zero, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 8, 8),
            child: Row(children: [
              const Logo(size: 34),
              const Spacer(),
              TextButton.icon(
                onPressed: () => showLanguagePicker(context),
                icon: const Icon(Icons.translate, size: 18),
                label: Text(current),
              ),
            ]),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: _HeroCarousel(),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(
                t('land_title', "Your child's health, kept in one place"),
                style: const TextStyle(fontSize: 28, height: 1.15, fontWeight: FontWeight.w700, letterSpacing: -0.6),
              ),
              const SizedBox(height: 10),
              Text(
                t('land_sub', 'Vaccines, growth and meals for children up to five years, shared between you and your ASHA worker.'),
                style: const TextStyle(fontSize: 16, color: C.muted, height: 1.45),
              ),
              const SizedBox(height: 22),
              FilledButton(onPressed: () => Navigator.pushNamed(context, '/register'), child: Text(t('land_create', 'Create an account'))),
              const SizedBox(height: 10),
              OutlinedButton(onPressed: () => Navigator.pushNamed(context, '/login'), child: Text(t('land_login', 'I already have an account'))),
              const SizedBox(height: 36),
              Text(t('land_whatTitle', 'What you can do'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.3)),
              const SizedBox(height: 16),
              _Point(Icons.vaccines_outlined, t('land_p1', 'Keep vaccines on time'),
                  t('land_p1d', "See the full national schedule for your child, what's due next, and anything that was missed.")),
              _Point(Icons.monitor_weight_outlined, t('land_p2', 'Follow growth'),
                  t('land_p2d', 'Record weight and height. The app compares them with WHO growth charts and tells you if something needs attention.')),
              _Point(Icons.rice_bowl_outlined, t('land_p3', 'Know what to feed'),
                  t('land_p3d', "Simple meal plans for your child's age, with foods you can find at home.")),
              _Point(Icons.chat_bubble_outline_rounded, t('land_p4', 'Ask in your language'),
                  t('land_p4d', 'Questions about fever, feeding or schemes. Answers work even without internet.')),
            ]),
          ),
          const _PublicStats(),
          const SizedBox(height: 20),
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const _Photo('photo_health_worker', height: 220),
              const SizedBox(height: 16),
              Text(t('land_ashaTitle', 'For ASHA workers'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.3)),
              const SizedBox(height: 6),
              Text(
                t('land_ashaText', 'Log home visits, record vaccines and growth for every child in your area, follow up pregnancies and send referrals to the PHC. Your login comes from your block office.'),
                style: const TextStyle(color: C.muted, height: 1.45),
              ),
              const SizedBox(height: 14),
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/login'),
                  icon: const Icon(Icons.login, size: 18),
                  label: Text(t('land_ashaLogin', 'ASHA worker login')),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 24),
          const ShopTeaser(),
          const SizedBox(height: 24),
          const Divider(),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Logo(size: 28),
              const SizedBox(height: 14),
              Text(t('homeFooter_contact', 'Contact'), style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              InkWell(onTap: () => openLink('mailto:support@shishuaarogya.gov.in'), child: const Padding(padding: EdgeInsets.symmetric(vertical: 4), child: Text('support@shishuaarogya.gov.in', style: TextStyle(color: C.primary)))),
              InkWell(onTap: () => callPhone('18001234567'), child: const Padding(padding: EdgeInsets.symmetric(vertical: 4), child: Text('1800 123 4567 (toll free)', style: TextStyle(color: C.primary)))),
              const SizedBox(height: 12),
              Wrap(spacing: 18, runSpacing: 6, children: [
                for (final (label, route) in [(t('homeFooter_linkAbout', 'About'), '/about'), ('Privacy Policy', '/privacy'), ('Terms of Use', '/terms'), ('Photo credits', '/credits')])
                  InkWell(onTap: () => Navigator.pushNamed(context, route), child: Text(label, style: const TextStyle(color: C.text, decoration: TextDecoration.underline, decorationColor: C.border))),
              ]),
              const SizedBox(height: 14),
              Text('© ${DateTime.now().year} Shishu Aarogya', style: const TextStyle(color: C.muted, fontSize: 12)),
            ]),
          ),
        ]),
      ),
    );
  }
}

// ── About ──────────────────────────────────────────────────────────────────
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(t('homeNav_about', 'About'))),
        body: ListView(padding: const EdgeInsets.fromLTRB(20, 4, 20, 32), children: [
          const _Photo('photo_anganwadi', height: 200),
          const SizedBox(height: 20),
          Text(t('aboutTitle', 'About Shishu Aarogya'), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.4)),
          const SizedBox(height: 10),
          Text(
            t('about_p1', "Shishu Aarogya keeps a child's health record in one place: vaccines, weight and height, meals and visits. Parents see it on their phone; the ASHA worker for their area sees the same record and adds to it after each home visit."),
            style: const TextStyle(height: 1.5),
          ),
          const SizedBox(height: 12),
          Text(
            t('about_p2', 'Block and district health officers see totals for their area, so children who are behind on vaccines or not growing well can be reached sooner.'),
            style: const TextStyle(height: 1.5),
          ),
          const SizedBox(height: 12),
          Text(
            t('about_p3', 'Growth is checked against the WHO child growth standards, and the vaccine list follows the national immunisation schedule. The app does not replace a doctor: if something looks wrong, it tells you to visit your health centre.'),
            style: const TextStyle(height: 1.5),
          ),
          const SizedBox(height: 20),
          const _PublicStats(),
          const SizedBox(height: 20),
          FilledButton(onPressed: () => Navigator.pushNamed(context, '/register'), child: Text(t('land_create', 'Create an account'))),
        ]),
      );
}

// ── Photo credits (assets/photo_credits.json) ──────────────────────────────
class CreditsScreen extends StatelessWidget {
  const CreditsScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Photo credits')),
        body: FutureBuilder<String>(
          future: rootBundle.loadString('assets/photo_credits.json'),
          builder: (context, snap) {
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final rows = jsonDecode(snap.data!) as List;
            return ListView(padding: const EdgeInsets.all(16), children: [
              const Text('Photos from Wikimedia Commons, used under their free licences.', style: TextStyle(color: C.muted)),
              const SizedBox(height: 12),
              for (final r in rows)
                Card(
                  child: ListTile(
                    leading: ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.asset('assets/photos/${r['file']}', width: 52, height: 52, fit: BoxFit.cover)),
                    title: Text('${r['title']}', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                    subtitle: Text('${r['author']} · ${r['license']}', style: const TextStyle(fontSize: 12.5)),
                    onTap: () => openLink('${r['source']}'),
                  ),
                ),
            ]);
          },
        ),
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
