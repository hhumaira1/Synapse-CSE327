import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { AddCommentDto } from '../dto/add-comment.dto';
import { TicketStatus, TicketPriority } from 'prisma/generated/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createTicketDto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        tenantId,
        status: TicketStatus.OPEN,
      },
      include: {
        contact: true,
        portalCustomer: true,
        assignedUser: true,
        deal: true,
      },
    });
  }

  async findAll(
    tenantId: string,
    filters?: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assignedUserId?: string;
      contactId?: string;
      portalCustomerId?: string;
    },
  ) {
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.assignedUserId && {
          assignedUserId: filters.assignedUserId,
        }),
        ...(filters?.contactId && { contactId: filters.contactId }),
        ...(filters?.portalCustomerId && {
          portalCustomerId: filters.portalCustomerId,
        }),
      },
      include: {
        contact: true,
        portalCustomer: true,
        assignedUser: true,
        deal: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
      include: {
        contact: true,
        portalCustomer: true,
        assignedUser: true,
        deal: true,
        comments: {
          include: {
            user: true,
            portalCustomer: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(tenantId: string, id: string, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
      include: {
        contact: true,
        portalCustomer: true,
        assignedUser: true,
        deal: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return this.prisma.ticket.delete({
      where: { id },
    });
  }

  async addComment(
    tenantId: string,
    ticketId: string,
    userId: string,
    addCommentDto: AddCommentDto,
    authorName?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    return this.prisma.ticketComment.create({
      data: {
        content: addCommentDto.content,
        ticketId,
        userId,
        authorName,
        isInternal: true,
      },
      include: {
        user: true,
        portalCustomer: true,
      },
    });
  }

  async addPortalComment(
    tenantId: string,
    ticketId: string,
    portalCustomerId: string,
    addCommentDto: AddCommentDto,
    authorName?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    return this.prisma.ticketComment.create({
      data: {
        content: addCommentDto.content,
        ticketId,
        portalCustomerId,
        authorName,
        isInternal: false,
      },
      include: {
        user: true,
        portalCustomer: true,
      },
    });
  }

  async findMyTickets(tenantId: string, portalCustomerId: string) {
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        portalCustomerId,
      },
      include: {
        contact: true,
        assignedUser: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
