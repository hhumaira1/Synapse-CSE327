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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from '../dto/create-contact.dto';
import { ClerkAuthGuard } from 'src/clerk/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user/current-user.decorator';
import { AuthService } from 'src/auth/services/auth/auth.service';

@Controller('contacts')
@UseGuards(ClerkAuthGuard)
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @CurrentUser('sub') clerkId: string,
    @Body() createContactDto: CreateContactDto,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.create(currentUser.tenantId, createContactDto);
  }

  @Get()
  async findAll(@CurrentUser('sub') clerkId: string) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.findAll(currentUser.tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.findOne(currentUser.tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
    @Body() updateContactDto: any,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.update(currentUser.tenantId, id, updateContactDto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('sub') clerkId: string,
    @Param('id') id: string,
  ) {
    const currentUser = await this.authService.getUserDetails(clerkId);

    if (!currentUser) {
      throw new ForbiddenException('User not found');
    }

    return this.contactsService.remove(currentUser.tenantId, id);
  }
}
