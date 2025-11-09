import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { CallDirection } from 'prisma/generated/client';

export interface MakeCallParams {
  tenantId: string;
  userId: string;
  to: string;
  contactId?: string;
}

export interface CallStatusUpdate {
  callSid: string;
  callStatus: string;
  callDuration?: string;
  recordingUrl?: string;
  recordingSid?: string;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    private prisma: PrismaService,
    private twilioService: TwilioService,
  ) {}

  /**
   * Initiate outbound call and create CallLog entry
   */
  async makeCall(params: MakeCallParams) {
    const { tenantId, userId, to, contactId } = params;

    try {
      // Get Twilio phone number
      const fromNumber = this.twilioService.getTwilioPhoneNumber();

      // Check if we're in test mode
      const isTestMode = process.env.VOICE_CALL_MODE === 'test';

      // Create CallLog entry in database
      const callLog = await this.prisma.callLog.create({
        data: {
          tenantId,
          userId,
          contactId,
          direction: CallDirection.OUTBOUND,
          fromNumber,
          toNumber: to,
          status: 'INITIATED',
        },
      });

      this.logger.log(`Created CallLog with ID: ${callLog.id}`);

      if (isTestMode) {
        // **TEST MODE**: Simulate call without actually making it
        const mockCallSid = `TEST_CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.logger.warn(`🧪 TEST MODE: Simulating call to ${to} (not making real call)`);

        // Update CallLog with mock SID
        await this.prisma.callLog.update({
          where: { id: callLog.id },
          data: {
            twilioCallSid: mockCallSid,
            status: 'RINGING',
          },
        });

        // Simulate call progression (for testing UI)
        this.simulateCallProgression(callLog.id, mockCallSid);

        return {
          callSid: mockCallSid,
          callLogId: callLog.id,
          status: 'RINGING',
          testMode: true,
        };
      } else {
        // **PRODUCTION MODE**: Make real Twilio call
        const twilioCall: any = await this.twilioService.makeOutboundCall({
          to,
          from: fromNumber,
          statusCallback: `${process.env.BACKEND_URL}/api/twilio/call-status`,
          statusCallbackEvent: [
            'initiated',
            'ringing',
            'answered',
            'completed',
          ],
          record: true, // Enable recording
          recordingStatusCallback: `${process.env.BACKEND_URL}/api/twilio/recording-status`,
        });

        const callSid = (twilioCall.sid as string) || '';

        // Update CallLog with Twilio SID
        await this.prisma.callLog.update({
          where: { id: callLog.id },
          data: {
            twilioCallSid: callSid,
            status: 'RINGING',
          },
        });

        this.logger.log(`Call initiated with Twilio SID: ${callSid}`);

        return {
          callSid,
          callLogId: callLog.id,
          status: 'RINGING',
          testMode: false,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to make call: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simulate call progression for test mode
   */
  private async simulateCallProgression(callLogId: string, callSid: string) {
    // Simulate RINGING -> ANSWERED -> COMPLETED
    setTimeout(async () => {
      try {
        await this.prisma.callLog.update({
          where: { id: callLogId },
          data: {
            status: 'ANSWERED',
            startedAt: new Date(),
          },
        });
        this.logger.log(`🧪 TEST: Call ${callSid} answered (simulated)`);
      } catch (error) {
        this.logger.error(`Failed to update simulated call: ${error.message}`);
      }
    }, 3000); // Answer after 3 seconds

    setTimeout(async () => {
      try {
        const startedAt = new Date(Date.now() - 15000); // 15 seconds ago
        await this.prisma.callLog.update({
          where: { id: callLogId },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
            duration: 15, // 15 second call
          },
        });
        this.logger.log(`🧪 TEST: Call ${callSid} completed (simulated, duration: 15s)`);
      } catch (error) {
        this.logger.error(`Failed to complete simulated call: ${error.message}`);
      }
    }, 18000); // Complete after 18 seconds
  }

  /**
   * Update call status from Twilio webhook
   */
  async updateCallStatus(update: CallStatusUpdate) {
    const { callSid, callStatus, callDuration, recordingUrl, recordingSid } =
      update;

    try {
      // Find CallLog by Twilio SID
      const callLog = await this.prisma.callLog.findUnique({
        where: { twilioCallSid: callSid },
      });

      if (!callLog) {
        this.logger.warn(`CallLog not found for Twilio SID: ${callSid}`);
        return;
      }

      // Map Twilio status to our status enum
      const statusMap: Record<string, string> = {
        initiated: 'INITIATED',
        ringing: 'RINGING',
        'in-progress': 'ANSWERED',
        answered: 'ANSWERED',
        completed: 'COMPLETED',
        busy: 'FAILED',
        failed: 'FAILED',
        'no-answer': 'FAILED',
        canceled: 'FAILED',
      };

      const mappedStatus = statusMap[callStatus.toLowerCase()] || 'FAILED';

      // Update CallLog
      const updateData: any = {
        status: mappedStatus,
      };

      // Set timestamps
      if (mappedStatus === 'ANSWERED' && !callLog.startedAt) {
        updateData.startedAt = new Date();
      }

      if (mappedStatus === 'COMPLETED' || mappedStatus === 'FAILED') {
        updateData.endedAt = new Date();
      }

      // Add duration if available
      if (callDuration) {
        updateData.duration = parseInt(callDuration, 10);
      }

      // Add recording info if available
      if (recordingUrl) {
        updateData.recordingUrl = recordingUrl;
      }
      if (recordingSid) {
        updateData.recordingSid = recordingSid;
      }

      await this.prisma.callLog.update({
        where: { id: callLog.id },
        data: updateData,
      });

      this.logger.log(
        `Updated CallLog ${callLog.id} with status: ${mappedStatus}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update call status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get call logs with filters
   */
  async getCallLogs(
    tenantId: string,
    filters?: {
      userId?: string;
      contactId?: string;
      direction?: CallDirection;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = { tenantId };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.contactId) {
      where.contactId = filters.contactId;
    }

    if (filters?.direction) {
      where.direction = filters.direction;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.callLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single call log by ID
   */
  async getCallLog(tenantId: string, callLogId: string) {
    const callLog = await this.prisma.callLog.findFirst({
      where: {
        id: callLogId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!callLog) {
      throw new NotFoundException(`CallLog with ID ${callLogId} not found`);
    }

    return callLog;
  }
}
