import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RadiologyOrder } from './entities/radiology-order.entity';
import { RadiologyService } from './radiology.service';
import { RadiologyController } from './radiology.controller';
import { PatientsModule } from '../patients/patients.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RadiologyOrder]),
    PatientsModule,
    BillingModule,
    NotificationModule,
  ],
  providers: [RadiologyService],
  controllers: [RadiologyController],
  exports: [RadiologyService],
})
export class RadiologyModule {}
