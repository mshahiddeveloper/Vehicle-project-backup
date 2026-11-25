import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

function normPhoneDigits(p: string | null | undefined): string {
  const digits = String(p || '').replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return '92' + digits.slice(1);
  return digits;
}

/**
 * GET /api/chat?conversationId=...
 * Fetches conversations for the authenticated user (matched by userId OR normalized phone)
 * or messages for a specific conversationId.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const sql = getNeonSqlClient();

    if (conversationId) {
      const msgs = await sql`
        SELECT * FROM chat_messages
        WHERE conversation_id = ${conversationId} AND COALESCE(deleted, false) = false
        ORDER BY timestamp ASC
        LIMIT 300;
      `;
      const mapped = msgs.map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        receiverId: m.receiver_id,
        receiverName: m.receiver_name,
        text: m.text,
        timestamp: Number(m.timestamp),
        timeStr: m.time_str,
        read: Boolean(m.read),
        ref: m.ref,
        expiresAt: Number(m.expires_at || Date.now() + 7 * 86400000),
      }));
      return NextResponse.json({ success: true, messages: mapped }, { headers: NO_STORE_HEADERS });
    }

    const userPhoneNorm = normPhoneDigits(session.phone);
    const allConvs = await sql`
      SELECT * FROM chat_conversations
      ORDER BY last_message_timestamp DESC
      LIMIT 150;
    `;

    const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'AGENT';
    const userConvs = allConvs.filter((c: any) => {
      if (isAdmin) return true;
      const pIds: string[] = Array.isArray(c.participant_ids) ? c.participant_ids : [];
      if (pIds.includes(session.id)) return true;
      const phonesObj = c.participant_phones || {};
      return Object.values(phonesObj).some((ph: any) => {
        const d = normPhoneDigits(String(ph));
        return d.length >= 9 && userPhoneNorm.length >= 9 && d.slice(-9) === userPhoneNorm.slice(-9);
      });
    });

    const mappedConvs = userConvs.map((c: any) => ({
      id: c.id,
      participantIds: c.participant_ids || [],
      participantNames: c.participant_names || {},
      participantRoles: c.participant_roles || {},
      participantPhones: c.participant_phones || {},
      about: c.about || '',
      bookingRef: c.booking_ref,
      bookingStatus: c.booking_status || 'Waiting for owner',
      itemDetails: c.item_details,
      dates: c.dates,
      bookingMetadata: c.booking_metadata || undefined,
      lastMessageText: c.last_message_text || '',
      lastMessageTimestamp: Number(c.last_message_timestamp || 0),
      unreadCountFor: c.unread_count_for || {},
      updatedAt: Number(c.last_message_timestamp || Date.now()),
    }));

    return NextResponse.json({ success: true, conversations: mappedConvs }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load chat' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * POST /api/chat
 * action='start_or_open' -> upserts conversation + optional initial message
 * action='send_message'  -> inserts message + updates conversation metadata
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sql = getNeonSqlClient();

    if (body.action === 'start_or_open') {
      const conv = body.conversation;
      const initialMsg = body.initialMessage;
      if (!conv?.id) {
        return NextResponse.json({ success: false, error: 'Conversation payload required' }, { status: 400, headers: NO_STORE_HEADERS });
      }

      await sql`
        INSERT INTO chat_conversations (
          id, participant_ids, participant_names, participant_roles, participant_phones,
          about, booking_ref, booking_status, item_details, dates, booking_metadata,
          last_message_text, last_message_timestamp, unread_count_for, updated_at
        ) VALUES (
          ${conv.id},
          ${conv.participantIds || [session.id]},
          ${JSON.stringify(conv.participantNames || {})}::jsonb,
          ${JSON.stringify(conv.participantRoles || {})}::jsonb,
          ${JSON.stringify(conv.participantPhones || {})}::jsonb,
          ${conv.about || ''},
          ${conv.bookingRef || null},
          ${conv.bookingStatus || 'Waiting for owner'},
          ${conv.itemDetails || null},
          ${conv.dates || null},
          ${conv.bookingMetadata ? JSON.stringify(conv.bookingMetadata) : null}::jsonb,
          ${conv.lastMessageText || ''},
          ${Number(conv.lastMessageTimestamp || Date.now())},
          ${JSON.stringify(conv.unreadCountFor || {})}::jsonb,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          last_message_text = COALESCE(NULLIF(EXCLUDED.last_message_text, ''), chat_conversations.last_message_text),
          last_message_timestamp = GREATEST(EXCLUDED.last_message_timestamp, chat_conversations.last_message_timestamp),
          booking_metadata = COALESCE(EXCLUDED.booking_metadata, chat_conversations.booking_metadata),
          updated_at = NOW();
      `;

      if (initialMsg?.id && initialMsg?.text) {
        await sql`
          INSERT INTO chat_messages (
            id, conversation_id, sender_id, sender_name, sender_role,
            receiver_id, receiver_name, text, timestamp, time_str, read, ref, expires_at
          ) VALUES (
            ${initialMsg.id},
            ${conv.id},
            ${initialMsg.senderId || session.id},
            ${initialMsg.senderName || session.name},
            ${initialMsg.senderRole || session.role},
            ${initialMsg.receiverId || ''},
            ${initialMsg.receiverName || ''},
            ${initialMsg.text},
            ${Number(initialMsg.timestamp || Date.now())},
            ${initialMsg.timeStr || ''},
            false,
            ${initialMsg.ref || null},
            ${Number(initialMsg.expiresAt || Date.now() + 7 * 86400000)}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      return NextResponse.json({ success: true, conversationId: conv.id }, { headers: NO_STORE_HEADERS });
    }

    // Default: send_message
    const msg = body.message;
    if (!msg?.conversationId || !msg?.text) {
      return NextResponse.json({ success: false, error: 'conversationId and text are required' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const msgId = msg.id || `msg-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ts = Number(msg.timestamp || Date.now());

    // Ensure conversation row exists if created locally earlier
    if (body.conversation) {
      const c = body.conversation;
      await sql`
        INSERT INTO chat_conversations (
          id, participant_ids, participant_names, participant_roles, participant_phones,
          about, booking_ref, booking_status, item_details, dates, booking_metadata,
          last_message_text, last_message_timestamp, unread_count_for, updated_at
        ) VALUES (
          ${c.id},
          ${c.participantIds || [session.id]},
          ${JSON.stringify(c.participantNames || {})}::jsonb,
          ${JSON.stringify(c.participantRoles || {})}::jsonb,
          ${JSON.stringify(c.participantPhones || {})}::jsonb,
          ${c.about || ''},
          ${c.bookingRef || null},
          ${c.bookingStatus || 'Waiting for owner'},
          ${c.itemDetails || null},
          ${c.dates || null},
          ${c.bookingMetadata ? JSON.stringify(c.bookingMetadata) : null}::jsonb,
          ${msg.text},
          ${ts},
          ${JSON.stringify(c.unreadCountFor || {})}::jsonb,
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    await sql`
      INSERT INTO chat_messages (
        id, conversation_id, sender_id, sender_name, sender_role,
        receiver_id, receiver_name, text, timestamp, time_str, read, ref, expires_at
      ) VALUES (
        ${msgId},
        ${msg.conversationId},
        ${msg.senderId || session.id},
        ${msg.senderName || session.name},
        ${msg.senderRole || session.role},
        ${msg.receiverId || ''},
        ${msg.receiverName || ''},
        ${msg.text},
        ${ts},
        ${msg.timeStr || ''},
        false,
        ${msg.ref || null},
        ${Number(msg.expiresAt || Date.now() + 7 * 86400000)}
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    await sql`
      UPDATE chat_conversations
      SET
        last_message_text = ${msg.text},
        last_message_timestamp = ${ts},
        unread_count_for = jsonb_set(
          COALESCE(unread_count_for, '{}'::jsonb),
          ARRAY[${msg.receiverId || 'other'}],
          to_jsonb(COALESCE((unread_count_for->>${msg.receiverId || 'other'})::int, 0) + 1)
        ),
        updated_at = NOW()
      WHERE id = ${msg.conversationId};
    `;

    return NextResponse.json({ success: true, id: msgId }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to send message' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * PATCH /api/chat - Mark conversation messages as read
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const { conversationId } = await req.json().catch(() => ({}));
    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId required' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const sql = getNeonSqlClient();
    await sql`
      UPDATE chat_messages
      SET read = true
      WHERE conversation_id = ${conversationId} AND sender_id <> ${session.id};
    `;
    await sql`
      UPDATE chat_conversations
      SET unread_count_for = jsonb_set(COALESCE(unread_count_for, '{}'::jsonb), ARRAY[${session.id}], '0'::jsonb)
      WHERE id = ${conversationId};
    `;

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

/**
 * DELETE /api/chat?conversationId=...
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const conversationId = new URL(req.url).searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId required' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    const sql = getNeonSqlClient();
    await sql`UPDATE chat_messages SET deleted = true WHERE conversation_id = ${conversationId};`;
    await sql`UPDATE chat_conversations SET last_message_text = 'Chat history cleared' WHERE id = ${conversationId};`;
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

