import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/ui.dart';

// ponytail: static catalogue and on-device cart/orders, exactly like the website's shop;
// move both to a server API when real checkout and payments exist.
const _freeShippingMin = 499;
int shippingFor(int subtotal) =>
    subtotal == 0 || subtotal >= _freeShippingMin ? 0 : 49;
int offPct(Map p) =>
    p['old'] == null ? 0 : ((1 - p['price'] / p['old']) * 100).round();

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
      cart = {
        for (final e
            in (jsonDecode(p.getString('shopCartItems') ?? '[]') as List))
          e['id'] as int: e['qty'] as int,
      };
      wishlist = {
        ...(jsonDecode(p.getString('shopWishlist') ?? '[]') as List)
            .cast<int>(),
      };
      orders = (jsonDecode(p.getString('shopOrders') ?? '[]') as List)
          .cast<Map>();
    } catch (_) {}
    _loaded = true;
    notifyListeners();
  }

  Future<void> _save() async {
    notifyListeners();
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString(
        'shopCartItems',
        jsonEncode([
          for (final e in cart.entries) {'id': e.key, 'qty': e.value},
        ]),
      );
      await p.setString('shopWishlist', jsonEncode(wishlist.toList()));
      await p.setString('shopOrders', jsonEncode(orders));
    } catch (_) {}
  }

  Map? product(dynamic id) => products
      .where((p) => p['id'] == (id is int ? id : int.tryParse('$id')))
      .firstOrNull;
  int qtyOf(int id) => cart[id] ?? 0;
  void setQty(int id, int qty) {
    qty < 1 ? cart.remove(id) : cart[id] = qty;
    _save();
  }

  void toggleWish(int id) {
    wishlist.contains(id) ? wishlist.remove(id) : wishlist.add(id);
    _save();
  }

  List<(Map, int)> get lines => [
    for (final e in cart.entries)
      if (product(e.key) != null) (product(e.key)!, e.value),
  ];
  int get count => lines.fold(0, (n, l) => n + l.$2);
  int get subtotal =>
      lines.fold(0, (n, l) => n + (l.$1['price'] as int) * l.$2);
  int get mrpTotal => lines.fold(
    0,
    (n, l) => n + ((l.$1['old'] ?? l.$1['price']) as int) * l.$2,
  );

  Map placeOrder(Map<String, String> address, String payment) {
    final id =
        'SA${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    final sub = subtotal, ship = shippingFor(sub);
    final order = {
      'id': id,
      'date': DateTime.now().toIso8601String(),
      'items': [
        for (final (p, q) in lines)
          {'id': p['id'], 'qty': q, 'price': p['price']},
      ],
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
  const _ShopPage({
    required this.title,
    required this.child,
    this.showCartBar = true,
  });
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
            IconButton(
              tooltip: 'Search',
              icon: const Icon(Icons.search),
              onPressed: () => Navigator.pushNamed(
                context,
                '/shop/products',
                arguments: {'focus': true},
              ),
            ),
            IconButton(
              tooltip: 'My orders',
              icon: const Icon(Icons.receipt_long_outlined),
              onPressed: () => Navigator.pushNamed(context, '/shop/orders'),
            ),
            IconButton(
              tooltip: 'Wishlist',
              icon: const Icon(Icons.favorite_border),
              onPressed: () => Navigator.pushNamed(context, '/shop/wishlist'),
            ),
            IconButton(
              tooltip: 'My cart',
              icon: Badge(
                isLabelVisible: shop.count > 0,
                label: Text('${shop.count}'),
                child: const Icon(Icons.shopping_cart_outlined),
              ),
              onPressed: () => Navigator.pushNamed(context, '/shop/cart'),
            ),
          ],
        ),
        body: SafeArea(
          child: shop.products.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : child,
        ),
        bottomNavigationBar: showCartBar && shop.count > 0
            ? SafeArea(
                child: Material(
                  color: C.primary,
                  child: InkWell(
                    onTap: () => Navigator.pushNamed(context, '/shop/cart'),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.shopping_cart, color: Colors.white),
                          const SizedBox(width: 10),
                          Text(
                            '${shop.count} item${shop.count > 1 ? 's' : ''}\n${_inr(shop.subtotal)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Spacer(),
                          const Text(
                            'View cart',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
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
    final h = big ? 48.0 : 34.0;
    if (qty == 0 && big) {
      return FilledButton.icon(
        onPressed: () => shop.setQty(id, 1),
        icon: const Icon(Icons.add_shopping_cart, size: 20),
        label: const Text('Add to cart'),
      );
    }
    if (qty == 0) {
      return OutlinedButton(
        style: OutlinedButton.styleFrom(
          foregroundColor: C.primary,
          backgroundColor: Colors.white,
          elevation: big ? 0 : 2,
          shadowColor: const Color(0x33000000),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          side: const BorderSide(color: C.primary),
          minimumSize: Size(big ? double.infinity : 60, h),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        onPressed: () => shop.setQty(id, 1),
        child: Text(
          big ? 'Add to cart' : 'Add',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
      );
    }
    return Container(
      height: h,
      decoration: BoxDecoration(
        color: C.primary,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: big ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            visualDensity: VisualDensity.compact,
            color: Colors.white,
            tooltip: 'Remove one',
            icon: const Icon(Icons.remove, size: 18),
            onPressed: () => shop.setQty(id, qty - 1),
          ),
          Text(
            '$qty',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            color: Colors.white,
            tooltip: 'Add one',
            icon: const Icon(Icons.add, size: 18),
            onPressed: () => shop.setQty(id, qty + 1),
          ),
        ],
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.p, this.width = 164});
  final Map p;
  final double width;
  @override
  Widget build(BuildContext context) {
    final off = offPct(p);
    final id = p['id'] as int;
    final wished = shop.wishlist.contains(id);
    return SizedBox(
      width: width,
      child: Padding(
        padding: const EdgeInsets.all(5),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => Navigator.pushNamed(
            context,
            '/shop/product',
            arguments: {'id': id},
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  AspectRatio(
                    aspectRatio: 1,
                    child: ProductPhoto(p, height: double.infinity, radius: 14),
                  ),
                  if (off > 0)
                    Positioned(
                      left: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: C.primary,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '$off% off',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    right: 4,
                    top: 4,
                    child: IconButton(
                      visualDensity: VisualDensity.compact,
                      tooltip: wished
                          ? 'Remove from wishlist'
                          : 'Add to wishlist',
                      icon: Icon(
                        wished ? Icons.favorite : Icons.favorite_border,
                        color: wished ? C.red : C.muted,
                        size: 20,
                      ),
                      onPressed: () => shop.toggleWish(id),
                    ),
                  ),
                  Positioned(right: 8, bottom: -14, child: AddButton(id: id)),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    _inr(p['price']),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15.5,
                    ),
                  ),
                  if (off > 0) ...[
                    const SizedBox(width: 6),
                    Text(
                      _inr(p['old']),
                      style: const TextStyle(
                        color: C.muted,
                        fontSize: 12,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 2),
              Text(
                '${p['name']}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 13.5,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 4),
              _Rating(p),
            ],
          ),
        ),
      ),
    );
  }
}

Widget _rail(
  BuildContext context,
  String title,
  List<Map> items, {
  Map? args,
}) => Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 8, 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
          ),
          TextButton(
            onPressed: () =>
                Navigator.pushNamed(context, '/shop/products', arguments: args),
            child: const Text('See all'),
          ),
        ],
      ),
    ),
    SizedBox(
      height: 268,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [for (final p in items) ProductCard(p: p, width: 150)],
      ),
    ),
  ],
);

/// Product photo: the product cut out on a light tile (assets/photos/product_<id>.jpg; sources and
/// licences in assets/photo_credits.json). Shown whole, never cropped.
const _tile = Color(0xFFF4F3EF);

class ProductPhoto extends StatelessWidget {
  const ProductPhoto(
    this.p, {
    super.key,
    this.height = 110,
    this.width = double.infinity,
    this.radius = 0,
  });
  final Map? p;
  final double height, width, radius;
  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(radius),
    child: Container(
      height: height,
      width: width,
      color: _tile,
      child: Image.asset(
        'assets/photos/product_${p?['id']}.jpg',
        fit: BoxFit.contain,
        errorBuilder: (_, _, _) =>
            const Icon(Icons.inventory_2_outlined, color: C.primary),
      ),
    ),
  );
}

/// "4.5 ★ (1.2k)" in the style shopping apps use.
class _Rating extends StatelessWidget {
  const _Rating(this.p);
  final Map p;
  @override
  Widget build(BuildContext context) {
    final n = p['reviews'] as int;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
          decoration: BoxDecoration(
            color: C.green,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${p['rating']}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(width: 2),
              const Icon(Icons.star_rounded, color: Colors.white, size: 12),
            ],
          ),
        ),
        const SizedBox(width: 5),
        Text(
          '(${n >= 1000 ? '${(n / 1000).toStringAsFixed(1)}k' : n})',
          style: const TextStyle(color: C.muted, fontSize: 11.5),
        ),
      ],
    );
  }
}

/// Shop section for the app's landing page: a heading, categories and the most-bought items.
class ShopTeaser extends StatelessWidget {
  const ShopTeaser({super.key});
  @override
  Widget build(BuildContext context) => FutureBuilder(
    future: shop.load(),
    builder: (context, _) => ListenableBuilder(
      listenable: shop,
      builder: (context, _) {
        if (shop.products.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 8, 0),
              child: Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Shop for your baby',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.3,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Everyday care, feeding and health basics',
                          style: TextStyle(color: C.muted),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/shop'),
                    child: const Text('Open shop'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _CategoryRow(),
            _rail(context, 'Most bought', _bestsellers().take(8).toList()),
          ],
        );
      },
    ),
  );
}

List<Map> _bestsellers() =>
    [...shop.products]
      ..sort((a, b) => (b['reviews'] as int).compareTo(a['reviews'] as int));

/// Categories as photo tiles (photo of the category's most-reviewed product).
class _CategoryRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) => SizedBox(
    height: 112,
    child: ListView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        for (final c in shop.categories)
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => Navigator.pushNamed(
                context,
                '/shop/products',
                arguments: {'category': c['name']},
              ),
              child: SizedBox(
                width: 84,
                child: Column(
                  children: [
                    ProductPhoto(
                      _bestsellers()
                          .where((p) => p['category'] == c['name'])
                          .firstOrNull,
                      height: 76,
                      width: 84,
                      radius: 14,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${c['name']}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    ),
  );
}

/// Tinted banner with a product on the right; opens a filtered product list.
class _Feature extends StatelessWidget {
  const _Feature({
    required this.photo,
    required this.title,
    required this.sub,
    required this.args,
    required this.tint,
  });
  final int photo;
  final String title, sub;
  final Map args;
  final Color tint;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(right: 12),
    child: Material(
      color: tint,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () =>
            Navigator.pushNamed(context, '/shop/products', arguments: args),
        child: SizedBox(
          width: 290,
          child: Row(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 16, 4, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        sub,
                        style: const TextStyle(
                          color: C.muted,
                          fontSize: 13,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Row(
                        children: [
                          Text(
                            'Shop now',
                            style: TextStyle(
                              color: C.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Icon(Icons.chevron_right, color: C.primary, size: 18),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Image.asset(
                    'assets/photos/product_$photo.jpg',
                    width: 118,
                    height: 118,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

// ── Shop home ──────────────────────────────────────────────────────────────
class ShopScreen extends StatelessWidget {
  const ShopScreen({super.key});
  @override
  Widget build(BuildContext context) => _ShopPage(
    title: 'Shop',
    child: Builder(
      builder: (context) {
        List<Map> by(List<String> cats) =>
            shop.products.where((p) => cats.contains(p['category'])).toList();
        return ListView(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => Navigator.pushNamed(
                  context,
                  '/shop/products',
                  arguments: {'focus': true},
                ),
                child: const InputDecorator(
                  decoration: InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Search thermometers, cereal, clothes…',
                  ),
                  child: Text(
                    'Search thermometers, cereal, clothes…',
                    style: TextStyle(color: C.muted),
                  ),
                ),
              ),
            ),
            SizedBox(
              height: 170,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: const [
                  _Feature(
                    photo: 6,
                    title: 'Toys',
                    sub: 'Soft toys and rattles',
                    args: {'category': 'Toys'},
                    tint: Color(0xFFF6E7D3),
                  ),
                  _Feature(
                    photo: 5,
                    title: 'Feeding',
                    sub: 'Bottles, sippers and cereals',
                    args: {'category': 'Feeding'},
                    tint: Color(0xFFE3EEF3),
                  ),
                  _Feature(
                    photo: 8,
                    title: 'Health kits',
                    sub: 'Thermometer, ORS, weighing scale',
                    args: {'category': 'Health Kits'},
                    tint: Color(0xFFE6F0EA),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 20, 16, 10),
              child: Text(
                'Categories',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.2,
                ),
              ),
            ),
            _CategoryRow(),
            _rail(context, 'Most bought', _bestsellers().take(8).toList()),
            _rail(
              context,
              'Health and baby care',
              by(['Health Kits', 'Baby Care']),
              args: {'category': 'Health Kits'},
            ),
            _rail(
              context,
              'Food and feeding',
              by(['Nutrition', 'Feeding']),
              args: {'category': 'Nutrition'},
            ),
            _rail(
              context,
              'Clothes and toys',
              by(['Baby Clothing', 'Toys']),
              args: {'category': 'Toys'},
            ),
            const SizedBox(height: 20),
          ],
        );
      },
    ),
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
    title: q.isNotEmpty
        ? 'Results for "$q"'
        : (category.isNotEmpty
              ? category
              : sale
              ? 'On Sale'
              : 'All Products'),
    child: Builder(
      builder: (context) {
        final list = shop.products
            .where((p) => category.isEmpty || p['category'] == category)
            .where((p) => !sale || p['old'] != null)
            .where(
              (p) =>
                  q.isEmpty ||
                  '${p['name']} ${p['category']} ${p['subtitle']}'
                      .toLowerCase()
                      .contains(q.toLowerCase()),
            )
            .toList();
        int cmp(Map a, Map b) => switch (sort) {
          'priceLow' => (a['price'] as int).compareTo(b['price'] as int),
          'priceHigh' => (b['price'] as int).compareTo(a['price'] as int),
          'discount' => offPct(b).compareTo(offPct(a)),
          _ => (b['reviews'] as int).compareTo(a['reviews'] as int),
        };
        list.sort(cmp);
        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            TextField(
              autofocus: widget.args['focus'] == true,
              onChanged: (v) => setState(() => q = v.trim()),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search "baby oil", "thermometer"…',
              ),
            ),
            const SizedBox(height: 8),
            ChoiceRow(
              value: sale ? 'sale' : (category.isEmpty ? 'all' : category),
              onChanged: (v) => setState(() {
                sale = v == 'sale';
                category = v == 'sale' || v == 'all' ? '' : v;
              }),
              options: [
                ('all', 'All'),
                for (final c in shop.categories)
                  ('${c['name']}', '${c['name']}'),
                ('sale', 'On Sale'),
              ],
            ),
            Row(
              children: [
                Text(
                  '${list.length} products',
                  style: const TextStyle(color: C.muted),
                ),
                const Spacer(),
                DropdownButton<String>(
                  value: sort,
                  underline: const SizedBox.shrink(),
                  items: const [
                    DropdownMenuItem(
                      value: 'relevance',
                      child: Text('Relevance'),
                    ),
                    DropdownMenuItem(
                      value: 'priceLow',
                      child: Text('Price (Low to High)'),
                    ),
                    DropdownMenuItem(
                      value: 'priceHigh',
                      child: Text('Price (High to Low)'),
                    ),
                    DropdownMenuItem(value: 'discount', child: Text('% Off')),
                  ],
                  onChanged: (v) => setState(() => sort = v ?? 'relevance'),
                ),
              ],
            ),
            if (list.isEmpty)
              const EmptyState(
                'Nothing here yet\nTry a different search or category.',
                icon: Icons.search_off,
              ),
            LayoutBuilder(
              builder: (context, c) {
                final cols = (c.maxWidth / 170).floor().clamp(2, 6);
                return Wrap(
                  children: [
                    for (final p in list)
                      ProductCard(p: p, width: c.maxWidth / cols),
                  ],
                );
              },
            ),
          ],
        );
      },
    ),
  );
}

// ── Product detail ─────────────────────────────────────────────────────────
class ProductDetailScreen extends StatelessWidget {
  const ProductDetailScreen({super.key, required this.id});
  final dynamic id;
  @override
  Widget build(BuildContext context) => _ShopPage(
    title: 'Product',
    child: Builder(
      builder: (context) {
        final p = shop.product(id);
        if (p == null) return const EmptyState('Product not found');
        final off = offPct(p);
        final similar = shop.products
            .where((x) => x['category'] == p['category'] && x['id'] != p['id'])
            .toList();
        final more = shop.products
            .where((x) => x['category'] != p['category'])
            .take(8)
            .toList();
        final pid = p['id'] as int;
        return ListView(
          children: [
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 1.1,
                  child: ProductPhoto(p, height: double.infinity),
                ),
                Positioned(
                  right: 12,
                  top: 12,
                  child: Material(
                    color: Colors.white,
                    shape: const CircleBorder(),
                    child: IconButton(
                      tooltip: 'Wishlist',
                      icon: Icon(
                        shop.wishlist.contains(pid)
                            ? Icons.favorite
                            : Icons.favorite_border,
                        color: shop.wishlist.contains(pid) ? C.red : C.text,
                      ),
                      onPressed: () => shop.toggleWish(pid),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${p['category']}',
                    style: const TextStyle(
                      color: C.primary,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${p['name']}',
                    style: const TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${p['subtitle']}',
                    style: const TextStyle(color: C.muted),
                  ),
                  const SizedBox(height: 8),
                  _Rating(p),
                  const SizedBox(height: 16),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      if (off > 0) ...[
                        Text(
                          '-$off%',
                          style: const TextStyle(
                            color: C.red,
                            fontSize: 20,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        _inr(p['price']),
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                  if (p['old'] != null)
                    Text(
                      'MRP ${_inr(p['old'])}',
                      style: const TextStyle(
                        color: C.muted,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  const Text(
                    'Inclusive of all taxes',
                    style: TextStyle(color: C.muted, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: AddButton(id: pid, big: true),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: C.border),
                    ),
                    child: const Column(
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.payments_outlined,
                              color: C.primary,
                              size: 20,
                            ),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text('Pay on delivery: cash or UPI'),
                            ),
                          ],
                        ),
                        SizedBox(height: 10),
                        Row(
                          children: [
                            Icon(
                              Icons.call_outlined,
                              color: C.primary,
                              size: 20,
                            ),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'We call you to confirm the delivery time',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'About this item',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 6),
                  Text('${p['desc']}', style: const TextStyle(height: 1.5)),
                ],
              ),
            ),
            if (similar.isNotEmpty)
              _rail(
                context,
                'Similar products',
                similar,
                args: {'category': p['category']},
              ),
            _rail(context, 'You may also like', more),
            const SizedBox(height: 20),
          ],
        );
      },
    ),
  );
}

Widget _bill(int subtotal, int mrpTotal) {
  final ship = shippingFor(subtotal), saved = mrpTotal - subtotal;
  return Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Bill details',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Items total${saved > 0 ? '  (Saved ${_inr(saved)})' : ''}',
                ),
              ),
              Text(_inr(subtotal)),
            ],
          ),
          Row(
            children: [
              const Expanded(child: Text('Delivery charge')),
              Text(
                ship > 0 ? _inr(ship) : 'FREE',
                style: TextStyle(
                  fontWeight: ship > 0 ? null : FontWeight.w800,
                  color: ship > 0 ? null : C.green,
                ),
              ),
            ],
          ),
          if (ship > 0)
            Text(
              'Add items worth ${_inr(_freeShippingMin - subtotal)} more for FREE delivery',
              style: const TextStyle(color: C.primary, fontSize: 12),
            ),
          const Divider(),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Grand total',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                _inr(subtotal + ship),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

Widget _cartLines(BuildContext context) => Card(
  child: Column(
    children: [
      ListTile(
        leading: const IconWell(Icons.local_shipping_outlined),
        title: const Text(
          'Home delivery',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text('Shipment of ${shop.count} item(s)'),
      ),
      for (final (p, _) in shop.lines)
        ListTile(
          leading: ProductPhoto(p, height: 52, width: 52, radius: 8),
          title: Text(
            '${p['name']}',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text('${p['subtitle']}\n${_inr(p['price'])}'),
          isThreeLine: true,
          trailing: AddButton(id: p['id'] as int),
          onTap: () => Navigator.pushNamed(
            context,
            '/shop/product',
            arguments: {'id': p['id']},
          ),
        ),
    ],
  ),
);

// ── Cart / checkout / orders / wishlist ────────────────────────────────────
class CartScreen extends StatelessWidget {
  const CartScreen({super.key});
  @override
  Widget build(BuildContext context) => _ShopPage(
    title: 'My Cart',
    showCartBar: false,
    child: Builder(
      builder: (context) {
        if (shop.lines.isEmpty) {
          return _empty(
            context,
            "You don't have any items in your cart",
            'Your favourite items are just a click away.',
            Icons.shopping_cart_outlined,
          );
        }
        final total = shop.subtotal + shippingFor(shop.subtotal);
        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            _cartLines(context),
            _bill(shop.subtotal, shop.mrpTotal),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(14),
                child: Text(
                  'Cancellation Policy\nOrders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.',
                  style: TextStyle(fontSize: 12.5),
                ),
              ),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2D6A4F),
                minimumSize: const Size.fromHeight(54),
              ),
              onPressed: () => Navigator.pushNamed(context, '/shop/checkout'),
              child: Text('${_inr(total)} TOTAL   ·   Proceed ▸'),
            ),
          ],
        );
      },
    ),
  );
}

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final form = GlobalKey<FormState>();
  final c = {
    for (final k in ['name', 'phone', 'line', 'city', 'state', 'pincode'])
      k: TextEditingController(),
  };
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
    child: Builder(
      builder: (context) {
        if (shop.lines.isEmpty) {
          return _empty(
            context,
            "You don't have any items in your cart",
            '',
            Icons.shopping_cart_outlined,
          );
        }
        String? req(String? v) =>
            v == null || v.trim().isEmpty ? 'Required' : null;
        return Form(
          key: form,
          child: ListView(
            padding: const EdgeInsets.all(12),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    children: [
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Delivery address',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      gap,
                      TextFormField(
                        controller: c['name'],
                        validator: req,
                        decoration: const InputDecoration(
                          labelText: 'Full name',
                        ),
                      ),
                      gap,
                      TextFormField(
                        controller: c['phone'],
                        keyboardType: TextInputType.phone,
                        validator: (v) =>
                            RegExp(r'^[6-9]\d{9}$').hasMatch(v ?? '')
                            ? null
                            : '10-digit Indian mobile number',
                        decoration: const InputDecoration(
                          labelText: 'Mobile number',
                        ),
                      ),
                      gap,
                      TextFormField(
                        controller: c['line'],
                        validator: req,
                        decoration: const InputDecoration(
                          labelText: 'House no., street, area',
                        ),
                      ),
                      gap,
                      TextFormField(
                        controller: c['city'],
                        validator: req,
                        decoration: const InputDecoration(
                          labelText: 'City / Village',
                        ),
                      ),
                      gap,
                      TextFormField(
                        controller: c['state'],
                        validator: req,
                        decoration: const InputDecoration(labelText: 'State'),
                      ),
                      gap,
                      TextFormField(
                        controller: c['pincode'],
                        keyboardType: TextInputType.number,
                        validator: (v) =>
                            RegExp(r'^[1-9]\d{5}$').hasMatch(v ?? '')
                            ? null
                            : '6-digit PIN code',
                        decoration: const InputDecoration(
                          labelText: 'PIN code',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Card(
                child: Column(
                  children: [
                    const ListTile(
                      title: Text(
                        'Payment method',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    for (final (label, sub, _) in const [
                      (
                        'Cash on Delivery',
                        'Pay in cash when your order arrives',
                        '💵',
                      ),
                      (
                        'UPI on Delivery',
                        'Scan & pay with any UPI app at your door',
                        '📱',
                      ),
                    ])
                      ListTile(
                        leading: Icon(
                          payment == label
                              ? Icons.radio_button_checked
                              : Icons.radio_button_unchecked,
                          color: C.primary,
                        ),
                        title: Text(
                          label,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(sub),
                        onTap: () => setState(() => payment = label),
                      ),
                  ],
                ),
              ),
              _cartLines(context),
              _bill(shop.subtotal, shop.mrpTotal),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF2D6A4F),
                  minimumSize: const Size.fromHeight(54),
                ),
                onPressed: () {
                  if (!(form.currentState?.validate() ?? false)) return;
                  final order = shop.placeOrder({
                    for (final e in c.entries) e.key: e.value.text.trim(),
                  }, payment);
                  Navigator.pushReplacementNamed(
                    context,
                    '/shop/order',
                    arguments: {'id': order['id'], 'justPlaced': true},
                  );
                },
                child: Text(
                  '${_inr(shop.subtotal + shippingFor(shop.subtotal))} TOTAL   ·   Place Order ▸',
                ),
              ),
            ],
          ),
        );
      },
    ),
  );
}

String _orderDate(dynamic iso) => fmtDateTime(iso);

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({
    super.key,
    required this.id,
    this.justPlaced = false,
  });
  final String id;
  final bool justPlaced;
  @override
  Widget build(BuildContext context) => _ShopPage(
    title: 'Order',
    child: Builder(
      builder: (context) {
        final o = shop.orders.where((x) => x['id'] == id).firstOrNull;
        if (o == null) {
          return _empty(
            context,
            'Order not found',
            '',
            Icons.receipt_long_outlined,
          );
        }
        final a = (o['address'] as Map?) ?? {};
        final items = (o['items'] as List?) ?? [];
        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            if (justPlaced)
              Card(
                color: const Color(0xFFE3F1E8),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.check_circle,
                        color: Color(0xFF2D6A4F),
                        size: 48,
                      ),
                      const Text(
                        'Order placed!',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        "We'll call ${a['phone']} to confirm the delivery time.",
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            Card(
              child: ListTile(
                title: Text(
                  'Order #${o['id']}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text(_orderDate(o['date'])),
                trailing: Badge2('${o['status']}', tone: goodTone),
              ),
            ),
            Card(
              child: Column(
                children: [
                  ListTile(
                    title: Text(
                      '${items.fold<int>(0, (n, i) => n + (i['qty'] as int))} item(s) in this order',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  for (final it in items)
                    ListTile(
                      leading: ProductPhoto(
                        shop.product(it['id']),
                        height: 48,
                        width: 48,
                        radius: 8,
                      ),
                      title: Text(
                        '${shop.product(it['id'])?['name'] ?? 'Product'}',
                      ),
                      subtitle: Text('${it['qty']} × ${_inr(it['price'])}'),
                      trailing: Text(
                        _inr((it['price'] as int) * (it['qty'] as int)),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                ],
              ),
            ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Bill details',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    InfoRow('Items total', _inr(o['subtotal'])),
                    InfoRow(
                      'Delivery charge',
                      (o['shipping'] ?? 0) == 0 ? 'FREE' : _inr(o['shipping']),
                    ),
                    InfoRow('Grand total', _inr(o['total'])),
                    const Divider(),
                    InfoRow('Payment', '${o['payment']}'),
                    InfoRow(
                      'Deliver to',
                      '${a['name']}, ${a['line']}, ${a['city']}, ${a['state']} – ${a['pincode']} · ${a['phone']}',
                    ),
                  ],
                ),
              ),
            ),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () =>
                        Navigator.pushReplacementNamed(context, '/shop/orders'),
                    child: const Text('All orders'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: () => Navigator.popUntil(
                      context,
                      (r) => r.settings.name == '/shop' || r.isFirst,
                    ),
                    child: const Text('Continue shopping'),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    ),
  );
}

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});
  @override
  Widget build(BuildContext context) => _ShopPage(
    title: 'My Orders',
    child: Builder(
      builder: (context) {
        if (shop.orders.isEmpty) {
          return _empty(
            context,
            'No orders yet',
            'Your orders will show up here.',
            Icons.receipt_long_outlined,
          );
        }
        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            for (final o in shop.orders)
              Card(
                child: ListTile(
                  leading: ProductPhoto(
                    shop.product((o['items'] as List).firstOrNull?['id']),
                    height: 48,
                    width: 48,
                    radius: 8,
                  ),
                  title: Text(
                    '${_inr(o['total'])}  ·  ${o['status']}',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text('#${o['id']} · ${_orderDate(o['date'])}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(
                    context,
                    '/shop/order',
                    arguments: {'id': o['id']},
                  ),
                ),
              ),
          ],
        );
      },
    ),
  );
}

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});
  @override
  Widget build(BuildContext context) => _ShopPage(
    title: 'My Wishlist',
    child: Builder(
      builder: (context) {
        final items = shop.wishlist.map(shop.product).whereType<Map>().toList();
        if (items.isEmpty) {
          return _empty(
            context,
            'Your wishlist is empty',
            'Tap the ♡ on any product to save it here.',
            Icons.favorite_border,
          );
        }
        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            LayoutBuilder(
              builder: (context, c) {
                final cols = (c.maxWidth / 170).floor().clamp(2, 6);
                return Wrap(
                  children: [
                    for (final p in items)
                      ProductCard(p: p, width: c.maxWidth / cols),
                  ],
                );
              },
            ),
          ],
        );
      },
    ),
  );
}

Widget _empty(BuildContext context, String title, String sub, IconData icon) =>
    Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: C.border),
            const SizedBox(height: 10),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            if (sub.isNotEmpty)
              Text(
                sub,
                textAlign: TextAlign.center,
                style: const TextStyle(color: C.muted),
              ),
            gap,
            FilledButton(
              onPressed: () => Navigator.pushNamed(context, '/shop'),
              child: const Text('Start Shopping'),
            ),
          ],
        ),
      ),
    );
