import { NextRequest, NextResponse } from 'next/server';
import { withUserContext } from '@/lib/dbWithContext';
import { getSessionFromRequest } from '@/lib/session';
import { logAuditEvent } from '@/lib/auditLogServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/intercity/book - Atomic seat reservation & booking creation
 * 
 * Enforces:
 * 1. Transactional row-level lock `SELECT ... FOR UPDATE` on `intercity_trips`
 * 2. Strict capacity check: `available_seats >= requested_seats`
 * 3. Atomic decrement: `available_seats = available_seats - requested_seats`
 * 4. Creation of `bookings` record
 * 5. Real-time notification dispatch to `notifications`
 * 6. Cryptographic audit log insertion
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Login required to book seats' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { tripId, seatsCount = 1, pickupLocation, dropoffLocation } = body;

    const requestedSeats = parseInt(seatsCount, 10);
    if (!tripId || isNaN(requestedSeats) || requestedSeats <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid tripId and positive seatsCount are required.' },
        { status: 400 }
      );
    }

    const bookingResult = await withUserContext(session.id, session.role, async (client) => {
      // 1. Row-level lock on the trip to prevent concurrent race conditions
      const tripRes = await client.query(
        `SELECT id, provider_id, origin_city, destination_city, departure_time, vehicle_type, available_seats, per_seat_fare_pkr, status
         FROM intercity_trips
         WHERE id = $1
         FOR UPDATE`,
        [tripId]
      );

      if (tripRes.rows.length === 0) {
        throw new Error('Intercity trip not found.');
      }

      const trip = tripRes.rows[0];

      if (trip.status !== 'SCHEDULED') {
        throw new Error(`This trip is currently ${trip.status.toLowerCase()} and no longer accepting seat bookings.`);
      }

      if (trip.available_seats < requestedSeats) {
        throw new Error(`Not enough seats available. Requested: ${requestedSeats}, Available: ${trip.available_seats}`);
      }

      // 2. Atomic seat decrement
      const updatedAvailable = trip.available_seats - requestedSeats;
      await client.query(
        `UPDATE intercity_trips 
         SET available_seats = $1,
             status = CASE WHEN $1 = 0 THEN 'BOARDING' ELSE status END
         WHERE id = $2`,
        [updatedAvailable, tripId]
      );

      // 3. Create central booking record
      const totalAmount = parseFloat(trip.per_seat_fare_pkr) * requestedSeats;
      const bookingRef = `SAFAR-IC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const departureDate = new Date(trip.departure_time).toISOString().split('T')[0];

      const bookingRes = await client.query(
        `INSERT INTO bookings (
           booking_reference,
           customer_id,
           lister_id,
           service_type,
           start_date,
           end_date,
           pickup_location,
           dropoff_location,
           total_amount_pkr,
           payment_status,
           booking_status
         ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10)
         RETURNING id, booking_reference`,
        [
          bookingRef,
          session.id,
          trip.provider_id,
          'CITY_TO_CITY',
          departureDate,
          pickupLocation || `${trip.origin_city} Terminal`,
          dropoffLocation || `${trip.destination_city} Terminal`,
          totalAmount,
          'PAY_ON_PICKUP',
          'CONFIRMED',
        ]
      );

      const bookingId = bookingRes.rows[0].id;

      // 4. Emit customer notification
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          session.id,
          'BOOKING_CONFIRMED',
          'Intercity Seat Booking Confirmed',
          `Your reservation for ${requestedSeats} seat(s) on ${trip.origin_city} ➔ ${trip.destination_city} (${bookingRef}) is confirmed! Pay Rs ${totalAmount.toLocaleString()} at departure.`,
          `/customer?tab=intercity`,
        ]
      );

      // 5. Emit provider notification
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          trip.provider_id,
          'BOOKING_CONFIRMED',
          'New Seat Reserved on Intercity Route',
          `${session.name} reserved ${requestedSeats} seat(s) on ${trip.origin_city} ➔ ${trip.destination_city}. Remaining seats: ${updatedAvailable}.`,
          `/provider?mode=city_to_city`,
        ]
      );

      return {
        bookingId,
        bookingReference: bookingRef,
        totalAmount,
        requestedSeats,
        remainingSeats: updatedAvailable,
        origin: trip.origin_city,
        destination: trip.destination_city,
      };
    });

    // 6. Log audit event
    await logAuditEvent({
      actorId: session.id,
      actorRole: session.role,
      actionType: 'INTERCITY_SEATS_BOOKED',
      targetResource: 'BOOKING',
      resourceId: bookingResult.bookingId,
      stateDelta: { tripId, requestedSeats, bookingRef: bookingResult.bookingReference },
    });

    return NextResponse.json({
      success: true,
      data: bookingResult,
      message: 'Seats successfully booked in atomic transaction.',
    });
  } catch (error: any) {
    console.error('Intercity Booking Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to complete atomic seat reservation' },
      { status: 400 }
    );
  }
}

