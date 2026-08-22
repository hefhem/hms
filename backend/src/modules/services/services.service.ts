import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceItem } from './entities/service-item.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceItem)
    private serviceRepository: Repository<ServiceItem>,
  ) {}

  async findAll(isActive?: boolean): Promise<ServiceItem[]> {
    const qb = this.serviceRepository.createQueryBuilder('srv').orderBy('srv.code', 'ASC');
    if (isActive !== undefined) {
      qb.andWhere('srv.isActive = :isActive', { isActive });
    }
    return await qb.getMany();
  }

  async findOne(id: string): Promise<ServiceItem> {
    const srv = await this.serviceRepository.findOne({ where: { id } });
    if (!srv) throw new NotFoundException('Service Master item not found');
    return srv;
  }

  async create(data: Partial<ServiceItem>): Promise<ServiceItem> {
    const item = this.serviceRepository.create(data);
    return await this.serviceRepository.save(item);
  }

  async update(id: string, data: Partial<ServiceItem>): Promise<ServiceItem> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return await this.serviceRepository.save(item);
  }

  async delete(id: string): Promise<void> {
    await this.serviceRepository.delete(id);
  }
}
