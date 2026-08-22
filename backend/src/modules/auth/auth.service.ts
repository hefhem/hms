import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { NotificationService } from '../notification/notification.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private resetTokens: Map<string, { userId: string; email: string; expires: number }> = new Map();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return null;

    const { password, mfaSecret, ...result } = user;
    return user;
  }

  async login(email: string, pass: string) {
    const user = await this.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid email address or password');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('Account is inactive. Access disabled by System Administrator.');
    }

    if (user.mfaEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, isPendingMfa: true },
        { expiresIn: '10m' },
      );
      return {
        requireMfa: true,
        tempToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    }

    const token = this.generateJwtToken(user);
    return {
      requireMfa: false,
      accessToken: token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  async verifyMfaLogin(userId: string, otpCode: string) {
    const user = await this.usersService.findByEmail(userId);
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA is not configured for this account');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: otpCode,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 6-digit MFA verification code');
    }

    const token = this.generateJwtToken(user);
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mfaEnabled: true,
      },
    };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Return neutral response to prevent user enumeration
      return { message: 'If the email exists, a password reset link has been dispatched via SMTP.' };
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetTokens.set(token, {
      userId: user.id,
      email: user.email,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    await this.notificationService.sendPasswordResetEmail(user.email, user.fullName, token);

    return { message: 'Password reset authorization token dispatched via SMTP.' };
  }

  async resetPassword(token: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const resetData = this.resetTokens.get(token);
    if (!resetData || resetData.expires < Date.now()) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const user = await this.usersService.findById(resetData.userId);
    if (!user) throw new NotFoundException('User not found');

    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    await this.usersService.changePassword(user.id, user.password, newPass);
    this.resetTokens.delete(token);

    return { success: true, message: 'Password successfully reset via authorization token.' };
  }

  async generateMfaSetup(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const appName = this.configService.get<string>('MFA_APP_NAME', 'HMS Enterprise Care');
    const secret = speakeasy.generateSecret({
      name: `${appName} (${user.email})`,
      length: 20,
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');
    await this.usersService.updateMfaSecret(userId, secret.base32, false);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  async enableMfa(userId: string, otpCode: string) {
    const user = await this.usersService.findByEmail(userId);
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initialized');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: otpCode,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Invalid OTP code. MFA setup failed.');
    }

    await this.usersService.updateMfaSecret(userId, user.mfaSecret, true);
    return { success: true, message: 'MFA successfully enabled for account.' };
  }

  private generateJwtToken(user: any) {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
