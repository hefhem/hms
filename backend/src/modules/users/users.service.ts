import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { NotificationService } from '../notification/notification.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  async create(data: { email: string; password?: string; fullName: string; role?: UserRole }): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    const rawPassword = data.password || 'Password@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const user = this.usersRepository.create({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role || UserRole.DOCTOR,
    });

    const saved = await this.usersRepository.save(user);

    // Send Welcome Email via SMTP
    await this.notificationService.sendWelcomeEmail(saved.email, saved.fullName, saved.role, rawPassword);

    return saved;
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.mfaSecret')
      .where('user.email = :email', { email })
      .getOne();
  }

  async updateMfaSecret(userId: string, secret: string, enabled: boolean): Promise<void> {
    await this.usersRepository.update(userId, {
      mfaSecret: secret,
      mfaEnabled: enabled,
    });
  }

  async updateProfile(userId: string, data: { fullName?: string; role?: UserRole }): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (data.fullName) user.fullName = data.fullName;
    if (data.role) user.role = data.role;

    return await this.usersRepository.save(user);
  }

  async changePassword(userId: string, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) throw new NotFoundException('User account not found');

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    user.password = await bcrypt.hash(newPass, 10);
    await this.usersRepository.save(user);

    // Send Password Change Security Confirmation Email via SMTP
    await this.notificationService.sendPasswordChangeConfirmationEmail(user.email, user.fullName);

    return { success: true, message: 'Password changed successfully. Security notification sent.' };
  }
}
