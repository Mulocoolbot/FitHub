# PROMPT PERBAIKAN BUG — FitHub

> Cara pakai: copy dari `## 0. KONTEKS` sampai akhir, kirim ke Claude Code/Cursor/Windsurf yang sudah punya akses ke repo `Mulocoolbot/FitHub`. Ini bukan fitur baru — ini perbaikan atas kode yang sudah ada dari Fase 1.

---

## 0. KONTEKS

Review kode menemukan 2 bug di implementasi Fase 1: satu di Edge Function `send-sms` (blocker — bikin testing OTP telepon mustahil), satu di alur Google Sign-In (celah keamanan, bukan blocker). Perbaiki dua-duanya. Jangan ubah bagian lain yang sudah benar.

Aturan kerja:
1. Sebelum edit, baca dulu file yang disebutkan untuk konfirmasi state kode saat ini masih sama seperti yang dilaporkan di sini.
2. Untuk Bug 2, ada langkah verifikasi wajib sebelum menulis kode — jangan lewati, hasilnya menentukan bentuk fix yang benar.
3. Setelah kedua fix selesai, jalankan `npx tsc --noEmit` dan laporkan hasilnya.
4. Jangan commit secret apa pun ke git.

---

## 1. BUG 1 — Edge Function `send-sms` membaca field yang salah dari payload

**File:** `supabase/functions/send-sms/index.ts`
**Severity:** Blocker — testing OTP telepon tidak bisa dilakukan sampai ini diperbaiki.

### Presisi bug

Interface `SMSHookPayload` di file ini didefinisikan sebagai:
```typescript
interface SMSHookPayload {
  user_id: string;
  phone: string;
  otp: string;
}
```
dan kode membaca `payload.phone`, `payload.otp`, `payload.user_id` langsung sebagai field di root object hasil `req.json()`.

### Kenapa ini terjadi

Kode ini mengasumsikan Supabase mengirim payload flat (semua field di level atas). Kenyataannya, kontrak resmi **Send SMS Hook** dari Supabase mengirim payload dengan dua object bersarang di root: `user` (objek User lengkap) dan `sms` (metadata OTP). Field yang benar ada di `user.phone`, `sms.otp`, dan `user.id` — bukan langsung di root sebagai `phone`, `otp`, `user_id`.

Selain itu, kode ini tidak melakukan verifikasi signature sama sekali. Auth Hooks Supabase (berbeda dari Database Webhooks biasa) memakai skema Standard Webhooks dengan tiga header (`webhook-id`, `webhook-timestamp`, `webhook-signature`) dan secret berformat `v1,whsec_<base64>` yang di-generate saat hook dibuat di Dashboard. Tanpa verifikasi ini, endpoint bisa dipanggil siapa saja yang tahu URL-nya, tidak cuma dari Supabase Auth.

Response sukses saat ini juga `{ success: true }`, padahal kontrak resmi untuk hook `send_sms` mengharapkan objek kosong `{}`.

### Bukti

Dari dokumentasi resmi Supabase (Auth Hooks — Send SMS Hook), tabel Input hook ini:

| Field | Tipe | Keterangan |
|---|---|---|
| `user` | User object | user yang sedang mencoba sign in |
| `sms` | object | metadata pengiriman SMS, termasuk OTP |

Payload aktual yang dikirim GoTrue (auth server Supabase) berbentuk:
```json
{
  "user": { "id": "...", "phone": "+62...", "...": "..." },
  "sms": { "otp": "123456" }
}
```

Dengan bentuk payload seperti ini, `payload.phone`, `payload.otp`, dan `payload.user_id` di kode saat ini **selalu `undefined`** — field-field itu tidak ada di root, mereka bersarang di dalam `user` dan `sms`. Console log akan mencetak `Phone: undefined` dan `OTP: undefined`, sehingga tidak ada cara melihat kode OTP asli untuk login manual saat testing.

Tabel referensi payload/response tiap hook (termasuk `send_sms`) juga menegaskan response sukses adalah `{}`, dan Auth Hooks memakai signature Standard Webhooks HMAC-SHA256 lewat tiga header di atas — berbeda dari Database Webhooks yang tidak punya signature bawaan.

### Solusi

Ganti seluruh isi `supabase/functions/send-sms/index.ts` menjadi:

```typescript
/**
 * Supabase Send SMS Hook — Development Mode
 *
 * Payload contract (Supabase docs): { user: User, sms: { otp: string } }
 * NOT flat { user_id, phone, otp }.
 *
 * Verifies the Standard Webhooks signature using SEND_SMS_HOOK_SECRET,
 * set as an Edge Function secret — never hardcoded in source.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const hookSecret = (Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '').replace('v1,whsec_', '');

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 });
  }

  if (!hookSecret) {
    console.error('SEND_SMS_HOOK_SECRET is not set');
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: 'Hook secret not configured' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    // IMPORTANT: pass the RAW body to wh.verify(), not a re-serialized object.
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);

    const { user, sms } = wh.verify(rawBody, headers) as {
      user: { id: string; phone?: string };
      sms: { otp: string };
    };

    // ─── DEV MODE: Log OTP to console ───────────────────────────────
    console.log('═══════════════════════════════════════════');
    console.log('📱 SMS OTP Hook (Development Mode)');
    console.log(`   Phone:   ${user.phone}`);
    console.log(`   OTP:     ${sms.otp}`);
    console.log(`   User ID: ${user.id}`);
    console.log('═══════════════════════════════════════════');

    // ─── PRODUCTION (Fase 3): replace this block with a real SMS/WhatsApp
    // provider call. Still return {} on success — do not add extra fields.

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SMS Hook error:', error);
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: 'Failed to process SMS hook' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
```

Langkah tambahan yang harus dilakukan (bukan cuma ganti kode):

1. Generate secret: `echo "v1,whsec_$(openssl rand -base64 32)"`
2. Set sebagai Edge Function secret (BUKAN di `.env` yang ikut ke client): `npx supabase secrets set SEND_SMS_HOOK_SECRET="v1,whsec_..."`
3. Deploy ulang function: `npx supabase functions deploy send-sms`
4. Di Supabase Dashboard → Authentication → Hooks → Send SMS hook, pastikan secret yang didaftarkan di sana **sama persis** dengan yang di-set di langkah 2 — dua-duanya harus match atau `wh.verify()` akan selalu gagal.
5. Update `README.md` bagian setup untuk mencantumkan langkah generate + set secret ini, supaya tidak hilang kalau project di-setup ulang di mesin lain.

---

## 2. BUG 2 — Google Sign-In tidak mengirim nonce

**File:** `src/features/auth/api/auth.ts`
**Severity:** Celah keamanan, bukan blocker — login Google tetap berfungsi tanpa ini.

### Presisi bug

Fungsi `signInWithGoogle()` memanggil `GoogleSignin.signIn()` lalu `supabase.auth.signInWithIdToken()` tanpa parameter nonce sama sekali. `expo-crypto` sudah ada di `package.json` sebagai dependency, tapi tidak pernah di-import atau dipakai di file ini.

### Kenapa ini terjadi

Kemungkinan besar langkah ini terlewat saat implementasi awal — dependency-nya sudah disiapkan tapi belum disambungkan ke alur sign-in.

### Bukti

Nonce (number used once) adalah mekanisme standar OIDC untuk mengikat satu ID token ke satu permintaan sign-in spesifik, mencegah token yang sama dipakai ulang (replay attack) — pola yang sama juga dipakai Sign in with Apple. Dokumentasi resmi `@react-native-google-signin/google-signin` untuk integrasi Supabase secara eksplisit mendokumentasikan pola: generate `rawNonce` (UUID acak), hash jadi `hashedNonce` (SHA-256) via `expo-crypto`, `hashedNonce` dikirim ke Google, `rawNonce` dikirim ke `supabase.auth.signInWithIdToken()` — Supabase yang men-hash ulang `rawNonce` dan membandingkannya dengan nonce di dalam ID token dari Google.

**Catatan penting sebelum implementasi:** dukungan parameter nonce kustom di method `signIn()` library ini berbeda-beda antar versi, dan ada laporan error nyata di GitHub issue resminya — `"Nonces mismatch"` — kalau nonce dikirim ke satu sisi (Google atau Supabase) tapi tidak konsisten dengan sisi lain. Jangan asal tempel kode dari internet tanpa verifikasi versi yang terpasang.

### Solusi (WAJIB verifikasi dulu sebelum menulis kode)

**Langkah 1 — Cek dukungan nonce di versi yang terpasang:**

```bash
grep -n "nonce" node_modules/@react-native-google-signin/google-signin/index.d.ts
```

**Langkah 2a — Kalau `signIn()` mendukung parameter nonce** (ada di hasil grep di atas), implementasikan:

```typescript
import * as Crypto from 'expo-crypto';

async function createNonce() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  return { rawNonce, hashedNonce };
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const { rawNonce, hashedNonce } = await createNonce();
  // Sesuaikan nama parameter persis dengan hasil grep Langkah 1 —
  // jangan asumsikan namanya "nonce" tanpa konfirmasi dari index.d.ts.
  const response = await GoogleSignin.signIn({ nonce: hashedNonce });

  if (!response.data?.idToken) {
    throw new Error('Google Sign-In failed: no ID token returned');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.data.idToken,
    nonce: rawNonce,
  });

  if (error) throw error;
  return data;
}
```

**Langkah 2b — Kalau `signIn()` versi ini TIDAK mendukung parameter nonce kustom:**

Jangan paksa kirim nonce ke salah satu sisi saja — itu yang menyebabkan error "Nonces mismatch" di atas. Biarkan kode seperti semula (tanpa nonce di kedua sisi), tapi:

1. Tambahkan komentar di atas `signInWithGoogle()` yang menjelaskan kenapa nonce tidak dipakai (versi library tidak mendukung), supaya tidak terlihat seperti terlewat begitu saja.
2. Catat ini di `README.md` bagian "Key Decisions" sebagai keterbatasan yang diketahui, plus rencana upgrade library kalau versi lebih baru menambah dukungan ini.
3. Laporkan balik ke saya hasil dari Langkah 1 (dukung atau tidak), supaya aku tahu status akhirnya.

---

## 3. SETELAH SELESAI

Laporkan:
1. Hasil `npx tsc --noEmit` setelah kedua fix
2. Untuk Bug 2: apakah versi `@react-native-google-signin/google-signin` yang terpasang mendukung nonce kustom atau tidak, dan jalur mana (2a/2b) yang akhirnya dipakai
3. Konfirmasi secret `SEND_SMS_HOOK_SECRET` sudah di-set di Supabase (jangan tempel nilai secret-nya di laporan, cukup konfirmasi sudah/belum)
4. Hasil test manual: signup pakai nomor telepon dev, cek Edge Function logs (Dashboard → Edge Functions → send-sms → Logs) menampilkan nomor dan OTP yang benar (bukan `undefined`)
