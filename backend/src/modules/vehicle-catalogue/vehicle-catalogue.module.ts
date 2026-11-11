import { Module } from '@nestjs/common';
import { VehicleCatalogueService } from './vehicle-catalogue.service.js';
import { VehicleCatalogueController } from './vehicle-catalogue.controller.js';

@Module({
  controllers: [VehicleCatalogueController],
  providers: [VehicleCatalogueService],
  exports: [VehicleCatalogueService],
})
export class VehicleCatalogueModule {}

