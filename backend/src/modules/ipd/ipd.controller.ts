import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IpdService } from './ipd.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Bed } from './entities/bed.entity';

@Controller('ipd')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IpdController {
  constructor(private readonly ipdService: IpdService) {}

  @Get('beds')
  async getBeds() {
    return this.ipdService.getAllBeds();
  }

  @Post('beds')
  @Roles(UserRole.ADMIN)
  async createBed(@Body() body: { bedNumber: string; wardName: string; bedClass?: string; pricePerNight?: number }) {
    return this.ipdService.createBed(body);
  }

  @Put('beds/:id')
  @Roles(UserRole.ADMIN)
  async updateBed(@Param('id') id: string, @Body() body: Partial<Bed>) {
    return this.ipdService.updateBed(id, body);
  }

  @Delete('beds/:id')
  @Roles(UserRole.ADMIN)
  async deleteBed(@Param('id') id: string) {
    await this.ipdService.deleteBed(id);
    return { success: true };
  }

  @Get('admissions')
  async getAdmissions() {
    return this.ipdService.getAllAdmissions();
  }

  @Post('admissions')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  async admitPatient(
    @Body() body: { patientId: string; bedId: string; reason?: string },
    @CurrentUser('fullName') doctorName: string,
  ) {
    return this.ipdService.admitPatient({
      ...body,
      attendingDoctor: doctorName || 'Dr. Alexander Fleming',
    });
  }

  @Put('admissions/:id/discharge')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async dischargePatient(@Param('id') id: string, @Body() body: { dischargeSummary: string }) {
    return this.ipdService.dischargePatient(id, body.dischargeSummary);
  }
}
