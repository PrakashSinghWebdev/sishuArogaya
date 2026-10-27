# Shishu Aarogya — Android & iOS app

Flutter app with every page of the website (parent, ASHA worker and admin portals, public pages, chatbot, shop), in the same 23 languages. It uses the same Node.js API (`../server`); no server changes are needed.

## Run it

1. Start the API: `cd ../server && npm run dev` (port 5002).
2. Start an Android emulator or iOS simulator, then:

```bash
flutter pub get
flutter run
```

With no settings, the app talks to the API on your computer: `http://10.0.2.2:5002` from the Android emulator, `http://localhost:5002` from the iOS simulator. On a real phone, or against the live server, pass the address:

```bash
flutter run --dart-define=API_URL=http://192.168.1.20:5002     # dev server on your Wi-Fi
flutter run --dart-define=API_URL=https://api.your-domain.in   # live server
```

Plain `http://` only works in debug builds. Release builds need an HTTPS server.

## Build for release

```bash
# Android: APK to share, or app bundle for Google Play
flutter build apk --release --dart-define=API_URL=https://api.your-domain.in
flutter build appbundle --release --dart-define=API_URL=https://api.your-domain.in

# iOS (needs Xcode on a Mac and an Apple developer account)
flutter build ipa --release --dart-define=API_URL=https://api.your-domain.in
```

Before publishing:
- **Android signing:** create an upload key and add a `signingConfig` in `android/app/build.gradle.kts` ([guide](https://docs.flutter.dev/deployment/android#sign-the-app)). Until then, release builds use the debug key, which Google Play rejects.
- **App ID:** the bundle/application ID is `com.shishuaarogya.shishu_aarogya`. Change it before the first store upload if you want a different one; it can't be changed afterwards.

## How it works

- **Login:** the server's httpOnly session cookie is stored in the phone's secure storage (Keychain / Keystore) and sent on every request, with the same `X-Requested-With` header the website sends.
- **Languages:** `assets/i18n.json` holds the website's translation tables. Missing keys fall back to English.
- **Shared data:** translations, districts, Privacy Policy and Terms, built-in diet plans, chatbot answers and the shop catalogue come from the website's source files. After changing any of them on the website, run `node mobile/tool/export_web_data.mjs` from the project root.
- **Offline chatbot:** if the server can't be reached, the assistant answers from the bundled knowledge base, as the website does.
- **App icon:** generated from `icon/app_icon.png` with `dart run flutter_launcher_icons`.

## Layout

```
lib/
  main.dart            app start, login state → first screen
  routes.dart          every page, same paths as the website (/parent/..., /asha/..., /admin/...)
  shell.dart           app bar, side menu and bottom tabs for each role
  core/                API client, login, languages, theme and shared widgets, file downloads
  screens/
    auth/              login, forgot password, register, change password
    public/            home, about, privacy, terms, shop
    parent/            dashboard, my child + growth, vaccines, diet, AI prediction, schemes, reports
    asha/              dashboard, families, visits, children, maternal care, referrals, records, reports, incentives
    admin/             dashboard, registry, ASHA workers, referrals, claims, users, reports, schemes, logs
    shared/            settings, messages, camps, chatbot
  widgets/             growth charts and z-score gauges, hospital map
```

## Test

```bash
flutter analyze
flutter test
```
