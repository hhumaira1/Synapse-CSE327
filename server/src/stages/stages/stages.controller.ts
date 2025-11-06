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
import { ClerkAuthGuard } from '../../clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';
import { AuthService } from '../../auth/services/auth/auth.service';

@Controller('stages')
@UseGuards(ClerkAuthGuard)
export class StagesController {
  constructor(
    private readonly stagesService: StagesService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @CurrentUser('sub') clerkId: string,
    @Body() createStageDto: CreateStageDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.create(user.tenantId, createStageDto);
  }

  @Get()
  async findAll(
    @CurrentUser('sub') clerkId: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.findAll(user.tenantId, pipelineId);
  }

  @Get(':id')
  async findOne(@CurrentUser('sub') clerkId: string, @Param('id') id: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.findOne(user.tenantId, id);
  }

  @Patch('reorder')
  async reorder(
    @CurrentUser('sub') clerkId: string,
    @Body() reorderDto: ReorderStagesDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.reorder(user.tenantId, reorderDto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
    @Body() updateStageDto: UpdateStageDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.update(user.tenantId, id, updateStageDto);
  }

  @Delete(':id')
  async remove(@CurrentUser('sub') clerkId: string, @Param('id') id: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.stagesService.remove(user.tenantId, id);
  }
}

