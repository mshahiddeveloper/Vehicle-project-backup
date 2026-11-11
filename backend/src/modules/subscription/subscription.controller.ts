import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async getPlans(
    @Query('countryCode') countryCode?: string,
    @Query('targetType') targetType?: string,
  ) {
    return this.subscriptionService.getPlans(countryCode, targetType);
  }

  @UseGuards(JwtAuthGuard)
  @Post('select')
  async selectPlan(@Req() req: any, @Body('planId') planId: string) {
    return this.subscriptionService.selectPlan(req.user.sub, planId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMySubscription(@Req() req: any) {
    return this.subscriptionService.getUserSubscription(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getUserSubscription(@Param('userId') userId: string) {
    return this.subscriptionService.getUserSubscription(userId);
  }
}

