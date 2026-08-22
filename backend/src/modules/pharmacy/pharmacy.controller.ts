import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Drug } from './entities/drug.entity';

@Controller('pharmacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Get('drugs')
  async getAllDrugs() {
    return this.pharmacyService.findAllDrugs();
  }

  @Post('drugs')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async createDrug(@Body() body: Partial<Drug>) {
    return this.pharmacyService.createDrug(body);
  }

  @Put('drugs/:id')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async updateDrug(@Param('id') id: string, @Body() body: Partial<Drug>) {
    return this.pharmacyService.updateDrug(id, body);
  }

  @Delete('drugs/:id')
  @Roles(UserRole.ADMIN)
  async deleteDrug(@Param('id') id: string) {
    await this.pharmacyService.deleteDrug(id);
    return { success: true };
  }

  @Post('drugs/:id/batches')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async addBatch(
    @Param('id') id: string,
    @Body() body: { batchNumber: string; quantity: number; expiryDate: string; supplier?: string },
  ) {
    return this.pharmacyService.addBatch(id, body);
  }

  @Post('dispense/:prescriptionId')
  @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
  async dispensePrescription(
    @Param('prescriptionId') prescriptionId: string,
    @CurrentUser('fullName') pharmacistName: string,
  ) {
    return this.pharmacyService.dispensePrescription(prescriptionId, pharmacistName || 'Lead Pharmacist');
  }
}
