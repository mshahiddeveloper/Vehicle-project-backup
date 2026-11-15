import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userPhone?: string, userId?: string) {
    if (!userPhone && !userId) {
      return this.prisma.chatConversation.findMany({
        orderBy: { lastMessageAt: 'desc' },
        take: 50,
        include: { participants: true, messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      });
    }

    return this.prisma.chatConversation.findMany({
      where: {
        OR: [
          ...(userPhone ? [{ customerPhone: userPhone }, { listerPhone: userPhone }] : []),
          ...(userId
            ? [
                {
                  participants: {
                    some: { userId },
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getConversationById(id: string) {
    const conv = await this.prisma.chatConversation.findUnique({
      where: { id },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    return conv;
  }

  async createOrOpenConversation(dto: {
    bookingRef?: string;
    listingId?: string;
    customerPhone: string;
    customerName: string;
    listerPhone: string;
    listerName: string;
    initialMessage?: string;
    about?: string;
  }) {
    const {
      bookingRef,
      listingId,
      customerPhone,
      customerName,
      listerPhone,
      listerName,
      initialMessage,
      about,
    } = dto;

    // Check if an existing conversation exists between these participants for this booking or listing
    let conv = await this.prisma.chatConversation.findFirst({
      where: {
        OR: [
          ...(bookingRef ? [{ bookingRef }] : []),
          {
            AND: [
              { customerPhone },
              { listerPhone },
              ...(listingId ? [{ listingId }] : []),
            ],
          },
        ],
      },
      include: { participants: true },
    });

    if (!conv) {
      conv = await this.prisma.chatConversation.create({
        data: {
          bookingRef,
          listingId,
          customerPhone,
          customerName,
          listerPhone,
          listerName,
          lastMessageText: initialMessage || `Inquiry regarding ${about || 'Rental'}`,
          lastMessageAt: new Date(),
          participants: {
            create: [
              {
                role: 'CUSTOMER',
                name: customerName,
                phone: customerPhone,
              },
              {
                role: 'LISTER',
                name: listerName,
                phone: listerPhone,
              },
            ],
          },
        },
        include: { participants: true },
      });
    }

    if (initialMessage) {
      await this.prisma.chatMessage.create({
        data: {
          conversationId: conv.id,
          senderName: customerName,
          senderRole: 'CUSTOMER',
          receiverName: listerName,
          text: initialMessage,
        },
      });

      await this.prisma.chatConversation.update({
        where: { id: conv.id },
        data: {
          lastMessageText: initialMessage,
          lastMessageAt: new Date(),
          unreadCountLister: { increment: 1 },
        },
      });
    }

    return conv;
  }

  async sendMessage(
    conversationId: string,
    dto: {
      senderId?: string;
      senderName: string;
      senderRole: string;
      text: string;
      attachments?: string;
    },
  ) {
    const conv = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: dto.senderId,
        senderName: dto.senderName,
        senderRole: dto.senderRole,
        text: dto.text,
        attachments: dto.attachments,
      },
    });

    const isCustomerSender = dto.senderRole.toUpperCase() === 'CUSTOMER';

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: dto.text,
        lastMessageAt: new Date(),
        unreadCountLister: isCustomerSender ? { increment: 1 } : undefined,
        unreadCountCustomer: !isCustomerSender ? { increment: 1 } : undefined,
      },
    });

    return message;
  }

  async markAsRead(conversationId: string, role: string) {
    const isCustomer = role.toUpperCase() === 'CUSTOMER';
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        unreadCountCustomer: isCustomer ? 0 : undefined,
        unreadCountLister: !isCustomer ? 0 : undefined,
      },
    });

    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  }
}

