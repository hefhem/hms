import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { PatientsService } from '../patients/patients.service';
import { UsersService } from '../users/users.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationStage } from '../notification/entities/notification.entity';
import { ConcurrencyConflictException } from '../../common/filters/concurrency-exception.filter';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    private patientsService: PatientsService,
    private usersService: UsersService,
    private notificationService: NotificationService,
  ) {}

  async create(data: {
    patientId: string;
    doctorId?: string;
    doctorName?: string;
    appointmentDate: string;
    timeSlot?: string;
    notes?: string;
    reason?: string;
  }): Promise<Appointment> {
    const patient = await this.patientsService.findOne(data.patientId);

    let docId = data.doctorId || null;
    let docName = data.doctorName || 'Unassigned Physician';

    if (data.doctorId) {
      try {
        const doctor = await this.usersService.findById(data.doctorId);
        if (doctor) {
          docId = doctor.id;
          docName = doctor.fullName;
        }
      } catch (e) {
        // fallback
      }
    }

    const timeSlot = data.timeSlot || (data.appointmentDate.includes('T') ? data.appointmentDate.split('T')[1]?.slice(0, 5) : '09:00 AM');

    const appointment = this.appointmentsRepository.create({
      patientId: patient.id,
      patientName: patient.fullName,
      doctorId: docId,
      doctorName: docName,
      appointmentDate: data.appointmentDate,
      timeSlot,
      reason: data.notes || data.reason || 'Routine Consultation Follow-up',
      status: AppointmentStatus.SCHEDULED,
    });

    const saved = await this.appointmentsRepository.save(appointment);

    // Notify Assigned Doctor
    if (docId) {
      await this.notificationService.createStageNotification({
        title: `New Appointment Scheduled: ${patient.fullName}`,
        message: `Patient ${patient.fullName} scheduled for consultation on ${new Date(data.appointmentDate).toLocaleString()}.`,
        recipientRole: 'DOCTOR',
        recipientId: docId,
        stage: NotificationStage.CHECKED_IN,
        metadata: { patientId: patient.id, appointmentId: saved.id },
      });
    }

    // Trigger Patient SMTP Email Notification
    if (patient.email) {
      this.notificationService.sendAppointmentNotification(
        patient.email,
        patient.fullName,
        data.appointmentDate,
        docName,
      );
    }

    return saved;
  }

  async findAll(query?: { doctorId?: string; status?: AppointmentStatus; date?: string }): Promise<Appointment[]> {
    const qb = this.appointmentsRepository.createQueryBuilder('app').orderBy('app.appointmentDate', 'ASC');

    if (query?.doctorId) {
      qb.andWhere('app.doctorId = :doctorId', { doctorId: query.doctorId });
    }
    if (query?.status) {
      qb.andWhere('app.status = :status', { status: query.status });
    }
    if (query?.date) {
      qb.andWhere('app.appointmentDate = :date', { date: query.date });
    }

    return await qb.getMany();
  }

  async reschedule(
    id: string,
    data: { appointmentDate: string; doctorId?: string; doctorName?: string; notes?: string; version?: number },
  ): Promise<Appointment> {
    const app = await this.appointmentsRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Appointment not found');

    if (data.version !== undefined && app.version !== data.version) {
      throw new ConcurrencyConflictException('Appointment', id, app.version);
    }

    app.appointmentDate = data.appointmentDate;
    if (data.doctorId) {
      app.doctorId = data.doctorId;
      app.doctorName = data.doctorName || app.doctorName;
    }
    if (data.notes) app.reason = data.notes;

    const saved = await this.appointmentsRepository.save(app);

    // Notify Assigned Doctor
    await this.notificationService.createStageNotification({
      title: `Appointment Rescheduled: ${app.patientName}`,
      message: `Appointment for ${app.patientName} rescheduled to ${new Date(data.appointmentDate).toLocaleString()} with ${app.doctorName}.`,
      recipientRole: 'DOCTOR',
      stage: NotificationStage.CHECKED_IN,
      metadata: { patientId: app.patientId, appointmentId: app.id },
    });

    return saved;
  }

  async cancel(id: string, reason?: string, version?: number): Promise<Appointment> {
    const app = await this.appointmentsRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Appointment not found');

    if (version !== undefined && app.version !== version) {
      throw new ConcurrencyConflictException('Appointment', id, app.version);
    }

    app.status = AppointmentStatus.CANCELLED;
    if (reason) app.reason = `CANCELLED: ${reason}`;

    const saved = await this.appointmentsRepository.save(app);

    // Notify Assigned Doctor
    await this.notificationService.createStageNotification({
      title: `Appointment Cancelled: ${app.patientName}`,
      message: `Appointment for ${app.patientName} scheduled for ${app.appointmentDate} has been cancelled. Reason: ${reason || 'Patient request'}.`,
      recipientRole: 'DOCTOR',
      stage: NotificationStage.CHECKED_IN,
      metadata: { patientId: app.patientId, appointmentId: app.id },
    });

    return saved;
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    version?: number,
    doctorId?: string,
    doctorName?: string,
  ): Promise<Appointment> {
    const app = await this.appointmentsRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Appointment not found');

    if (version !== undefined && app.version !== version) {
      throw new ConcurrencyConflictException('Appointment', id, app.version);
    }

    app.status = status;
    if (doctorId) {
      app.doctorId = doctorId;
      app.doctorName = doctorName || app.doctorName;
    }

    const saved = await this.appointmentsRepository.save(app);

    // Cross-Departmental Stage Notifications
    if (status === AppointmentStatus.CHECKED_IN) {
      await this.notificationService.createStageNotification({
        title: `Patient Checked In: ${app.patientName}`,
        message: `Patient ${app.patientName} checked in at Front Desk. Assigned Doctor: ${app.doctorName}. Nurse triage required.`,
        recipientRole: 'NURSE',
        stage: NotificationStage.CHECKED_IN,
        metadata: { patientId: app.patientId, mrn: app.patientName },
      });

      if (app.doctorId) {
        await this.notificationService.createStageNotification({
          title: `Patient Arrival Alert: ${app.patientName}`,
          message: `Your patient ${app.patientName} has checked in and is awaiting consultation.`,
          recipientRole: 'DOCTOR',
          recipientId: app.doctorId,
          stage: NotificationStage.CHECKED_IN,
          metadata: { patientId: app.patientId },
        });
      }
    } else if (status === AppointmentStatus.TRIAGED) {
      await this.notificationService.createStageNotification({
        title: `Vitals Recorded: ${app.patientName}`,
        message: `Triage vitals logged for ${app.patientName}. Patient is ready for doctor consultation.`,
        recipientRole: 'DOCTOR',
        stage: NotificationStage.TRIAGED,
        metadata: { patientId: app.patientId },
      });
    } else if (status === AppointmentStatus.IN_CONSULTATION) {
      await this.notificationService.createStageNotification({
        title: `Consultation Started: ${app.patientName}`,
        message: `Patient ${app.patientName} is currently in consultation room with ${app.doctorName}.`,
        recipientRole: 'RECEPTIONIST',
        stage: NotificationStage.IN_CONSULTATION,
        metadata: { patientId: app.patientId },
      });
    }

    return saved;
  }
}
