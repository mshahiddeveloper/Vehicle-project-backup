import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CountryModule } from './modules/country/country.module.js';
import { VehicleCatalogueModule } from './modules/vehicle-catalogue/vehicle-catalogue.module.js';
import { SubscriptionModule } from './modules/subscription/subscription.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { ListingModule } from './modules/listing/listing.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { UserModule } from './modules/user/user.module.js';
import { ReviewModule } from './modules/review/review.module.js';
import { ComplaintModule } from './modules/complaint/complaint.module.js';
import { DocumentModule } from './modules/document/document.module.js';
import { AgentModule } from './modules/agent/agent.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CountryModule,
    VehicleCatalogueModule,
    SubscriptionModule,
    PaymentModule,
    ListingModule,
    BookingModule,
    AdminModule,
    UserModule,
    ReviewModule,
    ComplaintModule,
    DocumentModule,
    AgentModule,
    ChatModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
