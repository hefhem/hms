import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createUser(@Body() body: { email: string; fullName: string; role?: UserRole; password?: string; isActive?: boolean }) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateUser(@Param('id') id: string, @Body() body: { fullName?: string; email?: string; role?: UserRole; isActive?: boolean }) {
    return this.usersService.updateProfile(id, body);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.usersService.toggleStatus(id, body.isActive);
  }

  @Put(':id/reset-password')
  @Roles(UserRole.ADMIN)
  async adminResetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.usersService.adminResetPassword(id, body.newPassword);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { success: true };
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { oldPass: string; newPass: string },
  ) {
    return this.usersService.changePassword(userId, body.oldPass, body.newPass);
  }
}
