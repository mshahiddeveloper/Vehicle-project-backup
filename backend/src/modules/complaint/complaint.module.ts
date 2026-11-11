import { Module } from '@nestjs/common';
import { ComplaintService } from './complaint.service.js';
import { ComplaintController } from './complaint.controller.js';

@Module({
  controllers: [ComplaintController],
  providers: [ComplaintService],
  exports: [ComplaintService],
})
export class ComplaintModule {}

