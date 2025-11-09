import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import AccessToken from 'twilio/lib/jwt/AccessToken';
const VoiceGrant = AccessToken.VoiceGrant;

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly twilioClient: twilio.Twilio;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly apiKeySid: string;
  private readonly apiKeySecret: string;
  private readonly twilioPhoneNumber: string;
  private readonly twimlAppSid: string;

  constructor(private configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.apiKeySid = this.configService.get<string>('TWILIO_API_KEY_SID') || '';
    this.apiKeySecret =
      this.configService.get<string>('TWILIO_API_KEY_SECRET') || '';
    this.twilioPhoneNumber =
      this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';
    this.twimlAppSid =
      this.configService.get<string>('TWILIO_TWIML_APP_SID') || '';

    // Initialize Twilio client
    this.twilioClient = twilio(this.accountSid, this.authToken);

    this.logger.log('Twilio service initialized');
  }

  /**
   * Generate Twilio Access Token for frontend client
   * Token valid for 1 hour
   */
  generateAccessToken(identity: string): {
    token: string;
    identity: string;
    expiresIn: number;
  } {
    try {
      // Create access token
      const accessToken = new AccessToken(
        this.accountSid,
        this.apiKeySid,
        this.apiKeySecret,
        {
          identity,
          ttl: 3600, // 1 hour in seconds
        },
      );

      // Create Voice grant
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: this.twimlAppSid,
        incomingAllow: false, // Phase 1: Outbound only
      });

      // Add grant to token
      accessToken.addGrant(voiceGrant);

      const token = accessToken.toJwt();

      this.logger.log(`Generated access token for identity: ${identity}`);

      return {
        token,
        identity,
        expiresIn: 3600, // seconds
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate access token: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Initiate outbound call using Twilio REST API
   */
  async makeOutboundCall(params: {
    to: string;
    from: string;
    statusCallback: string;
    statusCallbackEvent: string[];
    record?: boolean;
    recordingStatusCallback?: string;
  }): Promise<any> {
    try {
      this.logger.log(`Initiating call from ${params.from} to ${params.to}`);

      const call = await this.twilioClient.calls.create({
        to: params.to,
        from: params.from,
        url: `${this.configService.get<string>('BACKEND_URL')}/api/twilio/voice-webhook`,
        statusCallback: params.statusCallback,
        statusCallbackEvent: params.statusCallbackEvent,
        record: params.record || false,
        recordingStatusCallback: params.recordingStatusCallback,
      });

      this.logger.log(`Call initiated with SID: ${call.sid as string}`);

      return call;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to make outbound call: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get call details from Twilio
   */
  async getCallDetails(callSid: string): Promise<any> {
    try {
      return await this.twilioClient.calls(callSid).fetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to fetch call details for ${callSid}: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Get Twilio phone number for outbound calls
   */
  getTwilioPhoneNumber(): string {
    return this.twilioPhoneNumber;
  }

  /**
   * Validate Twilio webhook signature (for production)
   */
  validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, string>,
  ): boolean {
    try {
      return twilio.validateRequest(this.authToken, signature, url, params);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to validate webhook signature: ${errorMessage}`,
      );
      return false;
    }
  }
}
