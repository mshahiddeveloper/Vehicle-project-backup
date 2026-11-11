import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingService } from './booking.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BookingService', () => {
  let service: BookingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      vehicleListing: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      booking: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      lead: {
        create: vi.fn(),
      },
    };
    service = new BookingService(mockPrisma);
  });

  it('should throw NotFoundException if listing does not exist', async () => {
    mockPrisma.vehicleListing.findUnique.mockResolvedValue(null);

    await expect(
      service.createBooking({
        userId: 'user-1',
        listingId: 'non-existent',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if end date is before start date', async () => {
    mockPrisma.vehicleListing.findUnique.mockResolvedValue({ id: 'lst-1', dailyRate: 5000 });

    await expect(
      service.createBooking({
        userId: 'user-1',
        listingId: 'lst-1',
        startDate: '2026-11-15',
        endDate: '2026-11-10',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if overlapping confirmed booking exists', async () => {
    mockPrisma.vehicleListing.findUnique.mockResolvedValue({ id: 'lst-1', dailyRate: 5000 });
    mockPrisma.booking.findFirst.mockResolvedValue({ id: 'existing-confirmed-booking' });

    await expect(
      service.createBooking({
        userId: 'user-1',
        listingId: 'lst-1',
        startDate: '2026-11-10',
        endDate: '2026-11-14',
      }),
    ).rejects.toThrow(/already booked and confirmed/);
  });

  it('should successfully create booking request with driver fee calculation', async () => {
    mockPrisma.vehicleListing.findUnique.mockResolvedValue({
      id: 'lst-1',
      dailyRate: 10000,
      driverDailyCharge: 2500,
      driverMandatory: false,
      currencyCode: 'PKR',
      city: 'Lahore',
    });
    mockPrisma.booking.findFirst.mockResolvedValue(null);
    mockPrisma.booking.create.mockImplementation((args: any) => ({
      id: 'bk-new',
      ...args.data,
    }));

    const result = await service.createBooking({
      userId: 'user-1',
      listingId: 'lst-1',
      startDate: '2026-11-10T00:00:00.000Z',
      endDate: '2026-11-12T00:00:00.000Z',
      withDriver: true,
      pickupCity: 'Lahore',
    });

    expect(result.success).toBe(true);
    expect(result.data.totalDays).toBe(2);
    expect(result.data.dailyRate).toBe(10000);
    expect(result.data.driverCharge).toBe(5000); // 2 days * 2500
    expect(result.data.totalAmount).toBe(25000); // 20000 rental + 5000 driver
  });
});

