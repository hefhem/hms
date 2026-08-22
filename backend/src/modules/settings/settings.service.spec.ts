import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { Invoice } from '../billing/entities/invoice.entity';

describe('SettingsService - Configurable & Locked Currency', () => {
  let service: SettingsService;
  let mockSettingRepo: any;
  let mockInvoiceRepo: any;

  const mockSettings = [
    { key: 'CURRENCY_SYMBOL', value: '$', description: 'Symbol' },
    { key: 'CURRENCY_CODE', value: 'USD', description: 'Code' },
  ];

  beforeEach(async () => {
    mockSettingRepo = {
      find: jest.fn().mockResolvedValue(mockSettings),
      findOne: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(mockSettings.find((s) => s.key === where.key) || null);
      }),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      create: jest.fn().mockImplementation((dto) => dto),
    };

    mockInvoiceRepo = {
      count: jest.fn().mockResolvedValue(0), // default 0 invoices
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Setting),
          useValue: mockSettingRepo,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepo,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should allow currency changes when 0 financial transactions exist', async () => {
    mockInvoiceRepo.count.mockResolvedValue(0);
    const updated = await service.updateSettings({
      CURRENCY_SYMBOL: '€',
      CURRENCY_CODE: 'EUR',
    });
    expect(mockSettingRepo.save).toHaveBeenCalled();
    expect(updated).toBeDefined();
  });

  it('should THROW ForbiddenException when attempting to change currency after transactions exist', async () => {
    mockInvoiceRepo.count.mockResolvedValue(3); // 3 invoices exist!

    await expect(
      service.updateSettings({
        CURRENCY_SYMBOL: '₦',
        CURRENCY_CODE: 'NGN',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
