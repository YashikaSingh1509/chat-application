import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { RoomsService } from '../rooms/rooms.service';
import { RoomStatus } from '../rooms/schemas/room.schema';
import { GenerateLivekitTokenDto, LivekitUserRole } from './dto/generate-token.dto';

export interface AuthenticatedJwtUser {
  id: string;
  email: string;
  name?: string;
}

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly roomsService: RoomsService,
  ) {}

  /**
   * Generates a signed LiveKit WebRTC access token.
   * Enforces room validity, host ownership, and participant permissions.
   */
  async generateToken(
    user: AuthenticatedJwtUser,
    dto: GenerateLivekitTokenDto,
  ) {
    const { roomName, role } = dto;
    const userId = user.id;

    // 1. Validate room existence
    const room = await this.roomsService.findByNameOrId(roomName);
    if (!room) {
      throw new NotFoundException(`Room with name or ID "${roomName}" not found`);
    }

    // 2. Validate room is active
    if (room.status !== RoomStatus.ACTIVE) {
      throw new BadRequestException('Cannot generate token: Room is no longer active');
    }

    // 3. Validate user's relationship to the room
    const isRoomHost = room.hostId.toString() === userId.toString();

    if (role === LivekitUserRole.HOST && !isRoomHost) {
      this.logger.warn(
        `User ${userId} attempted to request HOST permissions for room ${room.roomName} owned by ${room.hostId}`,
      );
      throw new ForbiddenException(
        'You are not authorized as host for this room. Only the room creator can generate host tokens.',
      );
    }

    // 4. Retrieve LiveKit credentials from configuration
    const apiKey =
      this.configService.get<string>('LIVEKIT.API_KEY') ||
      this.configService.get<string>('LIVEKIT_API_KEY') ||
      'devkey';

    const apiSecret =
      this.configService.get<string>('LIVEKIT.API_SECRET') ||
      this.configService.get<string>('LIVEKIT_API_SECRET') ||
      'secret';

    const serverUrl =
      this.configService.get<string>('LIVEKIT.URL') ||
      this.configService.get<string>('LIVEKIT_URL') ||
      'wss://demo.livekit.cloud';

    // 5. Create LiveKit AccessToken
    // Explicitly set participant identity to the authenticated user ID (never trusted from payload)
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: user.name || user.email || `User_${userId.slice(-4)}`,
      ttl: '2h', // 2 hours validity
    });

    // 6. Configure permissions/grants based on validated role
    const isHost = role === LivekitUserRole.HOST;

    at.addGrant({
      room: room.roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      roomAdmin: isHost, // Only hosts can mute others or kick participants
    });

    // 7. Sign and generate token
    const token = await at.toJwt();

    this.logger.log(
      `Generated LiveKit token for user ${userId} in room "${room.roomName}" with role "${role}"`,
    );

    // 8. Return formatted payload (never exposing apiSecret)
    return {
      success: true,
      data: {
        token,
        serverUrl,
        roomName: room.roomName,
      },
    };
  }
}

