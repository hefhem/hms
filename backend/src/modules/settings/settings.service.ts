import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private notificationService: NotificationService,
  ) {}

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await this.settingsRepository.find();
    const result: Record<string, string> = {
      CURRENCY_SYMBOL: '$',
      CURRENCY_CODE: 'USD',
      CLINIC_NAME: 'ApexCare HMS Enterprise',
      PLATFORM_SMTP_HOST: 'localhost',
      PLATFORM_SMTP_PORT: '1025',
      PLATFORM_SMTP_USER: '',
      PLATFORM_SMTP_PASS: '',
      PLATFORM_SMTP_FROM_EMAIL: 'no-reply@platform.clinic.com',
      PLATFORM_SMTP_FROM_NAME: 'ApexCare SaaS Platform Administrator',
      PLATFORM_SMTP_SECURE: 'false',
    };

    const hasTx = (await this.invoiceRepository.count()) > 0;
    result.IS_CURRENCY_LOCKED = hasTx ? 'true' : 'false';

    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  async updateSettings(data: Record<string, string>): Promise<Record<string, string>> {
    const isModifyingCurrency = data.CURRENCY_SYMBOL !== undefined || data.CURRENCY_CODE !== undefined;

    if (isModifyingCurrency) {
      const invoiceCount = await this.invoiceRepository.count();
      if (invoiceCount > 0) {
        throw new ForbiddenException(
          'Base System Currency is locked because financial transactions (invoices/payments) have already been recorded. Currency changes are disabled to prevent financial ledger corruption.',
        );
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (key === 'IS_CURRENCY_LOCKED') continue;

      let setting = await this.settingsRepository.findOne({ where: { key } });
      if (!setting) {
        setting = this.settingsRepository.create({ key, value });
      } else {
        setting.value = value;
      }
      await this.settingsRepository.save(setting);
    }

    return await this.getAllSettings();
  }

  async testPlatformSmtp(data: {
    host: string;
    port: number;
    user?: string;
    pass?: string;
    secure?: boolean;
    fromEmail: string;
    fromName?: string;
    headerTemplate?: string;
    footerTemplate?: string;
    testRecipient?: string;
  }) {
    return await this.notificationService.sendCustomSmtpTest(data);
  }
}
