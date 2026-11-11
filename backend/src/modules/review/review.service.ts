import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async getListingReviews(listingId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        booking: { listingId },
        isPublished: true,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            customerProfile: true,
          },
        },
        response: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: reviews };
  }

  async createReview(dto: {
    reviewerId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }) {
    const { reviewerId, bookingId, rating, comment } = dto;

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { lister: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId,
        reviewerId,
        revieweeId: booking.listing.lister.userId,
        rating,
        comment,
        isPublished: true,
      },
    });

    return { success: true, data: review, message: 'Review submitted successfully' };
  }

  async respondToReview(reviewId: string, responderId: string, responseText: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    const res = await this.prisma.reviewResponse.create({
      data: {
        reviewId,
        responderId,
        response: responseText,
      },
    });

    return { success: true, data: res, message: 'Response posted successfully' };
  }
}
