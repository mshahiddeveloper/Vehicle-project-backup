import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ComplaintService } from './complaint.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('complaints')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Post()
  async createComplaint(@Req() req: any, @Body() body: any) {
    const userId = req.user?.sub || body.userId;
    return this.complaintService.createComplaint({ ...body, userId });
  }

  @Get('my')
  async getMyComplaints(@Req() req: any) {
    const userId = req.user?.sub;
    return this.complaintService.getUserComplaints(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/message')
  async addMessage(
    @Param('id') id: string,
    @Req() req: any,
    @Body('message') message: string,
  ) {
    return this.complaintService.addMessage(id, req.user.sub, message);
  }
}

