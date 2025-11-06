import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateStageDto } from '../dto/create-stage.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { ReorderStagesDto } from '../dto/reorder-stages.dto';

@Injectable()
export class StagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createStageDto: CreateStageDto) {
    // Verify pipeline exists and belongs to tenant
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        id: createStageDto.pipelineId,
        tenantId,
      },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    // Get next order number if not provided
    let order = createStageDto.order;
    if (!order) {
      const lastStage = await this.prisma.stage.findFirst({
        where: { pipelineId: createStageDto.pipelineId },
        orderBy: { order: 'desc' },
      });
      order = lastStage ? lastStage.order + 1 : 1;
    }

    return this.prisma.stage.create({
      data: {
        name: createStageDto.name,
        pipelineId: createStageDto.pipelineId,
        order,
      },
    });
  }

  async findAll(tenantId: string, pipelineId?: string) {
    const where: any = {};

    if (pipelineId) {
      // Verify pipeline belongs to tenant
      const pipeline = await this.prisma.pipeline.findFirst({
        where: { id: pipelineId, tenantId },
      });

      if (!pipeline) {
        throw new NotFoundException('Pipeline not found');
      }

      where.pipelineId = pipelineId;
    } else {
      // Get all stages for all tenant pipelines
      const pipelines = await this.prisma.pipeline.findMany({
        where: { tenantId },
        select: { id: true },
      });

      where.pipelineId = {
        in: pipelines.map((p) => p.id),
      };
    }

    return this.prisma.stage.findMany({
      where,
      include: {
        pipeline: true,
        _count: {
          select: {
            deals: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const stage = await this.prisma.stage.findFirst({
      where: {
        id,
        pipeline: {
          tenantId,
        },
      },
      include: {
        pipeline: true,
        _count: {
          select: {
            deals: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${id} not found`);
    }

    return stage;
  }

  async update(tenantId: string, id: string, updateStageDto: UpdateStageDto) {
    // Verify stage exists and belongs to tenant
    await this.findOne(tenantId, id);

    return this.prisma.stage.update({
      where: { id },
      data: {
        name: updateStageDto.name,
        order: updateStageDto.order,
      },
      include: {
        pipeline: true,
      },
    });
  }

  async reorder(tenantId: string, reorderDto: ReorderStagesDto) {
    // Verify all stages belong to tenant's pipelines
    const stageIds = reorderDto.stages.map((s) => s.id);
    const stages = await this.prisma.stage.findMany({
      where: {
        id: { in: stageIds },
        pipeline: { tenantId },
      },
    });

    if (stages.length !== stageIds.length) {
      throw new BadRequestException('One or more stages not found');
    }

    // Update all stages in a transaction
    await this.prisma.$transaction(
      reorderDto.stages.map((stageOrder) =>
        this.prisma.stage.update({
          where: { id: stageOrder.id },
          data: { order: stageOrder.order },
        }),
      ),
    );

    return { message: 'Stages reordered successfully' };
  }

  async remove(tenantId: string, id: string) {
    // Verify stage exists and belongs to tenant
    await this.findOne(tenantId, id);

    // Check if stage has deals
    const dealCount = await this.prisma.deal.count({
      where: { stageId: id },
    });

    if (dealCount > 0) {
      throw new BadRequestException(
        `Cannot delete stage with ${dealCount} active deal(s)`,
      );
    }

    await this.prisma.stage.delete({
      where: { id },
    });

    return { message: 'Stage deleted successfully' };
  }
}

