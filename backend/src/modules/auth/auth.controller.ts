import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; pass: string }) {
    return this.authService.login(body.email, body.pass);
  }

  @Post('mfa/verify-login')
  async verifyMfaLogin(@Body() body: { email: string; otpCode: string }) {
    return this.authService.verifyMfaLogin(body.email, body.otpCode);
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  async generateMfaSetup(@CurrentUser('id') userId: string) {
    return this.authService.generateMfaSetup(userId);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  async enableMfa(@CurrentUser('email') email: string, @Body() body: { otpCode: string }) {
    return this.authService.enableMfa(email, body.otpCode);
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
