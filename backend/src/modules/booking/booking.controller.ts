import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('leads')
  async generateLead(@Body() body: any) {
    return this.bookingService.generateLead(body);
  }

  @Post('bookings')
  async createBooking(@Req() req: any, @Body() body: any) {
    const userId = req.user?.sub || body.userId;
    return this.bookingService.createBooking({ ...body, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/my')
  async getMyBookings(@Req() req: any) {
    return this.bookingService.getUserBookings(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/lister')
  async getListerBookings(@Req() req: any) {
    return this.bookingService.getListerBookings(req.user.sub);
  }

  @Patch('bookings/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.bookingService.updateBookingStatus(id, status, notes);
  }
}

