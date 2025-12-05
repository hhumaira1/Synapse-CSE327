import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminAnalyticsService } from './analytics.service';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@Controller('super-admin/analytics')
@UseGuards(SuperAdminGuard)
export class SuperAdminAnalyticsController {
  constructor(private analyticsService: SuperAdminAnalyticsService) {}

  @Get('overview')
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('tenant-growth')
  async getTenantGrowth(@Query('months') months?: string) {
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.analyticsService.getTenantGrowth(monthsNum);
  }

  @Get('usage')
  async getUsageStats() {
    return this.analyticsService.getUsageStats();
  }

  @Get('active-users')
  async getActiveUsers(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getActiveUsers(daysNum);
  }
}
