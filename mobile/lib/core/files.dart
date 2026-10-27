import 'dart:io';

import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import 'api.dart';
import 'ui.dart';

/// Download a report from the API and open it in the phone's PDF / spreadsheet viewer.
Future<void> downloadAndOpen(BuildContext context, String path, String fileName, [Map<String, dynamic>? query]) async {
  try {
    final bytes = await api.bytes(path, query);
    final dir = await getApplicationDocumentsDirectory();
    final safe = fileName.replaceAll(RegExp(r'[^\w.\- ]'), '_');
    final file = File('${dir.path}/$safe');
    await file.writeAsBytes(bytes);
    final result = await OpenFilex.open(file.path);
    if (result.type != ResultType.done && context.mounted) toast(context, 'Saved to ${file.path}');
  } catch (e) {
    if (context.mounted) toast(context, errText(e), error: true);
  }
}
