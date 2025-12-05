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
import { StagesService } from './stages.service';
import { CreateStageDto } from '../dto/create-stage.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { ReorderStagesDto } from '../dto/reorder-stages.dto';
import { SupabaseAuthGuard } from '../../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../../supabase-auth/decorators/current-user.decorator';
import { AuthService } from '../../auth/auth.service';

@Controller('stages')
@UseGuards(SupabaseAuthGuard)
export class StagesController {
  constructor(
    private readonly stagesService: StagesService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') supabaseUserId: string,
    @Body() createStageDto: CreateStageDto,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.create(user.tenantId, createStageDto);
  }

  @Get()
  async findAll(
    @CurrentUser('id') supabaseUserId: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.findAll(user.tenantId, pipelineId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') supabaseUserId: string, @Param('id') id: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.findOne(user.tenantId, id);
  }

  @Patch('reorder')
  async reorder(
    @CurrentUser('id') supabaseUserId: string,
    @Body() reorderDto: ReorderStagesDto,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.reorder(user.tenantId, reorderDto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') id: string,
    @Body() updateStageDto: UpdateStageDto,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.update(user.tenantId, id, updateStageDto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') supabaseUserId: string, @Param('id') id: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.remove(user.tenantId, id);
  }
}


