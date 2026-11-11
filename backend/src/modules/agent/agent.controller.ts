import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AgentService } from './agent.service.js';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.agentService.getDashboard();
  }

  @Get('pending-listings')
  async getPendingListings() {
    return this.agentService.getPendingListings();
  }

  @Post('listings/:id/approve')
  async approveListing(
    @Param('id') id: string,
    @Body('agentId') agentId?: string,
  ) {
    return this.agentService.approveListing(id, agentId);
  }

  @Post('listings/:id/reject')
  async rejectListing(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('agentId') agentId?: string,
  ) {
    return this.agentService.rejectListing(id, reason, agentId);
  }

  @Get('pending-payments')
  async getPendingPayments() {
    return this.agentService.getPendingPayments();
  }

  @Post('payments/:id/approve')
  async approvePayment(
    @Param('id') id: string,
    @Body('agentId') agentId?: string,
  ) {
    return this.agentService.approvePayment(id, agentId);
  }

  @Post('payments/:id/reject')
  async rejectPayment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('agentId') agentId?: string,
  ) {
    return this.agentService.rejectPayment(id, reason, agentId);
  }

  @Get('pending-profiles')
  async getPendingProfiles() {
    return this.agentService.getPendingProfiles();
  }

  @Post('profiles/:id/verify')
  async verifyProfile(
    @Param('id') id: string,
    @Body('agentId') agentId?: string,
  ) {
    return this.agentService.verifyProfile(id, agentId);
  }
}

