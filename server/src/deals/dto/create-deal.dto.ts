import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateDealDto {
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters long' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @IsString({ message: 'Contact ID must be a valid string' })
  contactId: string;

  @IsString({ message: 'Pipeline ID must be a valid string' })
  pipelineId: string;

  @IsString({ message: 'Stage ID must be a valid string' })
  stageId: string;

  @IsOptional()
  @IsNumber({}, { message: 'Value must be a number' })
  @Min(0, { message: 'Value cannot be negative' })
  value?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Probability must be a number' })
  @Min(0, { message: 'Probability cannot be less than 0' })
  @Max(100, { message: 'Probability cannot exceed 100' })
  probability?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Expected close date must be a valid date' })
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  notes?: string;

  @IsOptional()
  @IsString({ message: 'Lead ID must be a valid string' })
  leadId?: string;
}
