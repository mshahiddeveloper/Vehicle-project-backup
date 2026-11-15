import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  async track(@Body() body: any) {
    return this.analyticsService.trackEvent(body);
  }

  @Get('lister/:id')
  async getListerStats(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getListerStats(id, days ? Number(days) : 30);
  }

  @Get('listing/:id')
  async getListingStats(@Param('id') id: string) {
    return this.analyticsService.getListingStats(id);
  }
}

