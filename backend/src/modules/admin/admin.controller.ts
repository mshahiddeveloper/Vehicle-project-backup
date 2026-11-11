import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('platform/toggle-mode')
  async togglePlatformMode(@Body('mode') mode: 'PAKISTAN_ONLY' | 'INTERNATIONAL') {
    return this.adminService.togglePlatformMode(mode);
  }

  @Post('platform/toggle-driver-portal')
  async toggleDriverPortal(@Body('enabled') enabled: boolean) {
    return this.adminService.toggleDriverPortal(enabled);
  }

  @Patch('countries/:code/status')
  async updateCountryStatus(
    @Param('code') code: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateCountryStatus(code, status);
  }

  @Get('pending-payments')
  async getPendingPayments() {
    return this.adminService.getPendingPayments();
  }

  @Post('payments/:id/action')
  async actionPayment(
    @Param('id') id: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.adminService.actionPayment(id, action, rejectionReason);
  }

  @Get('pending-listings')
  async getPendingListings() {
    return this.adminService.getPendingListings();
  }

  @Post('listings/:id/action')
  async actionListing(
    @Param('id') id: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.adminService.actionListing(id, action, rejectionReason);
  }

  @Get('pending-users')
  async getPendingUsers() {
    return this.adminService.getPendingUsers();
  }

  @Post('users/:id/action')
  async actionUser(
    @Param('id') id: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
  ) {
    return this.adminService.actionUser(id, action);
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit?: string) {
    return this.adminService.getAuditLogs(limit ? Number(limit) : 50);
  }

  @Get('settings/modules')
  async getModuleSwitches() {
    return this.adminService.getModuleSwitches();
  }

  @Post('settings/module-toggle')
  async toggleModule(
    @Body('moduleKey') moduleKey: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.adminService.toggleModule(moduleKey, enabled);
  }

  @Get('overview-full')
  async getFullAdminOverview() {
    return this.adminService.getFullAdminOverview();
  }

  @Post('listings/:id/status')
  async toggleListingStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.toggleListingStatus(id, status);
  }

  @Post('agents')
  async createAgent(@Body() body: any) {
    return this.adminService.createAgent(body);
  }

  @Post('agents/:id/permissions')
  async updateAgentPermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.adminService.updateAgentPermissions(id, permissions);
  }

  @Post('listers/:id/quota')
  async adjustListerQuota(
    @Param('id') id: string,
    @Body('quota') quota: number,
  ) {
    return this.adminService.adjustListerQuota(id, Number(quota));
  }

  @Post('subscriptions/save-plan')
  async saveSubscriptionPlan(@Body() body: any) {
    return this.adminService.saveSubscriptionPlan(body);
  }

  @Post('legal-content')
  async saveLegalContent(
    @Body('type') type: 'TERMS' | 'PRIVACY',
    @Body('content') content: string,
  ) {
    return this.adminService.saveLegalContent(type, content);
  }

  @Post('promotional-popup')
  async savePromotionalPopup(@Body() body: any) {
    return this.adminService.savePromotionalPopup(body);
  }
}

