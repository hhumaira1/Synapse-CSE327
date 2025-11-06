import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StageOrder {
  id: string;
  order: number;
}

export class ReorderStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageOrder)
  stages: StageOrder[];
}
