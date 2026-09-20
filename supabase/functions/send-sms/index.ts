/**
 * Supabase Send SMS Hook — Development Mode
 *
 * This Edge Function intercepts SMS OTP requests from Supabase Auth.
 * In production, replace the console.log with actual SMS provider call.
 *
 * To use: Configure this as a "Send SMS" hook in Supabase Dashboard
 * under Authentication > Hooks.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface SMSHookPayload {
  user_id: string;
  phone: string;
  otp: string;
}

serve(async (req: Request) => {
  try {
    const payload: SMSHookPayload = await req.json();

    // ─── DEV MODE: Log OTP to console ───────────────────────────────
    console.log('═══════════════════════════════════════════');
    console.log('📱 SMS OTP Hook (Development Mode)');
    console.log(`   Phone:   ${payload.phone}`);
    console.log(`   OTP:     ${payload.otp}`);
    console.log(`   User ID: ${payload.user_id}`);
    console.log('═══════════════════════════════════════════');

    // ─── PRODUCTION: Replace with SMS provider ──────────────────────
    // Example with Twilio:
    // const twilioResponse = await fetch(
    //   `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Basic ${btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)}`,
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //     body: new URLSearchParams({
    //       To: payload.phone,
    //       From: TWILIO_FROM_NUMBER,
    //       Body: `Your FitHub verification code is: ${payload.otp}`,
    //     }),
    //   }
    // );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SMS Hook error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send SMS' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
