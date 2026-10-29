import 'package:flutter/material.dart';

import '../core/ui.dart';

/// One line in the popup: emoji, text, and whether it is urgent (red) or a reminder (amber).
typedef Warning = ({String icon, String text, bool urgent});

/// Notification-style card at the top of the screen that closes itself after [seconds].
/// Tap the card to close it early.
void showWarningPopup(BuildContext context, List<Warning> warnings, {int seconds = 7}) {
  if (warnings.isEmpty) return;
  final overlay = Overlay.of(context, rootOverlay: true);
  late final OverlayEntry entry;
  var closed = false;
  void close() {
    if (closed) return;
    closed = true;
    entry.remove();
  }

  entry = OverlayEntry(builder: (_) => _WarningCard(warnings: warnings, seconds: seconds, onClose: close));
  overlay.insert(entry);
  Future.delayed(Duration(seconds: seconds), close);
}

class _WarningCard extends StatelessWidget {
  const _WarningCard({required this.warnings, required this.seconds, required this.onClose});
  final List<Warning> warnings;
  final int seconds;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final urgent = warnings.any((w) => w.urgent);
    final accent = urgent ? C.red : C.amber;
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: -1, end: 0),
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
          builder: (_, dy, child) => FractionalTranslation(translation: Offset(0, dy), child: child),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(16),
              clipBehavior: Clip.antiAlias,
              color: Colors.white,
              child: InkWell(
                onTap: onClose,
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 6, 6),
                    child: Row(children: [
                      Icon(Icons.warning_amber_rounded, color: accent),
                      const SizedBox(width: 8),
                      Expanded(child: Text(urgent ? 'Health warning' : 'Reminder', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: accent))),
                      IconButton(visualDensity: VisualDensity.compact, icon: const Icon(Icons.close, size: 20), onPressed: onClose, tooltip: 'Close'),
                    ]),
                  ),
                  for (final w in warnings.take(5))
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        glyph(w.icon, size: 18),
                        const SizedBox(width: 8),
                        Expanded(child: Text(w.text, style: TextStyle(fontWeight: w.urgent ? FontWeight.w700 : FontWeight.w500, color: w.urgent ? C.red : null))),
                      ]),
                    ),
                  if (warnings.length > 5)
                    Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('+${warnings.length - 5} more', style: const TextStyle(color: C.muted, fontSize: 12))),
                  // shrinking bar shows the time left before the popup closes
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 1, end: 0),
                    duration: Duration(seconds: seconds),
                    builder: (_, v, _) => LinearProgressIndicator(value: v, minHeight: 4, color: accent, backgroundColor: accent.withValues(alpha: 0.15)),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
