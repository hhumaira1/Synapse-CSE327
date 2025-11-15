import {
  Controller,
  Get,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { SupabaseAuthGuard } from '../../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../../supabase-auth/decorators/current-user.decorator';
import { AuthService } from '../../auth/auth.service';

@Controller('analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Get comprehensive analytics dashboard
   * GET /analytics/dashboard
   */
  @Get('dashboard')
  async getDashboard(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.analyticsService.getDashboard(user.tenantId);
  }

  /**
   * Get revenue metrics
   * GET /analytics/revenue
   */
  @Get('revenue')
  async getRevenueMetrics(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.analyticsService.getRevenueMetrics(user.tenantId);
  }

  /**
   * Get win/loss metrics
   * GET /analytics/win-loss
   */
  @Get('win-loss')
  async getWinLossMetrics(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.analyticsService.getWinLossMetrics(user.tenantId);
  }

  /**
   * Get conversion metrics
   * GET /analytics/conversion
   */
  @Get('conversion')
  async getConversionMetrics(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.analyticsService.getConversionMetrics(user.tenantId);
  }

  /**
   * Get sales velocity
   * GET /analytics/velocity
   */
  @Get('velocity')
  async getSalesVelocity(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.analyticsService.getSalesVelocity(user.tenantId);
  }

  /**
   * Get pipeline health
   * GET /analytics/pipeline-health
   */
  @Get('pipeline-health')
  async getPipelineHealth(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.analyticsService.getPipelineHealth(user.tenantId);
  }

  /**
   * Get top performers
   * GET /analytics/top-performers
   */
  @Get('top-performers')
  async getTopPerformers(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.analyticsService.getTopPerformers(user.tenantId);
  }

  /**
   * Get revenue forecast
   * GET /analytics/forecast?period=month|quarter
   */
  @Get('forecast')
  async getRevenueForecast(
    @CurrentUser('id') supabaseUserId: string,
    @Query('period') period?: string,
  ) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const validPeriod = period === 'quarter' ? 'quarter' : 'month';
    return this.analyticsService.getRevenueForecast(user.tenantId, validPeriod);
  }

  /**
   * Get time series data
   * GET /analytics/time-series
   */
  @Get('time-series')
  async getTimeSeriesData(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserBySupabaseId(supabaseUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.analyticsService.getTimeSeriesData(user.tenantId);
  }
}

