import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { TenantSubscriptionInvoice } from './entities/tenant-subscription-invoice.entity';
import { User } from '../users/entities/user.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, SubscriptionPlan, TenantSubscriptionInvoice, User]),
    NotificationModule,
  ],
  providers: [TenantsService],
  controllers: [TenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}
