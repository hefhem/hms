import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { PaymentStatus, PaymentMethod, InvoiceLineItem } from './entities/invoice.entity';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  async getInvoices(
    @Query('status') status?: PaymentStatus,
    @Query('patientId') patientId?: string,
  ) {
    return this.billingService.findAll({ status, patientId });
  }

  @Get('invoices/:id')
  async getInvoice(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Post('invoices')
  @Roles(UserRole.ADMIN, UserRole.BILLING_CLERK, UserRole.RECEPTIONIST)
  async createInvoice(
    @Body() body: {
      patientId: string;
      consultationId?: string;
      prescriptionId?: string;
      lineItems: InvoiceLineItem[];
      discount?: number;
      notes?: string;
    },
  ) {
    return this.billingService.createInvoice(body);
  }

  @Put('invoices/:id/pay')
  @Roles(UserRole.ADMIN, UserRole.BILLING_CLERK, UserRole.RECEPTIONIST)
  async processPayment(
    @Param('id') id: string,
    @Body() body: { paymentMethod: PaymentMethod; version?: number },
  ) {
    return this.billingService.processPayment(id, body.paymentMethod, body.version);
  }
}
