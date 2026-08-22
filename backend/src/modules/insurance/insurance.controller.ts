import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { ClaimStatus } from './entities/hmo-claim.entity';
import { HmoProvider } from './entities/hmo-provider.entity';

@Controller('insurance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // HMO Providers Master Endpoints
  @Get('providers')
  async getAllProviders() {
    return this.insuranceService.findAllProviders();
  }

  @Post('providers')
  @Roles(UserRole.ADMIN, UserRole.BILLING_CLERK)
  async createProvider(@Body() body: Partial<HmoProvider>) {
    return this.insuranceService.createProvider(body);
  }

  @Put('providers/:id')
  @Roles(UserRole.ADMIN, UserRole.BILLING_CLERK)
  async updateProvider(@Param('id') id: string, @Body() body: Partial<HmoProvider>) {
    return this.insuranceService.updateProvider(id, body);
  }

  @Delete('providers/:id')
  @Roles(UserRole.ADMIN)
  async deleteProvider(@Param('id') id: string) {
    await this.insuranceService.deleteProvider(id);
    return { success: true };
  }

  // HMO Claims Endpoints
  @Get('claims')
  async getAllClaims() {
    return this.insuranceService.findAll();
  }

  @Post('claims')
  @Roles(UserRole.ADMIN, UserRole.BILLING_CLERK, UserRole.RECEPTIONIST)
  async createClaim(
    @Body() body: {
      patientId: string;
      hmoProvider: string;
      policyNumber: string;
      preAuthCode?: string;
      claimAmount: number;
      copayAmount?: number;
    },
  ) {
    return this.insuranceService.createClaim(body);
  }

  @Put('claims/:id/status')
  @Roles(UserRole.ADMIN, UserRole.BILLING_CLERK)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ClaimStatus; rejectionReason?: string; version?: number },
  ) {
    return this.insuranceService.updateStatus(id, body.status, body.rejectionReason, body.version);
  }
}
