import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { User } from './modules/users/entities/user.entity';
import { Patient } from './modules/patients/entities/patient.entity';
import { Triage } from './modules/patients/entities/triage.entity';
import { Appointment } from './modules/appointments/entities/appointment.entity';
import { Consultation } from './modules/emr/entities/consultation.entity';
import { Prescription } from './modules/emr/entities/prescription.entity';
import { Drug } from './modules/pharmacy/entities/drug.entity';
import { DrugBatch } from './modules/pharmacy/entities/drug-batch.entity';
import { Invoice } from './modules/billing/entities/invoice.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { Setting } from './modules/settings/entities/setting.entity';
import { LabOrder } from './modules/lab/entities/lab-order.entity';
import { ServiceItem } from './modules/services/entities/service-item.entity';
import { RadiologyOrder } from './modules/radiology/entities/radiology-order.entity';
import { Bed } from './modules/ipd/entities/bed.entity';
import { Admission } from './modules/ipd/entities/admission.entity';
import { HmoClaim } from './modules/insurance/entities/hmo-claim.entity';
import { HmoProvider } from './modules/insurance/entities/hmo-provider.entity';
import { Tenant } from './modules/tenants/entities/tenant.entity';
import { Notification } from './modules/notification/entities/notification.entity';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { EmrModule } from './modules/emr/emr.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { BillingModule } from './modules/billing/billing.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SettingsModule } from './modules/settings/settings.module';
import { LabModule } from './modules/lab/lab.module';
import { ServicesModule } from './modules/services/services.module';
import { RadiologyModule } from './modules/radiology/radiology.module';
import { IpdModule } from './modules/ipd/ipd.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { TenantsModule } from './modules/tenants/tenants.module';

import { ConcurrencyExceptionFilter } from './common/filters/concurrency-exception.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { SeedService } from './database/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 120),
        },
      ],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE', 'postgres');
        const entities = [
          User,
          Patient,
          Triage,
          Appointment,
          Consultation,
          Prescription,
          Drug,
          DrugBatch,
          Invoice,
          AuditLog,
          Setting,
          LabOrder,
          ServiceItem,
          RadiologyOrder,
          Bed,
          Admission,
          HmoClaim,
          HmoProvider,
          Tenant,
          Notification,
        ];

        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: 'hms_database.sqlite',
            entities,
            synchronize: true,
            logging: false,
          };
        }

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'hms_password'),
          database: config.get<string>('DB_NAME', 'hms_db'),
          entities,
          synchronize: true,
          logging: false,
        };
      },
    }),

    TypeOrmModule.forFeature([
      User,
      Patient,
      Drug,
      LabOrder,
      ServiceItem,
      RadiologyOrder,
      Bed,
      Admission,
      HmoClaim,
      HmoProvider,
      Tenant,
      Notification,
    ]),

    NotificationModule,
    AuditModule,
    UsersModule,
    AuthModule,
    PatientsModule,
    AppointmentsModule,
    EmrModule,
    PharmacyModule,
    BillingModule,
    SettingsModule,
    LabModule,
    ServicesModule,
    RadiologyModule,
    IpdModule,
    InsuranceModule,
    TenantsModule,
  ],
  providers: [
    SeedService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ConcurrencyExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
