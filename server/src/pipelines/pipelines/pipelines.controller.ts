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
import { ClerkAuthGuard } from '../../clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';
import { AuthService } from '../../auth/services/auth/auth.service';

@Controller('pipelines')
@UseGuards(ClerkAuthGuard)
export class PipelinesController {
  constructor(
    private readonly pipelinesService: PipelinesService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @CurrentUser('sub') clerkId: string,
    @Body() createPipelineDto: CreatePipelineDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.create(user.tenantId, createPipelineDto);
  }

  @Get()
  async findAll(@CurrentUser('sub') clerkId: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.findAll(user.tenantId);
  }

  @Get(':id')
  async findOne(@CurrentUser('sub') clerkId: string, @Param('id') id: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
    @Body() updatePipelineDto: UpdatePipelineDto,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.update(user.tenantId, id, updatePipelineDto);
  }

  @Delete(':id')
  async remove(@CurrentUser('sub') clerkId: string, @Param('id') id: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new ForbiddenException('User not found');
    return this.pipelinesService.remove(user.tenantId, id);
  }
}

