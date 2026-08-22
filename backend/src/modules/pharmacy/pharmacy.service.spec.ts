import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PharmacyService } from './pharmacy.service';
import { Drug } from './entities/drug.entity';
import { DrugBatch } from './entities/drug-batch.entity';
import { Prescription } from '../emr/entities/prescription.entity';

describe('PharmacyService - Dispensing & Concurrency', () => {
  let service: PharmacyService;
  let mockDrugRepo: any;
  let mockBatchRepo: any;
  let mockRxRepo: any;

  beforeEach(async () => {
    mockDrugRepo = {
      find: jest.fn().mockResolvedValue([
        { id: '1', name: 'Amoxicillin', unitPrice: 12.5, quantityInStock: 100, reorderLevel: 20, version: 1 },
      ]),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: '1', ...dto })),
    };

    mockBatchRepo = {};
    mockRxRepo = {};

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          save: jest.fn(),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PharmacyService,
        { provide: getRepositoryToken(Drug), useValue: mockDrugRepo },
        { provide: getRepositoryToken(DrugBatch), useValue: mockBatchRepo },
        { provide: getRepositoryToken(Prescription), useValue: mockRxRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PharmacyService>(PharmacyService);
  });

  it('should list all drugs in catalog', async () => {
    const drugs = await service.findAllDrugs();
    expect(drugs.length).toBe(1);
    expect(drugs[0].name).toBe('Amoxicillin');
  });

  it('should create new drug SKU', async () => {
    const newDrug = await service.createDrug({ name: 'Paracetamol', unitPrice: 5.0, quantityInStock: 200 });
    expect(newDrug.name).toBe('Paracetamol');
  });
});
