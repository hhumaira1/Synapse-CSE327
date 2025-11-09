import { IsString } from 'class-validator';

export class MoveStageDto {
  @IsString({ message: 'Stage ID must be a valid string' })
  stageId: string;
}
