import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { PaginationDto } from '../dto/pagination.dto';
import { AuditService } from './audit.service';
import type { Response } from 'express';

@Controller('super-admin/audit-logs')
@UseGuards(SuperAdminGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('superAdminId') superAdminId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.findAll({
      superAdminId,
      action,
      targetType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip: pagination.skip,
      take: pagination.limit,
    });
  }

  @Get('export')
  async export(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ) {
    const logs = await this.auditService.exportLogs({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    if (format === 'csv') {
      // Convert to CSV
      const csv = this.convertToCSV(logs);
      res?.setHeader('Content-Type', 'text/csv');
      res?.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      return res?.send(csv);
    }

    // Default JSON format
    return logs;
  }

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) return '';

    const headers = ['ID', 'Admin Email', 'Action', 'Target Type', 'Target ID', 'IP Address', 'Timestamp'];
    const rows = logs.map((log) => [
      log.id,
      log.superAdmin?.email || '',
      log.action,
      log.targetType,
      log.targetId || '',
      log.ipAddress || '',
      log.createdAt.toISOString(),
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
  }
}
