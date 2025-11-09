import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class ConvertLeadDto {
  @IsString({ message: 'Pipeline ID must be a valid string' })
  pipelineId: string;

  @IsString({ message: 'Stage ID must be a valid string' })
  stageId: string;

  @IsOptional()
  @IsNumber({}, { message: 'Probability must be a number' })
  @Min(0, { message: 'Probability cannot be less than 0' })
  @Max(100, { message: 'Probability cannot exceed 100' })
  probability?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Expected close date must be a valid date' })
  expectedCloseDate?: string;
}
