import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { Patient } from './entities/patient.entity';
import { Triage } from './entities/triage.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async getAllPatients(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.patientsService.findAll(search, user?.tenantId);
  }

  @Get(':id')
  async getPatient(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE)
  async createPatient(@CurrentUser() user: any, @Body() body: Partial<Patient>) {
    return this.patientsService.create({
      ...body,
      tenantId: user?.tenantId,
    });
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE)
  async updatePatient(
    @Param('id') id: string,
    @Body() body: Partial<Patient> & { version?: number },
  ) {
    return this.patientsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deletePatient(@Param('id') id: string) {
    return this.patientsService.delete(id);
  }

  @Post(':id/triage')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
  async recordTriage(
    @Param('id') patientId: string,
    @Body() body: Partial<Triage>,
    @CurrentUser('fullName') nurseName: string,
  ) {
    return this.patientsService.recordTriage(patientId, {
      ...body,
      recordedBy: nurseName || 'Duty Nurse',
    });
  }

  @Post('bulk-import')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async bulkImportPatients(@CurrentUser() user: any, @Body() body: { records: Partial<Patient>[] }) {
    const recordsWithTenant = body.records.map((r) => ({ ...r, tenantId: user?.tenantId }));
    return this.patientsService.bulkImport(recordsWithTenant);
  }
}
