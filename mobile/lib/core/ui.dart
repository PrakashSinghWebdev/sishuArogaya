import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';
import 'i18n.dart';

/// App palette: neem green, turmeric and clay on warm paper.
class C {
  static const primary = Color(0xFF2D6A4F); // neem green: buttons, links, active
  static const dark = Color(0xFF1B4332); // headings on tinted panels, pressed
  static const accent = Color(0xFFE09F3E); // turmeric: the logo's child, highlights
  static const bg = Color(0xFFF7F5F0); // warm paper
  static const soft = Color(0xFFE6F0EA); // pale green tint for icon wells, selected rows
  static const border = Color(0xFFE4DFD5);
  static const text = Color(0xFF1E2522);
  static const muted = Color(0xFF66706B);
  static const green = Color(0xFF2F855A);
  static const amber = Color(0xFFB7791F);
  static const red = Color(0xFFB5452F); // clay red
}

ThemeData appTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: C.primary,
    primary: C.primary,
    secondary: C.accent,
    surface: Colors.white,
    error: C.red,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, fontFamily: 'Figtree');
  final text = base.textTheme.apply(bodyColor: C.text, displayColor: C.text);
  final radius12 = RoundedRectangleBorder(borderRadius: BorderRadius.circular(12));
  OutlineInputBorder line(Color c, [double w = 1]) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: BorderSide(color: c, width: w),
  );
  return base.copyWith(
    scaffoldBackgroundColor: C.bg,
    textTheme: text.copyWith(
      titleLarge: text.titleLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.3),
      titleMedium: text.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      bodyMedium: text.bodyMedium?.copyWith(height: 1.4),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: C.bg,
      foregroundColor: C.text,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      shadowColor: C.border,
      titleTextStyle: TextStyle(fontFamily: 'Figtree', fontSize: 20, fontWeight: FontWeight.w700, color: C.text, letterSpacing: -0.3),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: C.border),
      ),
    ),
    dividerTheme: const DividerThemeData(color: C.border, space: 1),
    listTileTheme: const ListTileThemeData(iconColor: C.primary),
    iconTheme: const IconThemeData(color: C.text),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      labelStyle: const TextStyle(color: C.muted),
      border: line(C.border),
      enabledBorder: line(C.border),
      focusedBorder: line(C.primary, 1.6),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: C.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(48, 50),
        shape: radius12,
        textStyle: const TextStyle(fontFamily: 'Figtree', fontSize: 15.5, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: C.text,
        minimumSize: const Size(48, 50),
        side: const BorderSide(color: C.border, width: 1.2),
        shape: radius12,
        textStyle: const TextStyle(fontFamily: 'Figtree', fontSize: 15.5, fontWeight: FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: C.primary,
        textStyle: const TextStyle(fontFamily: 'Figtree', fontWeight: FontWeight.w600),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: C.primary,
      foregroundColor: Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      indicatorColor: C.soft,
      elevation: 0,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (s) => TextStyle(
          fontFamily: 'Figtree',
          fontSize: 12,
          fontWeight: s.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
          color: s.contains(WidgetState.selected) ? C.primary : C.muted,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (s) => IconThemeData(color: s.contains(WidgetState.selected) ? C.primary : C.muted),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: Colors.white,
      selectedColor: C.soft,
      side: const BorderSide(color: C.border),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      labelStyle: const TextStyle(fontFamily: 'Figtree', color: C.text, fontWeight: FontWeight.w500),
    ),
    drawerTheme: const DrawerThemeData(backgroundColor: C.bg, surfaceTintColor: Colors.transparent),
    dialogTheme: DialogThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
    ),
    bottomSheetTheme: const BottomSheetThemeData(backgroundColor: Colors.white, surfaceTintColor: Colors.transparent),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: C.text,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: C.primary),
  );
}

// ── Formatting (same output as the website) ────────────────────────────────
const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

DateTime? parseDate(dynamic d) =>
    d == null ? null : DateTime.tryParse(d.toString())?.toLocal();

String fmtDate(dynamic d) {
  final dt = parseDate(d);
  if (dt == null) return '—';
  return '${dt.day.toString().padLeft(2, '0')} ${_months[dt.month - 1]} ${dt.year}';
}

String fmtDateTime(dynamic d) {
  final dt = parseDate(d);
  if (dt == null) return '—';
  final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
  return '${fmtDate(d)}, $h:${dt.minute.toString().padLeft(2, '0')} ${dt.hour < 12 ? 'am' : 'pm'}';
}

int ageMonths(dynamic dob) {
  final dt = parseDate(dob);
  if (dt == null) return 0;
  return (DateTime.now().difference(dt).inDays / 30.44).floor();
}

String ageText(dynamic dob) {
  if (parseDate(dob) == null) return '—';
  final m = ageMonths(dob);
  return m < 24 ? '$m mo' : '${m ~/ 12} yr ${m % 12} mo';
}

/// yyyy-mm-dd, n days from today
String isoDay([int n = 0]) {
  final d = DateTime.now().add(Duration(days: n));
  return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

String isoOf(DateTime d) =>
    '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

String rupees(dynamic n) {
  final v = (n is num ? n : num.tryParse('$n') ?? 0).round();
  return '₹${inr(v)}';
}

/// Indian digit grouping: 12,34,567
String inr(dynamic n) {
  final v = (n is num ? n : num.tryParse('$n') ?? 0).round();
  final s = v.abs().toString();
  if (s.length <= 3) return '${v < 0 ? '-' : ''}$s';
  final last3 = s.substring(s.length - 3);
  var rest = s.substring(0, s.length - 3);
  final parts = <String>[];
  while (rest.length > 2) {
    parts.insert(0, rest.substring(rest.length - 2));
    rest = rest.substring(0, rest.length - 2);
  }
  if (rest.isNotEmpty) parts.insert(0, rest);
  return '${v < 0 ? '-' : ''}${parts.join(',')},$last3';
}

String str(dynamic v, [String fallback = '—']) =>
    v == null || '$v'.isEmpty ? fallback : '$v';

Future<void> callPhone(dynamic phone) async {
  final n = '$phone'.replaceAll(RegExp(r'[^\d+]'), '');
  if (n.isNotEmpty) await launchUrl(Uri.parse('tel:$n'));
}

Future<void> openLink(String url) async {
  await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
}

// ── Status colours ─────────────────────────────────────────────────────────
class Tone {
  const Tone(this.fg, this.bg);
  final Color fg;
  final Color bg;
}

const nutritionTone = {
  'healthy': goodTone,
  'moderate': warnTone,
  'severe': badTone,
};

const urgencyTone = {
  'emergency': Tone(Colors.white, C.red),
  'urgent': warnTone,
  'routine': infoTone,
};

const neutralTone = Tone(Color(0xFF55605B), Color(0xFFEFECE6));
const infoTone = Tone(C.dark, C.soft);
const goodTone = Tone(Color(0xFF276749), Color(0xFFE3F1E8));
const warnTone = Tone(Color(0xFF8A5A12), Color(0xFFFBEFD9));
const badTone = Tone(Color(0xFF9B3A26), Color(0xFFF8E3DD));

// ── Small widgets ──────────────────────────────────────────────────────────
class Badge2 extends StatelessWidget {
  const Badge2(this.label, {super.key, this.tone = neutralTone});
  final String label;
  final Tone tone;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: tone.bg,
      borderRadius: BorderRadius.circular(6),
    ),
    child: Text(
      label,
      style: TextStyle(
        color: tone.fg,
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
    ),
  );
}

class StatusBadge extends StatelessWidget {
  const StatusBadge(this.status, {super.key});
  final String? status;
  @override
  Widget build(BuildContext context) {
    final s = status ?? '';
    return Badge2(
      t(s, s.isEmpty ? '—' : s[0].toUpperCase() + s.substring(1)),
      tone: nutritionTone[s] ?? neutralTone,
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.icon, this.trailing});
  final String text;
  final IconData? icon;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(2, 18, 2, 8),
    child: Row(
      children: [
        if (icon != null) ...[
          Icon(icon, color: C.primary, size: 20),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: C.text,
              letterSpacing: -0.2,
            ),
          ),
        ),
        ?trailing,
      ],
    ),
  );
}

/// Round tinted well with an icon, used for list leading icons and tiles.
class IconWell extends StatelessWidget {
  const IconWell(this.icon, {super.key, this.color = C.primary, this.size = 40});
  final IconData icon;
  final Color color;
  final double size;
  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: color.withValues(alpha: 0.11), borderRadius: BorderRadius.circular(size * 0.32)),
    child: Icon(icon, color: color, size: size * 0.52),
  );
}

class StatTile extends StatelessWidget {
  const StatTile({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.color = C.primary,
    this.sub,
    this.onTap,
  });
  final String label;
  final String value;
  final IconData? icon;
  final Color color;
  final String? sub;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => Card(
    margin: EdgeInsets.zero,
    child: InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[IconWell(icon!, color: color, size: 34), const SizedBox(height: 10)],
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: C.text,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(fontSize: 13, color: C.text, fontWeight: FontWeight.w500),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (sub != null)
              Text(
                sub!,
                style: const TextStyle(fontSize: 12, color: C.muted),
              ),
          ],
        ),
      ),
    ),
  );
}

/// 2-column grid of StatTiles that wraps on small screens.
class StatGrid extends StatelessWidget {
  const StatGrid(this.children, {super.key, this.columns = 2});
  final List<Widget> children;
  final int columns;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, c) {
      final cols = c.maxWidth > 600 ? columns * 2 : columns;
      final w = (c.maxWidth - (cols - 1) * 10) / cols;
      return Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [for (final ch in children) SizedBox(width: w, child: ch)],
      );
    },
  );
}

class InfoRow extends StatelessWidget {
  const InfoRow(this.label, this.value, {super.key});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 130,
          child: Text(
            label,
            style: const TextStyle(color: C.muted, fontSize: 13.5),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, color: C.text),
          ),
        ),
      ],
    ),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState(this.message, {super.key, this.icon = Icons.inbox_outlined});
  final String message;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
    child: Column(
      children: [
        IconWell(icon, color: C.muted, size: 48),
        const SizedBox(height: 12),
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: C.muted),
        ),
      ],
    ),
  );
}

class ErrorBox extends StatelessWidget {
  const ErrorBox(this.message, {super.key, this.onRetry});
  final String message;
  final VoidCallback? onRetry;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
    decoration: BoxDecoration(
      color: badTone.bg,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        Icon(Icons.error_outline, color: badTone.fg, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            message,
            style: TextStyle(color: badTone.fg),
          ),
        ),
        if (onRetry != null)
          TextButton(onPressed: onRetry, child: Text(t('retry', 'Retry'))),
      ],
    ),
  );
}

class NoticeBox extends StatelessWidget {
  const NoticeBox(this.message, {super.key, this.tone = goodTone});
  final String message;
  final Tone tone;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: tone.bg,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Text(
      message,
      style: TextStyle(color: tone.fg, fontWeight: FontWeight.w500),
    ),
  );
}

/// Line icons for the pictograms that the shared data (website diet plans, shop, alerts) still
/// carries as emoji, so the app shows one consistent icon style instead of emoji.
const _glyphs = <String, IconData>{
  '💉': Icons.vaccines_outlined, '🚨': Icons.priority_high_rounded, '👶': Icons.child_care_outlined,
  '👦': Icons.boy_outlined, '👧': Icons.girl_outlined, '🏥': Icons.local_hospital_outlined, '🏨': Icons.local_hospital_outlined,
  '⚠️': Icons.warning_amber_rounded, '⚠': Icons.warning_amber_rounded, '📋': Icons.assignment_outlined,
  '🔔': Icons.notifications_none_rounded, '🩺': Icons.medical_services_outlined, '🥗': Icons.restaurant_outlined,
  '🍽️': Icons.restaurant_outlined, '🏠': Icons.home_outlined, '🤰': Icons.pregnant_woman_outlined,
  '✅': Icons.check_circle_outline, '🏛️': Icons.account_balance_outlined, '👩‍⚕️': Icons.health_and_safety_outlined,
  '👨‍⚕️': Icons.health_and_safety_outlined, '📊': Icons.bar_chart_rounded, '📢': Icons.campaign_outlined,
  '📣': Icons.campaign_outlined, '🏷️': Icons.sell_outlined, '⚡': Icons.bolt_outlined, '⚙️': Icons.settings_outlined,
  '📅': Icons.event_outlined, '🗓️': Icons.event_outlined, '✉️': Icons.mail_outline, '📄': Icons.description_outlined,
  '📦': Icons.inventory_2_outlined, '🤖': Icons.insights_outlined, '🔐': Icons.lock_outline, '🗺️': Icons.map_outlined,
  '🎓': Icons.school_outlined, '✏️': Icons.edit_outlined, '❓': Icons.help_outline, '📞': Icons.call_outlined,
  '❤️‍🩹': Icons.favorite_border, '⛺': Icons.groups_outlined, '👥': Icons.groups_outlined, '⏰': Icons.alarm,
  '🍼': Icons.baby_changing_station_outlined, '🛍️': Icons.shopping_bag_outlined, '⏱️': Icons.schedule, '⏱': Icons.schedule,
  '💵': Icons.payments_outlined, '💰': Icons.payments_outlined, '📱': Icons.smartphone, '📍': Icons.place_outlined,
  '📂': Icons.folder_open_outlined, '📉': Icons.trending_down, '📈': Icons.trending_up, '💡': Icons.lightbulb_outline,
  '📏': Icons.straighten, '💊': Icons.medication_outlined, '🚑': Icons.emergency_outlined, '⚖️': Icons.monitor_weight_outlined,
  '🌅': Icons.wb_twilight, '☀️': Icons.wb_sunny_outlined, '🌆': Icons.wb_twilight, '🌙': Icons.bedtime_outlined,
  '🌛': Icons.bedtime_outlined, '🍎': Icons.apple, '🍚': Icons.rice_bowl_outlined, '🥣': Icons.rice_bowl_outlined,
  '🌾': Icons.grass, '🥬': Icons.eco_outlined, '🍳': Icons.egg_outlined, '🫙': Icons.kitchen_outlined,
  '🫘': Icons.grain, '🍌': Icons.eco_outlined, '👕': Icons.checkroom, '🧴': Icons.soap_outlined, '🧸': Icons.toys_outlined,
  '💬': Icons.chat_bubble_outline, '📚': Icons.menu_book_outlined, '📖': Icons.menu_book_outlined, '🩸': Icons.bloodtype_outlined,
  '🎂': Icons.cake_outlined, '🧾': Icons.receipt_long_outlined, '📝': Icons.edit_note, '👤': Icons.person_outline,
};

/// Plain icon for a pictogram key, for chips and small spots.
IconData glyphIcon(String? key) => _glyphs[key?.trim()] ?? Icons.circle_outlined;

/// Icon in a tinted well for a pictogram key (see [_glyphs]); [size] is the old emoji font size.
Widget glyph(String? key, {double size = 22, Color color = C.primary}) =>
    IconWell(_glyphs[key?.trim()] ?? Icons.circle_outlined, color: color, size: size * 1.7);

final _emojiRe = RegExp(
  '[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE0F}\u{200D}]',
  unicode: true,
);

/// Text with any emoji removed (for strings that come from the server or the shared data).
String noEmoji(String s) => s.replaceAll(_emojiRe, '').replaceAll(RegExp(r'[ \t]{2,}'), ' ').trim();

/// Loads data with [load], shows a spinner, an error with retry, or [builder]. Pull to refresh.
class Loader<T> extends StatefulWidget {
  const Loader({
    super.key,
    required this.load,
    required this.builder,
    this.padding = const EdgeInsets.all(16),
  });
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data, VoidCallback reload)
  builder;
  final EdgeInsets padding;
  @override
  State<Loader<T>> createState() => LoaderState<T>();
}

class LoaderState<T> extends State<Loader<T>> {
  late Future<T> _future = widget.load();
  void reload() => setState(() { _future = widget.load(); });
  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
    future: _future,
    builder: (context, snap) {
      if (snap.connectionState != ConnectionState.done) {
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(40),
            child: CircularProgressIndicator(),
          ),
        );
      }
      if (snap.hasError) {
        return ListView(
          padding: widget.padding,
          children: [ErrorBox('${snap.error}', onRetry: reload)],
        );
      }
      return RefreshIndicator(
        onRefresh: () async {
          reload();
          await _future.catchError((_) => null as T);
        },
        child: widget.builder(context, snap.data as T, reload),
      );
    },
  );
}

/// Prev / Next for server-paged lists.
class Pager extends StatelessWidget {
  const Pager({
    super.key,
    required this.page,
    required this.limit,
    required this.total,
    required this.onPage,
  });
  final int page;
  final int limit;
  final int total;
  final ValueChanged<int> onPage;
  @override
  Widget build(BuildContext context) {
    if (total <= limit) return const SizedBox.shrink();
    final pages = (total / limit).ceil();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '${(page - 1) * limit + 1}–${(page * limit).clamp(0, total)} of ${inr(total)}',
              style: const TextStyle(color: C.muted, fontSize: 13),
            ),
          ),
          IconButton(
            onPressed: page > 1 ? () => onPage(page - 1) : null,
            icon: const Icon(Icons.chevron_left),
          ),
          Text('$page / $pages'),
          IconButton(
            onPressed: page < pages ? () => onPage(page + 1) : null,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}

/// Filter chips row (status tabs on the website).
class ChoiceRow extends StatelessWidget {
  const ChoiceRow({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
  });
  final List<(String, String)> options; // (value, label)
  final String value;
  final ValueChanged<String> onChanged;
  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    scrollDirection: Axis.horizontal,
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        for (final (v, label) in options)
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(label),
              selected: v == value,
              onSelected: (_) => onChanged(v),
            ),
          ),
      ],
    ),
  );
}

void toast(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message), backgroundColor: error ? C.red : C.dark),
  );
}

String errText(Object e) => e is ApiException ? e.message : '$e';

/// Runs [task] with a snackbar on success / failure. Returns true on success.
Future<bool> runAction(
  BuildContext context,
  Future<void> Function() task, {
  String? success,
}) async {
  try {
    await task();
    if (context.mounted && success != null) toast(context, success);
    return true;
  } catch (e) {
    if (context.mounted) toast(context, errText(e), error: true);
    return false;
  }
}

Future<bool> confirm(
  BuildContext context,
  String message, {
  String? ok,
}) async =>
    await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: Text(t('cancel', 'Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: Text(ok ?? t('confirm', 'Confirm')),
          ),
        ],
      ),
    ) ??
    false;

/// Ask for a line of text (reasons, notes).
Future<String?> askText(
  BuildContext context,
  String title, {
  String? hint,
  bool required = false,
  int maxLength = 500,
}) async {
  final ctrl = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (c) => StatefulBuilder(
      builder: (c, setS) {
        return AlertDialog(
          title: Text(title, style: const TextStyle(fontSize: 17)),
          content: TextField(
            controller: ctrl,
            maxLength: maxLength,
            maxLines: 3,
            minLines: 1,
            autofocus: true,
            decoration: InputDecoration(hintText: hint),
            onChanged: (_) => setS(() {}),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(c),
              child: Text(t('cancel', 'Cancel')),
            ),
            FilledButton(
              onPressed: required && ctrl.text.trim().isEmpty
                  ? null
                  : () => Navigator.pop(c, ctrl.text.trim()),
              child: Text(t('save', 'Save')),
            ),
          ],
        );
      },
    ),
  );
}

/// Date field that opens the platform date picker; value is yyyy-mm-dd.
class DateField extends StatelessWidget {
  const DateField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.first,
    this.last,
  });
  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  final DateTime? first;
  final DateTime? last;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: () async {
      final now = DateTime.now();
      final picked = await showDatePicker(
        context: context,
        initialDate:
            DateTime.tryParse(value) ??
            (last != null && last!.isBefore(now) ? last! : now),
        firstDate: first ?? DateTime(now.year - 60),
        lastDate: last ?? DateTime(now.year + 2),
      );
      if (picked != null) onChanged(isoOf(picked));
    },
    child: InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        suffixIcon: const Icon(Icons.calendar_today, size: 18),
      ),
      child: Text(value.isEmpty ? '—' : fmtDate(value)),
    ),
  );
}

/// Dropdown over (value, label) pairs.
class Pick<T> extends StatelessWidget {
  const Pick({
    super.key,
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });
  final String label;
  final T? value;
  final List<(T, String)> items;
  final ValueChanged<T?>? onChanged;
  @override
  Widget build(BuildContext context) => DropdownButtonFormField<T>(
    initialValue: items.any((i) => i.$1 == value) ? value : null,
    isExpanded: true,
    decoration: InputDecoration(labelText: label),
    items: [
      for (final (v, l) in items)
        DropdownMenuItem(
          value: v,
          child: Text(l, overflow: TextOverflow.ellipsis),
        ),
    ],
    onChanged: onChanged,
  );
}

const gap = SizedBox(height: 12);
