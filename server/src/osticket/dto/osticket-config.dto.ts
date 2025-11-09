import { IsString, IsUrl, IsBoolean, IsOptional } from 'class-validator';

export class SetupOsTicketDto {
  @IsUrl({ require_protocol: true })
  baseUrl: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsBoolean()
  syncExistingTickets?: boolean;
}

export class TestOsTicketConnectionDto {
  @IsUrl({ require_protocol: true })
  baseUrl: string;

  @IsString()
  apiKey: string;
}
