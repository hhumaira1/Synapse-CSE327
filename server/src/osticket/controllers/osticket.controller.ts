import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from 'src/supabase-auth/decorators/current-user.decorator';
import { AuthService } from 'src/auth/auth.service';
import { OsTicketApiService } from '../services/osticket-api.service';
import { TicketSyncService } from '../services/ticket-sync.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  SetupOsTicketDto,
  TestOsTicketConnectionDto,
} from '../dto/osticket-config.dto';
import { SyncTicketDto } from '../dto/sync-ticket.dto';

@Controller('osticket')
@UseGuards(SupabaseAuthGuard)
export class OsTicketController {
  constructor(
    private readonly authService: AuthService,
    private readonly osTicketApi: OsTicketApiService,
    private readonly ticketSync: TicketSyncService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Setup osTicket integration for a tenant
   * POST /api/osticket/setup
   */
  @Post('setup')
  async setup(
    @Body() setupDto: SetupOsTicketDto,
    @CurrentUser('id') supabaseUserId: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // Only ADMIN can setup integrations
    if (user.role !== 'ADMIN') {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    // Test connection first
    this.osTicketApi.initialize({
      baseUrl: setupDto.baseUrl,
      apiKey: setupDto.apiKey,
      isActive: true,
    });

    const isConnected = await this.osTicketApi.testConnection();
    if (!isConnected) {
      throw new HttpException(
        'Failed to connect to osTicket. Please check your URL and API key.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Save integration
    const integration = await this.prisma.integration.upsert({
      where: {
        tenantId_serviceName: {
          tenantId: user.tenantId,
          serviceName: 'osticket',
        },
      },
      update: {
        config: {
          baseUrl: setupDto.baseUrl,
          apiKey: setupDto.apiKey,
        },
        isActive: true,
        lastSyncAt: new Date(),
        syncStatus: 'success',
      },
      create: {
        tenantId: user.tenantId,
        serviceName: 'osticket',
        config: {
          baseUrl: setupDto.baseUrl,
          apiKey: setupDto.apiKey,
        },
        isActive: true,
        lastSyncAt: new Date(),
        syncStatus: 'success',
      },
    });

    // Optionally sync existing tickets
    if (setupDto.syncExistingTickets) {
      await this.ticketSync.syncAllTickets(user.tenantId);
    }

    return {
      success: true,
      message: 'osTicket integration configured successfully',
      integration: {
        id: integration.id,
        serviceName: integration.serviceName,
        isActive: integration.isActive,
        baseUrl: setupDto.baseUrl,
      },
    };
  }

  /**
   * Test osTicket connection
   * POST /api/osticket/test
   */
  @Post('test')
  async testConnection(
    @Body() testDto: TestOsTicketConnectionDto,
    @CurrentUser('id') supabaseUserId: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    this.osTicketApi.initialize({
      baseUrl: testDto.baseUrl,
      apiKey: testDto.apiKey,
      isActive: true,
    });

    const isConnected = await this.osTicketApi.testConnection();

    return {
      success: isConnected,
      message: isConnected
        ? 'Successfully connected to osTicket'
        : 'Failed to connect to osTicket',
    };
  }

  /**
   * Get osTicket integration status
   * GET /api/osticket/status
   */
  @Get('status')
  async getStatus(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const integration = await this.prisma.integration.findFirst({
      where: {
        tenantId: user.tenantId,
        serviceName: 'osticket',
      },
    });

    if (!integration) {
      return {
        configured: false,
        isActive: false,
      };
    }

    const config = integration.config as { baseUrl?: string };

    return {
      configured: true,
      isActive: integration.isActive,
      baseUrl: config.baseUrl || null,
      lastSyncAt: integration.lastSyncAt,
      syncStatus: integration.syncStatus,
      errorMessage: integration.errorMessage,
    };
  }

  /**
   * Manually sync a specific ticket to osTicket
   * POST /api/osticket/sync/:ticketId
   */
  @Post('sync/:ticketId')
  async syncTicket(
    @Param('ticketId') ticketId: string,
    @Body() syncDto: SyncTicketDto,
    @CurrentUser('id') supabaseUserId: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const result = await this.ticketSync.syncToOsTicket(
      user.tenantId,
      ticketId,
      syncDto.force,
    );

    if (!result.success) {
      throw new HttpException(
        result.error || 'Failed to sync ticket',
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  /**
   * Sync all tickets to osTicket
   * POST /api/osticket/sync-all
   */
  @Post('sync-all')
  async syncAllTickets(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // Only ADMIN can do bulk sync
    if (user.role !== 'ADMIN') {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    const results = await this.ticketSync.syncAllTickets(user.tenantId);

    return {
      success: true,
      ...results,
    };
  }

  /**
   * Disable osTicket integration
   * POST /api/osticket/disable
   */
  @Post('disable')
  async disable(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // Only ADMIN can disable
    if (user.role !== 'ADMIN') {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    await this.prisma.integration.updateMany({
      where: {
        tenantId: user.tenantId,
        serviceName: 'osticket',
      },
      data: {
        isActive: false,
      },
    });

    return {
      success: true,
      message: 'osTicket integration disabled',
    };
  }
}
