import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LabService } from './lab.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { LabOrderStatus, LabTestParameter } from './entities/lab-order.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('lab')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Get('orders')
  async getOrders(
    @Query('status') status?: LabOrderStatus,
    @Query('patientId') patientId?: string,
  ) {
    return this.labService.findAll({ status, patientId });
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.labService.findOne(id);
  }

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  async createOrder(
    @Body() body: {
      patientId: string;
      testName: string;
      specimenType?: string;
      cost?: number;
    },
    @CurrentUser('id') doctorId: string,
    @CurrentUser('fullName') doctorName: string,
  ) {
    return this.labService.createOrder({
      ...body,
      doctorId: doctorId || 'doc-1',
      doctorName: doctorName || 'Dr. Practitioner',
    });
  }

  @Put('orders/:id/status')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: LabOrderStatus; version?: number },
  ) {
    return this.labService.updateStatus(id, body.status, body.version);
  }

  @Put('orders/:id/results')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  async enterResults(
    @Param('id') id: string,
    @Body() body: {
      testParameters: LabTestParameter[];
      labNotes?: string;
      version?: number;
    },
    @CurrentUser('fullName') techName: string,
  ) {
    return this.labService.enterResults(
      id,
      body.testParameters,
      body.labNotes,
      techName || 'Lead Lab Technologist',
      body.version,
    );
  }
}
