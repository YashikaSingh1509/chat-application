import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { RedisService } from '../../providers/redis/redis.service';
import {
  JoinRoomSocketDto,
  LeaveRoomSocketDto,
  RoomMessageSocketDto,
} from './dto/socket-events.dto';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  /**
   * Authenticates incoming Socket.IO connections using JWT.
   * Extracts token from auth object, authorization header, or query parameters.
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractJwtToken(client);

      if (!token) {
        this.logger.warn(`Unauthorized socket connection attempt: ${client.id} - No token provided`);
        client.emit('error', { message: 'Authentication required. Token missing.' });
        client.disconnect(true);
        return;
      }

      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        this.configService.get<string>('JWT_PRIVATE_KEY') ||
        'super_secret_jwt_key_change_in_production';

      const payload = this.jwtService.verify(token, { secret });

      if (!payload || !payload.sub) {
        this.logger.warn(`Invalid JWT payload on socket connection: ${client.id}`);
        client.emit('error', { message: 'Invalid authentication token.' });
        client.disconnect(true);
        return;
      }

      // Fetch user from DB to verify active account
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        this.logger.warn(`User ${payload.sub} not found for socket connection: ${client.id}`);
        client.emit('error', { message: 'User not found.' });
        client.disconnect(true);
        return;
      }

      // Securely store authenticated user identity on the socket instance
      const authenticatedUser: AuthenticatedUser = {
        id: payload.sub,
        email: user.email,
        name: user.name,
      };
      client.data.user = authenticatedUser;

      // Mark user online in MongoDB
      await this.usersService.updateOnlineStatus(payload.sub, true);

      // Register real-time online presence in Redis with TTL (default 300s = 5m)
      if (this.redisService) {
        await this.redisService.setUserOnline(payload.sub, 300);
      }

      this.logger.log(`Client authenticated: ${client.id} (User: ${user.name} - ${payload.sub})`);

      // Emit connection success to the client
      client.emit('authenticated', {
        user: authenticatedUser,
        message: 'Successfully connected and authenticated.',
      });

      // Broadcast user online event
      this.server.emit('user:online', {
        userId: payload.sub,
        email: user.email,
        name: user.name,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Socket authentication failed for ${client.id}: ${error.message}`);
      client.emit('error', { message: 'Authentication failed. Invalid or expired token.' });
      client.disconnect(true);
    }
  }

  /**
   * Handles socket disconnection: marks user offline in DB and Redis.
   */
  async handleDisconnect(client: Socket) {
    const user: AuthenticatedUser | undefined = client.data?.user;

    if (user && user.id) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${user.name} - ${user.id})`);

      try {
        // Update user offline status in MongoDB
        await this.usersService.updateOnlineStatus(user.id, false);

        // Remove user presence from Redis
        if (this.redisService) {
          await this.redisService.setUserOffline(user.id);
        }
      } catch (err) {
        this.logger.warn(`Failed to update offline status for user ${user.id}: ${err.message}`);
      }

      // Broadcast user offline event
      this.server.emit('user:offline', {
        userId: user.id,
        email: user.email,
        timestamp: new Date(),
      });
    } else {
      this.logger.log(`Unauthenticated client disconnected: ${client.id}`);
    }
  }

  /**
   * Join Room event:
   * 1. Validates room
   * 2. Registers participant in DB (idempotently)
   * 3. Joins Socket.IO room `room:<roomId>`
   * 4. Emits `participant:joined` to the room
   * 5. Emits `room:participant-count` to the room
   */
  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomSocketDto,
  ) {
    const user = this.getAuthenticatedUser(client);
    const { roomId } = payload;

    if (!roomId) {
      return { success: false, message: 'roomId is required' };
    }

    try {
      // Ensure participation is recorded in database
      try {
        await this.roomsService.joinRoom(roomId, user.id);
      } catch (dbErr: any) {
        // If already active participant, continue to ensure socket joins the room
        if (!dbErr.message?.includes('already an active participant')) {
          return { success: false, message: dbErr.message || 'Unable to join room' };
        }
      }

      // Join the Socket.IO room using the prescribed pattern `room:<roomId>`
      const socketRoomName = `room:${roomId}`;
      await client.join(socketRoomName);

      // Add user to Redis active room participant Set
      if (this.redisService) {
        await this.redisService.addRoomParticipant(roomId, user.id);
      }

      // Fetch fresh room details
      const roomDetails = await this.roomsService.findById(roomId);

      // Emit participant:joined only to relevant room users
      this.server.to(socketRoomName).emit('participant:joined', {
        roomId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        timestamp: new Date(),
      });

      // Emit updated participant count to the room
      this.server.to(socketRoomName).emit('room:participant-count', {
        roomId,
        participantCount: roomDetails.participantCount,
      });

      this.logger.log(`User ${user.name} (${user.id}) joined socket room ${socketRoomName}`);

      return {
        success: true,
        roomId,
        roomName: roomDetails.roomName,
        participantCount: roomDetails.participantCount,
      };
    } catch (error: any) {
      this.logger.error(`Error joining room ${roomId}: ${error.message}`);
      return { success: false, message: error.message || 'Error joining room' };
    }
  }

  /**
   * Leave Room event:
   * 1. Leaves Socket.IO room `room:<roomId>`
   * 2. Calls RoomsService.leaveRoom (updates DB and handles host termination)
   * 3. Emits `participant:left` to the room
   * 4. Emits `room:participant-count` to the room
   * 5. If host left, emits `room:status` with 'ENDED'
   */
  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomSocketDto,
  ) {
    const user = this.getAuthenticatedUser(client);
    const { roomId } = payload;

    if (!roomId) {
      return { success: false, message: 'roomId is required' };
    }

    try {
      const socketRoomName = `room:${roomId}`;

      // Leave the Socket.IO room
      await client.leave(socketRoomName);

      // Process leave in database
      const leaveResult = await this.roomsService.leaveRoom(roomId, user.id);

      // Remove user from Redis active room participant Set
      if (this.redisService) {
        await this.redisService.removeRoomParticipant(roomId, user.id);
        if (leaveResult.roomStatus === 'ENDED') {
          await this.redisService.clearRoomParticipants(roomId);
        }
      }

      // Emit participant:left to remaining room members
      this.server.to(socketRoomName).emit('participant:left', {
        roomId,
        userId: user.id,
        timestamp: new Date(),
      });

      // Emit updated participant count
      this.server.to(socketRoomName).emit('room:participant-count', {
        roomId,
        participantCount: leaveResult.participantCount,
      });

      // If room ended (host left), emit room status change
      if (leaveResult.roomStatus === 'ENDED') {
        this.server.to(socketRoomName).emit('room:status', {
          roomId,
          status: 'ENDED',
          message: leaveResult.message,
          timestamp: new Date(),
        });
      }

      this.logger.log(`User ${user.name} (${user.id}) left socket room ${socketRoomName}`);

      return {
        success: true,
        message: leaveResult.message,
        roomId,
        participantCount: leaveResult.participantCount,
      };
    } catch (error: any) {
      this.logger.error(`Error leaving room ${roomId}: ${error.message}`);
      return { success: false, message: error.message || 'Error leaving room' };
    }
  }

  /**
   * Room Message event:
   * Broadcasts real-time messages exclusively to the specified room.
   * Never broadcasts globally.
   */
  @SubscribeMessage('room:message')
  async handleRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: RoomMessageSocketDto,
  ) {
    const user = this.getAuthenticatedUser(client);
    const { roomId, message } = payload;

    if (!roomId || !message?.trim()) {
      return { success: false, message: 'roomId and message are required' };
    }

    const socketRoomName = `room:${roomId}`;

    // Verify client has joined this room
    if (!client.rooms.has(socketRoomName)) {
      return {
        success: false,
        message: 'You must join this room before sending messages.',
      };
    }

    const messageEventPayload = {
      roomId,
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      message: message.trim(),
      timestamp: new Date(),
    };

    // Broadcast message exclusively to users in this room
    this.server.to(socketRoomName).emit('room:message', messageEventPayload);

    this.logger.log(`Room message in ${socketRoomName} from ${user.name}: "${message.substring(0, 30)}..."`);

    return {
      success: true,
      message: 'Message delivered',
    };
  }

  /**
   * Heartbeat event to refresh presence TTL in Redis.
   * Clients send this periodically (e.g. every 60 seconds) to prevent TTL expiry.
   */
  @SubscribeMessage('presence:ping')
  async handlePresencePing(@ConnectedSocket() client: Socket) {
    const user = this.getAuthenticatedUser(client);
    if (this.redisService) {
      await this.redisService.refreshUserPresence(user.id, 300);
    }
    return { success: true, timestamp: new Date() };
  }

  /**
   * Helper: Extracts JWT token from client handshake.
   */
  private extractJwtToken(client: Socket): string | null {
    // 1. Check handshake auth object (standard Socket.IO v4 client auth)
    if (client.handshake.auth?.token) {
      return this.cleanBearer(client.handshake.auth.token);
    }

    // 2. Check authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      return this.cleanBearer(authHeader);
    }

    // 3. Check query parameters
    if (client.handshake.query?.token) {
      const queryToken = client.handshake.query.token;
      return Array.isArray(queryToken)
        ? this.cleanBearer(queryToken[0])
        : this.cleanBearer(queryToken);
    }

    return null;
  }

  private cleanBearer(token: string): string {
    return token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  }

  /**
   * Helper: Extracts and enforces validated user identity.
   * Throws if socket is unauthenticated.
   */
  private getAuthenticatedUser(client: Socket): AuthenticatedUser {
    const user = client.data?.user;
    if (!user || !user.id) {
      client.emit('error', { message: 'Unauthorized: Missing valid session.' });
      client.disconnect(true);
      throw new Error('Unauthorized socket action: user not identified.');
    }
    return user;
  }
}

