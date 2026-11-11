import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('drivers')
  async getDrivers(@Query('city') city?: string) {
    return this.userService.getDrivers(city);
  }

  @Get('drivers/:id')
  async getDriverById(@Param('id') id: string) {
    return this.userService.getDriverById(id);
  }

  @Post('drivers/toggle-availability')
  async toggleDriverAvailability(
    @Body('userId') userId: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.userService.toggleDriverAvailability(userId, isAvailable);
  }

  @Post('saved-vehicles/toggle')
  async toggleSavedVehicle(
    @Body('userId') userId: string,
    @Body('listingId') listingId: string,
  ) {
    return this.userService.toggleSavedVehicle(userId, listingId);
  }

  @Get('saved-vehicles')
  async getSavedVehicles(@Query('userId') userId: string) {
    return this.userService.getSavedVehicles(userId);
  }

  @Get('customer/bookings')
  async getCustomerBookings(@Query('userId') userId: string) {
    return this.userService.getCustomerBookings(userId);
  }

  @Get('customer/leads')
  async getCustomerLeads(@Query('userId') userId: string) {
    return this.userService.getCustomerLeads(userId);
  }
}
