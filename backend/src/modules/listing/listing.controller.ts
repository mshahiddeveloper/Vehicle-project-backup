import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ListingService } from './listing.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get()
  async search(@Query() query: any) {
    return this.listingService.searchListings(query);
  }

  @Get('search')
  async searchExplicit(@Query() query: any) {
    return this.listingService.searchListings(query);
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return this.listingService.getListingById(id);
  }

  @Post()
  async createListing(@Req() req: any, @Body() body: any) {
    const userId = req.user?.sub || body.userId;
    return this.listingService.createPublicListing({ ...body, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Post('draft')
  async createDraft(@Req() req: any, @Body() body: any) {
    return this.listingService.createDraft({ ...body, userId: req.user.sub });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  async submitListing(@Param('id') id: string, @Req() req: any) {
    return this.listingService.submitListing(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lister/my')
  async getMyListings(@Req() req: any) {
    return this.listingService.getListerListings(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lister/:userId')
  async getListerListings(@Param('userId') userId: string) {
    return this.listingService.getListerListings(userId);
  }
}

