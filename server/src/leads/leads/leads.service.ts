import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { ConvertLeadDto } from '../dto/convert-lead.dto';
import { LeadStatus } from 'prisma/generated/client';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createLeadDto: CreateLeadDto) {
    // Verify contact exists and belongs to tenant
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: createLeadDto.contactId,
        tenantId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.lead.create({
      data: {
        ...createLeadDto,
        tenantId,
      },
      include: {
        contact: true,
      },
    });
  }

  async findAll(
    tenantId: string,
    filters?: {
      status?: LeadStatus;
      contactId?: string;
      source?: string;
    },
  ) {
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.contactId) {
      where.contactId = filters.contactId;
    }

    if (filters?.source) {
      where.source = filters.source;
    }

    return this.prisma.lead.findMany({
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
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        contact: true,
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async update(tenantId: string, id: string, updateLeadDto: UpdateLeadDto) {
    // Verify lead exists and belongs to tenant
    await this.findOne(tenantId, id);

    // If updating contact, verify it exists
    if (updateLeadDto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: updateLeadDto.contactId,
          tenantId,
        },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }
    }

    return this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
      include: {
        contact: true,
      },
    });
  }

  async convert(
    tenantId: string,
    userId: string,
    leadId: string,
    convertDto: ConvertLeadDto,
  ) {
    // Verify lead exists and belongs to tenant
    const lead = await this.findOne(tenantId, leadId);

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead has already been converted');
    }

    // Verify pipeline and stage exist and belong to tenant
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        id: convertDto.pipelineId,
        tenantId,
      },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    const stage = await this.prisma.stage.findFirst({
      where: {
        id: convertDto.stageId,
        pipelineId: convertDto.pipelineId,
      },
    });

    if (!stage) {
      throw new NotFoundException(
        'Stage not found or does not belong to the specified pipeline',
      );
    }

    // Create deal and update lead in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create deal
      const deal = await tx.deal.create({
        data: {
          title: lead.title,
          contactId: lead.contactId!,
          pipelineId: convertDto.pipelineId,
          stageId: convertDto.stageId,
          tenantId,
          leadId: leadId,
          value: lead.value,
          probability: convertDto.probability ?? 50,
          expectedCloseDate: convertDto.expectedCloseDate
            ? new Date(convertDto.expectedCloseDate)
            : undefined,
          notes: lead.notes,
        },
        include: {
          contact: true,
          pipeline: true,
          stage: true,
        },
      });

      // Update lead status to CONVERTED
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          convertedAt: new Date(),
        },
      });

      return deal;
    });

    return result;
  }

  async remove(tenantId: string, id: string) {
    // Verify lead exists and belongs to tenant
    await this.findOne(tenantId, id);

    await this.prisma.lead.delete({
      where: { id },
    });

    return { message: 'Lead deleted successfully' };
  }
}
