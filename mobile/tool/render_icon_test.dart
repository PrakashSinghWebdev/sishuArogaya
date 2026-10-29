// Renders the logo (lib/widgets/logo.dart) to the launcher icon sources. After changing the logo:
//   flutter test tool/render_icon_test.dart && dart run flutter_launcher_icons
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter_test/flutter_test.dart';
import 'package:shishu_aarogya/widgets/logo.dart';

Future<void> _render(String path, LogoPainter painter, {ui.Color? background}) async {
  const size = 1024.0;
  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);
  if (background != null) canvas.drawRect(const ui.Rect.fromLTWH(0, 0, size, size), ui.Paint()..color = background);
  painter.paint(canvas, const ui.Size.square(size));
  final image = await recorder.endRecording().toImage(size.toInt(), size.toInt());
  final png = await image.toByteData(format: ui.ImageByteFormat.png);
  File(path).writeAsBytesSync(png!.buffer.asUint8List());
}

void main() {
  test('render launcher icons', () async {
    // iOS / legacy Android: full green tile, square corners (the OS rounds them)
    await _render('icon/app_icon.png', const LogoPainter(tile: true, padding: 0.12), background: const ui.Color(0xFF2D6A4F));
    // Android adaptive foreground: mark only, inside the 66% safe zone; background colour is set in pubspec
    await _render('icon/app_icon_fg.png', const LogoPainter(tile: true, padding: 0.25));
  });
}
