import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { TenantStatus, TenantPlan } from './entities/tenant.entity';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async getAllTenants() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get('subdomain/:subdomain')
  async getBySubdomain(@Param('subdomain') subdomain: string) {
    return this.tenantsService.findBySubdomain(subdomain);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createTenant(
    @Body() body: {
      name: string;
      subdomain: string;
      currency?: string;
      plan?: TenantPlan;
      maxUsers?: number;
      contactEmail?: string;
      contactPhone?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
      senderEmail?: string;
      senderName?: string;
    },
  ) {
    return this.tenantsService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateTenant(@Param('id') id: string, @Body() body: any) {
    return this.tenantsService.update(id, body);
  }

  @Put(':id/smtp')
  @Roles(UserRole.ADMIN)
  async updateSmtpConfig(
    @Param('id') id: string,
    @Body() body: {
      smtpHost: string;
      smtpPort: number;
      smtpUser?: string;
      smtpPassword?: string;
      senderEmail: string;
      senderName: string;
      emailHeaderTemplate?: string;
      emailFooterTemplate?: string;
    },
  ) {
    return this.tenantsService.updateSmtpConfig(id, body);
  }

  @Put(':id/lock')
  @Roles(UserRole.ADMIN)
  async toggleLock(
    @Param('id') id: string,
    @Body() body: { isLocked: boolean; lockReason?: string },
  ) {
    return this.tenantsService.toggleLock(id, body.isLocked, body.lockReason);
  }

  @Put(':id/maintenance')
  @Roles(UserRole.ADMIN)
  async toggleMaintenance(
    @Param('id') id: string,
    @Body() body: { isMaintenanceMode: boolean; maintenanceMessage?: string },
  ) {
    return this.tenantsService.toggleMaintenance(id, body.isMaintenanceMode, body.maintenanceMessage);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id') id: string, @Body() body: { status: TenantStatus }) {
    return this.tenantsService.toggleStatus(id, body.status);
  }

  @Post(':id/test-smtp')
  @Roles(UserRole.ADMIN)
  async sendTestSmtp(@Param('id') id: string, @Body() body: { recipientEmail: string }) {
    return this.tenantsService.sendTestSmtp(id, body.recipientEmail);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteTenant(@Param('id') id: string) {
    await this.tenantsService.delete(id);
    return { success: true };
  }
}
