import { IsEmail, IsString, IsOptional } from 'class-validator';

export class InviteCustomerDto {
  @IsEmail()
  email: string;

  @IsString()
  contactId: string;

  @IsOptional()
  @IsString()
  message?: string;
}
