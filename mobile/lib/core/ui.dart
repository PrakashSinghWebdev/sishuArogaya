import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';
import 'i18n.dart';

/// Colours from the website (client/src/pages/asha/fieldUi.jsx).
class C {
  static const primary = Color(0xFF0891B2);
  static const dark = Color(0xFF0E7490);
  static const bg = Color(0xFFF0FDFF);
  static const border = Color(0xFFC5E8EF);
  static const text = Color(0xFF0C2340);
  static const muted = Color(0xFF4A7A8A);
  static const green = Color(0xFF059669);
  static const amber = Color(0xFFD97706);
  static const red = Color(0xFFDC2626);
}

ThemeData appTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: C.dark,
    primary: C.dark,
    secondary: C.primary,
    surface: Colors.white,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: C.bg,
    appBarTheme: const AppBarTheme(
      backgroundColor: C.dark,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: C.border),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      isDense: true,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: C.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: C.border),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: C.dark,
        minimumSize: const Size(48, 46),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: C.dark,
        minimumSize: const Size(48, 42),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
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
  'healthy': Tone(Color(0xFF059669), Color(0xFFD1FAE5)),
  'moderate': Tone(Color(0xFF92400E), Color(0xFFFEF3C7)),
  'severe': Tone(Color(0xFF991B1B), Color(0xFFFEE2E2)),
};

const urgencyTone = {
  'emergency': Tone(Colors.white, Color(0xFFDC2626)),
  'urgent': Tone(Color(0xFF92400E), Color(0xFFFEF3C7)),
  'routine': Tone(Color(0xFF0E7490), Color(0xFFCFFAFE)),
};

const neutralTone = Tone(Color(0xFF475569), Color(0xFFF1F5F9));
const infoTone = Tone(Color(0xFF0E7490), Color(0xFFCFFAFE));
const goodTone = Tone(Color(0xFF059669), Color(0xFFD1FAE5));
const warnTone = Tone(Color(0xFF92400E), Color(0xFFFEF3C7));
const badTone = Tone(Color(0xFF991B1B), Color(0xFFFEE2E2));

// ── Small widgets ──────────────────────────────────────────────────────────
class Badge2 extends StatelessWidget {
  const Badge2(this.label, {super.key, this.tone = neutralTone});
  final String label;
  final Tone tone;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
    decoration: BoxDecoration(
      color: tone.bg,
      borderRadius: BorderRadius.circular(999),
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
    padding: const EdgeInsets.fromLTRB(2, 8, 2, 10),
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
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: C.text,
            ),
          ),
        ),
        ?trailing,
      ],
    ),
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
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 12.5, color: C.muted),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (sub != null)
              Text(
                sub!,
                style: const TextStyle(fontSize: 11.5, color: C.muted),
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
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 130,
          child: Text(
            label,
            style: const TextStyle(color: C.muted, fontSize: 13),
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
    padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
    child: Column(
      children: [
        Icon(icon, size: 44, color: C.border),
        const SizedBox(height: 10),
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
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: badTone.bg,
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      children: [
        const Icon(Icons.error_outline, color: Color(0xFF991B1B)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            message,
            style: const TextStyle(color: Color(0xFF991B1B)),
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
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: tone.bg,
      borderRadius: BorderRadius.circular(10),
    ),
    child: Text(
      message,
      style: TextStyle(color: tone.fg, fontWeight: FontWeight.w600),
    ),
  );
}

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
  void reload() => setState(() => _future = widget.load());
  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
    future: _future,
    builder: (context, snap) {
      if (snap.connectionState != ConnectionState.done)
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(40),
            child: CircularProgressIndicator(),
          ),
        );
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
