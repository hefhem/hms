import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; pass: string; password?: string }) {
    return this.authService.login(body.email, body.pass || body.password || '');
  }

  @Post('mfa/verify-login')
  async verifyMfaLogin(@Body() body: { userId: string; otpCode: string }) {
    return this.authService.verifyMfaLogin(body.userId, body.otpCode);
  }

  @Get('mfa/setup')
  @UseGuards(JwtAuthGuard)
  async setupMfa(@CurrentUser('id') userId: string) {
    return this.authService.generateMfaSetup(userId);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  async enableMfa(
    @CurrentUser('id') userId: string,
    @Body() body: { otpCode: string },
  ) {
    return this.authService.enableMfa(userId, body.otpCode);
  }
}
