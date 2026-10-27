import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/ui.dart';

// ponytail: static catalogue and on-device cart/orders, exactly like the website's shop;
// move both to a server API when real checkout and payments exist.
const _freeShippingMin = 499;
const _delivery = '30 minutes';
int shippingFor(int subtotal) => subtotal == 0 || subtotal >= _freeShippingMin ? 0 : 49;
int offPct(Map p) => p['old'] == null ? 0 : ((1 - p['price'] / p['old']) * 100).round();

/// Catalogue (assets/shop.json) + cart, wishlist and orders kept on the phone.
class ShopStore extends ChangeNotifier {
  ShopStore._();
  static final instance = ShopStore._();

  List<Map> products = [], categories = [];
  Map<int, int> cart = {}; // product id → qty
  Set<int> wishlist = {};
  List<Map> orders = [];
  bool _loaded = false;

  Future<void> load() async {
    if (_loaded) return;
    final j = jsonDecode(await rootBundle.loadString('assets/shop.json'));
    products = (j['products'] as List).cast<Map>();
    categories = (j['categories'] as List).cast<Map>();
    try {
      final p = await SharedPreferences.getInstance();
      cart = {for (final e in (jsonDecode(p.getString('shopCartItems') ?? '[]') as List)) e['id'] as int: e['qty'] as int};
      wishlist = {...(jsonDecode(p.getString('shopWishlist') ?? '[]') as List).cast<int>()};
      orders = (jsonDecode(p.getString('shopOrders') ?? '[]') as List).cast<Map>();
    } catch (_) {}
    _loaded = true;
    notifyListeners();
  }

  Future<void> _save() async {
    notifyListeners();
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString('shopCartItems', jsonEncode([for (final e in cart.entries) {'id': e.key, 'qty': e.value}]));
      await p.setString('shopWishlist', jsonEncode(wishlist.toList()));
      await p.setString('shopOrders', jsonEncode(orders));
    } catch (_) {}
  }

  Map? product(dynamic id) => products.where((p) => p['id'] == (id is int ? id : int.tryParse('$id'))).firstOrNull;
  int qtyOf(int id) => cart[id] ?? 0;
  void setQty(int id, int qty) {
    qty < 1 ? cart.remove(id) : cart[id] = qty;
    _save();
  }

  void toggleWish(int id) {
    wishlist.contains(id) ? wishlist.remove(id) : wishlist.add(id);
    _save();
  }

  List<(Map, int)> get lines => [for (final e in cart.entries) if (product(e.key) != null) (product(e.key)!, e.value)];
  int get count => lines.fold(0, (n, l) => n + l.$2);
  int get subtotal => lines.fold(0, (n, l) => n + (l.$1['price'] as int) * l.$2);
  int get mrpTotal => lines.fold(0, (n, l) => n + ((l.$1['old'] ?? l.$1['price']) as int) * l.$2);

  Map placeOrder(Map<String, String> address, String payment) {
    final id = 'SA${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    final sub = subtotal, ship = shippingFor(sub);
    final order = {
      'id': id,
      'date': DateTime.now().toIso8601String(),
      'items': [for (final (p, q) in lines) {'id': p['id'], 'qty': q, 'price': p['price']}],
      'subtotal': sub,
      'shipping': ship,
      'total': sub + ship,
      'payment': payment,
      'address': address,
      'status': 'Placed',
    };
    orders = [order, ...orders];
    cart = {};
    _save();
    return order;
  }
}

final shop = ShopStore.instance;
String _inr(dynamic n) => rupees(n);

/// Scaffold for every shop page: header with search, orders, wishlist and cart; cart bar at the bottom.
class _ShopPage extends StatelessWidget {
  const _ShopPage({required this.title, required this.child, this.showCartBar = true});
  final String title;
  final Widget child;
  final bool showCartBar;
  @override
  Widget build(BuildContext context) => FutureBuilder(
        future: shop.load(),
        builder: (context, _) => ListenableBuilder(
          listenable: shop,
          builder: (context, _) => Scaffold(
            appBar: AppBar(
              title: Text(title),
              actions: [
                IconButton(tooltip: 'Search', icon: const Icon(Icons.search), onPressed: () => Navigator.pushNamed(context, '/shop/products', arguments: {'focus': true})),
                IconButton(tooltip: 'My orders', icon: const Icon(Icons.receipt_long_outlined), onPressed: () => Navigator.pushNamed(context, '/shop/orders')),
                IconButton(tooltip: 'Wishlist', icon: const Icon(Icons.favorite_border), onPressed: () => Navigator.pushNamed(context, '/shop/wishlist')),
                IconButton(tooltip: 'My cart', icon: Badge(isLabelVisible: shop.count > 0, label: Text('${shop.count}'), child: const Icon(Icons.shopping_cart_outlined)), onPressed: () => Navigator.pushNamed(context, '/shop/cart')),
              ],
            ),
            body: SafeArea(child: shop.products.isEmpty ? const Center(child: CircularProgressIndicator()) : child),
            bottomNavigationBar: showCartBar && shop.count > 0
                ? SafeArea(
                    child: Material(
                      color: const Color(0xFF0C831F),
                      child: InkWell(
                        onTap: () => Navigator.pushNamed(context, '/shop/cart'),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Row(children: [
                            const Icon(Icons.shopping_cart, color: Colors.white),
                            const SizedBox(width: 10),
                            Text('${shop.count} item${shop.count > 1 ? 's' : ''}\n${_inr(shop.subtotal)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                            const Spacer(),
                            const Text('View Cart ▸', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                          ]),
                        ),
                      ),
                    ),
                  )
                : null,
          ),
        ),
      );
}

class AddButton extends StatelessWidget {
  const AddButton({super.key, required this.id, this.big = false});
  final int id;
  final bool big;
  @override
  Widget build(BuildContext context) {
    final qty = shop.qtyOf(id);
    const green = Color(0xFF0C831F);
    if (qty == 0) {
      return OutlinedButton(
        style: OutlinedButton.styleFrom(foregroundColor: green, side: const BorderSide(color: green), minimumSize: Size(big ? 120 : 64, big ? 44 : 34), padding: const EdgeInsets.symmetric(horizontal: 10)),
        onPressed: () => shop.setQty(id, 1),
        child: const Text('ADD', style: TextStyle(fontWeight: FontWeight.w800)),
      );
    }
    return Container(
      height: big ? 44 : 34,
      decoration: BoxDecoration(color: green, borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        IconButton(visualDensity: VisualDensity.compact, color: Colors.white, icon: const Icon(Icons.remove, size: 18), onPressed: () => shop.setQty(id, qty - 1)),
        Text('$qty', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
        IconButton(visualDensity: VisualDensity.compact, color: Colors.white, icon: const Icon(Icons.add, size: 18), onPressed: () => shop.setQty(id, qty + 1)),
      ]),
    );
  }
}

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.p, this.width = 160});
  final Map p;
  final double width;
  @override
  Widget build(BuildContext context) {
    final off = offPct(p);
    final id = p['id'] as int;
    return SizedBox(
      width: width,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => Navigator.pushNamed(context, '/shop/product', arguments: {'id': id}),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Stack(children: [
                Container(height: 90, width: double.infinity, alignment: Alignment.center, decoration: BoxDecoration(color: const Color(0xFFF5F7FA), borderRadius: BorderRadius.circular(10)), child: Text('${p['emoji']}', style: const TextStyle(fontSize: 46))),
                if (off > 0) Positioned(left: 0, top: 0, child: Container(padding: const EdgeInsets.all(4), color: const Color(0xFF256FEF), child: Text('$off%\nOFF', style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w800)))),
                Positioned(right: -8, top: -8, child: IconButton(icon: Icon(shop.wishlist.contains(id) ? Icons.favorite : Icons.favorite_border, color: shop.wishlist.contains(id) ? C.red : C.muted, size: 20), onPressed: () => shop.toggleWish(id))),
              ]),
              const SizedBox(height: 6),
              const Text('⏱ 30 MINS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: C.muted)),
              Text('${p['name']}', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              Text('${p['subtitle']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: C.muted, fontSize: 11.5)),
              const SizedBox(height: 6),
              Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(_inr(p['price']), style: const TextStyle(fontWeight: FontWeight.w800)),
                    if (p['old'] != null) Text(_inr(p['old']), style: const TextStyle(decoration: TextDecoration.lineThrough, color: C.muted, fontSize: 11)),
                  ]),
                ),
                AddButton(id: id),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

Widget _rail(BuildContext context, String title, List<Map> items, {Map? args}) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 8, 6),
        child: Row(children: [
          Expanded(child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))),
          TextButton(onPressed: () => Navigator.pushNamed(context, '/shop/products', arguments: args), child: const Text('see all')),
        ]),
      ),
      SizedBox(height: 250, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [for (final p in items) ProductCard(p: p)])),
    ]);

// ── Shop home ──────────────────────────────────────────────────────────────
class ShopScreen extends StatelessWidget {
  const ShopScreen({super.key});
  @override
  Widget build(BuildContext context) => _ShopPage(
        title: 'ShishuShop',
        child: Builder(builder: (context) {
          List<Map> by(List<String> cats) => shop.products.where((p) => cats.contains(p['category'])).toList();
          final best = [...shop.products]..sort((a, b) => (b['reviews'] as int).compareTo(a['reviews'] as int));
          const promos = [
            ('Health kits at your doorstep', 'Thermometers, ORS & more', 'Health Kits', '🩺', C.dark, Colors.white),
            ('Feeding time made easy', 'Bottles, sippers & cereals', 'Feeding', '🍼', Color(0xFFF7C948), C.text),
            ('Big savings on baby care', 'Up to 25% off', null, '🏷️', Color(0xFFD9F4F8), C.text),
          ];
          return ListView(children: [
            Container(
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: const Color(0xFFF8F8F8), borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                const Text('⚡', style: TextStyle(fontSize: 24)),
                const SizedBox(width: 10),
                Expanded(child: Text('Delivery in $_delivery\n${shop.orders.isNotEmpty ? 'Home – ${shop.orders.first['address']?['city'] ?? ''}' : 'Set address at checkout'}', style: const TextStyle(fontWeight: FontWeight.w700))),
              ]),
            ),
            SizedBox(
              height: 130,
              child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [
                for (final (title, sub, cat, emoji, bg, fg) in promos)
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/shop/products', arguments: cat == null ? {'sale': true} : {'category': cat}),
                    child: Container(
                      width: 260,
                      margin: const EdgeInsets.only(right: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14)),
                      child: Row(children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [Text(title, style: TextStyle(color: fg, fontWeight: FontWeight.w800, fontSize: 15)), Text(sub, style: TextStyle(color: fg.withValues(alpha: .8)))])),
                        Text(emoji, style: const TextStyle(fontSize: 40)),
                      ]),
                    ),
                  ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(spacing: 8, runSpacing: 8, children: [
                for (final c in shop.categories) ActionChip(avatar: Text('${c['emoji']}'), label: Text('${c['name']}'), onPressed: () => Navigator.pushNamed(context, '/shop/products', arguments: {'category': c['name']})),
                ActionChip(avatar: const Text('🏷️'), label: const Text('On Sale'), onPressed: () => Navigator.pushNamed(context, '/shop/products', arguments: {'sale': true})),
                ActionChip(avatar: const Text('🛍️'), label: const Text('All Products'), onPressed: () => Navigator.pushNamed(context, '/shop/products')),
              ]),
            ),
            _rail(context, 'Bestsellers', best.take(8).toList()),
            _rail(context, 'Health & Baby Care', by(['Health Kits', 'Baby Care']), args: {'category': 'Health Kits'}),
            _rail(context, 'Food & Feeding', by(['Nutrition', 'Feeding']), args: {'category': 'Nutrition'}),
            _rail(context, 'Clothing & Toys', by(['Baby Clothing', 'Toys']), args: {'category': 'Toys'}),
            const SizedBox(height: 20),
          ]);
        }),
      );
}

// ── Product listing ────────────────────────────────────────────────────────
class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key, this.args = const {}});
  final Map args;
  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  late String category = '${widget.args['category'] ?? ''}';
  late bool sale = widget.args['sale'] == true;
  String q = '', sort = 'relevance';

  @override
  Widget build(BuildContext context) => _ShopPage(
        title: q.isNotEmpty ? 'Results for "$q"' : (category.isNotEmpty ? category : sale ? 'On Sale' : 'All Products'),
        child: Builder(builder: (context) {
          final list = shop.products.where((p) => category.isEmpty || p['category'] == category).where((p) => !sale || p['old'] != null).where((p) => q.isEmpty || '${p['name']} ${p['category']} ${p['subtitle']}'.toLowerCase().contains(q.toLowerCase())).toList();
          int cmp(Map a, Map b) => switch (sort) {
                'priceLow' => (a['price'] as int).compareTo(b['price'] as int),
                'priceHigh' => (b['price'] as int).compareTo(a['price'] as int),
                'discount' => offPct(b).compareTo(offPct(a)),
                _ => (b['reviews'] as int).compareTo(a['reviews'] as int),
              };
          list.sort(cmp);
          return ListView(padding: const EdgeInsets.all(12), children: [
            TextField(autofocus: widget.args['focus'] == true, onChanged: (v) => setState(() => q = v.trim()), decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search "baby oil", "thermometer"…')),
            const SizedBox(height: 8),
            ChoiceRow(
              value: sale ? 'sale' : (category.isEmpty ? 'all' : category),
              onChanged: (v) => setState(() {
                sale = v == 'sale';
                category = v == 'sale' || v == 'all' ? '' : v;
              }),
              options: [('all', '🛍️ All'), for (final c in shop.categories) ('${c['name']}', '${c['emoji']} ${c['name']}'), ('sale', '🏷️ On Sale')],
            ),
            Row(children: [
              Text('${list.length} products', style: const TextStyle(color: C.muted)),
              const Spacer(),
              DropdownButton<String>(
                value: sort,
                underline: const SizedBox.shrink(),
                items: const [DropdownMenuItem(value: 'relevance', child: Text('Relevance')), DropdownMenuItem(value: 'priceLow', child: Text('Price (Low to High)')), DropdownMenuItem(value: 'priceHigh', child: Text('Price (High to Low)')), DropdownMenuItem(value: 'discount', child: Text('% Off'))],
                onChanged: (v) => setState(() => sort = v ?? 'relevance'),
              ),
            ]),
            if (list.isEmpty) const EmptyState('Nothing here yet\nTry a different search or category.', icon: Icons.search_off),
            LayoutBuilder(builder: (context, c) {
              final cols = (c.maxWidth / 170).floor().clamp(2, 6);
              return Wrap(children: [for (final p in list) ProductCard(p: p, width: c.maxWidth / cols)]);
            }),
          ]);
        }),
      );
}

// ── Product detail ─────────────────────────────────────────────────────────
class ProductDetailScreen extends StatelessWidget {
  const ProductDetailScreen({super.key, required this.id});
  final dynamic id;
  @override
  Widget build(BuildContext context) => _ShopPage(
        title: 'Product',
        child: Builder(builder: (context) {
          final p = shop.product(id);
          if (p == null) return const EmptyState('Product not found');
          final off = offPct(p);
          final similar = shop.products.where((x) => x['category'] == p['category'] && x['id'] != p['id']).toList();
          final more = shop.products.where((x) => x['category'] != p['category']).take(8).toList();
          final pid = p['id'] as int;
          return ListView(children: [
            Container(height: 220, alignment: Alignment.center, color: const Color(0xFFF5F7FA), child: Text('${p['emoji']}', style: const TextStyle(fontSize: 120))),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Home / ${p['category']}', style: const TextStyle(color: C.muted, fontSize: 12)),
                const SizedBox(height: 4),
                Text('${p['name']}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                const Text('⏱ 30 MINS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: C.muted)),
                Text('★' * (p['rating'] as num).round() + '☆' * (5 - (p['rating'] as num).round()) + '  ${p['rating']} (${p['reviews']} reviews)', style: const TextStyle(color: Color(0xFFF59E0B))),
                const SizedBox(height: 10),
                Text('${p['subtitle']}', style: const TextStyle(color: C.muted)),
                Row(children: [
                  Text(_inr(p['price']), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  if (p['old'] != null) Padding(padding: const EdgeInsets.only(left: 8), child: Text('MRP ${_inr(p['old'])}', style: const TextStyle(decoration: TextDecoration.lineThrough, color: C.muted))),
                  if (off > 0) Padding(padding: const EdgeInsets.only(left: 8), child: Badge2('$off% OFF', tone: const Tone(Colors.white, Color(0xFF256FEF)))),
                ]),
                const Text('(Inclusive of all taxes)', style: TextStyle(color: C.muted, fontSize: 12)),
                const SizedBox(height: 12),
                Row(children: [
                  IconButton.outlined(icon: Icon(shop.wishlist.contains(pid) ? Icons.favorite : Icons.favorite_border, color: shop.wishlist.contains(pid) ? C.red : null), onPressed: () => shop.toggleWish(pid)),
                  const SizedBox(width: 10),
                  AddButton(id: pid, big: true),
                ]),
                const SizedBox(height: 16),
                const Text('Product Details', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                const Text('Key Features', style: TextStyle(fontWeight: FontWeight.w700)),
                Text('${p['desc']}'),
                const SizedBox(height: 6),
                const Text('Suitable For', style: TextStyle(fontWeight: FontWeight.w700)),
                Text('${p['subtitle']}'),
                const SizedBox(height: 16),
                const Text('Why shop from ShishuShop?', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                for (final (e, title, sub) in const [
                  ('⚡', 'Superfast Delivery', 'Get your order delivered to your doorstep at the earliest.'),
                  ('🏷️', 'Best Prices & Offers', 'Best price destination with offers directly from the manufacturers.'),
                  ('🩺', 'Paediatrician Approved', 'Every product is checked for child safety before it is listed.'),
                ])
                  ListTile(contentPadding: EdgeInsets.zero, leading: Text(e, style: const TextStyle(fontSize: 24)), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(sub)),
              ]),
            ),
            if (similar.isNotEmpty) _rail(context, 'Similar products', similar, args: {'category': p['category']}),
            _rail(context, 'You might also like', more),
            const SizedBox(height: 20),
          ]);
        }),
      );
}

Widget _bill(int subtotal, int mrpTotal) {
  final ship = shippingFor(subtotal), saved = mrpTotal - subtotal;
  return Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Bill details', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 8),
        Row(children: [Expanded(child: Text('🧾 Items total${saved > 0 ? '  (Saved ${_inr(saved)})' : ''}')), Text(_inr(subtotal))]),
        Row(children: [const Expanded(child: Text('🚲 Delivery charge')), Text(ship > 0 ? _inr(ship) : 'FREE', style: TextStyle(fontWeight: ship > 0 ? null : FontWeight.w800, color: ship > 0 ? null : C.green))]),
        if (ship > 0) Text('Add items worth ${_inr(_freeShippingMin - subtotal)} more for FREE delivery', style: const TextStyle(color: C.primary, fontSize: 12)),
        const Divider(),
        Row(children: [const Expanded(child: Text('Grand total', style: TextStyle(fontWeight: FontWeight.w800))), Text(_inr(subtotal + ship), style: const TextStyle(fontWeight: FontWeight.w800))]),
      ]),
    ),
  );
}

Widget _cartLines(BuildContext context) => Card(
      child: Column(children: [
        ListTile(leading: const Text('⏱️', style: TextStyle(fontSize: 22)), title: const Text('Delivery in $_delivery', style: TextStyle(fontWeight: FontWeight.w800)), subtitle: Text('Shipment of ${shop.count} item(s)')),
        for (final (p, _) in shop.lines)
          ListTile(
            leading: Text('${p['emoji']}', style: const TextStyle(fontSize: 30)),
            title: Text('${p['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Text('${p['subtitle']}\n${_inr(p['price'])}'),
            isThreeLine: true,
            trailing: AddButton(id: p['id'] as int),
            onTap: () => Navigator.pushNamed(context, '/shop/product', arguments: {'id': p['id']}),
          ),
      ]),
    );

// ── Cart / checkout / orders / wishlist ────────────────────────────────────
class CartScreen extends StatelessWidget {
  const CartScreen({super.key});
  @override
  Widget build(BuildContext context) => _ShopPage(
        title: 'My Cart',
        showCartBar: false,
        child: Builder(builder: (context) {
          if (shop.lines.isEmpty) return _empty(context, "You don't have any items in your cart", 'Your favourite items are just a click away.', Icons.shopping_cart_outlined);
          final total = shop.subtotal + shippingFor(shop.subtotal);
          return ListView(padding: const EdgeInsets.all(12), children: [
            _cartLines(context),
            _bill(shop.subtotal, shop.mrpTotal),
            const Card(child: Padding(padding: EdgeInsets.all(14), child: Text('Cancellation Policy\nOrders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.', style: TextStyle(fontSize: 12.5)))),
            FilledButton(style: FilledButton.styleFrom(backgroundColor: const Color(0xFF0C831F), minimumSize: const Size.fromHeight(54)), onPressed: () => Navigator.pushNamed(context, '/shop/checkout'), child: Text('${_inr(total)} TOTAL   ·   Proceed ▸')),
          ]);
        }),
      );
}

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final form = GlobalKey<FormState>();
  final c = {for (final k in ['name', 'phone', 'line', 'city', 'state', 'pincode']) k: TextEditingController()};
  String payment = 'Cash on Delivery';

  @override
  void initState() {
    super.initState();
    shop.load().then((_) {
      final last = shop.orders.firstOrNull?['address'] as Map?;
      if (last != null) {
        for (final e in c.entries) {
          e.value.text = '${last[e.key] ?? ''}';
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) => _ShopPage(
        title: 'Checkout',
        showCartBar: false,
        child: Builder(builder: (context) {
          if (shop.lines.isEmpty) return _empty(context, "You don't have any items in your cart", '', Icons.shopping_cart_outlined);
          String? req(String? v) => v == null || v.trim().isEmpty ? 'Required' : null;
          return Form(
            key: form,
            child: ListView(padding: const EdgeInsets.all(12), children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(children: [
                    const Align(alignment: Alignment.centerLeft, child: Text('Delivery address', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16))),
                    gap,
                    TextFormField(controller: c['name'], validator: req, decoration: const InputDecoration(labelText: 'Full name')),
                    gap,
                    TextFormField(controller: c['phone'], keyboardType: TextInputType.phone, validator: (v) => RegExp(r'^[6-9]\d{9}$').hasMatch(v ?? '') ? null : '10-digit Indian mobile number', decoration: const InputDecoration(labelText: 'Mobile number')),
                    gap,
                    TextFormField(controller: c['line'], validator: req, decoration: const InputDecoration(labelText: 'House no., street, area')),
                    gap,
                    TextFormField(controller: c['city'], validator: req, decoration: const InputDecoration(labelText: 'City / Village')),
                    gap,
                    TextFormField(controller: c['state'], validator: req, decoration: const InputDecoration(labelText: 'State')),
                    gap,
                    TextFormField(controller: c['pincode'], keyboardType: TextInputType.number, validator: (v) => RegExp(r'^[1-9]\d{5}$').hasMatch(v ?? '') ? null : '6-digit PIN code', decoration: const InputDecoration(labelText: 'PIN code')),
                  ]),
                ),
              ),
              Card(
                child: Column(children: [
                  const ListTile(title: Text('Payment method', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16))),
                  for (final (label, sub, emoji) in const [('Cash on Delivery', 'Pay in cash when your order arrives', '💵'), ('UPI on Delivery', 'Scan & pay with any UPI app at your door', '📱')])
                    ListTile(
                      leading: Icon(payment == label ? Icons.radio_button_checked : Icons.radio_button_unchecked, color: const Color(0xFF0C831F)),
                      title: Text('$emoji $label', style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(sub),
                      onTap: () => setState(() => payment = label),
                    ),
                ]),
              ),
              _cartLines(context),
              _bill(shop.subtotal, shop.mrpTotal),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: const Color(0xFF0C831F), minimumSize: const Size.fromHeight(54)),
                onPressed: () {
                  if (!(form.currentState?.validate() ?? false)) return;
                  final order = shop.placeOrder({for (final e in c.entries) e.key: e.value.text.trim()}, payment);
                  Navigator.pushReplacementNamed(context, '/shop/order', arguments: {'id': order['id'], 'justPlaced': true});
                },
                child: Text('${_inr(shop.subtotal + shippingFor(shop.subtotal))} TOTAL   ·   Place Order ▸'),
              ),
            ]),
          );
        }),
      );
}

String _orderDate(dynamic iso) => fmtDateTime(iso);

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.id, this.justPlaced = false});
  final String id;
  final bool justPlaced;
  @override
  Widget build(BuildContext context) => _ShopPage(
        title: 'Order',
        child: Builder(builder: (context) {
          final o = shop.orders.where((x) => x['id'] == id).firstOrNull;
          if (o == null) return _empty(context, 'Order not found', '', Icons.receipt_long_outlined);
          final a = (o['address'] as Map?) ?? {};
          final items = (o['items'] as List?) ?? [];
          return ListView(padding: const EdgeInsets.all(12), children: [
            if (justPlaced) Card(color: const Color(0xFFE8F5E9), child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [const Icon(Icons.check_circle, color: Color(0xFF0C831F), size: 48), const Text('Order placed!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)), Text("Arriving in $_delivery. We'll call ${a['phone']} before delivery.", textAlign: TextAlign.center)]))),
            Card(child: ListTile(title: Text('Order #${o['id']}', style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(_orderDate(o['date'])), trailing: Badge2('${o['status']}', tone: goodTone))),
            Card(
              child: Column(children: [
                ListTile(title: Text('${items.fold<int>(0, (n, i) => n + (i['qty'] as int))} item(s) in this order', style: const TextStyle(fontWeight: FontWeight.w700))),
                for (final it in items)
                  ListTile(leading: Text('${shop.product(it['id'])?['emoji'] ?? '📦'}', style: const TextStyle(fontSize: 26)), title: Text('${shop.product(it['id'])?['name'] ?? 'Product'}'), subtitle: Text('${it['qty']} × ${_inr(it['price'])}'), trailing: Text(_inr((it['price'] as int) * (it['qty'] as int)), style: const TextStyle(fontWeight: FontWeight.w800))),
              ]),
            ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Bill details', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  InfoRow('Items total', _inr(o['subtotal'])),
                  InfoRow('Delivery charge', (o['shipping'] ?? 0) == 0 ? 'FREE' : _inr(o['shipping'])),
                  InfoRow('Grand total', _inr(o['total'])),
                  const Divider(),
                  InfoRow('Payment', '${o['payment']}'),
                  InfoRow('Deliver to', '${a['name']}, ${a['line']}, ${a['city']}, ${a['state']} – ${a['pincode']} · ${a['phone']}'),
                ]),
              ),
            ),
            Row(children: [
              Expanded(child: OutlinedButton(onPressed: () => Navigator.pushReplacementNamed(context, '/shop/orders'), child: const Text('All orders'))),
              const SizedBox(width: 10),
              Expanded(child: FilledButton(onPressed: () => Navigator.popUntil(context, (r) => r.settings.name == '/shop' || r.isFirst), child: const Text('Continue shopping'))),
            ]),
          ]);
        }),
      );
}

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});
  @override
  Widget build(BuildContext context) => _ShopPage(
        title: 'My Orders',
        child: Builder(builder: (context) {
          if (shop.orders.isEmpty) return _empty(context, 'No orders yet', 'Your orders will show up here.', Icons.receipt_long_outlined);
          return ListView(padding: const EdgeInsets.all(12), children: [
            for (final o in shop.orders)
              Card(
                child: ListTile(
                  leading: Text('${shop.product((o['items'] as List).firstOrNull?['id'])?['emoji'] ?? '📦'}', style: const TextStyle(fontSize: 28)),
                  title: Text('${_inr(o['total'])}  ·  ${o['status']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                  subtitle: Text('#${o['id']} · ${_orderDate(o['date'])}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(context, '/shop/order', arguments: {'id': o['id']}),
                ),
              ),
          ]);
        }),
      );
}

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});
  @override
  Widget build(BuildContext context) => _ShopPage(
        title: 'My Wishlist',
        child: Builder(builder: (context) {
          final items = shop.wishlist.map(shop.product).whereType<Map>().toList();
          if (items.isEmpty) return _empty(context, 'Your wishlist is empty', 'Tap the ♡ on any product to save it here.', Icons.favorite_border);
          return ListView(padding: const EdgeInsets.all(12), children: [
            LayoutBuilder(builder: (context, c) {
              final cols = (c.maxWidth / 170).floor().clamp(2, 6);
              return Wrap(children: [for (final p in items) ProductCard(p: p, width: c.maxWidth / cols)]);
            }),
          ]);
        }),
      );
}

Widget _empty(BuildContext context, String title, String sub, IconData icon) => Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 64, color: C.border),
          const SizedBox(height: 10),
          Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          if (sub.isNotEmpty) Text(sub, textAlign: TextAlign.center, style: const TextStyle(color: C.muted)),
          gap,
          FilledButton(onPressed: () => Navigator.pushNamed(context, '/shop'), child: const Text('Start Shopping')),
        ]),
      ),
    );
