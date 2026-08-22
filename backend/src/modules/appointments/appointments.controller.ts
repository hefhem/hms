import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { AppointmentStatus } from './entities/appointment.entity';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(@Query() query: { doctorId?: string; status?: AppointmentStatus; date?: string }) {
    return this.appointmentsService.findAll(query);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR)
  async create(
    @Body() body: {
      patientId: string;
      doctorId?: string;
      doctorName?: string;
      appointmentDate: string;
      timeSlot?: string;
      notes?: string;
      reason?: string;
    },
  ) {
    return this.appointmentsService.create(body);
  }

  @Put(':id/reschedule')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR)
  async reschedule(
    @Param('id') id: string,
    @Body() body: {
      appointmentDate: string;
      doctorId?: string;
      doctorName?: string;
      notes?: string;
      version?: number;
    },
  ) {
    return this.appointmentsService.reschedule(id, body);
  }

  @Put(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR)
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string; version?: number },
  ) {
    return this.appointmentsService.cancel(id, body.reason, body.version);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus; version?: number; doctorId?: string; doctorName?: string },
  ) {
    return this.appointmentsService.updateStatus(id, body.status, body.version, body.doctorId, body.doctorName);
  }
}
