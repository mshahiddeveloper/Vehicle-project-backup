import { NextRequest, NextResponse } from 'next/server';

/**
 * Free WhatsApp Verification Endpoint
 * 
 * Integration Options:
 * 1. Meta WhatsApp Cloud API (Free Tier: 1,000 service conversations/month)
 *    Configure in environment variables:
 *    - WHATSAPP_CLOUD_API_TOKEN: Permanent or System User Access Token from Meta Developer Portal
 *    - WHATSAPP_PHONE_NUMBER_ID: Sender phone number ID from WhatsApp Business Platform
 * 
 * 2. Zero-Config Deep-Link Gateway:
 *    If tokens are not set, generates authentic 6-digit OTP and deep link:
 *    https://api.whatsapp.com/send?phone=...&text=...
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const otpCode = code || Math.floor(100000 + Math.random() * 900000).toString();

    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // 1. Meta WhatsApp Cloud API Dispatch (if configured)
    if (token && phoneNumberId) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: `SafarPK Verification Code: ${otpCode}. Valid for 10 minutes. Do not share this code.`,
            },
          }),
        });

        const metaData = await metaRes.json();
        if (metaRes.ok) {
          return NextResponse.json({
            success: true,
            provider: 'meta_cloud_api',
            message: 'OTP delivered via Meta WhatsApp Cloud API',
            code: otpCode,
            phone: cleanPhone,
            metaMessageId: metaData.messages?.[0]?.id,
          });
        }
      } catch (err: any) {
        console.warn('[WhatsApp Cloud API] Dispatch error, falling back to direct gateway:', err?.message);
      }
    }

    // 2. Direct Gateway Deep Link
    const waText = encodeURIComponent(
      `*SafarPK Verification Code*\nYour secure authentication code is: *${otpCode}*\nValid for 10 minutes.`
    );
    const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${waText}`;

    return NextResponse.json({
      success: true,
      provider: 'whatsapp_direct_gateway',
      code: otpCode,
      phone: cleanPhone,
      waLink,
      message: 'OTP generated. Open WhatsApp to receive/send.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

