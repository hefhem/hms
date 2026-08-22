import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bed } from './entities/bed.entity';
import { Admission } from './entities/admission.entity';
import { IpdService } from './ipd.service';
import { IpdController } from './ipd.controller';
import { PatientsModule } from '../patients/patients.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bed, Admission]),
    PatientsModule,
    BillingModule,
  ],
  providers: [IpdService],
  controllers: [IpdController],
  exports: [IpdService],
})
export class IpdModule {}
