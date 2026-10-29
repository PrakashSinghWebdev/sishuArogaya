import 'package:flutter/material.dart';

import '../core/ui.dart';

/// The Shishu Aarogya mark: two cupped hands holding a child (the warm dot).
/// Drawn in code so the app, the splash and the launcher icon all use one source.
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 40, this.tile = true});
  final double size;

  /// true: on a green rounded tile (app icon look); false: green mark on a light background
  final bool tile;

  @override
  Widget build(BuildContext context) => CustomPaint(size: Size.square(size), painter: LogoPainter(tile: tile));
}

class LogoPainter extends CustomPainter {
  const LogoPainter({this.tile = true, this.padding = 0});
  final bool tile;

  /// extra empty margin as a fraction of the size (adaptive-icon safe zone)
  final double padding;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.shortestSide;
    if (tile && padding == 0) {
      canvas.drawRRect(RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(s * 0.24)), Paint()..color = C.primary);
    }
    // all coordinates below are on a 100 × 100 grid
    final inner = s * (1 - 2 * padding);
    canvas.translate(s * padding, s * padding);
    canvas.scale(inner / 100);

    // cupped hands: one crescent, the right side lifted a little higher so it reads as drawn, not stamped
    final hands = Path()
      ..moveTo(13, 37)
      ..cubicTo(15, 66, 33, 80, 51, 80)
      ..cubicTo(70, 80, 86, 63, 88, 31)
      ..cubicTo(81, 52, 68, 63, 51, 63)
      ..cubicTo(35, 63, 21, 53, 13, 37)
      ..close();
    canvas.drawPath(hands, Paint()..color = tile ? const Color(0xFFF7F3EA) : C.primary);
    // the child
    canvas.drawCircle(const Offset(50, 40), 12.5, Paint()..color = C.accent);
  }

  @override
  bool shouldRepaint(LogoPainter old) => old.tile != tile || old.padding != padding;
}

/// Mark plus the name, for headers.
class Logo extends StatelessWidget {
  const Logo({super.key, this.size = 36, this.light = false});
  final double size;
  final bool light;
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        LogoMark(size: size),
        SizedBox(width: size * 0.3),
        Text.rich(
          TextSpan(children: [
            TextSpan(text: 'Shishu ', style: TextStyle(color: light ? Colors.white : C.text)),
            TextSpan(text: 'Aarogya', style: TextStyle(color: light ? Colors.white70 : C.primary)),
          ]),
          style: TextStyle(fontSize: size * 0.5, fontWeight: FontWeight.w700, letterSpacing: -0.2),
        ),
      ]);
}
