import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreatePipelineDto {
  @IsString()
  @MinLength(2, { message: 'Pipeline name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Pipeline name cannot exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}
