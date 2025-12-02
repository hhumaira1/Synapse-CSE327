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
  ForbiddenException,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from '../dto/create-contact.dto';
import { SupabaseAuthGuard } from 'src/supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from 'src/supabase-auth/decorators/current-user.decorator';
import { AuthService } from 'src/auth/auth.service';
import { EntityResolverService } from 'src/chatbot/entity-resolver.service';
import { UserRole } from 'prisma/generated/client';

@Controller('contacts')
@UseGuards(SupabaseAuthGuard)
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly authService: AuthService,
    private readonly entityResolver: EntityResolverService,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') supabaseUserId: string,
    @Body() createContactDto: CreateContactDto,
  ) {
    const currentUser =
      await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.create(currentUser.tenantId, createContactDto);
  }

  @Get('search')
  async search(
    @CurrentUser('id') supabaseUserId: string,
    @Query('q') query: string,
  ) {
    const currentUser =
      await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    if (!query || query.trim() === '') {
      return [];
    }

    // Use EntityResolverService for fuzzy search
    const matches = await this.entityResolver.searchContacts(
      query,
      currentUser.tenantId,
    );

    return matches;
  }

  @Get()
  async findAll(@CurrentUser('id') supabaseUserId: string) {
    const currentUser =
      await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.findAll(currentUser.tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') id: string,
  ) {
    const currentUser =
      await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.findOne(currentUser.tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') id: string,
    @Body() updateContactDto: any,
  ) {
    const currentUser =
      await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.update(
      currentUser.tenantId,
      id,
      updateContactDto,
    );
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') supabaseUserId: string,
    @Param('id') id: string,
  ) {
    const currentUser =
      await this.authService.getUserBySupabaseId(supabaseUserId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    // Only ADMIN and MANAGER can delete contacts
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Only admins and managers can delete contacts',
      );
    }

    return this.contactsService.remove(currentUser.tenantId, id);
  }
}
