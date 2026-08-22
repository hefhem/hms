import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { Invoice, PaymentStatus, PaymentMethod } from './entities/invoice.entity';
import { PatientsService } from '../patients/patients.service';
import { NotificationService } from '../notification/notification.service';

describe('BillingService - Invoicing & Payments', () => {
  let service: BillingService;
  let mockInvoiceRepo: any;

  beforeEach(async () => {
    mockInvoiceRepo = {
      count: jest.fn().mockResolvedValue(5),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'inv-1', ...dto, version: 1 })),
      findOne: jest.fn().mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'INV-2026-0006',
        finalAmount: 85.0,
        paymentStatus: PaymentStatus.PENDING,
        version: 1,
      }),
    };

    const mockPatientsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'p1', fullName: 'John Doe', email: 'john@example.com' }),
    };

    const mockNotificationService = {
      sendInvoiceNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        { provide: PatientsService, useValue: mockPatientsService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('should calculate invoice total and subtotal accurately', async () => {
    const inv = await service.createInvoice({
      patientId: 'p1',
      lineItems: [
        { description: 'Consultation Fee', unitPrice: 50.0, quantity: 1, total: 50.0 },
        { description: 'Blood Test', unitPrice: 35.0, quantity: 1, total: 35.0 },
      ],
      discount: 10.0,
    });

    expect(inv.totalAmount).toBe(85.0);
    expect(inv.discount).toBe(10.0);
    expect(inv.finalAmount).toBe(75.0);
  });

  it('should process payment and change status to PAID', async () => {
    const paidInv = await service.processPayment('inv-1', PaymentMethod.CARD, 1);
    expect(paidInv.paymentStatus).toBe(PaymentStatus.PAID);
    expect(paidInv.paymentMethod).toBe(PaymentMethod.CARD);
  });
});
