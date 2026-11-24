import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function hashOtp(phone: string, otp: string): string {
  const salt = process.env.KMS_ENCRYPTION_KEY || 'safarpk_otp_salt_2026';
  return crypto.createHash('sha256').update(`${phone}:${otp}:${salt}`).digest('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = 'request', phone, code, purpose = 'register' } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const standardWaPhone = cleanPhone.startsWith('0')
      ? '92' + cleanPhone.slice(1)
      : cleanPhone.startsWith('92')
      ? cleanPhone
      : '92' + cleanPhone;

    const sql = getNeonSqlClient();

    // =========================================================================
    // REGISTRATION PRE-CHECK: NEVER SEND OTP TO ALREADY REGISTERED NUMBERS
    // =========================================================================
    if (action === 'request' && purpose === 'register') {
      const localPhone = standardWaPhone.startsWith('92') ? '0' + standardWaPhone.slice(2) : standardWaPhone;
      const plusPhone = '+' + standardWaPhone;

      const existingUsers = await sql`
        SELECT id, role, full_name, phone 
        FROM users 
        WHERE phone = ${standardWaPhone} 
           OR phone = ${localPhone} 
           OR phone = ${plusPhone}
           OR phone = ${cleanPhone}
        LIMIT 1;
      `;

      if (existingUsers.length > 0) {
        return NextResponse.json(
          {
            success: false,
            alreadyRegistered: true,
            role: existingUsers[0].role,
            error: 'An account with this phone number is already registered. Please sign in instead.',
          },
          { status: 409, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    // =========================================================================
    // 1. ACTION: VERIFY
    // =========================================================================
    if (action === 'verify') {
      if (!code || typeof code !== 'string' || code.trim().length !== 6) {
        return NextResponse.json(
          { success: false, error: 'Please provide a valid 6-digit verification code.' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      const rows = await sql`
        SELECT phone, otp_hash, attempt_count, expires_at 
        FROM otp_verifications 
        WHERE phone = ${standardWaPhone}
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No active verification code found. Please request a new code.' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      const record = rows[0];
      const now = new Date();

      if (new Date(record.expires_at) < now) {
        await sql`DELETE FROM otp_verifications WHERE phone = ${standardWaPhone};`;
        return NextResponse.json(
          { success: false, error: 'Verification code has expired. Please request a new code.' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      if (record.attempt_count >= 3) {
        return NextResponse.json(
          { success: false, error: 'Maximum attempts exceeded. This verification code is locked. Please request a new one.' },
          { status: 429, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      const candidateHash = hashOtp(standardWaPhone, code.trim());
      const isMatch = timingSafeEqual(candidateHash, record.otp_hash);

      if (!isMatch) {
        const nextAttempts = record.attempt_count + 1;
        await sql`
          UPDATE otp_verifications 
          SET attempt_count = ${nextAttempts}, updated_at = NOW() 
          WHERE phone = ${standardWaPhone};
        `;
        const remaining = Math.max(0, 3 - nextAttempts);
        return NextResponse.json(
          {
            success: false,
            error: remaining > 0 
              ? `Incorrect code. ${remaining} attempt(s) remaining.` 
              : 'Maximum attempts exceeded. Code is now locked.',
            remainingAttempts: remaining,
          },
          { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      // Valid: Consume OTP record
      await sql`DELETE FROM otp_verifications WHERE phone = ${standardWaPhone};`;

      return NextResponse.json(
        {
          success: true,
          verified: true,
          phone: standardWaPhone,
          message: 'Phone number verified successfully.',
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // =========================================================================
    // 2. ACTION: REQUEST OTP
    // =========================================================================
    // Check existing record for rate limiting & cooldown
    const existingRows = await sql`
      SELECT phone, attempt_count, cooldown_until, expires_at 
      FROM otp_verifications 
      WHERE phone = ${standardWaPhone}
      LIMIT 1;
    `;

    const now = new Date();
    if (existingRows.length > 0) {
      const rec = existingRows[0];
      if (new Date(rec.cooldown_until) > now) {
        const secondsRemaining = Math.ceil((new Date(rec.cooldown_until).getTime() - now.getTime()) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${secondsRemaining}s before requesting another verification code.`,
            cooldownSeconds: secondsRemaining,
          },
          { status: 429, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    // Generate authentic 6-digit OTP code
    const otpCode =
      code && typeof code === 'string' && /^\d{6}$/.test(code)
        ? code
        : Math.floor(100000 + Math.random() * 900000).toString();

    const otpHash = hashOtp(standardWaPhone, otpCode);

    // Persist in Neon PostgreSQL: 10-minute expiration, 60-second cooldown
    await sql`
      INSERT INTO otp_verifications (
        phone,
        otp_hash,
        attempt_count,
        cooldown_until,
        expires_at,
        created_at,
        updated_at
      ) VALUES (
        ${standardWaPhone},
        ${otpHash},
        0,
        NOW() + INTERVAL '60 seconds',
        NOW() + INTERVAL '10 minutes',
        NOW(),
        NOW()
      )
      ON CONFLICT (phone) DO UPDATE SET
        otp_hash = EXCLUDED.otp_hash,
        attempt_count = 0,
        cooldown_until = NOW() + INTERVAL '60 seconds',
        expires_at = NOW() + INTERVAL '10 minutes',
        updated_at = NOW();
    `;

    // WhatsApp Dispatch via Meta WhatsApp Cloud API (Official & Free Tier)
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;

    let dispatchedViaMeta = false;
    let metaErrorMessage = '';

    if (token && phoneNumberId) {
      try {
        let metaPayload: any;

        if (templateName) {
          // Template-based OTP message (Meta Official Production Standard)
          metaPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: standardWaPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en_US' },
              components: [
                {
                  type: 'body',
                  parameters: [{ type: 'text', text: otpCode }],
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [{ type: 'text', text: otpCode }],
                },
              ],
            },
          };
        } else {
          // Direct text message OTP (Supports Developer Test Recipient numbers)
          metaPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: standardWaPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: `Your SafarPK verification code is: *${otpCode}*\n\nValid for 10 minutes. Do not share this code with anyone.`,
            },
          };
        }

        const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metaPayload),
        });

        const metaData = await metaRes.json().catch(() => ({}));
        if (metaRes.ok && metaData.messages) {
          dispatchedViaMeta = true;
          console.log(`[WhatsApp OTP] Successfully dispatched to ${standardWaPhone}. Message ID: ${metaData.messages[0]?.id}`);
        } else {
          metaErrorMessage = metaData?.error?.message || `Meta API HTTP ${metaRes.status}`;
          console.warn('[WhatsApp OTP] Meta Cloud API dispatch failed:', metaErrorMessage);
        }
      } catch (err: any) {
        metaErrorMessage = err?.message || 'Network error calling Meta API';
        console.warn('[WhatsApp OTP] Meta Cloud API exception:', metaErrorMessage);
      }
    }

    const isConfigured = Boolean(token && phoneNumberId);

    return NextResponse.json(
      {
        success: true,
        provider: isConfigured ? 'meta_cloud_api' : 'sandbox_simulation',
        phone: standardWaPhone,
        dispatched: dispatchedViaMeta,
        expiresInSeconds: 600,
        cooldownSeconds: 60,
        // Only expose devCode if token is NOT configured and NOT in production
        ...(isConfigured || process.env.NODE_ENV === 'production'
          ? {}
          : { devCode: otpCode, isDevDemo: true }),
        message: dispatchedViaMeta
          ? 'Verification code sent to your WhatsApp account.'
          : isConfigured
          ? `Attempted WhatsApp dispatch: ${metaErrorMessage || 'Check Meta developer dashboard'}`
          : 'Verification code generated.',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('WhatsApp OTP Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal security error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
