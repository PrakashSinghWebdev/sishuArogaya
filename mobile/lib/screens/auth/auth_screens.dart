import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/api.dart';
import '../../core/auth.dart';
import '../../core/i18n.dart';
import '../../core/ui.dart';
import '../../widgets/logo.dart';

final _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
final _phone = RegExp(r'^\d{10}$');
final _ashaUser = RegExp(r'^asha-\d+$', caseSensitive: false);

class _Brand extends StatelessWidget {
  const _Brand({required this.title, required this.subtitle});
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Logo(size: 36),
        const SizedBox(height: 32),
        Text(title, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: C.text, letterSpacing: -0.5)),
        const SizedBox(height: 6),
        Text(subtitle, style: const TextStyle(color: C.muted, fontSize: 15)),
        const SizedBox(height: 24),
      ]);
}

class _Page extends StatelessWidget {
  const _Page({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(actions: [
          IconButton(tooltip: 'Language', icon: const Icon(Icons.translate), onPressed: () => Navigator.pushNamed(context, '/language')),
        ]),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
              ),
            ),
          ),
        ),
      );
}

class PasswordField extends StatefulWidget {
  const PasswordField({super.key, required this.controller, required this.label, this.error, this.onChanged});
  final TextEditingController controller;
  final String label;
  final String? error;
  final ValueChanged<String>? onChanged;
  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool show = false;
  @override
  Widget build(BuildContext context) => TextField(
        controller: widget.controller,
        obscureText: !show,
        onChanged: widget.onChanged,
        decoration: InputDecoration(
          labelText: widget.label,
          errorText: widget.error,
          prefixIcon: const Icon(Icons.lock_outline),
          suffixIcon: IconButton(icon: Icon(show ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => show = !show)),
        ),
      );
}

// ── Login + forgot password ────────────────────────────────────────────────
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const roles = [
    ('parent', 'Parent', 'parent@sishu.gov.in', Icons.family_restroom),
    ('asha', 'ASHA Worker', 'ASHA-123456', Icons.health_and_safety_outlined),
    ('admin', 'Admin', 'admin@sishu.gov.in', Icons.admin_panel_settings_outlined),
  ];
  static const demo = {
    'parent': 'Demo login: parent@sishu.gov.in / Parent@123',
    'asha': 'Demo login: asha@sishu.gov.in / Asha@123',
    'admin': 'Demo login: admin@sishu.gov.in / Admin@123',
  };

  int role = 0;
  String step = 'login'; // login | forgot-request | forgot-reset
  final email = TextEditingController();
  final password = TextEditingController();
  final otp = TextEditingController();
  final newPassword = TextEditingController();
  String userId = '';
  bool emailErr = false, passErr = false, loading = false;
  String error = '', info = '';

  void reset([String next = 'login']) => setState(() {
        step = next;
        error = info = '';
        emailErr = passErr = false;
        if (next != 'forgot-reset') {
          otp.clear();
          newPassword.clear();
        }
      });

  Future<void> login() async {
    final id = email.text.trim();
    setState(() {
      error = info = '';
      emailErr = !(_email.hasMatch(id) || _phone.hasMatch(id) || _ashaUser.hasMatch(id));
      passErr = password.text.length < 6;
    });
    if (emailErr || passErr) return;
    setState(() => loading = true);
    try {
      await auth.login(id, password.text, roles[role].$1);
      // the app's root listens to auth and opens the right home screen
    } catch (e) {
      setState(() => error = e is ApiException ? e.message : 'Login failed. Please try again.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> forgot() async {
    setState(() {
      error = info = '';
      emailErr = !_email.hasMatch(email.text.trim());
    });
    if (emailErr) return;
    setState(() => loading = true);
    try {
      final data = await api.post('/auth/forgot-password', {'email': email.text.trim()});
      userId = '${data['userId'] ?? ''}';
      otp.text = '${data['otp'] ?? ''}';
      setState(() {
        info = data['otp'] != null ? 'Dev OTP: ${data['otp']}' : '${data['message'] ?? 'Password reset OTP sent.'}';
        step = 'forgot-reset';
      });
    } catch (e) {
      setState(() => error = e is ApiException ? e.message : 'Unable to send reset OTP right now.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> resetPassword() async {
    setState(() {
      error = info = '';
      passErr = false;
    });
    if (otp.text.trim().isEmpty) return setState(() => error = 'Please enter the reset OTP.');
    if (newPassword.text.length < 8) return setState(() => passErr = true);
    setState(() => loading = true);
    try {
      final data = await api.post('/auth/reset-password', {'userId': userId, 'otp': otp.text.trim(), 'newPassword': newPassword.text});
      password.clear();
      reset();
      setState(() => info = '${data['message'] ?? 'Password reset successful. Please login.'}');
    } catch (e) {
      setState(() => error = e is ApiException ? e.message : 'Unable to reset password.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = roles[role];
    final submit = FilledButton(
      onPressed: loading ? null : (step == 'login' ? login : step == 'forgot-request' ? forgot : resetPassword),
      child: loading
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : Text(step == 'login' ? t('loginBtn', 'Login') : step == 'forgot-request' ? 'Send Reset OTP' : 'Reset Password'),
    );
    return _Page(children: [
      _Brand(
        title: step == 'login' ? t('loginTitle', 'Welcome back') : step == 'forgot-request' ? 'Forgot Password' : 'Reset Password',
        subtitle: step == 'login'
            ? t('loginSubtitle', 'Sign in to continue')
            : step == 'forgot-request'
                ? 'Enter your registered email to receive a reset OTP.'
                : 'Enter the OTP and choose a new password.',
      ),
      if (error.isNotEmpty) ErrorBox(error),
      if (info.isNotEmpty) NoticeBox(info, tone: infoTone),
      if (step == 'login') ...[
        SegmentedButton<int>(
          segments: [for (var i = 0; i < roles.length; i++) ButtonSegment(value: i, icon: Icon(roles[i].$4, size: 18), label: Text(roles[i].$2, style: const TextStyle(fontSize: 12.5)))],
          selected: {role},
          showSelectedIcon: false,
          onSelectionChanged: (s) => setState(() => role = s.first),
        ),
        gap,
        // demo accounts are seeded only on dev servers, so the hint stays out of release builds
        if (kDebugMode) NoticeBox(demo[r.$1]!, tone: infoTone),
        TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          decoration: InputDecoration(
            labelText: r.$1 == 'asha' ? 'Username / Email / Phone' : t('email', 'Email'),
            hintText: r.$3,
            prefixIcon: const Icon(Icons.alternate_email),
            errorText: emailErr ? 'Please enter a valid email, 10-digit phone number or ASHA username.' : null,
          ),
        ),
        gap,
        PasswordField(controller: password, label: t('password', 'Password'), error: passErr ? 'Password must be at least 6 characters.' : null),
        Align(alignment: Alignment.centerRight, child: TextButton(onPressed: () => reset('forgot-request'), child: Text(t('forgotPassword', 'Forgot password?')))),
        submit,
        const SizedBox(height: 16),
        if (r.$1 != 'parent')
          const Text('Login details are provided by your admin via SMS, WhatsApp or email.', textAlign: TextAlign.center, style: TextStyle(color: C.muted, fontSize: 12.5))
        else
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(t('noAccount', "Don't have an account?"), style: const TextStyle(color: C.muted)),
            TextButton(onPressed: () => Navigator.pushNamed(context, '/register'), child: Text(t('registerBtn', 'Register'))),
          ]),
      ] else if (step == 'forgot-request') ...[
        TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(labelText: t('email', 'Email'), prefixIcon: const Icon(Icons.alternate_email), errorText: emailErr ? 'Please enter a valid email address.' : null),
        ),
        gap,
        submit,
        TextButton(onPressed: reset, child: Text(t('backToLogin', 'Back to login'))),
      ] else ...[
        TextField(
          controller: otp,
          keyboardType: TextInputType.number,
          maxLength: 6,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(labelText: t('otpLabel', 'OTP'), hintText: 'Enter 6-digit OTP', prefixIcon: const Icon(Icons.pin_outlined)),
        ),
        PasswordField(controller: newPassword, label: 'New Password', error: passErr ? 'Password must be at least 8 characters.' : null),
        gap,
        submit,
        TextButton(onPressed: reset, child: Text(t('backToLogin', 'Back to login'))),
        const Text('Use the OTP sent to your email to complete the password reset.', textAlign: TextAlign.center, style: TextStyle(color: C.muted, fontSize: 12.5)),
      ],
      const SizedBox(height: 18),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        TextButton(onPressed: () => Navigator.pushNamed(context, '/terms'), child: const Text('Terms of Use')),
        const Text('|', style: TextStyle(color: C.muted)),
        TextButton(onPressed: () => Navigator.pushNamed(context, '/privacy'), child: const Text('Privacy Policy')),
      ]),
    ]);
  }
}

// ── Parent self-registration ───────────────────────────────────────────────
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final first = TextEditingController(), last = TextEditingController(), email = TextEditingController();
  final mobile = TextEditingController(), block = TextEditingController(), password = TextEditingController(), confirm = TextEditingController();
  String dob = '', state = '', district = '';
  bool agreed = false, loading = false;
  String error = '', success = '';
  Map<String, String> errors = {};
  Map<String, List<String>> districts = {};

  @override
  void initState() {
    super.initState();
    rootBundle.loadString('assets/india_districts.json').then((s) {
      final j = jsonDecode(s);
      setState(() => districts = (j['districts'] as Map).map((k, v) => MapEntry('$k', List<String>.from(v))));
    });
  }

  (int, String, Color) get strength {
    final p = password.text;
    var score = 0;
    if (p.length >= 8) score++;
    if (RegExp('[A-Z]').hasMatch(p)) score++;
    if (RegExp('[0-9]').hasMatch(p)) score++;
    if (RegExp('[^a-zA-Z0-9]').hasMatch(p)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = [C.border, Color(0xFFB5452F), Color(0xFFB7791F), Color(0xFFE09F3E), Color(0xFF2F855A)];
    return (score, labels[score], colors[score]);
  }

  bool validate() {
    final e = <String, String>{};
    final mail = email.text.trim().toLowerCase();
    final phone = mobile.text.replaceAll(RegExp(r'\D'), '');
    if (first.text.trim().isEmpty) e['firstName'] = 'First name is required.';
    if (last.text.trim().isEmpty) e['lastName'] = 'Last name is required.';
    if (!_email.hasMatch(mail)) e['email'] = 'Enter a valid email address.';
    if (phone.length != 10) e['mobile'] = 'Enter a valid 10-digit mobile number.';
    if (dob.isEmpty) e['dob'] = 'Date of birth is required.';
    if (state.isEmpty) e['state'] = 'Select a state.';
    if (district.isEmpty) e['district'] = 'Select a district.';
    if (block.text.trim().isEmpty) e['block'] = 'Enter your block or PHC.';
    if (password.text.length < 8) e['password'] = 'Password must be at least 8 characters.';
    if (password.text != confirm.text) e['confirm'] = 'Passwords do not match.';
    if (!agreed) e['agreed'] = 'Please accept the Terms of Use and Privacy Policy.';
    setState(() => errors = e);
    return e.isEmpty;
  }

  Future<void> submit() async {
    if (!validate() || loading) return;
    setState(() {
      error = success = '';
      loading = true;
    });
    final phone = mobile.text.replaceAll(RegExp(r'\D'), '');
    try {
      final data = await api.post('/auth/register', {
        'firstName': first.text.trim(),
        'lastName': last.text.trim(),
        'name': '${first.text.trim()} ${last.text.trim()}'.trim(),
        'email': email.text.trim().toLowerCase(),
        'phone': phone,
        'mobile': phone,
        'dob': dob,
        'state': state,
        'district': district,
        'block': block.text.trim(),
        'password': password.text,
        'role': 'parent', // ASHA accounts are created by admins
      });
      setState(() => success = '${data['message'] ?? 'Registered successfully. Redirecting to login...'}');
      await Future.delayed(const Duration(milliseconds: 1400));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => error = e is ApiException ? e.message : 'Registration failed. Please try again.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Widget field(TextEditingController c, String key, String label, IconData icon, {TextInputType? type, String? prefix}) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
          controller: c,
          keyboardType: type,
          onChanged: (_) => setState(() => errors.remove(key)),
          decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon), prefixText: prefix, errorText: errors[key]),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final (score, label, color) = strength;
    return _Page(children: [
      const _Brand(title: 'Create your account', subtitle: 'Register for secure access to the child health portal'),
      if (error.isNotEmpty) ErrorBox(error),
      if (success.isNotEmpty) NoticeBox(success, tone: infoTone),
      field(first, 'firstName', 'First Name', Icons.badge_outlined),
      field(last, 'lastName', 'Last Name', Icons.badge_outlined),
      field(email, 'email', 'Email Address', Icons.alternate_email, type: TextInputType.emailAddress),
      field(mobile, 'mobile', 'Mobile Number', Icons.phone_outlined, type: TextInputType.phone, prefix: '+91 '),
      DateField(label: 'Date of Birth', value: dob, last: DateTime.now(), onChanged: (v) => setState(() {
            dob = v;
            errors.remove('dob');
          })),
      if (errors['dob'] != null) Padding(padding: const EdgeInsets.only(top: 4, left: 12), child: Text(errors['dob']!, style: const TextStyle(color: C.red, fontSize: 12))),
      gap,
      Pick<String>(
        label: 'State / UT',
        value: state.isEmpty ? null : state,
        items: [for (final s in districts.keys) (s, s)],
        onChanged: (v) => setState(() {
          state = v ?? '';
          district = ''; // a new state invalidates the chosen district
          errors.remove('state');
        }),
      ),
      if (errors['state'] != null) Text(errors['state']!, style: const TextStyle(color: C.red, fontSize: 12)),
      gap,
      Pick<String>(
        key: ValueKey(state),
        label: 'District',
        value: district.isEmpty ? null : district,
        items: [for (final d in districts[state] ?? const <String>[]) (d, d)],
        onChanged: state.isEmpty ? null : (v) => setState(() {
              district = v ?? '';
              errors.remove('district');
            }),
      ),
      if (errors['district'] != null) Text(errors['district']!, style: const TextStyle(color: C.red, fontSize: 12)),
      gap,
      field(block, 'block', 'Block / PHC', Icons.location_city_outlined),
      PasswordField(controller: password, label: 'Password', error: errors['password'], onChanged: (_) => setState(() => errors.remove('password'))),
      if (password.text.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Row(children: [
            Expanded(child: LinearProgressIndicator(value: score / 4, color: color, backgroundColor: C.border)),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
        ),
      gap,
      PasswordField(controller: confirm, label: 'Confirm Password', error: errors['confirm'], onChanged: (_) => setState(() => errors.remove('confirm'))),
      CheckboxListTile(
        contentPadding: EdgeInsets.zero,
        controlAffinity: ListTileControlAffinity.leading,
        value: agreed,
        onChanged: (v) => setState(() {
          agreed = v ?? false;
          errors.remove('agreed');
        }),
        title: Wrap(children: [
          const Text('I agree to the '),
          GestureDetector(onTap: () => Navigator.pushNamed(context, '/terms'), child: const Text('Terms of Use', style: TextStyle(color: C.primary, fontWeight: FontWeight.w600))),
          const Text(' and '),
          GestureDetector(onTap: () => Navigator.pushNamed(context, '/privacy'), child: const Text('Privacy Policy', style: TextStyle(color: C.primary, fontWeight: FontWeight.w600))),
          const Text(', and I am the parent or lawful guardian of any child I register'),
        ]),
        subtitle: errors['agreed'] != null ? Text(errors['agreed']!, style: const TextStyle(color: C.red)) : null,
      ),
      FilledButton(
        onPressed: loading ? null : submit,
        child: loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Create Account'),
      ),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Text('Already have an account?', style: TextStyle(color: C.muted)),
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Sign In')),
      ]),
    ]);
  }
}

// ── Change password (forced after an admin-issued one-time password) ────────
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final current = TextEditingController(), next = TextEditingController(), confirm = TextEditingController();
  String error = '';
  bool busy = false;

  Future<void> submit() async {
    if (next.text.length < 8) return setState(() => error = t('pwTooShort', 'Password must be at least 8 characters.'));
    if (next.text != confirm.text) return setState(() => error = t('pwMismatch', 'Passwords do not match.'));
    if (next.text == current.text) return setState(() => error = t('pwSameAsOld', 'Choose a new password.'));
    setState(() => busy = true);
    try {
      final data = await api.put('/auth/change-password', {'currentPassword': current.text, 'newPassword': next.text});
      auth.setUser({...Map<String, dynamic>.from(data['user'] ?? {}), 'mustChangePassword': false});
      if (mounted && Navigator.canPop(context)) {
        toast(context, '${data['message'] ?? 'Password updated'}');
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() {
        error = e is ApiException ? e.message : 'Could not change the password';
        busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final forced = auth.mustChangePassword;
    return _Page(children: [
      Center(child: glyph('🔐', size: 40)),
      Center(child: Text(t('setNewPassword', 'Set a new password'), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: C.text))),
      Center(child: Text(auth.name, style: const TextStyle(color: C.muted))),
      const SizedBox(height: 16),
      if (forced) NoticeBox(t('pwForcedHint', 'You signed in with a one-time password. Set your own password to continue.'), tone: infoTone),
      if (error.isNotEmpty) ErrorBox(error),
      PasswordField(controller: current, label: forced ? t('pwOneTime', 'One-time password') : t('pwCurrent', 'Current password')),
      gap,
      PasswordField(controller: next, label: t('pwNew', 'New password')),
      gap,
      PasswordField(controller: confirm, label: t('pwConfirm', 'Confirm new password')),
      gap,
      Text('• ${t('pwRuleLength', 'At least 8 characters')}\n• ${t('pwRuleShare', 'Never share your password')}', style: const TextStyle(color: C.muted, fontSize: 13)),
      gap,
      FilledButton(onPressed: busy ? null : submit, child: Text(busy ? '…' : t('setNewPassword', 'Set a new password'))),
      TextButton(onPressed: () => auth.logout(), child: Text(lang.plain('logout', 'Logout'))),
    ]);
  }
}
