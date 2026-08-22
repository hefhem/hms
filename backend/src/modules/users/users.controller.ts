import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
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

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('change-password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { oldPass: string; newPass: string },
  ) {
    return this.usersService.changePassword(userId, body.oldPass, body.newPass);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createUser(
    @Body() body: { email: string; password?: string; fullName: string; role?: UserRole },
  ) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Body() body: { fullName?: string; role?: UserRole },
  ) {
    return this.usersService.updateProfile(id, body);
  }
}
