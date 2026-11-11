import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DocumentService, FileUploadPayload } from './document.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * Upload a single file (Vehicle photo, Payment screenshot, ID document)
   */
  @Post('upload')
  async uploadFile(
    @Body() payload: FileUploadPayload,
    @Body('userId') bodyUserId?: string,
  ) {
    const userId = bodyUserId || 'demo-user-id';
    return this.documentService.uploadFile(userId, payload);
  }

  /**
   * Batch Upload Vehicle Photographs:
   * Enforces Min 2, Max 8, <= 2MB images
   */
  @Post('upload-vehicle-images')
  async uploadVehicleImages(
    @Body('images') images: FileUploadPayload[],
    @Body('userId') bodyUserId?: string,
  ) {
    const userId = bodyUserId || 'demo-user-id';
    return this.documentService.uploadVehicleImages(userId, images);
  }

  /**
   * OCR document scanner endpoint
   */
  @Post('ocr')
  async performOcr(
    @Body('documentType') documentType: string,
    @Body('fileUrl') fileUrl: string,
    @Body('userId') bodyUserId?: string,
  ) {
    const userId = bodyUserId || 'demo-user-id';
    return this.documentService.performOcr(userId, documentType, fileUrl);
  }
}

