import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../core/api.dart';
import '../core/i18n.dart';
import '../core/ui.dart';

// Same sources and fallbacks as the website's HospitalMap.jsx:
// 1) our database, 2) OpenStreetMap (Overpass), 3) a few known hospitals.
const _overpass = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const _nominatim = 'https://nominatim.openstreetmap.org/search';
const _osrm = 'https://router.project-osrm.org/route/v1/driving';
const _ua = {'User-Agent': 'ShishuAarogya/1.0 (child health app)'};
const _nearestN = 10;
const _radii = [10000, 30000, 100000];

const amenity = {
  'hospital': (Color(0xFFB5452F), 'Hospital', '🏥'),
  'clinic': (Color(0xFF2D6A4F), 'Clinic', '🏨'),
  'pharmacy': (Color(0xFF2F855A), 'Pharmacy', '💊'),
  'health_post': (Color(0xFFB7791F), 'PHC / CHC', '🏠'),
  'doctors': (Color(0xFF6B5B95), 'Doctor', '👨‍⚕️'),
  'ambulance_station': (Color(0xFF9B3A26), 'Ambulance', '🚑'),
};
const _filters = [('all', 'All'), ('hospital', 'Hospitals'), ('health_post', 'PHC / CHC'), ('clinic', 'Clinics'), ('ambulance_station', 'Ambulance'), ('pharmacy', 'Pharmacy'), ('doctors', 'Doctors')];

const _static = [
  ('s13', 30.0869, 78.2650, 'AIIMS Rishikesh', 'Virbhadra Rd, Rishikesh', '0135-2462916'),
  ('s14', 30.3165, 78.0338, 'Doon Govt Hospital', 'Sharanpur Rd, Dehradun', '0135-2714441'),
  ('s15', 29.9457, 78.1642, 'District Hospital Haridwar', 'Ranipur More, Haridwar', '01334-226506'),
  ('s16', 30.3145, 78.0357, 'Combined Medical Institute', '54, Haridwar Road, Dehradun', '0135-2720921'),
  ('s17', 30.3850, 78.0850, 'Max Super Specialty Hospital', 'Malsi, Mussoorie Rd, Dehradun', '0135-6673555'),
  ('s01', 28.6362, 77.2166, 'AIIMS New Delhi', 'Ansari Nagar, New Delhi', '011-26588500'),
  ('s02', 28.6517, 77.2219, 'Safdarjung Hospital', 'Ring Road, New Delhi', '011-26730000'),
  ('s03', 19.0176, 72.8561, 'KEM Hospital Mumbai', 'Parel, Mumbai', '022-24107000'),
];

class Facility {
  Facility({required this.id, required this.pos, required this.type, required this.name, this.address = '', this.phone = '', this.dist, this.isGovernment = false, this.hasEmergency = false, this.hasICU = false});
  final String id;
  final LatLng pos;
  final String type;
  final String name;
  final String address;
  final String phone;
  double? dist;
  final bool isGovernment, hasEmergency, hasICU;
}

double distKm(LatLng a, LatLng b) {
  double rad(double x) => x * math.pi / 180;
  final dLat = rad(b.latitude - a.latitude), dLng = rad(b.longitude - a.longitude);
  final h = math.pow(math.sin(dLat / 2), 2) + math.cos(rad(a.latitude)) * math.cos(rad(b.latitude)) * math.pow(math.sin(dLng / 2), 2);
  return 6371 * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h));
}

/// The closest [_nearestN] of each facility type.
List<Facility> _nearest(List<Facility> list) {
  final count = <String, int>{};
  final sorted = [...list]..sort((a, b) => (a.dist ?? 1e9).compareTo(b.dist ?? 1e9));
  return sorted.where((f) => (count[f.type] = (count[f.type] ?? 0) + 1) <= _nearestN).toList();
}

int _hospitals(List<Facility> l) => l.where((f) => f.type == 'hospital').length;

Facility _fromDb(Map h, LatLng? origin) {
  final c = (h['location']?['coordinates'] as List?) ?? [0, 0];
  final pos = LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble());
  return Facility(
    id: '${h['_id']}',
    pos: pos,
    type: '${h['type'] ?? 'hospital'}',
    name: '${h['name']}',
    address: '${h['address'] ?? ''}',
    phone: '${h['phone'] ?? h['emergencyPhone'] ?? ''}',
    isGovernment: h['isGovernment'] == true,
    hasEmergency: h['hasEmergency'] == true,
    hasICU: h['hasICU'] == true,
    dist: h['distanceMeters'] is num ? (h['distanceMeters'] as num) / 1000 : (origin == null ? null : distKm(origin, pos)),
  );
}

class HospitalMap extends StatefulWidget {
  const HospitalMap({super.key});
  @override
  State<HospitalMap> createState() => _HospitalMapState();
}

class _HospitalMapState extends State<HospitalMap> {
  final map = MapController();
  final search = TextEditingController();
  LatLng? me;
  List<Facility> facilities = [];
  String filter = 'all', status = 'idle', source = '', error = '';
  Facility? selected;
  List<LatLng> route = [];
  String? routeInfo;
  bool searching = false;
  StreamSubscription<Position>? _gps;
  LatLng? _lastFetch;

  @override
  void initState() {
    super.initState();
    locate();
  }

  @override
  void dispose() {
    _gps?.cancel();
    super.dispose();
  }

  Future<void> locate() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) throw 'Turn on location (GPS) to find nearby hospitals.';
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) throw t('hospital_gps_denied', 'Allow location access to find the nearest hospital.');
      final p = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 20)));
      _onPosition(LatLng(p.latitude, p.longitude), recenter: true);
      _gps?.cancel();
      _gps = Geolocator.getPositionStream(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 25)).listen((p) => _onPosition(LatLng(p.latitude, p.longitude)));
    } catch (e) {
      setState(() => error = '$e');
    }
  }

  void _onPosition(LatLng p, {bool recenter = false}) {
    setState(() {
      me = p;
      error = '';
      for (final f in facilities) {
        f.dist = distKm(p, f.pos);
      }
    });
    if (recenter) map.move(p, 13);
    // refetch only after moving more than 1 km
    if (_lastFetch == null || distKm(_lastFetch!, p) > 1) {
      _lastFetch = p;
      fetch(p);
    }
  }

  Future<void> fetch(LatLng origin) async {
    setState(() => status = 'loading');
    var db = <Facility>[];
    try {
      final res = await api.get('/hospitals/nearby', {'lat': origin.latitude, 'lng': origin.longitude, 'radius': 30000, 'type': 'all'});
      final rows = (res is Map ? res['hospitals'] : null) as List? ?? [];
      db = _nearest([for (final h in rows) _fromDb(h, origin)]);
      if (_hospitals(db) >= _nearestN) return _show(db, 'done', 'Database');
    } catch (_) {}

    var osm = <Facility>[];
    for (final radius in _radii) {
      final elements = await _overpassQuery(origin, radius);
      if (elements == null) break;
      osm = _nearest([
        for (final el in elements)
          if ((el['lat'] ?? el['center']?['lat']) != null)
            () {
              final pos = LatLng(((el['lat'] ?? el['center']['lat']) as num).toDouble(), ((el['lon'] ?? el['center']['lon']) as num).toDouble());
              final tags = (el['tags'] as Map?) ?? {};
              final type = tags['emergency'] == 'ambulance_station' ? 'ambulance_station' : (amenity.containsKey(tags['amenity']) ? '${tags['amenity']}' : 'hospital');
              return Facility(
                id: '${el['id']}',
                pos: pos,
                type: type,
                name: '${tags['name'] ?? '${amenity[type]!.$2} (unnamed)'}',
                address: [tags['addr:street'], tags['addr:city']].where((e) => e != null).join(', '),
                phone: '${tags['phone'] ?? tags['contact:phone'] ?? ''}',
                dist: distKm(origin, pos),
              );
            }(),
      ]);
      if (_hospitals(osm) >= _nearestN) break;
    }
    final live = _hospitals(osm) >= _hospitals(db) ? osm : db;
    if (_hospitals(live) >= _nearestN) return _show(live, 'done', identical(live, osm) ? 'OpenStreetMap' : 'Database');
    final known = [for (final s in _static) Facility(id: s.$1, pos: LatLng(s.$2, s.$3), type: 'hospital', name: s.$4, address: s.$5, phone: s.$6, isGovernment: true, hasEmergency: true, dist: distKm(origin, LatLng(s.$2, s.$3)))];
    _show(_nearest([...osm, ...db, ...known]), 'fallback', t('hospital_cached_source', 'Known facilities'));
    if (mounted) setState(() => error = t('hospital_data_fallback_msg', 'Live hospital data unavailable. Showing nearest known facilities.'));
  }

  void _show(List<Facility> list, String s, String src) {
    if (!mounted) return;
    setState(() {
      facilities = list;
      status = s;
      source = src;
    });
  }

  Future<List?> _overpassQuery(LatLng o, int radius) async {
    final around = '(around:$radius,${o.latitude},${o.longitude})';
    final q = '[out:json][timeout:25];(nwr["amenity"~"^(hospital|clinic|pharmacy|health_post|doctors)\$"]$around;nwr["emergency"="ambulance_station"]$around;);out center;';
    // every mirror at once, first good answer wins
    final done = Completer<List?>();
    var failed = 0;
    for (final ep in _overpass) {
      http.post(Uri.parse(ep), body: q, headers: _ua).timeout(const Duration(seconds: 30)).then((r) {
        if (r.statusCode != 200) throw r.statusCode;
        if (!done.isCompleted) done.complete((jsonDecode(r.body)['elements'] as List?) ?? []);
      }).catchError((_) {
        if (++failed == _overpass.length && !done.isCompleted) done.complete(null);
      });
    }
    return done.future;
  }

  Future<void> directions(Facility f) async {
    if (me == null) return setState(() => error = t('hospital_gps_directions_needed', 'Allow location access first to get directions.'));
    setState(() => selected = f);
    try {
      final r = await http.get(Uri.parse('$_osrm/${me!.longitude},${me!.latitude};${f.pos.longitude},${f.pos.latitude}?overview=full&geometries=geojson'), headers: _ua);
      final j = jsonDecode(r.body);
      final routes = j['routes'] as List?;
      if (routes == null || routes.isEmpty) throw 'no route';
      final coords = [for (final c in routes.first['geometry']['coordinates']) LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble())];
      setState(() {
        route = coords;
        routeInfo = '${(routes.first['distance'] / 1000).toStringAsFixed(1)} km · ${(routes.first['duration'] / 60).round()} min to ${f.name}';
      });
      map.fitCamera(CameraFit.coordinates(coordinates: coords, padding: const EdgeInsets.all(50)));
    } catch (_) {
      if (mounted) toast(context, 'Could not load route. Check your connection.', error: true);
    }
  }

  void emergency() {
    if (me == null) {
      toast(context, t('hospital_gps_denied', 'Allow location access first to find the nearest hospital.'), error: true);
      locate();
      return;
    }
    if (facilities.isEmpty) {
      toast(context, t('hospital_searching', 'Finding nearby hospitals...'));
      fetch(me!);
      return;
    }
    final sorted = [...facilities]..sort((a, b) => distKm(me!, a.pos).compareTo(distKm(me!, b.pos)));
    final target = sorted.where((f) => f.type == 'hospital').firstOrNull ?? sorted.first;
    map.move(target.pos, 16);
    directions(target);
  }

  Future<void> doSearch() async {
    final q = search.text.trim();
    if (q.isEmpty) return;
    setState(() {
      searching = true;
      error = '';
    });
    try {
      final res = await api.get('/hospitals/search', {'q': q, 'lat': me?.latitude, 'lng': me?.longitude});
      final rows = (res is Map ? res['hospitals'] : null) as List? ?? [];
      if (rows.isNotEmpty) {
        final list = [for (final h in rows) _fromDb(h, me)];
        _show(list, 'done', 'Database');
        map.move(list.first.pos, 13);
        return;
      }
    } catch (_) {}
    try {
      for (final query in ['$q, India', q]) {
        final r = await http.get(Uri.parse('$_nominatim?q=${Uri.encodeQueryComponent(query)}&format=json&limit=1'), headers: {..._ua, 'Accept-Language': 'en'});
        final results = jsonDecode(r.body) as List;
        if (results.isNotEmpty) {
          final c = LatLng(double.parse('${results[0]['lat']}'), double.parse('${results[0]['lon']}'));
          map.move(c, 13);
          await fetch(c);
          return;
        }
      }
      setState(() => error = 'Location not found. Try a hospital name, city, or district.');
    } catch (_) {
      setState(() => error = 'Search failed. Please try again.');
    } finally {
      if (mounted) setState(() => searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shown = (filter == 'all' ? facilities : facilities.where((f) => f.type == filter).toList())..sort((a, b) => (a.dist ?? 1e9).compareTo(b.dist ?? 1e9));
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
        child: TextField(
          controller: search,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => doSearch(),
          decoration: InputDecoration(
            hintText: 'Search hospital, city or district',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: searching ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))) : IconButton(icon: const Icon(Icons.arrow_forward), onPressed: doSearch),
          ),
        ),
      ),
      Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: ChoiceRow(options: _filters, value: filter, onChanged: (v) => setState(() => filter = v))),
      if (error.isNotEmpty) Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: NoticeBox(error, tone: warnTone)),
      if (routeInfo != null)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Card(
            color: const Color(0xFFE5ECF2),
            child: ListTile(
              dense: true,
              leading: const Icon(Icons.directions_car, color: Color(0xFF3B6E8F)),
              title: Text(routeInfo!, style: const TextStyle(fontWeight: FontWeight.w600)),
              trailing: IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() {
                route = [];
                routeInfo = null;
              })),
            ),
          ),
        ),
      Expanded(
        flex: 3,
        child: Stack(children: [
          FlutterMap(
            mapController: map,
            options: const MapOptions(initialCenter: LatLng(20.5937, 78.9629), initialZoom: 5, maxZoom: 19),
            children: [
              TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.shishuaarogya.shishu_aarogya'),
              if (route.isNotEmpty) PolylineLayer(polylines: [Polyline(points: route, color: const Color(0xFF3B6E8F), strokeWidth: 5)]),
              MarkerLayer(markers: [
                for (final f in shown)
                  Marker(
                    point: f.pos,
                    width: 34,
                    height: 34,
                    child: GestureDetector(
                      onTap: () => _details(f),
                      child: Container(
                        decoration: BoxDecoration(color: amenity[f.type]?.$1 ?? C.red, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2), boxShadow: selected?.id == f.id ? const [BoxShadow(color: Color(0x66DC2626), spreadRadius: 6)] : null),
                        alignment: Alignment.center,
                        child: glyph(amenity[f.type]?.$3 ?? '🏥', size: 15),
                      ),
                    ),
                  ),
                if (me != null) Marker(point: me!, width: 22, height: 22, child: Container(decoration: BoxDecoration(color: const Color(0xFF3B6E8F), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3)))),
              ]),
              const RichAttributionWidget(attributions: [TextSourceAttribution('© OpenStreetMap contributors')]),
            ],
          ),
          Positioned(
            right: 10,
            top: 10,
            child: Column(children: [
              FloatingActionButton.small(heroTag: 'locate', onPressed: locate, child: const Icon(Icons.my_location)),
              const SizedBox(height: 8),
              FloatingActionButton.small(heroTag: 'sos', backgroundColor: C.red, foregroundColor: Colors.white, onPressed: emergency, child: const Icon(Icons.emergency)),
            ]),
          ),
          if (status == 'loading') const Positioned(left: 10, top: 10, child: Card(child: Padding(padding: EdgeInsets.all(8), child: Text('Finding nearby facilities…')))),
          if (source.isNotEmpty && status != 'loading') Positioned(left: 10, top: 10, child: Card(child: Padding(padding: const EdgeInsets.all(6), child: Text(source, style: const TextStyle(fontSize: 11))))),
        ]),
      ),
      Container(
        color: const Color(0xFFF8E3DD),
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
          for (final (n, label) in const [('108', 'Ambulance'), ('102', 'Mother & child'), ('112', 'Emergency')])
            TextButton.icon(style: TextButton.styleFrom(foregroundColor: C.red), onPressed: () => callPhone(n), icon: const Icon(Icons.call, size: 16), label: Text('$n $label', style: const TextStyle(fontSize: 12))),
        ]),
      ),
      Expanded(
        flex: 2,
        child: shown.isEmpty
            ? Center(child: Text(status == 'loading' ? 'Loading…' : me == null ? 'Allow location access to see nearby facilities.' : 'No facilities found.', style: const TextStyle(color: C.muted)))
            : ListView.builder(
                itemCount: shown.length,
                itemBuilder: (context, i) {
                  final f = shown[i];
                  return ListTile(
                    dense: true,
                    leading: glyph(amenity[f.type]?.$3 ?? '🏥', size: 22),
                    title: Text(f.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text([amenity[f.type]?.$2, if (f.dist != null) '${f.dist!.toStringAsFixed(1)} km', if (f.address.isNotEmpty) f.address].whereType<String>().join(' · '), maxLines: 2),
                    trailing: IconButton(icon: const Icon(Icons.directions, color: C.primary), onPressed: () => directions(f)),
                    onTap: () {
                      map.move(f.pos, 15);
                      _details(f);
                    },
                  );
                },
              ),
      ),
    ]);
  }

  void _details(Facility f) => showModalBottomSheet(
        context: context,
        builder: (c) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(f.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              Text([amenity[f.type]?.$2, if (f.dist != null) '${f.dist!.toStringAsFixed(1)} km away'].whereType<String>().join(' · '), style: const TextStyle(color: C.muted)),
              if (f.address.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(f.address)),
              const SizedBox(height: 8),
              Wrap(spacing: 6, children: [
                if (f.isGovernment) const Badge2('Government', tone: goodTone),
                if (f.hasEmergency) const Badge2('24×7 Emergency', tone: badTone),
                if (f.hasICU) const Badge2('ICU', tone: infoTone),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                if (f.phone.isNotEmpty) Expanded(child: OutlinedButton.icon(onPressed: () => callPhone(f.phone), icon: const Icon(Icons.call), label: Text(f.phone))),
                if (f.phone.isNotEmpty) const SizedBox(width: 8),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () {
                      Navigator.pop(c);
                      directions(f);
                    },
                    icon: const Icon(Icons.directions),
                    label: const Text('Directions'),
                  ),
                ),
              ]),
            ]),
          ),
        ),
      );
}
