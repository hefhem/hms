import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './entities/consultation.entity';
import { Prescription } from './entities/prescription.entity';
import { EmrService } from './emr.service';
import { EmrController } from './emr.controller';
import { PatientsModule } from '../patients/patients.module';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { LabModule } from '../lab/lab.module';
import { ServicesModule } from '../services/services.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation, Prescription]),
    PatientsModule,
    PharmacyModule,
    LabModule,
    ServicesModule,
    BillingModule,
    NotificationModule,
  ],
  providers: [EmrService],
  controllers: [EmrController],
  exports: [EmrService],
})
export class EmrModule {}
