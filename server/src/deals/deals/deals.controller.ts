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
import { ClerkAuthGuard } from '../../clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';
import { AuthService } from '../../auth/services/auth/auth.service';

@Controller('deals')
@UseGuards(ClerkAuthGuard)
export class DealsController {
  constructor(
    private readonly dealsService: DealsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @CurrentUser('sub') clerkId: string,
    @Body() createDealDto: CreateDealDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.create(user.tenantId, createDealDto);
  }

  @Get()
  async findAll(
    @CurrentUser('sub') clerkId: string,
    @Query('stageId') stageId?: string,
    @Query('pipelineId') pipelineId?: string,
    @Query('contactId') contactId?: string,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.findAll(user.tenantId, {
      stageId,
      pipelineId,
      contactId,
    });
  }

  @Get('stats/:pipelineId')
  async getStats(
    @CurrentUser('sub') clerkId: string,
    @Param('pipelineId') pipelineId: string,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.getStatsByPipeline(user.tenantId, pipelineId);
  }

  @Get(':id')
  async findOne(@CurrentUser('sub') clerkId: string, @Param('id') id: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.findOne(user.tenantId, id);
  }

  @Patch(':id/move')
  async moveStage(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
    @Body() moveStageDto: MoveStageDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.moveStage(user.tenantId, id, moveStageDto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.update(user.tenantId, id, updateDealDto);
  }

  @Delete(':id')
  async remove(@CurrentUser('sub') clerkId: string, @Param('id') id: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.dealsService.remove(user.tenantId, id);
  }
}

