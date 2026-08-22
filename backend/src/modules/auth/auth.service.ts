import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

    if (user.mfaEnabled) {
      // User must submit MFA code
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
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  async verifyMfaLogin(userId: string, otpCode: string) {
    const user = await this.usersService.findByEmail(userId); // or by id
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA is not configured for this account');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: otpCode,
      window: 1, // allow 30s drift
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

  async generateMfaSetup(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const appName = this.configService.get<string>('MFA_APP_NAME', 'HMS Enterprise Care');
    const secret = speakeasy.generateSecret({
      name: `${appName} (${user.email})`,
      length: 20,
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    // Temporarily save secret until verified
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
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
