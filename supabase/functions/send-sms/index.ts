// @ts-nocheck
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
