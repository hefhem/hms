import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ServiceItem } from './entities/service-item.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceItem)
    private serviceRepository: Repository<ServiceItem>,
    private dataSource: DataSource,
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
    const srv = await this.findOne(id);

    let labCount = 0;
    let radCount = 0;
    let invoiceCount = 0;

    try {
      labCount = await this.dataSource.getRepository('LabOrder').count({
        where: [{ testName: srv.name }, { testName: srv.code }],
      });
    } catch (e) {}

    try {
      radCount = await this.dataSource.getRepository('RadiologyOrder').count({
        where: [{ procedureName: srv.name }, { procedureName: srv.code }],
      });
    } catch (e) {}

    try {
      invoiceCount = await this.dataSource.getRepository('InvoiceItem').count({
        where: [{ itemDescription: srv.name }, { itemDescription: srv.code }],
      });
    } catch (e) {}

    const totalUsage = labCount + radCount + invoiceCount;
    if (totalUsage > 0) {
      throw new BadRequestException(
        `Cannot delete Master Item '${srv.name}' (${srv.code}) because it is actively referenced in ${totalUsage} clinical order(s) or billing invoice(s). Please deactivate the item instead to preserve historical integrity.`,
      );
    }

    await this.serviceRepository.delete(id);
  }
}
