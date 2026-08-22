import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { RadiologyService } from './radiology.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('radiology')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RadiologyController {
  constructor(private readonly radiologyService: RadiologyService) {}

  @Get('orders')
  async getAllOrders() {
    return this.radiologyService.findAll();
  }

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async createOrder(
    @Body() body: {
      patientId: string;
      modality: string;
      procedureName: string;
      cost?: number;
    },
    @CurrentUser('id') doctorId: string,
    @CurrentUser('fullName') doctorName: string,
  ) {
    return this.radiologyService.createOrder({
      ...body,
      doctorId: doctorId || 'doc-1',
      doctorName: doctorName || 'Dr. Alexander Fleming',
    });
  }

  @Put('orders/:id/report')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async submitReport(
    @Param('id') id: string,
    @Body() body: { notes: string; impression: string; version?: number },
    @CurrentUser('fullName') radiologistName: string,
  ) {
    return this.radiologyService.submitReport(
      id,
      body.notes,
      body.impression,
      radiologistName || 'Consultant Radiologist',
      body.version,
    );
  }
}
