import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewService } from './review.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('listing/:listingId')
  async getListingReviews(@Param('listingId') listingId: string) {
    return this.reviewService.getListingReviews(listingId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(@Req() req: any, @Body() body: any) {
    return this.reviewService.createReview({ ...body, reviewerId: req.user.sub });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/response')
  async respondToReview(
    @Param('id') id: string,
    @Req() req: any,
    @Body('response') response: string,
  ) {
    return this.reviewService.respondToReview(id, req.user.sub, response);
  }
}
