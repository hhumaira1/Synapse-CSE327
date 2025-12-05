import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateStageDto {
  @IsString()
  @MinLength(2, { message: 'Stage name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Stage name cannot exceed 50 characters' })
  name: string;

  @IsString({ message: 'Pipeline ID must be a valid string' })
  pipelineId: string;

  @IsOptional()
  @IsInt({ message: 'Order must be an integer' })
  @Min(1, { message: 'Order must be at least 1' })
  order?: number;
}
