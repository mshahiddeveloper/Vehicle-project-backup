import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { VehicleCatalogueService } from './vehicle-catalogue.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('catalogue')
export class VehicleCatalogueController {
  constructor(private readonly catalogueService: VehicleCatalogueService) {}

  @Get('categories')
  async getCategories() {
    return this.catalogueService.getCategories();
  }

  @Get('manufacturers')
  async getManufacturers(@Query('categoryId') categoryId?: string) {
    return this.catalogueService.getManufacturers(categoryId);
  }

  @Get('models')
  async getModels(@Query('manufacturerId') manufacturerId?: string) {
    return this.catalogueService.getModels(manufacturerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('categories')
  async createCategory(@Body() body: any) {
    return this.catalogueService.createCategory(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manufacturers')
  async createManufacturer(@Body() body: any) {
    return this.catalogueService.createManufacturer(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('models')
  async createModel(@Body() body: any) {
    return this.catalogueService.createModel(body);
  }
}

