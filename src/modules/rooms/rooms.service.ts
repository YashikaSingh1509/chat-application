import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from './schemas/room.schema';
import {
  ParticipantStatus,
  RoomParticipant,
  RoomParticipantDocument,
} from './schemas/room-participant.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { RedisService } from '../../providers/redis/redis.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(RoomParticipant.name)
    private readonly participantModel: Model<RoomParticipantDocument>,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  /**
   * Create a new room with the authenticated user as host and first participant
   */
  async create(userId: string, createRoomDto: CreateRoomDto) {
    const hostObjectId = new Types.ObjectId(userId);

    const room = new this.roomModel({
      roomName: createRoomDto.roomName.trim(),
      hostId: hostObjectId,
      status: RoomStatus.ACTIVE,
      participantCount: 1,
    });

    const savedRoom = await room.save();

    // Register host as the first active participant
    const hostParticipant = new this.participantModel({
      roomId: savedRoom._id,
      userId: hostObjectId,
      joinedAt: new Date(),
      status: ParticipantStatus.ACTIVE,
    });

    await hostParticipant.save();

    return this.roomModel
      .findById(savedRoom._id)
      .populate('hostId', 'name email profileImage')
      .exec();
  }

  /**
   * Retrieve all currently active rooms
   */
  async findActiveRooms() {
    return this.roomModel
      .find({ status: RoomStatus.ACTIVE })
      .sort({ createdAt: -1 })
      .populate('hostId', 'name email profileImage')
      .exec();
  }

  /**
   * Retrieve room details and its active participants
   */
  async findById(roomId: string) {
    if (!isValidObjectId(roomId)) {
      throw new BadRequestException(`Invalid room ID format: ${roomId}`);
    }

    const room = await this.roomModel
      .findById(roomId)
      .populate('hostId', 'name email profileImage')
      .exec();

    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    // Retrieve active participants from MongoDB
    const activeParticipants = await this.participantModel
      .find({
        roomId: new Types.ObjectId(roomId),
        status: ParticipantStatus.ACTIVE,
      })
      .populate('userId', 'name email profileImage')
      .exec();

    // Retrieve real-time active participant IDs from Redis
    let liveParticipantIds: string[] = [];
    if (this.redisService) {
      liveParticipantIds = await this.redisService.getRoomParticipants(roomId);
    }

    return {
      ...room.toObject(),
      activeParticipants,
      liveParticipantIds,
    };
  }

  /**
   * Find a room by either its MongoDB ObjectId or by its roomName
   */
  async findByNameOrId(identifier: string): Promise<RoomDocument | null> {
    if (!identifier) return null;
    const trimmed = identifier.trim();
    if (isValidObjectId(trimmed)) {
      const room = await this.roomModel.findById(trimmed).exec();
      if (room) return room;
    }
    return this.roomModel.findOne({ roomName: trimmed }).exec();
  }

  /**
   * Join an active room (prevents duplicate active participation)
   */
  async joinRoom(roomId: string, userId: string) {
    if (!isValidObjectId(roomId)) {
      throw new BadRequestException(`Invalid room ID format: ${roomId}`);
    }

    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    if (room.status !== RoomStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot join: this room is no longer active',
      );
    }

    const roomObjectId = new Types.ObjectId(roomId);
    const userObjectId = new Types.ObjectId(userId);

    // Prevent duplicate active participation
    const alreadyParticipating = await this.participantModel.findOne({
      roomId: roomObjectId,
      userId: userObjectId,
      status: ParticipantStatus.ACTIVE,
    });

    if (alreadyParticipating) {
      throw new BadRequestException(
        'You are already an active participant in this room',
      );
    }

    // Create participant record
    const participant = new this.participantModel({
      roomId: roomObjectId,
      userId: userObjectId,
      joinedAt: new Date(),
      status: ParticipantStatus.ACTIVE,
    });

    await participant.save();

    // Increment participant count atomically
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        roomId,
        { $inc: { participantCount: 1 } },
        { new: true },
      )
      .populate('hostId', 'name email profileImage')
      .exec();

    return {
      message: 'Successfully joined the room',
      room: updatedRoom,
      participant,
    };
  }

  /**
   * Leave a room:
   * - If host leaves: the room transitions to ENDED and all active participants are marked LEFT.
   * - If regular participant leaves: participant status is marked LEFT and participantCount is decremented.
   */
  async leaveRoom(roomId: string, userId: string) {
    if (!isValidObjectId(roomId)) {
      throw new BadRequestException(`Invalid room ID format: ${roomId}`);
    }

    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    const roomObjectId = new Types.ObjectId(roomId);
    const userObjectId = new Types.ObjectId(userId);

    // Verify user is actually participating in this room
    const participant = await this.participantModel.findOne({
      roomId: roomObjectId,
      userId: userObjectId,
      status: ParticipantStatus.ACTIVE,
    });

    if (!participant) {
      throw new BadRequestException(
        'You are not currently an active participant in this room',
      );
    }

    const isHost = room.hostId.toString() === userId.toString();
    const now = new Date();

    if (isHost) {
      // Host leaves -> Room ends for everyone
      participant.status = ParticipantStatus.LEFT;
      participant.leftAt = now;
      await participant.save();

      // End room and mark all remaining participants as LEFT
      await this.roomModel.findByIdAndUpdate(roomId, {
        status: RoomStatus.ENDED,
        participantCount: 0,
      });

      await this.participantModel.updateMany(
        {
          roomId: roomObjectId,
          status: ParticipantStatus.ACTIVE,
        },
        {
          $set: {
            status: ParticipantStatus.LEFT,
            leftAt: now,
          },
        },
      );

      return {
        message: 'Host left the room. The room has now ended.',
        roomId,
        roomStatus: RoomStatus.ENDED,
        participantCount: 0,
      };
    } else {
      // Regular participant leaves
      participant.status = ParticipantStatus.LEFT;
      participant.leftAt = now;
      await participant.save();

      const updatedRoom = await this.roomModel.findByIdAndUpdate(
        roomId,
        { $inc: { participantCount: -1 } },
        { new: true },
      );

      return {
        message: 'Successfully left the room',
        roomId,
        roomStatus: updatedRoom?.status || RoomStatus.ACTIVE,
        participantCount: Math.max(0, updatedRoom?.participantCount || 0),
      };
    }
  }
}

