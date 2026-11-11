import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ComplaintService {
  constructor(private prisma: PrismaService) {}

  async createComplaint(dto: {
    userId?: string;
    bookingId?: string;
    listingId?: string;
    subject: string;
    description: string;
    category?: string;
  }) {
    const { userId, bookingId, listingId, subject, description, category } = dto;
    let effectiveUserId = userId;

    if (!effectiveUserId) {
      const fallbackUser = await this.prisma.user.findFirst({ where: { userType: 'CUSTOMER' } });
      if (fallbackUser) {
        effectiveUserId = fallbackUser.id;
      } else {
        const pkCountry = await this.prisma.country.findFirst({ where: { code: 'PK' } });
        const newUser = await this.prisma.user.create({
          data: {
            phone: `+92300${Math.floor(1000000 + Math.random() * 9000000)}`,
            phoneCountryCode: '+92',
            userType: 'CUSTOMER',
            accountStatus: 'APPROVED',
            countryId: pkCountry ? pkCountry.id : 'demo-country-pk',
          },
        });
        effectiveUserId = newUser.id;
      }
    }

    const ticketRef = `TKT-${Date.now().toString().slice(-6)}`;

    const complaint = await this.prisma.complaint.create({
      data: {
        ticketRef,
        userId: effectiveUserId,
        bookingId: bookingId || null,
        listingId: listingId || null,
        subject,
        description,
        category: category || 'GENERAL',
        status: 'OPEN',
      },
      include: { messages: true },
    });

    return { success: true, data: complaint, message: 'Support ticket submitted.' };
  }

  async getUserComplaints(userId?: string) {
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const fallbackUser = await this.prisma.user.findFirst({ where: { userType: 'CUSTOMER' } });
      if (fallbackUser) effectiveUserId = fallbackUser.id;
    }

    if (!effectiveUserId) return { success: true, data: [] };

    const complaints = await this.prisma.complaint.findMany({
      where: { userId: effectiveUserId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: complaints };
  }

  async addMessage(complaintId: string, senderId: string, message: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundException('Complaint ticket not found');

    const msg = await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        senderId,
        message,
      },
    });

    return { success: true, data: msg };
  }
}
