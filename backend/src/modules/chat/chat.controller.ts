import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(
    @Query('phone') phone?: string,
    @Query('userId') userId?: string,
  ) {
    return this.chatService.getConversations(phone, userId);
  }

  @Get('conversations/:id')
  async getConversationById(@Param('id') id: string) {
    return this.chatService.getConversationById(id);
  }

  @Post('conversations')
  async createOrOpen(@Body() body: any) {
    return this.chatService.createOrOpenConversation(body);
  }

  @Post('conversations/:id/messages')
  async sendMessage(@Param('id') id: string, @Body() body: any) {
    return this.chatService.sendMessage(id, body);
  }

  @Post('conversations/:id/read')
  async markAsRead(@Param('id') id: string, @Body('role') role: string) {
    return this.chatService.markAsRead(id, role || 'CUSTOMER');
  }
}

