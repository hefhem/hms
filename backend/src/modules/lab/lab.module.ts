import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabOrder } from './entities/lab-order.entity';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';
import { PatientsModule } from '../patients/patients.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabOrder]),
    PatientsModule,
    BillingModule,
    NotificationModule,
  ],
  providers: [LabService],
  controllers: [LabController],
  exports: [LabService],
})
export class LabModule {}
