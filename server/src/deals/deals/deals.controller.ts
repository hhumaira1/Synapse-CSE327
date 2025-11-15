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
import { DealsService } from './deals.service';
import { CreateDealDto } from '../dto/create-deal.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { MoveStageDto } from '../dto/move-stage.dto';
import { SupabaseAuthGuard } from '../../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../../supabase-auth/decorators/current-user.decorator';
import { AuthService } from '../../auth/auth.service';

@Controller('deals')
@UseGuards(SupabaseAuthGuard)
export class DealsController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') supabaseUserId: string,
    @Body() createDealDto: CreateDealDto,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.create(user.tenantId, createDealDto);
  }

  @Get()
  async findAll(
    @CurrentUser('id') supabaseUserId: string,
    @Query('stageId') stageId?: string,
    @Query('pipelineId') pipelineId?: string,
    @Query('contactId') contactId?: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.findAll(user.tenantId, {
      stageId,
      pipelineId,
      contactId,
    });
  }

  @Get('stats/:pipelineId')
  async getStats(
    @CurrentUser('id') supabaseUserId: string,
    @Param('pipelineId') pipelineId: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.getStatsByPipeline(user.tenantId, pipelineId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') supabaseUserId: string, @Param('id') id: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.findOne(user.tenantId, id);
  }

  @Patch(':id/move')
  async moveStage(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') id: string,
    @Body() moveStageDto: MoveStageDto,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.moveStage(user.tenantId, id, moveStageDto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.update(user.tenantId, id, updateDealDto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') supabaseUserId: string, @Param('id') id: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.remove(user.tenantId, id);
  }
}


