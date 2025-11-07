import { IsString, MinLength } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @MinLength(1, { message: 'Comment cannot be empty' })
  content: string;
}
