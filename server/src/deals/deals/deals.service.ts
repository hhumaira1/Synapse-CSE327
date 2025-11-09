import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateDealDto } from '../dto/create-deal.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { MoveStageDto } from '../dto/move-stage.dto';

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createDealDto: CreateDealDto) {
    // Verify contact exists and belongs to tenant
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: createDealDto.contactId,
        tenantId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Verify pipeline exists and belongs to tenant
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        id: createDealDto.pipelineId,
        tenantId,
      },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    // Verify stage exists and belongs to pipeline
    const stage = await this.prisma.stage.findFirst({
      where: {
        id: createDealDto.stageId,
        pipelineId: createDealDto.pipelineId,
      },
    });

    if (!stage) {
      throw new NotFoundException(
        'Stage not found or does not belong to the specified pipeline',
      );
    }

    // If leadId provided, verify it exists
    if (createDealDto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: {
          id: createDealDto.leadId,
          tenantId,
        },
      });

      if (!lead) {
        throw new NotFoundException('Lead not found');
      }
    }

    // Convert probability from percentage to decimal (0-100 -> 0.0-1.0)
    const probability = createDealDto.probability
      ? createDealDto.probability / 100
      : 0.5;

    return this.prisma.deal.create({
      data: {
        title: createDealDto.title,
        contactId: createDealDto.contactId,
        pipelineId: createDealDto.pipelineId,
        stageId: createDealDto.stageId,
        tenantId,
        leadId: createDealDto.leadId,
        value: createDealDto.value,
        probability,
        expectedCloseDate: createDealDto.expectedCloseDate
          ? new Date(createDealDto.expectedCloseDate)
          : undefined,
        notes: createDealDto.notes,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
        pipeline: true,
        stage: true,
        lead: true,
      },
    });
  }

  async findAll(
    tenantId: string,
    filters?: {
      stageId?: string;
      pipelineId?: string;
      contactId?: string;
    },
  ) {
    const where: any = { tenantId };

    if (filters?.stageId) {
      where.stageId = filters.stageId;
    }

    if (filters?.pipelineId) {
      where.pipelineId = filters.pipelineId;
    }

    if (filters?.contactId) {
      where.contactId = filters.contactId;
    }

    return this.prisma.deal.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
        pipeline: true,
        stage: true,
        lead: {
          select: {
            id: true,
            title: true,
            source: true,
          },
        },
        _count: {
          select: {
            interactions: true,
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, tenantId },
      include: {
        contact: true,
        pipeline: true,
        stage: true,
        lead: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async update(tenantId: string, id: string, updateDealDto: UpdateDealDto) {
    // Verify deal exists and belongs to tenant
    await this.findOne(tenantId, id);

    // If updating contact, verify it exists
    if (updateDealDto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: updateDealDto.contactId,
          tenantId,
        },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }
    }

    // If updating pipeline or stage, verify they exist and are compatible
    if (updateDealDto.pipelineId || updateDealDto.stageId) {
      const pipelineId = updateDealDto.pipelineId;
      const stageId = updateDealDto.stageId;

      if (pipelineId) {
        const pipeline = await this.prisma.pipeline.findFirst({
          where: { id: pipelineId, tenantId },
        });

        if (!pipeline) {
          throw new NotFoundException('Pipeline not found');
        }
      }

      if (stageId) {
        const stage = await this.prisma.stage.findFirst({
          where: {
            id: stageId,
            pipelineId: pipelineId || undefined,
          },
        });

        if (!stage) {
          throw new NotFoundException(
            'Stage not found or does not belong to the specified pipeline',
          );
        }
      }
    }

    // Convert probability from percentage to decimal if provided
    const probability = updateDealDto.probability
      ? updateDealDto.probability / 100
      : undefined;

    return this.prisma.deal.update({
      where: { id },
      data: {
        ...updateDealDto,
        probability,
        expectedCloseDate: updateDealDto.expectedCloseDate
          ? new Date(updateDealDto.expectedCloseDate)
          : undefined,
      },
      include: {
        contact: true,
        pipeline: true,
        stage: true,
        lead: true,
      },
    });
  }

  async moveStage(tenantId: string, id: string, moveStageDto: MoveStageDto) {
    // Verify deal exists and belongs to tenant
    const deal = await this.findOne(tenantId, id);

    // Verify new stage exists and belongs to the same pipeline
    const stage = await this.prisma.stage.findFirst({
      where: {
        id: moveStageDto.stageId,
        pipelineId: deal.pipelineId,
      },
    });

    if (!stage) {
      throw new BadRequestException(
        'Stage not found or does not belong to the deal pipeline',
      );
    }

    return this.prisma.deal.update({
      where: { id },
      data: {
        stageId: moveStageDto.stageId,
      },
      include: {
        contact: true,
        pipeline: true,
        stage: true,
        lead: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    // Verify deal exists and belongs to tenant
    await this.findOne(tenantId, id);

    await this.prisma.deal.delete({
      where: { id },
    });

    return { message: 'Deal deleted successfully' };
  }

  // Helper method to get deal statistics
  async getStatsByPipeline(tenantId: string, pipelineId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId, pipelineId },
      include: {
        stage: true,
      },
    });

    const totalValue = deals.reduce(
      (sum, deal) => sum + Number(deal.value || 0),
      0,
    );

    const avgProbability =
      deals.reduce((sum, deal) => sum + Number(deal.probability || 0), 0) /
      (deals.length || 1);

    const dealsByStage = deals.reduce(
      (acc, deal) => {
        const stageName = deal.stage.name;
        if (!acc[stageName]) {
          acc[stageName] = { count: 0, value: 0 };
        }
        acc[stageName].count++;
        acc[stageName].value += Number(deal.value || 0);
        return acc;
      },
      {} as Record<string, { count: number; value: number }>,
    );

    return {
      totalDeals: deals.length,
      totalValue,
      avgProbability: avgProbability * 100, // Convert back to percentage
      dealsByStage,
    };
  }
}

