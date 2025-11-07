import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { ConvertLeadDto } from '../dto/convert-lead.dto';
import { ClerkAuthGuard } from '../../clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';
import { AuthService } from '../../auth/services/auth/auth.service';
import { LeadStatus } from 'prisma/generated/client';

@Controller('leads')
@UseGuards(ClerkAuthGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @CurrentUser('sub') clerkId: string,
    @Body() createLeadDto: CreateLeadDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.leadsService.create(user.tenantId, createLeadDto);
  }

  @Get()
  async findAll(
    @CurrentUser('sub') clerkId: string,
    @Query('status') status?: LeadStatus,
    @Query('contactId') contactId?: string,
    @Query('source') source?: string,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.leadsService.findAll(user.tenantId, {
      status,
      contactId,
      source,
    });
  }

  @Get(':id')
  async findOne(@CurrentUser('sub') clerkId: string, @Param('id') id: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.leadsService.findOne(user.tenantId, id);
  }

  @Post(':id/convert')
  async convert(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
    @Body() convertDto: ConvertLeadDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.leadsService.convert(user.tenantId, user.id, id, convertDto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.leadsService.update(user.tenantId, id, updateLeadDto);
  }

  @Delete(':id')
  async remove(@CurrentUser('sub') clerkId: string, @Param('id') id: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.leadsService.remove(user.tenantId, id);
  }
}
