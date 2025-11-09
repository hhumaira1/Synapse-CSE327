import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { AddCommentDto } from '../dto/add-comment.dto';
import { ClerkAuthGuard } from '../../clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';
import { AuthService } from '../../auth/services/auth/auth.service';
import { ClerkService } from '../../clerk/clerk/clerk.service';
import { TicketStatus, TicketPriority } from 'prisma/generated/client';

@Controller('tickets')
@UseGuards(ClerkAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly authService: AuthService,
    private readonly clerkService: ClerkService,
  ) {}

  @Post()
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser('sub') clerkId: string,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.create(user.tenantId, createTicketDto);
  }

  @Get()
  async findAll(
    @CurrentUser('sub') clerkId: string,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('contactId') contactId?: string,
    @Query('portalCustomerId') portalCustomerId?: string,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.findAll(user.tenantId, {
      status,
      priority,
      assignedUserId,
      contactId,
      portalCustomerId,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('sub') clerkId: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser('sub') clerkId: string,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.update(user.tenantId, id, updateTicketDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('sub') clerkId: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.remove(user.tenantId, id);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') ticketId: string,
    @Body() addCommentDto: AddCommentDto,
    @CurrentUser('sub') clerkId: string,
  ) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new Error('User not found');

    // Get user name from Clerk
    let authorName = 'Support Member';
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const clerkUser: any =
        await this.clerkService.client.users.getUser(clerkId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const firstName = (clerkUser?.firstName as string) || '';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const lastName = (clerkUser?.lastName as string) || '';
      authorName = `${firstName} ${lastName}`.trim() || 'Support Member';
    } catch {
      // If Clerk fetch fails, use fallback name
      authorName = 'Support Member';
    }

    return this.ticketsService.addComment(
      user.tenantId,
      ticketId,
      user.id,
      addCommentDto,
      authorName,
    );
  }
}
