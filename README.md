# Presensi Anugerah — Expo / React Native

Aplikasi absensi karyawan **PT Anugrah Intelligentia** (clock in/out dengan bukti
foto & lokasi), dibangun ulang dari design handoff memakai **Expo + React Native**
dan token brand dari **Anugrah Intelligentia Design System**. Bilingual **ID/EN**,
mobile full-bleed.

Scope saat ini: **flow Karyawan** (6 layar). Flow HR/Admin menyusul.

## Menjalankan

```bash
npm install
# selaraskan versi native dengan SDK Expo (penting):
npx expo install --fix
npx expo start        # tekan i (iOS), a (Android), atau w (web)
```

> `package.json` dipatok ke baseline **Expo SDK 52**. `npx expo install --fix`
> menyamakan versi `react-native`, `react-native-svg`, `expo-font`, dll. dengan
> SDK yang terpasang. Jika ingin SDK terbaru: `npx expo install expo@latest && npx expo install --fix`.

## Hubungan dengan Design System

Satu sumber kebenaran brand = **design tokens**. Komponen web design system
(`<div>`/CSS) tidak bisa dipakai di React Native, jadi yang dibagikan hanyalah
tokennya; komponen dibangun ulang secara native di sini.

- **Sekarang:** token di-*vendor* di [`src/theme/tokens.ts`](src/theme/tokens.ts)
  (nilai identik dengan paket `@anugrah/tokens` di repo design system).
- **Setelah `@anugrah/tokens` dipublish ke npm:**
  1. `npm install @anugrah/tokens`
  2. hapus `src/theme/tokens.ts`
  3. di [`src/theme/index.ts`](src/theme/index.ts) ganti `export * from './tokens'`
     menjadi `export * from '@anugrah/tokens'`.

Publish paket token (dari repo design system, folder `packages/tokens`):

```bash
npm run build && npm publish   # honors publishConfig.access
```

## Struktur

```
App.tsx                  root — load font Inter/JetBrains Mono, provider, navigator
index.ts                 entry (registerRootComponent)
src/
  theme/                 tokens (vendored) + helper RN (font per-weight, shadow→elevation)
  i18n/                  kamus ID/EN (strings.ts) + LangContext
  lib/                   useNow (live clock), format (waktu/tanggal), data (contoh + ikon)
  components/            Txt, Button, Badge, DataTag, LogoMark, Avatar, IconTile,
                         StatusBadge, CameraViewfinder, MiniMap, GlowCircle, Toggle,
                         TopAppBar, LangSwitch, TabBar (+FAB)
  navigation/            AppNavigator (tab + FAB adaptif + pushed clock views)
  screens/               Home, ClockIn, ClockOut, History, Profile, Leave
```

## Catatan implementasi

- **Font:** Inter (400–900) + JetBrains Mono via `@expo-google-fonts/*`. RN memilih
  face lewat nama family, bukan `fontWeight` — lihat `interFamily()` di `src/theme`.
  Angka teknis pakai `fontVariant: ['tabular-nums']` (helper `tabular`/prop `Txt tabular`).
- **Ikon:** `lucide-react-native` (butuh `react-native-svg`).
- **Kamera (Clock In/Out):** `CameraViewfinder` masih placeholder navy. Untuk produksi
  ganti dengan `expo-camera` `<CameraView>` + `expo-media-library`.
- **Lokasi/geofence:** `MiniMap` masih skematik. Untuk produksi pakai `expo-location`
  (koordinat + cek radius) dan `react-native-maps` untuk peta asli.
- **Navigasi:** sengaja berbasis state (bukan react-navigation/expo-router) agar FAB
  ter-angkat di tab bar bisa persis desain tanpa dependency tambahan. Bila butuh deep
  link / banyak stack, migrasikan ke Expo Router.
- **i18n:** ganti bahasa lewat Profil → Bahasa (toggle ID/EN). Semua copy runtime.

## Belum diverifikasi runtime

Kode ini ditulis lengkap tetapi **belum dijalankan** (environment pembuatan tidak punya
Node/Expo). Jalankan `npx expo start` dan `npm run typecheck`; jika ada error, mudah
diperbaiki (kemungkinan besar versi native → `npx expo install --fix`).
