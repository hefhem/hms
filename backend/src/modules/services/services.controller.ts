import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { ServiceItem } from './entities/service-item.entity';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(@Query('isActive') isActive?: string) {
    const activeBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.servicesService.findAll(activeBool);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BILLING_CLERK)
  async create(@Body() body: Partial<ServiceItem>) {
    return this.servicesService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BILLING_CLERK)
  async update(@Param('id') id: string, @Body() body: Partial<ServiceItem>) {
    return this.servicesService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.servicesService.delete(id);
    return { success: true };
  }
}
