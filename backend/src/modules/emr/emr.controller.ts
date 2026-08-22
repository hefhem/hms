import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EmrService } from './emr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('emr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmrController {
  constructor(private readonly emrService: EmrService) {}

  @Post('consultations')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async createConsultation(
    @Body() body: {
      patientId: string;
      chiefComplaint: string;
      hpi?: string;
      clinicalNotes?: string;
      diagnosis: string;
      icdCode?: string;
      labOrdersRequested?: string[];
      serviceItemIdsRequested?: string[];
      prescriptions?: { drugId: string; drugName: string; dosage: string; frequency: string; duration: string; quantity: number }[];
      parkedConsultationId?: string;
    },
    @CurrentUser('id') doctorId: string,
    @CurrentUser('fullName') doctorName: string,
  ) {
    return this.emrService.createConsultation({
      ...body,
      doctorId: doctorId || 'doc-1',
      doctorName: doctorName || 'Dr. Alexander Fleming',
    });
  }

  @Post('consultations/park')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async parkConsultation(
    @Body() body: {
      patientId: string;
      chiefComplaint?: string;
      hpi?: string;
      clinicalNotes?: string;
      diagnosis?: string;
      icdCode?: string;
      labOrdersRequested?: string[];
      serviceItemIdsRequested?: string[];
    },
    @CurrentUser('id') doctorId: string,
    @CurrentUser('fullName') doctorName: string,
  ) {
    return this.emrService.parkConsultation({
      ...body,
      doctorId: doctorId || 'doc-1',
      doctorName: doctorName || 'Dr. Alexander Fleming',
    });
  }

  @Get('consultations/parked')
  async getParkedConsultations() {
    return this.emrService.getParkedConsultations();
  }

  @Get('patient/:patientId/consultations')
  async getPatientConsultations(@Param('patientId') patientId: string) {
    return this.emrService.getPatientConsultations(patientId);
  }

  @Get('patient/:patientId/ai-briefing')
  async getAiPatientBriefing(@Param('patientId') patientId: string) {
    return this.emrService.generateAiPatientBriefing(patientId);
  }

  @Get('prescriptions/pending')
  async getPendingPrescriptions() {
    return this.emrService.getPendingPrescriptions();
  }

  @Get('icd10/search')
  async searchIcd10(@Query('q') query: string) {
    return this.emrService.searchIcd10(query);
  }
}
