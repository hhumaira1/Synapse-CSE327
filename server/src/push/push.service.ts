import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@synapsecrm.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured. Web push notifications will not work.');
      this.logger.warn('Generate keys with: npx web-push generate-vapid-keys');
      return;
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    this.logger.log('Web Push configured successfully');
  }

  /**
   * Send web push notification
   */
  async sendNotification(
    subscription: any, // PushSubscription object
    payload: {
      type: 'incoming_call' | 'missed_call' | 'call_ended';
      callerName: string;
      callerId?: string;
      roomName?: string;
      callLogId?: string;
      callTime?: string;
    },
  ): Promise<void> {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      this.logger.log(`Web push sent: ${payload.type} from ${payload.callerName}`);
    } catch (error) {
      // Handle subscription expiration
      if (error.statusCode === 410) {
        this.logger.warn('Push subscription expired, should be removed from database');
        throw new Error('SUBSCRIPTION_EXPIRED');
      }
      
      this.logger.error('Failed to send web push notification', error);
      throw error;
    }
  }

  /**
   * Send incoming call notification
   */
  async sendIncomingCallNotification(
    subscription: any,
    dto: {
      callerId: string;
      callerName: string;
      roomName: string;
      callLogId: string;
    },
  ): Promise<void> {
    await this.sendNotification(subscription, {
      type: 'incoming_call',
      ...dto,
    });
  }

  /**
   * Send missed call notification
   */
  async sendMissedCallNotification(
    subscription: any,
    dto: {
      callerName: string;
      callTime: string;
    },
  ): Promise<void> {
    await this.sendNotification(subscription, {
      type: 'missed_call',
      ...dto,
    });
  }

  /**
   * Send call ended notification
   */
  async sendCallEndedNotification(subscription: any, callerName: string): Promise<void> {
    await this.sendNotification(subscription, {
      type: 'call_ended',
      callerName,
    });
  }
}
