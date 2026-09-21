# PROMPT UNTUK AI CODING AGENT — GYM PROGRESS TRACKER

> Cara pakai: copy seluruh isi file ini (mulai dari `## 0. PERAN DAN CARA KERJA` sampai akhir) ke Claude Code, Cursor, atau Windsurf sebagai pesan pertama. Lampiran A sudah lengkap — Android Google Client ID menyusul di awal Fase 1 (butuh SHA-1 dari `eas credentials`, baru bisa diambil setelah project Expo dibuat).

---

## 0. PERAN DAN CARA KERJA

Kamu adalah senior mobile engineer yang membangun aplikasi produksi, bukan demo. Kamu mengerjakan aplikasi **gym progress tracker** cross-platform dari nol.

Aturan kerja yang wajib kamu ikuti:

1. **Kerjakan per fase.** Ada 4 fase di Bagian 11. Selesaikan satu fase, tunjukkan hasilnya, lalu **BERHENTI dan tunggu approval** sebelum lanjut ke fase berikutnya. Jangan kerjakan semuanya sekaligus.
2. **Jangan menebak versi package.** Cek dokumentasi resmi atau `npm view <pkg> version` sebelum menulis `package.json`. Kalau ada konflik peer dependency, laporkan, jangan dipaksa install.
3. **Kalau ada requirement yang ambigu, tanya dulu.** Jangan berasumsi lalu bikin sesuatu yang harus dibongkar ulang.
4. **TypeScript strict mode, tanpa `any`.** Kalau butuh escape hatch, pakai `unknown` + type guard.
5. **Jangan pernah hardcode secret.** Semua kredensial lewat `.env` + `app.config.ts`. Commit `.env.example`, jangan commit `.env`.
6. **Setiap tabel database wajib punya RLS policy sejak awal.** Tidak ada pengecualian, tidak ada "nanti ditambah".
7. Tulis kode dan komentar dalam bahasa Inggris. Penjelasan ke saya boleh bahasa Indonesia.

---

## 1. PRODUK YANG DIBANGUN

Aplikasi mobile untuk mencatat dan melacak progres latihan beban (gym).

Alur inti yang harus benar:

- User mencatat sesi latihan: pilih variasi gerakan, lalu input tiap set (beban dalam kg + jumlah reps).
- Sistem menyimpan **seluruh riwayat**, bukan cuma angka terakhir.
- Sistem otomatis membandingkan performa periode ini dengan periode sebelumnya, lalu memberi status **naik / turun / stagnan / campuran**.
- User bisa melihat perkembangan per hari, per minggu, dan per bulan.

Contoh skenario yang harus jalan:
> Minggu ke-1 user melakukan Incline Dumbbell Press 15 kg × 10 reps. Minggu ke-2 gerakan sama, 17,5 kg × 8 reps. Sistem menyimpan keduanya, menandai gerakan itu berstatus **naik**, dan menampilkan grafik perkembangannya.

---

## 2. REQUIREMENT WAJIB

| # | Requirement |
|---|---|
| R1 | Aplikasi mobile, berjalan di Android **dan** iOS dari satu codebase |
| R2 | UI/UX harus terasa dirancang manusia, bukan template generik (detail di Bagian 9) |
| R3 | Penyimpanan cloud berbasis database; data muncul kembali saat user login dengan akun yang sama di perangkat mana pun |
| R4 | Login & sign up via **Google** dan via **nomor telepon** |
| R5 | Autentikasi OTP 6 digit: metode nomor telepon → OTP via SMS/WhatsApp; metode email → OTP via email (detail penting di Bagian 8) |
| R6 | Fitur tracking progres |
| R7 | Edit input |
| R8 | Delete input |
| R9 | Add input |
| R10 | Status progres **up / down / flat / mixed** per hari, minggu, dan bulan |
| R11 | Arsitektur harus siap ditambah fitur baru tanpa refactor besar |

---

## 3. TECH STACK (SUDAH DITENTUKAN, JANGAN DIGANTI)

**Mobile**
- Expo (SDK terbaru stabil) + React Native + TypeScript strict
- Expo Router (file-based routing, penting untuk deep link password reset & notifikasi)
- TanStack Query v5 — server state, cache, optimistic update
- Zustand — UI state lokal saja
- NativeWind — styling, dikonfigurasi dengan design token sendiri
- React Native Reanimated + Gesture Handler — animasi & swipe
- Victory Native XL + React Native Skia — grafik progres
- lucide-react-native — ikon (JANGAN pakai emoji sebagai ikon)
- Zod — validasi semua input dan semua response dari server
- date-fns + date-fns-tz — semua operasi tanggal
- expo-secure-store — penyimpanan session token
- expo-haptics — feedback taktil saat set selesai / PR tercapai
- @react-native-google-signin/google-signin — Google Sign-In NATIF, lihat Bagian 8.2 kenapa bukan browser redirect
- expo-crypto — hashing nonce untuk Google Sign-In

**Backend**
- Supabase: Postgres + Auth + Row Level Security + Edge Functions
- supabase-js v2
- Migration dikelola lewat Supabase CLI (`supabase/migrations/*.sql`), bukan lewat dashboard

**Build**
- EAS Build untuk Android & iOS
- EAS Update untuk OTA patch
- **Development build wajib sejak Fase 1**, bukan Expo Go. `@react-native-google-signin/google-signin` memakai native module sehingga tidak berjalan di Expo Go. Setup `eas build --profile development` di hari pertama.

Kalau menurutmu ada satu pilihan di atas yang salah untuk kasus ini, katakan alasannya sebelum mulai coding. Jangan diam-diam menggantinya.

---

## 4. SKEMA DATABASE

Buat sebagai migration SQL. Semua berat disimpan dalam **kilogram**; konversi ke lbs hanya di layer presentasi.

```
profiles
  id              uuid PK → auth.users(id) on delete cascade
  display_name    text
  unit_pref       text default 'kg'          -- 'kg' | 'lb'
  timezone        text default 'Asia/Jakarta'
  created_at      timestamptz default now()

muscle_groups                                -- referensi sistem, read-only bagi user
  id              uuid PK
  slug            text unique not null       -- 'lats', 'quadriceps', 'rear_delts'
  name            text not null
  region          text not null              -- chest|back|shoulders|arms|legs|core|other
  sort_order      int not null

exercises                                    -- SELURUHNYA dibuat user, tidak ada katalog bawaan
  id              uuid PK
  owner_id        uuid not null → auth.users(id) on delete cascade
  name            text not null
  muscle_group_id uuid not null → muscle_groups(id)
  secondary_group_ids uuid[] default '{}'    -- opsional, untuk gerakan compound
  equipment       text null                  -- teks bebas, diisi user
  note            text null
  archived_at     timestamptz null           -- soft delete, lihat Bagian 4.3
  created_at      timestamptz default now()
  constraint uniq_exercise_name_per_user
    unique (owner_id, lower(trim(name)))

workout_sessions
  id              uuid PK
  user_id         uuid not null → auth.users(id) on delete cascade
  performed_at    timestamptz not null
  duration_sec    int
  note            text
  created_at      timestamptz default now()

session_exercises
  id              uuid PK
  session_id      uuid not null → workout_sessions(id) on delete cascade
  exercise_id     uuid not null → exercises(id)
  position        int not null

exercise_sets
  id              uuid PK
  session_exercise_id uuid not null → session_exercises(id) on delete cascade
  set_no          int not null
  weight_kg       numeric(6,2) not null check (weight_kg >= 0)
  reps            int not null check (reps > 0)
  rpe             numeric(3,1) null check (rpe between 1 and 10)
  is_warmup       boolean default false
```

**Index wajib:**
- `workout_sessions (user_id, performed_at desc)`
- `session_exercises (session_id)`
- `exercise_sets (session_exercise_id)`
- `exercises (owner_id) where archived_at is null`
- `exercises (muscle_group_id)`
- GIN trigram index pada `lower(name)` untuk deteksi duplikat (aktifkan extension `pg_trgm`)

**Seed data:** HANYA tabel `muscle_groups`. Tabel `exercises` mulai kosong untuk setiap user.

---

### 4.1 Katalog gerakan sepenuhnya milik user

Keputusan desain yang tidak bisa ditawar: **sistem tidak menyediakan satu pun gerakan bawaan.** User membuat semua variasi gerakannya sendiri. Sistem hanya menyediakan daftar muscle group tetap sebagai klasifikasi.

Seed `muscle_groups` dengan 18 entri berikut, dikelompokkan dalam 7 region:

| Region | Muscle group |
|---|---|
| `chest` | Chest |
| `back` | Lats, Upper Back, Lower Back, Traps |
| `shoulders` | Front Delts, Side Delts, Rear Delts |
| `arms` | Biceps, Triceps, Forearms |
| `legs` | Quadriceps, Hamstrings, Glutes, Calves, Adductors |
| `core` | Abdominals, Obliques |
| `other` | Neck, Full Body |

Alur membuat gerakan di Fase 1: user pilih **region** (7 kartu besar) → pilih **muscle group** → ketik nama gerakan → opsional isi equipment dan catatan. Field `secondary_group_ids` sudah ada di skema tapi **jangan ditampilkan di form Fase 1** — baru dimunculkan di UI pada Fase 4 (lihat Bagian 11) supaya form pembuatan gerakan tetap ringkas di awal. Kolomnya nullable/default array kosong jadi tidak mengganggu kalau belum dipakai.

Region dipakai untuk navigasi dan tampilan agregat; `muscle_group_id` dipakai untuk perhitungan volume per otot. Jangan simpan region di tabel `exercises`, turunkan dari `muscle_groups.region`.

### 4.2 Menangani duplikat nama (KRITIS)

Ini risiko terbesar dari katalog buatan user. Kalau user menulis "Bench Press", lalu "bench press", lalu "BP", sistem akan memperlakukannya sebagai tiga gerakan terpisah dan seluruh perhitungan progres di Bagian 6 jadi rusak.

Wajib diimplementasikan ketiganya:

1. **Unique constraint case-insensitive** `unique (owner_id, lower(trim(name)))`. Tangani pelanggaran constraint ini dengan pesan yang ramah, bukan error mentah.
2. **Fuzzy match saat membuat gerakan baru.** Sebelum menyimpan, cari gerakan milik user yang mirip dengan `similarity()` dari `pg_trgm` (ambang 0.4). Kalau ada, tampilkan: "Kamu sudah punya *Incline Dumbbell Press*. Pakai yang itu?" dengan pilihan **Pakai yang ada** atau **Tetap buat baru**.
3. **Fitur merge.** Di layar detail gerakan, sediakan aksi "Gabungkan dengan gerakan lain". Implementasinya: pindahkan semua `session_exercises` dari gerakan sumber ke gerakan tujuan, lalu arsipkan gerakan sumber. Jalankan dalam satu transaksi. Riwayat tidak boleh hilang.

Rename gerakan aman dilakukan kapan saja karena relasinya lewat foreign key, bukan lewat nama.

### 4.3 Menghapus gerakan

Jangan pernah hard delete gerakan yang sudah punya riwayat set, karena itu akan menghapus data latihan user.

- Jika gerakan belum pernah dipakai → boleh hard delete
- Jika sudah pernah dipakai → isi `archived_at`, sembunyikan dari daftar pilihan, tapi riwayat dan grafiknya tetap bisa dibuka
- Sediakan daftar "Diarsipkan" di pengaturan, lengkap dengan aksi restore

### 4.4 Cold start

User baru punya library kosong dan tidak bisa mencatat apa pun sampai dia membuat gerakan. Tangani dengan dua hal:

1. **Onboarding singkat setelah daftar:** "Grup otot apa saja yang kamu latih?" → user pilih beberapa region → di tiap region user langsung menambahkan nama-nama gerakannya. Bisa dilewati.
2. **Buat gerakan inline dari layar pencatatan.** Saat user mencari gerakan dan tidak ketemu, baris paling atas hasil pencarian harus berupa `+ Buat "bench press dumbbell"` yang langsung membuat gerakan tersebut tanpa meninggalkan layar. Ini jauh lebih penting daripada onboarding-nya sendiri.

---

## 5. ROW LEVEL SECURITY

Aktifkan RLS di **semua** tabel. Tanpa ini, siapa pun yang punya anon key bisa membaca data seluruh user.

- `profiles` — user hanya bisa select/update baris miliknya (`auth.uid() = id`)
- `muscle_groups` — select terbuka untuk semua user terautentikasi; tidak ada policy insert/update/delete sama sekali (tabel referensi, hanya diubah lewat migration)
- `exercises` — semua operasi dibatasi `auth.uid() = owner_id`. Tidak ada gerakan publik, jadi tidak ada pengecualian `owner_id is null`
- `workout_sessions` — semua operasi dibatasi `auth.uid() = user_id`
- `session_exercises` dan `exercise_sets` — tidak punya kolom `user_id`, jadi policy-nya harus menelusuri relasi ke `workout_sessions.user_id` lewat subquery atau join

Setelah menulis policy, **tulis test-nya**: buat dua user dummy, pastikan user A tidak bisa membaca maupun menghapus data user B. Tunjukkan hasil test ini ke saya.

---

## 6. LOGIKA PERHITUNGAN PROGRES

Ini bagian paling kritis. Salah di sini, seluruh aplikasi jadi tidak berguna.

### 6.1 Jangan bandingkan beban mentah

`100 kg × 5 reps` secara kekuatan lebih tinggi daripada `105 kg × 1 rep`. Kalau hanya membandingkan angka beban, sistem akan salah menyimpulkan.

Gunakan **estimated 1RM (rumus Epley)**:

```
e1RM = weight_kg × (1 + reps / 30)
```

Set dengan `is_warmup = true` dikecualikan dari semua perhitungan progres.

### 6.2 Metrik per gerakan per periode

- `best_e1rm` = e1RM tertinggi dalam periode
- `total_volume` = jumlah dari (weight_kg × reps) seluruh set kerja
- `session_count` = jumlah sesi yang memuat gerakan tersebut

### 6.3 Penentuan status

Bandingkan `best_e1rm` periode ini dengan periode sebelumnya yang **ada datanya** (bukan periode kalender sebelumnya):

| Kondisi | Status |
|---|---|
| Δ e1RM > +2% | `up` |
| Δ e1RM < −2% | `down` |
| −2% ≤ Δ ≤ +2% | `flat` |
| e1RM naik tapi total volume turun >10%, atau sebaliknya | `mixed` |
| Level agregat (per grup otot / per minggu): ada gerakan `up` dan ada `down` sekaligus | `mixed` |
| Belum ada data pembanding | `new` |

Ambang 2% adalah *dead zone* supaya status tidak berubah-ubah karena fluktuasi kecil. Jadikan konstanta bernama, jangan magic number.

### 6.4 Implementasi

Hitung di Postgres sebagai **view**, bukan kolom tersimpan. Status yang disimpan akan basi begitu user mengedit set lama.

Buat fungsi SQL `get_exercise_progress(p_user_id uuid, p_period text)` di mana `p_period` bernilai `'day' | 'week' | 'month'`, memakai `date_trunc(p_period, performed_at)` dan window function `lag()` untuk mengambil nilai periode sebelumnya.

**Penanganan periode kosong:** jika user melewatkan beberapa minggu, `lag()` akan mengambil data terakhir yang tersedia. Itu perilaku yang benar, tapi UI **wajib** menuliskan pembandingnya secara eksplisit, misal "vs 3 minggu lalu", bukan "vs minggu lalu".

**Timezone:** batas hari dan minggu mengikuti `profiles.timezone`, bukan UTC. Sesi jam 23:30 waktu Jakarta harus masuk hitungan hari itu, bukan hari berikutnya.

---

## 7. PERSONAL RECORD

Tandai dan simpan sebagai turunan (bukan tabel terpisah):
- PR beban: `weight_kg` tertinggi yang pernah diangkat untuk gerakan itu
- PR e1RM: `e1RM` tertinggi sepanjang waktu
- PR volume: volume satu sesi tertinggi

Saat user menyimpan set yang memecahkan rekor, tampilkan feedback di layar itu juga (haptic + badge), bukan lewat notifikasi terpisah.

---

## 8. AUTENTIKASI

### 8.1 Koreksi penting terhadap requirement awal

Requirement awal menyebut "kalau login pakai Google, OTP dikirim ke email Google". **Jangan diimplementasikan seperti itu.** Google OAuth sudah memverifikasi identitas user; menambahkan OTP di atasnya hanya menambah friksi tanpa menambah keamanan.

Implementasikan **tiga metode login terpisah**:

1. **Google** → OAuth flow, langsung masuk, tanpa OTP
2. **Email** → kirim OTP 6 digit ke email, user memasukkan kode
3. **Nomor telepon** → kirim OTP 6 digit via SMS/WhatsApp, user memasukkan kode

Ini memenuhi maksud R4 dan R5 dengan benar. Kalau saya tetap ingin OTP setelah Google, saya akan bilang.

### 8.2 Kenapa native sign-in, bukan browser redirect

Pendekatan lama (`expo-auth-session`, buka browser lalu redirect balik ke app lewat deep link) **sudah tidak reliable** di Expo versi terbaru — tim Expo sendiri menyatakan berhenti maintain library untuk alur ini, dan ada laporan tingkat kegagalan login di Android bisa mencapai 30% karena race condition saat browser redirect balik ke app.

Pakai **native sign-in** lewat `@react-native-google-signin/google-signin` + `supabase.auth.signInWithIdToken()`. User tidak pernah meninggalkan aplikasi — dialog akun Google muncul langsung di atas layar, lebih cepat dan jauh lebih stabil.

Konsekuensinya: butuh **tiga OAuth client ID berbeda dari Google Cloud** (Web, iOS, Android — lihat Lampiran A untuk cara membuatnya), dan butuh nonce yang di-hash pakai `expo-crypto` sebelum dikirim ke Google.

### 8.3 Detail implementasi

- Gunakan Supabase Auth untuk ketiganya.
- **Identity linking wajib diaktifkan.** Secara default Supabase membuat akun terpisah kalau user login via Google lalu via nomor telepon. Dengan linking, ketiga metode menunjuk ke satu `auth.users` yang sama, sehingga R3 terpenuhi.
- Di Supabase Dashboard → Authentication → Providers → Google, isi field **Client IDs** dengan ketiga client ID dipisah koma, **urutan: Web dulu, baru iOS, baru Android**. Ini format yang disyaratkan Supabase untuk memverifikasi token dari native sign-in.
- Session token disimpan di `expo-secure-store`, bukan AsyncStorage.
- Implementasikan auto-refresh token dan handle kasus refresh token kedaluwarsa (arahkan ke layar login, jangan crash).

### 8.4 SMS OTP

SMS ke nomor Indonesia via provider internasional mahal dan delivery rate-nya tidak stabil. Siapkan **Supabase Send SMS Hook** berupa Edge Function, sehingga provider bisa diganti tanpa mengubah kode aplikasi.

Untuk Fase 1, cukup buat hook-nya dengan implementasi log-to-console (mode development). Integrasi provider asli menyusul di Fase 3.

### 8.5 Layar auth yang dibutuhkan

Welcome → pilih metode → input (email / nomor telepon) → input OTP 6 digit → onboarding singkat (nama, satuan berat, timezone) → home.

Layar OTP harus punya: auto-focus, auto-advance antar digit, paste dari clipboard, timer resend 60 detik, dan pesan error yang jelas untuk kode salah vs kode kedaluwarsa.

---

## 9. UI/UX — ATURAN ANTI-GENERIK

Referensi visual saya: Figma "Fitness App UI Kit for Gym Workout App / Fitness Tracker Mobile App" (community). Kit ini dipakai **hanya untuk inventaris layar dan pola navigasi** (bottom tab 4 item, struktur kalender di layar progres, pola kartu aktivitas) — BUKAN untuk gaya visualnya. Kit aslinya memakai gradien ungu-lime dan foto stok generik, persis pola yang dilarang di Bagian 9.1 ini. Gaya visual final memakai token warna di Bagian 9.2, bukan warna dari kit.

Satu perbedaan struktural penting: kit ini mengasumsikan user *memilih* gerakan dari katalog bawaan berisi foto (lihat layar "Create Your Routine"-nya). Itu bertentangan dengan Bagian 4 spesifikasi ini — di aplikasi kita user *membuat* gerakannya sendiri, tanpa katalog dan tanpa foto. Adaptasi layout kit ke pola "list gerakan buatan sendiri + tombol buat baru", jangan tiru pola "browse katalog foto"-nya.

### 9.1 Dilarang

Hal-hal ini yang membuat sebuah UI langsung terasa hasil generate template. Jangan lakukan:

- Gradien ungu-ke-biru atau pelangi di mana pun
- `borderRadius` seragam di semua elemen tanpa alasan
- Emoji dipakai sebagai ikon fungsional
- Card putih mengambang dengan drop shadow di setiap elemen
- Type scale hanya dua ukuran (judul besar + body)
- Placeholder image generik atau ilustrasi stock
- Tombol dengan teks "Get Started" / "Let's Go" / "Continue Your Journey"
- Lebih dari satu warna aksen

### 9.2 Diwajibkan

Buat file `src/shared/ui/tokens.ts` lebih dulu, sebelum menulis satu pun komponen. Semua nilai styling di aplikasi harus mengambil dari file ini, tidak boleh ada angka literal di StyleSheet.

**Warna (ditentukan, jangan diganti):**

```
background        #2F3337   -- base layar
surface-muted     #898B90   -- HANYA untuk chip, badge, divider, dan elemen non-teks kecil (lihat catatan kontras)
surface-elevated  #3A3E43   -- card yang berisi teks/konten, turunan dari background, BUKAN dari surface-muted
accent            #000000   -- lihat aturan pemakaian di bawah
text-primary      #FFFFFF
text-secondary    #E6E6E6
```

**Catatan kontras — WAJIB dibaca sebelum implementasi:**

Dua warna yang diberikan tidak bisa dipakai literal sesuai instruksi "card putih... shadow" dari Bagian 9.1, dan kalau dipakai naif akan melanggar aturan kontras 4.5:1 di bawah ini:

1. `#898B90` terhadap teks putih hanya punya rasio kontras ±3.4:1 — gagal AA untuk teks body. Karena itu `surface-muted` hanya boleh dipakai untuk elemen non-teks (background icon, divider, badge kosong) atau untuk teks besar (≥24px). Untuk card yang memuat teks/angka progres, pakai `surface-elevated` (`#3A3E43`) yang kontrasnya terhadap teks putih >11:1.
2. `#000000` sebagai aksen nyaris tidak terlihat di atas `background` (#2F3337) — rasio kontras hanya ±1.6:1. Aturan pemakaian aksen:
   - Tombol/elemen aksen yang berdiri di atas `background` → beri **fill terang** (misal putih atau `text-primary`) dengan ikon/teks hitam di dalamnya, atau pakai varian **outline** (border putih, isi transparan) alih-alih fill hitam polos.
   - Aksen hitam solid dipakai ketika elemen itu sendiri punya fill terang di baliknya (misal pill putih dengan ikon hitam di dalamnya), bukan langsung di atas background gelap.
3. Jangan pernah pasang `text-secondary` di atas `surface-muted` — kombinasi itu rasio kontrasnya ±2.7:1, jauh di bawah ambang. Di atas `surface-muted`, kalau terpaksa perlu teks, pakai warna gelap (`background` atau hitam), bukan warna terang.

**Warna status (tambahan di luar 5 warna dasar, karena status adalah data, bukan pilihan estetik):**

```
status-up      hijau — pilih satu hue, jangan hijau neon generik
status-down    merah/oranye — pastikan tidak scream terhadap accent hitam
status-flat    abu netral, dekat text-secondary
status-mixed   kuning/amber — harus beda jelas dari up dan down bagi yang buta warna merah-hijau
```

Setiap status wajib dipasangkan icon berbeda (panah atas, panah bawah, garis datar, ikon split), jangan mengandalkan warna saja — sebagian user buta warna merah-hijau.

**Type scale (Poppins, 6 tingkat):**

| Token | Size / Line-height | Weight | Pemakaian |
|---|---|---|---|
| `display` | 34 / 40 | SemiBold (600) | Angka besar: berat PR, e1RM utama |
| `title` | 24 / 30 | SemiBold (600) | Judul layar |
| `heading` | 18 / 24 | Medium (500) | Judul section/card |
| `body` | 15 / 22 | Regular (400) | Teks utama |
| `label` | 14 / 20 | Medium (500) | Tombol, tab, chip |
| `caption` | 12 / 16 | Regular (400) | Metadata, timestamp |

Load 4 weight Poppins saja: Regular, Medium, SemiBold, dan Bold (cadangan untuk penekanan). Jangan load semua 9 weight Poppins, itu memperbesar bundle size tanpa manfaat.

**Radius (dibedakan per fungsi, 6 tingkat):**

| Token | Value | Pemakaian |
|---|---|---|
| `radius-xs` | 8 | Badge kecil, outline tag |
| `radius-sm` | 12 | Input field, list item |
| `radius-md` | 16 | Tombol, card kecil |
| `radius-lg` | 20 | Card konten utama |
| `radius-xl` | 28 | Bottom sheet, modal (hanya sudut atas) |
| `radius-full` | 999 | Avatar, FAB, pill tag |

- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48 — tidak ada nilai di luar ini
- **Angka beban wajib `fontVariant: ['tabular-nums']`** supaya digit tidak bergeser saat berubah
- **Ikon:** lucide-react-native, ukuran dan stroke-width seragam
- **Motion:** 150–250 ms untuk transisi, spring untuk gesture. Tidak ada animasi yang menunda user melihat data
- **Touch target minimal 44×44 pt**
- **Kontras teks minimal 4.5:1** — lihat catatan kontras di atas, ini bukan saran, ini gerbang wajib sebelum sebuah layar dianggap selesai

### 9.3 Prinsip khusus aplikasi gym

Aplikasi ini dipakai sambil berdiri, berkeringat, satu tangan, dalam jeda istirahat 90 detik. Maka:

- Input set harus bisa diselesaikan dalam ≤3 tap
- Angka beban dan reps diinput lewat stepper besar, bukan keyboard kecil
- Nilai default diambil dari set sebelumnya di sesi yang sama, dan dari sesi terakhir untuk gerakan yang sama
- Rest timer berjalan otomatis setelah set disimpan
- Aksi destruktif (delete set) harus punya undo, bukan dialog konfirmasi

---

## 10. ARSITEKTUR KODE

### 10.1 Struktur folder (feature-based, bukan layer-based)

```
src/
  app/                      # Expo Router routes
    (auth)/
    (tabs)/
    _layout.tsx
  features/
    auth/
      api/
      components/
      hooks/
      screens/
    workout/
    progress/
    exercises/
    profile/
  shared/
    ui/                     # tokens.ts + komponen dasar (Button, Card, Stepper, StatusChip)
    lib/                    # supabase client, formatters, date utils
    types/
supabase/
  migrations/
  functions/
```

### 10.2 Aturan arsitektur

- **Komponen tidak boleh memanggil `supabase.from(...)` langsung.** Setiap feature punya repository tipis di `features/<x>/api/`. Ini yang memungkinkan penggantian backend atau penulisan test tanpa membongkar UI.
- Semua response Supabase divalidasi dengan Zod sebelum masuk ke state.
- TanStack Query untuk server state. Zustand hanya untuk UI state (misal: sesi yang sedang berjalan sebelum disimpan).
- Tidak ada business logic di dalam komponen. Perhitungan progres ada di SQL, formatting ada di `shared/lib`.

### 10.3 Offline-first (wajib, bukan opsional)

Sinyal di dalam gym sering buruk. Aplikasi harus tetap bisa dipakai mencatat saat offline.

Untuk Fase 1–2: TanStack Query dengan persister ke AsyncStorage + optimistic mutation + retry queue. Mutation yang gagal karena jaringan harus masuk antrean dan dikirim ulang otomatis saat online, bukan hilang.

Tampilkan indikator sync yang jujur: "tersimpan lokal, menunggu sinkron" vs "tersimpan". Jangan berbohong ke user bahwa data sudah aman padahal masih di perangkat.

---

## 11. FASE PENGERJAAN

Berhenti dan tunggu approval saya di akhir setiap fase.

### Fase 1 — Fondasi
- Setup project Expo + TypeScript strict + NativeWind + Expo Router
- `tokens.ts` dan komponen dasar (Button, Input, Card, Stepper, StatusChip, Sheet)
- Migration database lengkap + RLS + seed tabel `muscle_groups` (18 entri, 7 region)
- Auth: Google + email OTP + phone OTP (hook mode dev) + identity linking
- Pembuatan gerakan oleh user: create (termasuk inline dari layar pencatatan), rename, arsip, deteksi duplikat fuzzy
- CRUD sesi latihan dan set: add, edit, delete
- **Checkpoint:** saya bisa daftar, membuat gerakan sendiri dari nol, mencatat satu sesi lengkap, lalu login di perangkat lain dan melihat data yang sama. Membuat gerakan dengan nama yang mirip memunculkan peringatan duplikat. Test RLS dua user lolos.

### Fase 2 — Progres
- View dan fungsi SQL perhitungan progres
- Layar detail gerakan: grafik e1RM, tabel riwayat, badge PR
- Layar progres: toggle hari/minggu/bulan, status per gerakan dan per grup otot
- Calendar/streak tracking
- **Checkpoint:** skenario di Bagian 1 berjalan benar, termasuk kasus periode kosong dan pergantian timezone.

### Fase 3 — Produksi
- Integrasi provider SMS/WhatsApp asli lewat Send SMS Hook
- Merge gerakan duplikat + daftar gerakan terarsip beserta aksi restore
- Rest timer, undo delete, haptic feedback
- Empty state, error state, loading skeleton untuk setiap layar
- EAS Build untuk Android dan iOS
- **Checkpoint:** build terpasang di perangkat fisik Android dan iOS.

### Fase 4 — Penyempurnaan
- Template workout
- Export data (CSV/JSON)
- Notifikasi PR
- Tampilkan input muscle group sekunder di form gerakan (kolom `secondary_group_ids` sudah ada di skema sejak Fase 1)
- Polish animasi dan aksesibilitas

---

## 12. DEFINITION OF DONE

Sebuah fase belum selesai sampai semua ini terpenuhi:

- [ ] `tsc --noEmit` bersih, tanpa `any`, tanpa `@ts-ignore`
- [ ] Lint bersih
- [ ] RLS aktif di semua tabel baru, dan sudah ditest dengan dua user berbeda
- [ ] Tidak ada secret di dalam source code
- [ ] Setiap layar punya loading state, empty state, dan error state
- [ ] Aplikasi tidak crash saat perangkat offline
- [ ] Angka berat tampil dengan tabular numerals dan tidak bergeser
- [ ] Sudah dijalankan di emulator Android **dan** iOS simulator
- [ ] README berisi cara setup dari nol

---

## 13. YANG HARUS KAMU LAPORKAN KE SAYA

Di akhir setiap fase, sampaikan:

1. Apa yang selesai dan apa yang belum
2. Keputusan teknis yang kamu ambil di luar spesifikasi ini, beserta alasannya
3. Bagian mana dari spesifikasi ini yang ternyata bermasalah saat diimplementasikan
4. Apa yang perlu saya siapkan sebelum fase berikutnya (kredensial, aset, keputusan desain)

---

## LAMPIRAN A — KREDENSIAL DAN KETENTUAN PROYEK

```
Supabase project URL      : https://whiwnmcoqotfxpulcnbi.supabase.co
Supabase publishable key  : sb_publishable_mWgllU39y6-43ACOYsdc2g_v4ksezjc
Google OAuth — Web        : 1089814670504-tv2a336qj0qaivtlcnk2lv3tse9732s2.apps.googleusercontent.com
Google OAuth — iOS        : 1089814670504-rat9udq6031r5cn414p949jggmjf78g1.apps.googleusercontent.com
Google OAuth — Android    : BELUM ADA — butuh SHA-1, baru bisa diambil setelah project Expo dibuat via `eas credentials` (lihat catatan di bawah). Agent harus tetap jalan tanpa ini di awal Fase 1, lalu ingatkan saya untuk melengkapinya sebelum build Android dites.
Deep link scheme          : fithub
Nama aplikasi             : FitHub
Bundle ID / package name  : com.mullo.fithub
```

**Catatan untuk agent soal Android client ID yang belum ada:** Konfigurasikan Google Sign-In dengan Web dan iOS client ID dulu. Di Supabase Dashboard field "Client IDs" isi dulu dengan Web dan iOS (urutan Web dulu). Setelah project Expo jadi dan `eas credentials` menghasilkan SHA-1, kembali ke [Google Cloud Console](https://console.cloud.google.com/auth/clients) untuk membuat Android client ID, lalu tambahkan ke field yang sama di Supabase (jadi Web, iOS, Android). Login Google di Android tidak akan berfungsi sampai langkah ini selesai — beri tahu saya di checkpoint Fase 1 kalau ini jadi blocker.

**Apa itu deep link scheme dan bundle ID (untuk konteks):**

- **Bundle ID / package name** adalah identitas unik aplikasi kamu di App Store dan Play Store, format kebalikan domain (`com.namamu.namaapp`). Sekali dipublikasikan tidak bisa diganti. Karena kamu belum punya domain, pakai namamu sendiri sebagai pengganti — tidak perlu domain asli, ini cuma string identifier.
- **Deep link scheme** adalah "protokol" custom (`fithub://...`) yang membuat link bisa membuka aplikasi ini langsung, dipakai misalnya untuk link reset password atau notifikasi. Sudah aku tentukan `fithub` di atas karena sesuai nama aplikasi dan tidak berisiko bentrok.

**Design token dari Figma:**

```
Warna background base     : #2F3337
Warna surface / card       : #898B90  -- HANYA elemen non-teks, lihat Bagian 9.2
Warna surface elevated     : #3A3E43  -- turunan otomatis, untuk card berisi teks
Warna aksen                : #000000  -- lihat aturan pemakaian di Bagian 9.2
Warna teks primer          : #FFFFFF
Warna teks sekunder        : #E6E6E6
Font family                : Poppins (Regular, Medium, SemiBold, Bold)
Type scale                 : lihat tabel di Bagian 9.2
Radius                     : lihat tabel di Bagian 9.2
```

Lampirkan juga screenshot 3–5 layar kunci dari Figma kit sebagai referensi *layout*, bukan warna: home, log workout, detail gerakan/grafik, dan profil.
