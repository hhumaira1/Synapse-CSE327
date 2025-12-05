import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App;

  constructor() {
    try {
      // Initialize Firebase Admin SDK
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn('Firebase credentials not configured. FCM notifications will not work.');
        return;
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  /**
   * Send incoming call notification to Android device
   */
  async sendIncomingCallNotification(dto: {
    fcmToken: string;
    callerId: string;
    callerName: string;
    roomName: string;
    callLogId: string;
  }): Promise<string | null> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized, skipping FCM notification');
      return null;
    }

    const { fcmToken, callerId, callerName, roomName, callLogId } = dto;

    const message: admin.messaging.Message = {
      token: fcmToken,
      data: {
        type: 'incoming_call',
        callerId,
        callerName,
        roomName,
        callLogId,
        timestamp: Date.now().toString(),
      },
      android: {
        priority: 'high', // CRITICAL for VoIP - wakes device
        ttl: 30000, // 30 seconds
      },
    };

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(`FCM notification sent to ${callerName}: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send FCM notification to ${fcmToken}`, error);
      
      // If token is invalid, return null so caller can handle cleanup
      if (error.code === 'messaging/registration-token-not-registered') {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Send missed call notification
   */
  async sendMissedCallNotification(dto: {
    fcmToken: string;
    callerName: string;
    callTime: string;
  }): Promise<string | null> {
    if (!this.app) {
      return null;
    }

    const { fcmToken, callerName, callTime } = dto;

    const message: admin.messaging.Message = {
      token: fcmToken,
      data: {
        type: 'missed_call',
        callerName,
        callTime,
      },
      android: {
        priority: 'normal',
      },
      notification: {
        title: 'Missed Call',
        body: `${callerName} called at ${callTime}`,
      },
    };

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(`Missed call notification sent: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send missed call notification`, error);
      return null;
    }
  }

  /**
   * Send call ended notification
   */
  async sendCallEndedNotification(fcmToken: string, callerName: string): Promise<void> {
    if (!this.app) {
      return;
    }

    const message: admin.messaging.Message = {
      token: fcmToken,
      data: {
        type: 'call_ended',
        callerName,
      },
    };

    try {
      await admin.messaging().send(message);
      this.logger.log('Call ended notification sent');
    } catch (error) {
      this.logger.error('Failed to send call ended notification', error);
    }
  }
}
