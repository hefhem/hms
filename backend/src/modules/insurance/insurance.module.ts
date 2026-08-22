import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HmoClaim } from './entities/hmo-claim.entity';
import { HmoProvider } from './entities/hmo-provider.entity';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HmoClaim, HmoProvider]),
    PatientsModule,
  ],
  providers: [InsuranceService],
  controllers: [InsuranceController],
  exports: [InsuranceService],
})
export class InsuranceModule {}
