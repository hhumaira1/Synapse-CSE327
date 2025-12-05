import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';
import { UpdatePipelineDto } from '../dto/update-pipeline.dto';
import { SupabaseAuthGuard } from '../../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../../supabase-auth/decorators/current-user.decorator';
import { AuthService } from '../../auth/auth.service';

@Controller('pipelines')
@UseGuards(SupabaseAuthGuard)
export class PipelinesController {
  constructor(
    private readonly pipelinesService: PipelinesService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') supabaseUserId: string,
    @Body() createPipelineDto: CreatePipelineDto,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.create(user.tenantId, createPipelineDto);
  }

  @Get()
  async findAll(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.findAll(user.tenantId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') supabaseUserId: string, @Param('id') id: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') id: string,
    @Body() updatePipelineDto: UpdatePipelineDto,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.update(user.tenantId, id, updatePipelineDto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') supabaseUserId: string, @Param('id') id: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.remove(user.tenantId, id);
  }
}

