import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SuperAdminTenantsService } from './tenants.service';
import type { CreateTenantDto, UpdateTenantDto } from './tenants.service';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { CurrentSuperAdmin } from '../decorators/current-super-admin.decorator';
import { PaginationDto } from '../dto/pagination.dto';
import { TenantType } from 'prisma/generated/client';

@Controller('super-admin/tenants')
@UseGuards(SuperAdminGuard)
export class SuperAdminTenantsController {
  constructor(private tenantsService: SuperAdminTenantsService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('type') type?: TenantType,
    @Query('isActive') isActive?: string,
  ) {
    return this.tenantsService.findAll({
      search,
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      skip: pagination.skip,
      take: pagination.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.tenantsService.getStats(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateTenantDto,
    @CurrentSuperAdmin('id') superAdminId: string,
  ) {
    return this.tenantsService.create(createDto, superAdminId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTenantDto,
    @CurrentSuperAdmin('id') superAdminId: string,
  ) {
    return this.tenantsService.update(id, updateDto, superAdminId);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(
    @Param('id') id: string,
    @CurrentSuperAdmin('id') superAdminId: string,
  ) {
    return this.tenantsService.toggleStatus(id, superAdminId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentSuperAdmin('id') superAdminId: string,
  ) {
    return this.tenantsService.remove(id, superAdminId);
  }
}
