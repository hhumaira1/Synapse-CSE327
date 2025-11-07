import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TicketPriority, TicketSource } from 'prisma/generated/client';

export class CreateTicketDto {
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description?: string;

  @IsEnum(TicketPriority)
  priority: TicketPriority;

  @IsEnum(TicketSource)
  source: TicketSource;

  @IsString({ message: 'Contact ID must be a valid string' })
  contactId: string;

  @IsOptional()
  @IsString({ message: 'Portal Customer ID must be a valid string' })
  portalCustomerId?: string;

  @IsOptional()
  @IsString({ message: 'Deal ID must be a valid string' })
  dealId?: string;

  @IsOptional()
  @IsString({ message: 'Assigned User ID must be a valid string' })
  assignedUserId?: string;
}

