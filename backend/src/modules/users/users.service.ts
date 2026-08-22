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

  async create(data: { email: string; password?: string; fullName: string; role?: UserRole; isActive?: boolean }): Promise<User> {
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
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const saved = await this.usersRepository.save(user);

    // Dispatch SMTP Welcome Email
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

  async updateProfile(userId: string, data: { fullName?: string; email?: string; role?: UserRole; isActive?: boolean }): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.email !== undefined) user.email = data.email;
    if (data.role !== undefined) user.role = data.role;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    return await this.usersRepository.save(user);
  }

  async toggleStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.isActive = isActive;
    return await this.usersRepository.save(user);
  }

  async adminResetPassword(id: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    user.password = await bcrypt.hash(newPass, 10);
    await this.usersRepository.save(user);

    // Send SMTP notification with updated credentials
    await this.notificationService.sendWelcomeEmail(user.email, user.fullName, user.role, newPass);

    return { success: true, message: `Password for ${user.fullName} successfully updated and dispatched via SMTP.` };
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
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
