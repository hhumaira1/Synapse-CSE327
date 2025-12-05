import { Injectable, Logger } from '@nestjs/common';
import { AccessToken, RoomServiceClient, EgressClient } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient;
  private egressClient: EgressClient;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly wsUrl: string;

  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY;
    this.apiSecret = process.env.LIVEKIT_API_SECRET;
    this.wsUrl = process.env.LIVEKIT_WS_URL || 'ws://localhost:7880';

    if (!this.apiKey || !this.apiSecret) {
      this.logger.warn('LiveKit credentials not configured. VoIP features will not work.');
    }

    // Initialize LiveKit clients
    const host = this.wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    this.roomService = new RoomServiceClient(host, this.apiKey, this.apiSecret);
    this.egressClient = new EgressClient(host, this.apiKey, this.apiSecret);
  }

  /**
   * Create access token for a participant to join a room
   */
  async createToken(roomName: string, participantId: string, participantName: string): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantId,
      name: participantName,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();
    this.logger.debug(`Created token for ${participantName} in room ${roomName}`);
    return jwt;
  }

  /**
   * List all active rooms
   */
  async listRooms(): Promise<any[]> {
    try {
      const rooms = await this.roomService.listRooms();
      return rooms;
    } catch (error) {
      this.logger.error('Failed to list rooms', error);
      throw error;
    }
  }

  /**
   * Get room details
   */
  async getRoom(roomName: string): Promise<any> {
    try {
      const participants = await this.roomService.listParticipants(roomName);
      return { roomName, participants };
    } catch (error) {
      this.logger.error(`Failed to get room ${roomName}`, error);
      return null;
    }
  }

  /**
   * Delete/close a room
   */
  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
      this.logger.log(`Deleted room: ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to delete room ${roomName}`, error);
    }
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(roomName: string, participantId: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomName, participantId);
      this.logger.log(`Removed participant ${participantId} from room ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to remove participant ${participantId}`, error);
    }
  }
}
