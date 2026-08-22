import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation, ConsultationStatus } from './entities/consultation.entity';
import { Prescription, PrescriptionStatus } from './entities/prescription.entity';
import { PatientsService } from '../patients/patients.service';
import { PharmacyService } from '../pharmacy/pharmacy.service';
import { LabService } from '../lab/lab.service';
import { ServicesService } from '../services/services.service';
import { BillingService } from '../billing/billing.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationStage } from '../notification/entities/notification.entity';

@Injectable()
export class EmrService {
  constructor(
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
    @InjectRepository(Prescription)
    private prescriptionRepository: Repository<Prescription>,
    private patientsService: PatientsService,
    private pharmacyService: PharmacyService,
    private labService: LabService,
    private servicesService: ServicesService,
    private billingService: BillingService,
    private notificationService: NotificationService,
  ) {}

  async parkConsultation(data: {
    patientId: string;
    doctorId: string;
    doctorName: string;
    chiefComplaint?: string;
    hpi?: string;
    clinicalNotes?: string;
    diagnosis?: string;
    icdCode?: string;
    labOrdersRequested?: string[];
    serviceItemIdsRequested?: string[];
  }): Promise<Consultation> {
    const patient = await this.patientsService.findOne(data.patientId);

    const consultation = this.consultationRepository.create({
      patientId: patient.id,
      patientName: patient.fullName,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      chiefComplaint: data.chiefComplaint || 'Awaiting Investigations',
      hpi: data.hpi,
      clinicalNotes: data.clinicalNotes,
      diagnosis: data.diagnosis || 'Under Investigation',
      icdCode: data.icdCode,
      labOrdersRequested: data.labOrdersRequested || [],
      status: ConsultationStatus.PARKED,
    });

    const saved = await this.consultationRepository.save(consultation);

    // 1. Process Requested Lab Investigations if any
    if (data.labOrdersRequested && data.labOrdersRequested.length > 0) {
      for (const testName of data.labOrdersRequested) {
        await this.labService.createOrder({
          patientId: patient.id,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          testName,
        });
      }
    }

    // 2. Notify Doctor & Nurse
    await this.notificationService.createStageNotification({
      title: `Consultation Parked: ${patient.fullName}`,
      message: `Consultation for ${patient.fullName} put on hold awaiting laboratory/imaging results.`,
      recipientRole: 'DOCTOR',
      stage: NotificationStage.LAB_ORDERED,
      metadata: { patientId: patient.id, consultationId: saved.id },
    });

    return saved;
  }

  async createConsultation(data: {
    patientId: string;
    doctorId: string;
    doctorName: string;
    chiefComplaint: string;
    hpi?: string;
    clinicalNotes?: string;
    diagnosis: string;
    icdCode?: string;
    labOrdersRequested?: string[];
    serviceItemIdsRequested?: string[];
    prescriptions?: { drugId: string; drugName: string; dosage: string; frequency: string; duration: string; quantity: number }[];
    parkedConsultationId?: string;
  }): Promise<Consultation> {
    const patient = await this.patientsService.findOne(data.patientId);

    let consultation: Consultation;

    if (data.parkedConsultationId) {
      const existing = await this.consultationRepository.findOne({ where: { id: data.parkedConsultationId } });
      if (existing) {
        consultation = existing;
        consultation.chiefComplaint = data.chiefComplaint;
        consultation.hpi = data.hpi;
        consultation.clinicalNotes = data.clinicalNotes;
        consultation.diagnosis = data.diagnosis;
        consultation.icdCode = data.icdCode;
        consultation.status = ConsultationStatus.FINALIZED;
      } else {
        consultation = this.consultationRepository.create({
          patientId: patient.id,
          patientName: patient.fullName,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          chiefComplaint: data.chiefComplaint,
          hpi: data.hpi,
          clinicalNotes: data.clinicalNotes,
          diagnosis: data.diagnosis,
          icdCode: data.icdCode,
          labOrdersRequested: data.labOrdersRequested || [],
          status: ConsultationStatus.FINALIZED,
        });
      }
    } else {
      consultation = this.consultationRepository.create({
        patientId: patient.id,
        patientName: patient.fullName,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        chiefComplaint: data.chiefComplaint,
        hpi: data.hpi,
        clinicalNotes: data.clinicalNotes,
        diagnosis: data.diagnosis,
        icdCode: data.icdCode,
        labOrdersRequested: data.labOrdersRequested || [],
        status: ConsultationStatus.FINALIZED,
      });
    }

    const savedConsultation = await this.consultationRepository.save(consultation);

    // 1. Process Prescription if provided
    if (data.prescriptions && data.prescriptions.length > 0) {
      const rxItems = data.prescriptions.map((p) => ({
        drugId: p.drugId,
        drugName: p.drugName,
        dosage: p.dosage,
        frequency: p.frequency,
        durationDays: parseInt(p.duration) || 5,
        quantity: p.quantity,
      }));

      const rx = this.prescriptionRepository.create({
        consultationId: savedConsultation.id,
        patientId: patient.id,
        patientName: patient.fullName,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        items: rxItems,
        status: PrescriptionStatus.PENDING,
      });
      await this.prescriptionRepository.save(rx);

      // Trigger Pharmacist Notification
      await this.notificationService.createStageNotification({
        title: `New E-Prescription Generated: ${patient.fullName}`,
        message: `Doctor ${data.doctorName} generated a new prescription containing ${rxItems.length} medication(s) for ${patient.fullName}.`,
        recipientRole: 'PHARMACIST',
        stage: NotificationStage.PRESCRIPTION_GENERATED,
        metadata: { patientId: patient.id, rxId: rx.id },
      });
    }

    // 2. Process Requested Lab Investigations if not already ordered
    if (data.labOrdersRequested && data.labOrdersRequested.length > 0 && !data.parkedConsultationId) {
      for (const testName of data.labOrdersRequested) {
        await this.labService.createOrder({
          patientId: patient.id,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          testName,
        });
      }
    }

    // 3. Process Requested Services & Procedures for Billing
    const invoiceLineItems: { description: string; unitPrice: number; quantity: number; total: number }[] = [
      { description: `Clinical Doctor Consultation Fee (${savedConsultation.doctorName})`, unitPrice: 50.0, quantity: 1, total: 50.0 },
    ];

    if (data.serviceItemIdsRequested && data.serviceItemIdsRequested.length > 0) {
      for (const srvId of data.serviceItemIdsRequested) {
        try {
          const srv = await this.servicesService.findOne(srvId);
          invoiceLineItems.push({
            description: `Procedure/Service: ${srv.name} (${srv.code})`,
            unitPrice: srv.price,
            quantity: 1,
            total: srv.price,
          });
        } catch (e) {
          // ignore unmapped service
        }
      }
    }

    // Generate/Update Invoice Draft
    await this.billingService.createInvoice({
      patientId: patient.id,
      lineItems: invoiceLineItems,
      notes: `Auto-generated from EMR Consultation #${savedConsultation.id.slice(0, 8)}`,
    });

    return savedConsultation;
  }

  async getParkedConsultations(): Promise<Consultation[]> {
    return await this.consultationRepository.find({
      where: { status: ConsultationStatus.PARKED },
      order: { updatedAt: 'DESC' },
    });
  }

  async getPatientConsultations(patientId: string): Promise<Consultation[]> {
    return await this.consultationRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingPrescriptions(): Promise<Prescription[]> {
    return await this.prescriptionRepository.find({
      where: { status: PrescriptionStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async generateAiPatientBriefing(patientId: string) {
    const patient = await this.patientsService.findOne(patientId);
    const pastConsultations = await this.getPatientConsultations(patientId);

    const totalVisits = pastConsultations.length;
    const pastDiagnoses = pastConsultations.map((c) => c.diagnosis).filter(Boolean);

    const diagnosisCounts: Record<string, number> = {};
    pastDiagnoses.forEach((d) => {
      diagnosisCounts[d] = (diagnosisCounts[d] || 0) + 1;
    });

    const recurrentConditions = Object.entries(diagnosisCounts)
      .filter(([_, count]) => count > 1)
      .map(([diag, count]) => `${diag} (${count} occurrences)`);

    let riskLevel = 'LOW';
    const riskAlerts: string[] = [];

    if (patient.allergies && patient.allergies !== 'None') {
      riskAlerts.push(`⚠️ Known Allergy Alert: ${patient.allergies}`);
    }

    if (recurrentConditions.length > 0) {
      riskLevel = 'MODERATE';
      riskAlerts.push(`🔁 Recurrent Diagnosis Detected: ${recurrentConditions.join(', ')}`);
    }

    if (totalVisits >= 3) {
      riskAlerts.push(`📊 High Visit Frequency: ${totalVisits} clinical encounters recorded.`);
    }

    const aiSummary = totalVisits === 0
      ? `First-time visit for ${patient.fullName}. No previous clinical encounters recorded in HMS database.`
      : `Patient ${patient.fullName} has ${totalVisits} previous consultation(s). Most recent diagnosis was "${pastConsultations[0]?.diagnosis || 'N/A'}". Recurrence analysis shows ${recurrentConditions.length > 0 ? recurrentConditions.join(', ') : 'no active recurrent condition risks'}. Known allergies: ${patient.allergies || 'None'}.`;

    return {
      patientId: patient.id,
      patientName: patient.fullName,
      mrn: patient.mrn,
      allergies: patient.allergies,
      bloodGroup: patient.bloodGroup,
      totalVisits,
      riskLevel,
      riskAlerts,
      recurrentConditions,
      lastDiagnosis: pastConsultations[0]?.diagnosis || 'None',
      lastVisitDate: pastConsultations[0]?.createdAt || null,
      aiSummary,
    };
  }

  async searchIcd10(query: string) {
    const commonIcd10 = [
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
      { code: 'I10', description: 'Essential (primary) hypertension' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
      { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
      { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
      { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
      { code: 'M54.5', description: 'Low back pain, unspecified' },
      { code: 'R51', description: 'Headache' },
    ];
    if (!query) return commonIcd10;
    return commonIcd10.filter(
      (i) => i.code.toLowerCase().includes(query.toLowerCase()) || i.description.toLowerCase().includes(query.toLowerCase()),
    );
  }
}
