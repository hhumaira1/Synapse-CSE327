import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';
import { UpdatePipelineDto } from '../dto/update-pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createPipelineDto: CreatePipelineDto) {
    return this.prisma.pipeline.create({
      data: {
        ...createPipelineDto,
        tenantId,
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.pipeline.findMany({
      where: { tenantId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            deals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, tenantId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: {
                deals: true,
              },
            },
          },
        },
        _count: {
          select: {
            deals: true,
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${id} not found`);
    }

    return pipeline;
  }

  async update(
    tenantId: string,
    id: string,
    updatePipelineDto: UpdatePipelineDto,
  ) {
    // Verify pipeline exists and belongs to tenant
    await this.findOne(tenantId, id);

    return this.prisma.pipeline.update({
      where: { id },
      data: updatePipelineDto,
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    // Verify pipeline exists and belongs to tenant
    const pipeline = await this.findOne(tenantId, id);

    // Check if pipeline has deals
    const dealCount = await this.prisma.deal.count({
      where: { pipelineId: id },
    });

    if (dealCount > 0) {
      throw new BadRequestException(
        `Cannot delete pipeline with ${dealCount} active deal(s)`,
      );
    }

    // Delete pipeline (cascades to stages)
    await this.prisma.pipeline.delete({
      where: { id },
    });

    return { message: 'Pipeline deleted successfully' };
  }
}
