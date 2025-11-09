import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { LeadStatus } from 'prisma/generated/client';

export class CreateLeadDto {
  @IsString({ message: 'Contact ID must be a valid string' })
  contactId: string;

  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters long' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @IsString()
  @MinLength(2, { message: 'Source must be at least 2 characters long' })
  @MaxLength(50, { message: 'Source cannot exceed 50 characters' })
  source: string;

  @IsOptional()
  @IsNumber({}, { message: 'Value must be a number' })
  @Min(0, { message: 'Value cannot be negative' })
  value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  notes?: string;

  @IsOptional()
  @IsEnum(LeadStatus, { message: 'Invalid lead status' })
  status?: LeadStatus;
}
