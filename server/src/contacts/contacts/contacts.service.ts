import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new contact
   */
  async create(tenantId: string, createContactDto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        tenantId,
        firstName: createContactDto.firstName,
        lastName: createContactDto.lastName || '', // Required field, use empty string if not provided
        email: createContactDto.email?.toLowerCase(),
        phone: createContactDto.phone,
        company: createContactDto.company,
        jobTitle: createContactDto.jobTitle,
        notes: createContactDto.notes,
      },
    });
  }

  /**
   * Get all contacts for a tenant
   */
  async findAll(tenantId: string) {
    return this.prisma.contact.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        firstName: 'asc',
      },
      include: {
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: {
              select: {
                name: true,
              },
            },
          },
        },
        interactions: {
          select: {
            id: true,
            type: true,
            subject: true,
            dateTime: true,
          },
          orderBy: {
            dateTime: 'desc',
          },
          take: 5,
        },
        tickets: {
          select: {
            id: true,
            title: true,
            status: true,
          },
          where: {
            status: {
              not: 'CLOSED',
            },
          },
        },
        portalCustomers: {
          select: {
            id: true,
            isActive: true,
            accessToken: true,
            supabaseUserId: true,
          },
        },
      },
    });
  }

  /**
   * Get a single contact by ID
   */
  async findOne(tenantId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
        },
        interactions: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            dateTime: 'desc',
          },
        },
        tickets: {
          include: {
            assignedUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        portalCustomers: {
          select: {
            id: true,
            isActive: true,
            accessToken: true,
            supabaseUserId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  /**
   * Update a contact
   */
  async update(tenantId: string, id: string, updateContactDto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...updateContactDto,
        email: updateContactDto.email?.toLowerCase(),
      },
    });
  }

  /**
   * Delete a contact (soft delete by marking inactive)
   */
  async remove(tenantId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Instead of hard delete, we could add an isActive field to contacts
    // For now, we'll do a hard delete but check for dependencies
    const hasDeals = await this.prisma.deal.count({
      where: { contactId: id },
    });

    if (hasDeals > 0) {
      throw new Error(
        'Cannot delete contact with associated deals. Please remove or reassign deals first.',
      );
    }

    return this.prisma.contact.delete({
      where: { id },
    });
  }
}
