import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('methods/:countryCode')
  async getMethods(@Param('countryCode') countryCode: string) {
    return this.paymentService.getMethods(countryCode);
  }

  @Post('submit-proof')
  async submitProof(@Body() body: any) {
    return this.paymentService.submitProof(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyPayments(@Req() req: any) {
    return this.paymentService.getUserPayments(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getUserPayments(@Param('userId') userId: string) {
    return this.paymentService.getUserPayments(userId);
  }
}

