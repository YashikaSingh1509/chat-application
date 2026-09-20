import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Rooms')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new live room' })
  @ApiCreatedResponse({
    description: 'Room created successfully with host as first participant',
    schema: {
      example: {
        _id: '66fa89c0f91a2b0012349999',
        roomName: 'Tech Talk & Architecture Sync',
        hostId: {
          _id: '66fa89c0f91a2b0012345678',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          profileImage: null,
        },
        status: 'ACTIVE',
        participantCount: 1,
        createdAt: '2026-09-19T18:15:00.000Z',
        updatedAt: '2026-09-19T18:15:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed on roomName' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async create(
    @CurrentUser() user: any,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    const userId = user._id?.toString() || user.id;
    return this.roomsService.create(userId, createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all currently active rooms' })
  @ApiOkResponse({
    description: 'List of active rooms',
    schema: {
      type: 'array',
      items: {
        example: {
          _id: '66fa89c0f91a2b0012349999',
          roomName: 'Tech Talk & Architecture Sync',
          hostId: {
            _id: '66fa89c0f91a2b0012345678',
            name: 'Jane Doe',
            email: 'jane.doe@example.com',
            profileImage: null,
          },
          status: 'ACTIVE',
          participantCount: 2,
          createdAt: '2026-09-19T18:15:00.000Z',
          updatedAt: '2026-09-19T18:15:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findActiveRooms() {
    return this.roomsService.findActiveRooms();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room details and active participant roster' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the room',
    example: '66fa89c0f91a2b0012349999',
  })
  @ApiOkResponse({
    description: 'Room information and list of active participants',
  })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiBadRequestResponse({ description: 'Invalid room ID format' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findById(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join an active room as a participant' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the room',
    example: '66fa89c0f91a2b0012349999',
  })
  @ApiOkResponse({
    description: 'Successfully joined room',
    schema: {
      example: {
        message: 'Successfully joined the room',
        room: {
          _id: '66fa89c0f91a2b0012349999',
          roomName: 'Tech Talk & Architecture Sync',
          status: 'ACTIVE',
          participantCount: 2,
        },
        participant: {
          _id: '66fa89c0f91a2b001234aaaa',
          roomId: '66fa89c0f91a2b0012349999',
          userId: '66fa89c0f91a2b001234bbbb',
          joinedAt: '2026-09-19T18:20:00.000Z',
          status: 'ACTIVE',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Room ended or user already participating',
  })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async joinRoom(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user._id?.toString() || user.id;
    return this.roomsService.joinRoom(id, userId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a room (or end room if host leaves)' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the room',
    example: '66fa89c0f91a2b0012349999',
  })
  @ApiOkResponse({
    description: 'Successfully left room (or room ended if host left)',
    schema: {
      example: {
        message: 'Successfully left the room',
        roomId: '66fa89c0f91a2b0012349999',
        roomStatus: 'ACTIVE',
        participantCount: 1,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'User is not an active participant in this room',
  })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async leaveRoom(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user._id?.toString() || user.id;
    return this.roomsService.leaveRoom(id, userId);
  }
}

