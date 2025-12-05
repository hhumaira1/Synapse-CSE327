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
import { SupabaseAuthGuard } from '../../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../../supabase-auth/decorators/current-user.decorator';
import { AuthService } from '../../auth/auth.service';
import { TicketStatus, TicketPriority } from 'prisma/generated/client';

@Controller('tickets')
@UseGuards(SupabaseAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser('id') supabaseUserId: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.create(user.tenantId, createTicketDto);
  }

  @Get()
  async findAll(
    @CurrentUser('id') supabaseUserId: string,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('contactId') contactId?: string,
    @Query('portalCustomerId') portalCustomerId?: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
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
  async findOne(@Param('id') id: string, @CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser('id') supabaseUserId: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.update(user.tenantId, id, updateTicketDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new Error('User not found');
    return this.ticketsService.remove(user.tenantId, id);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') ticketId: string,
    @Body() addCommentDto: AddCommentDto,
    @CurrentUser('id') supabaseUserId: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new Error('User not found');

    // Get user name from database
    const authorName = `${user.firstName} ${user.lastName}`.trim() || 'Support Member';

    return this.ticketsService.addComment(
      user.tenantId,
      ticketId,
      user.id,
      addCommentDto,
      authorName,
    );
  }
}

