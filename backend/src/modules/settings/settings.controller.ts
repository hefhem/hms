import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getAllSettings();
  }

  @Put()
  @Roles(UserRole.ADMIN)
  async updateSettings(@Body() body: Record<string, string>) {
    return this.settingsService.updateSettings(body);
  }

  @Post('test-platform-smtp')
  @Roles(UserRole.ADMIN)
  async testPlatformSmtp(@Body() body: {
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
    return this.settingsService.testPlatformSmtp(body);
  }
}
