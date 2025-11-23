import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient, Room } from 'livekit-server-sdk';

/**
 * LiveKitService
 * 
 * Handles LiveKit room management and token generation.
 * Used for audio/video streaming after signaling completes.
 */
@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient;
  private apiUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(private config: ConfigService) {
    this.apiUrl = this.config.get<string>('LIVEKIT_API_URL');
    this.apiKey = this.config.get<string>('LIVEKIT_API_KEY');
    this.apiSecret = this.config.get<string>('LIVEKIT_API_SECRET');

    if (!this.apiUrl || !this.apiKey || !this.apiSecret) {
      throw new Error(
        'LiveKit credentials not configured. Please set LIVEKIT_API_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in .env',
      );
    }

    this.roomService = new RoomServiceClient(
      this.apiUrl,
      this.apiKey,
      this.apiSecret,
    );

    this.logger.log('✅ LiveKit service initialized');
  }

  /**
   * Generate LiveKit access token for a user to join a room
   * 
   * @param userId - User's unique identifier (Supabase user ID)
   * @param roomName - Room name to join
   * @param tenantId - Tenant ID for multi-tenant isolation
   * @param metadata - Optional metadata (name, avatar, etc.)
   * @returns JWT token for LiveKit client
   */
  async generateToken(
    userId: string,
    roomName: string,
    tenantId: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    try {
      // Create identity in format: tenantId:userId for multi-tenant isolation
      const identity = `${tenantId}:${userId}`;

      const token = new AccessToken(this.apiKey, this.apiSecret, {
        identity,
        name: metadata?.name || userId,
        metadata: JSON.stringify({
          ...metadata,
          tenantId,
          userId,
        }),
      });

      // Grant permissions
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const jwt = await token.toJwt();
      this.logger.log(`🎫 Generated token for user ${userId} in room ${roomName}`);
      
      return jwt;
    } catch (error) {
      this.logger.error(`Failed to generate token: ${error.message}`);
      throw new BadRequestException('Failed to generate LiveKit token');
    }
  }

  /**
   * Create a new LiveKit room
   * 
   * @param roomName - Unique room identifier
   * @param tenantId - Tenant ID (for prefixing)
   * @returns Room object
   */
  async createRoom(roomName: string, tenantId: string): Promise<Room> {
    try {
      // Prefix room with tenant for isolation
      const fullRoomName = `${tenantId}-${roomName}`;

      const room = await this.roomService.createRoom({
        name: fullRoomName,
        emptyTimeout: 300, // Auto-delete after 5 min if empty
        maxParticipants: 10,
        metadata: JSON.stringify({ tenantId }),
      });

      this.logger.log(`🏠 Created room: ${fullRoomName}`);
      return room;
    } catch (error) {
      // Room might already exist, which is fine
      if (error.message?.includes('already exists')) {
        this.logger.log(`Room ${roomName} already exists, reusing it`);
        return null;
      }
      
      this.logger.error(`Failed to create room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a LiveKit room
   * 
   * @param roomName - Room to delete
   */
  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
      this.logger.log(`🗑️ Deleted room: ${roomName}`);
    } catch (error) {
      this.logger.warn(`Failed to delete room ${roomName}: ${error.message}`);
    }
  }

  /**
   * List all active rooms for a tenant
   * 
   * @param tenantId - Tenant ID
   * @returns Array of active rooms
   */
  async listActiveRooms(tenantId: string): Promise<Room[]> {
    try {
      const allRooms = await this.roomService.listRooms();
      return allRooms.filter(room => room.name.startsWith(`${tenantId}-`));
    } catch (error) {
      this.logger.error(`Failed to list rooms: ${error.message}`);
      return [];
    }
  }

  /**
   * Get room participants
   * 
   * @param roomName - Room name
   * @returns List of participants
   */
  async getRoomParticipants(roomName: string) {
    try {
      const participants = await this.roomService.listParticipants(roomName);
      return participants.map(p => ({
        identity: p.identity,
        name: p.name,
        joinedAt: p.joinedAt,
        isSpeaking: p.isSpeaking,
      }));
    } catch (error) {
      this.logger.error(`Failed to get participants: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate a deterministic room name for a call between two users
   * 
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @param tenantId - Tenant ID
   * @returns Deterministic room name
   */
  static generateRoomName(userId1: string, userId2: string, tenantId: string): string {
    // Sort user IDs to ensure same room name regardless of who calls
    const [user1, user2] = [userId1, userId2].sort();
    const timestamp = Date.now();
    return `${tenantId}-call-${user1}-${user2}-${timestamp}`;
  }
}
