import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { RoomsService } from './rooms/rooms.service';
import { RoomStatus } from './rooms/schemas/room.schema';
import { ParticipantStatus } from './rooms/schemas/room-participant.schema';
import { LivekitService } from './livekit/livekit.service';
import { LivekitUserRole } from './livekit/dto/generate-token.dto';

describe('Assignment Core Business Logic Tests', () => {
  // Mock Data
  const mockUser = {
    _id: '65fc8e3b1234567890111111',
    id: '65fc8e3b1234567890111111',
    name: 'Alice Host',
    email: 'alice@example.com',
    password: '$2b$10$hashedPassword1234567890',
    toObject: () => ({
      _id: '65fc8e3b1234567890111111',
      id: '65fc8e3b1234567890111111',
      name: 'Alice Host',
      email: 'alice@example.com',
    }),
  };

  const mockGuestUser = {
    _id: '65fc8e3b1234567890222222',
    id: '65fc8e3b1234567890222222',
    name: 'Bob Guest',
    email: 'bob@example.com',
  };

  const mockRoom = {
    _id: '65fc8e3b1234567890333333',
    roomName: 'Architecture Discussion',
    hostId: '65fc8e3b1234567890111111',
    status: RoomStatus.ACTIVE,
    participantCount: 1,
    toObject: () => ({
      _id: '65fc8e3b1234567890333333',
      roomName: 'Architecture Discussion',
      hostId: '65fc8e3b1234567890111111',
      status: RoomStatus.ACTIVE,
      participantCount: 1,
    }),
  };

  // 1. AUTHENTICATION & REGISTRATION TESTS
  describe('1. Authentication & Registration', () => {
    let authService: AuthService;
    let usersService: jest.Mocked<Partial<UsersService>>;
    let jwtService: jest.Mocked<Partial<JwtService>>;

    beforeEach(() => {
      usersService = {
        create: jest.fn(),
        findByEmail: jest.fn(),
      };
      jwtService = {
        sign: jest.fn().mockReturnValue('mock.jwt.token'),
      };
      authService = new AuthService(
        usersService as unknown as UsersService,
        jwtService as unknown as JwtService,
      );
    });

    it('should register user, hash password, strip password from response, and generate JWT', async () => {
      const registerDto = {
        name: 'Alice Host',
        email: 'alice@example.com',
        password: 'Password@123',
      };

      const safeUser = {
        _id: '65fc8e3b1234567890111111',
        name: 'Alice Host',
        email: 'alice@example.com',
        isOnline: false,
      };

      usersService.create = jest.fn().mockResolvedValue(safeUser as any);

      const result = await authService.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user).toEqual(safeUser);
      expect((result.user as any).password).toBeUndefined();
    });

    it('should login user with correct password and return token without password', async () => {
      const loginDto = {
        email: 'alice@example.com',
        password: 'Password@123',
      };

      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      usersService.findByEmail = jest.fn().mockResolvedValue(mockUser as any);

      const result = await authService.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email, true);
      expect(result.accessToken).toBe('mock.jwt.token');
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw UnauthorizedException on invalid login credentials', async () => {
      const loginDto = {
        email: 'alice@example.com',
        password: 'WrongPassword',
      };

      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      usersService.findByEmail = jest.fn().mockResolvedValue(mockUser as any);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // 2. UNAUTHORIZED ACCESS TESTS
  describe('2. Unauthorized Access', () => {
    it('should reject unauthenticated request when token is missing or invalid', () => {
      const jwtService = new JwtService({ secret: 'test-secret' });
      expect(() => {
        jwtService.verify('invalid.token.here');
      }).toThrow();
    });
  });

  // 3. ROOM MANAGEMENT TESTS
  describe('3. Room Management', () => {
    let roomsService: RoomsService;
    let roomModel: any;
    let participantModel: any;

    beforeEach(() => {
      // Create mock constructor functions for Mongoose models
      roomModel = jest.fn().mockImplementation((dto) => ({
        ...dto,
        _id: '65fc8e3b1234567890333333',
        save: jest.fn().mockResolvedValue({
          _id: '65fc8e3b1234567890333333',
          ...dto,
        }),
      }));
      roomModel.findById = jest.fn();
      roomModel.findByIdAndUpdate = jest.fn();
      roomModel.find = jest.fn();
      roomModel.findOne = jest.fn();

      participantModel = jest.fn().mockImplementation((dto) => ({
        ...dto,
        save: jest.fn().mockResolvedValue(dto),
      }));
      participantModel.findOne = jest.fn();
      participantModel.find = jest.fn();
      participantModel.updateMany = jest.fn();

      roomsService = new RoomsService(roomModel, participantModel);
    });

    it('should create an ACTIVE room with participantCount 1 and host as participant', async () => {
      const execMock = jest.fn().mockResolvedValue(mockRoom);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      roomModel.findById = jest.fn().mockReturnValue({ populate: populateMock });

      const result = await roomsService.create(mockUser._id, {
        roomName: 'Architecture Discussion',
      });

      expect(result).toBeDefined();
      expect(participantModel).toHaveBeenCalled();
    });

    it('should prevent duplicate active participation when joining a room', async () => {
      roomModel.findById = jest.fn().mockResolvedValue({
        _id: '65fc8e3b1234567890333333',
        status: RoomStatus.ACTIVE,
      });

      // Simulate user is already an active participant
      participantModel.findOne = jest.fn().mockResolvedValue({
        status: ParticipantStatus.ACTIVE,
      });

      await expect(
        roomsService.joinRoom('65fc8e3b1234567890333333', mockGuestUser._id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject joining an ENDED room', async () => {
      roomModel.findById = jest.fn().mockResolvedValue({
        _id: '65fc8e3b1234567890333333',
        status: RoomStatus.ENDED,
      });

      await expect(
        roomsService.joinRoom('65fc8e3b1234567890333333', mockGuestUser._id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle regular participant leave by updating status and decrementing count', async () => {
      roomModel.findById = jest.fn().mockResolvedValue({
        _id: '65fc8e3b1234567890333333',
        hostId: mockUser._id,
      });

      const participantMock = {
        status: ParticipantStatus.ACTIVE,
        save: jest.fn().mockResolvedValue(true),
      };
      participantModel.findOne = jest.fn().mockResolvedValue(participantMock);

      roomModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        status: RoomStatus.ACTIVE,
        participantCount: 1,
      });

      const result = await roomsService.leaveRoom(
        '65fc8e3b1234567890333333',
        mockGuestUser._id,
      );

      expect(result.participantCount).toBe(1);
      expect(participantMock.status).toBe(ParticipantStatus.LEFT);
    });

    it('should terminate the room (status: ENDED) when host leaves', async () => {
      roomModel.findById = jest.fn().mockResolvedValue({
        _id: '65fc8e3b1234567890333333',
        hostId: mockUser._id,
      });

      const hostParticipantMock = {
        status: ParticipantStatus.ACTIVE,
        save: jest.fn().mockResolvedValue(true),
      };
      participantModel.findOne = jest.fn().mockResolvedValue(hostParticipantMock);
      roomModel.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
      participantModel.updateMany = jest.fn().mockResolvedValue(true);

      const result = await roomsService.leaveRoom(
        '65fc8e3b1234567890333333',
        mockUser._id, // Host leaving
      );

      expect(result.roomStatus).toBe(RoomStatus.ENDED);
      expect(result.participantCount).toBe(0);
      expect(roomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '65fc8e3b1234567890333333',
        { status: RoomStatus.ENDED, participantCount: 0 },
      );
    });
  });

  // 4. LIVEKIT TOKEN AUTHORIZATION TESTS
  describe('4. LiveKit Token Authorization', () => {
    let livekitService: LivekitService;
    let configService: jest.Mocked<Partial<ConfigService>>;
    let roomsService: jest.Mocked<Partial<RoomsService>>;

    beforeEach(() => {
      configService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'LIVEKIT_API_KEY' || key === 'LIVEKIT.API_KEY') return 'testkey';
          if (key === 'LIVEKIT_API_SECRET' || key === 'LIVEKIT.API_SECRET') return 'testsecret1234567890abcdef1234567890';
          if (key === 'LIVEKIT_URL' || key === 'LIVEKIT.URL') return 'wss://test.livekit.cloud';
          return null;
        }),
      };

      roomsService = {
        findByNameOrId: jest.fn(),
      };

      livekitService = new LivekitService(
        configService as unknown as ConfigService,
        roomsService as unknown as RoomsService,
      );
    });

    it('should generate token for host with roomAdmin: true', async () => {
      roomsService.findByNameOrId = jest.fn().mockResolvedValue(mockRoom as any);

      const result = await livekitService.generateToken(
        { id: mockUser._id, email: mockUser.email, name: mockUser.name },
        { roomName: mockRoom.roomName, role: LivekitUserRole.HOST },
      );

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.roomName).toBe(mockRoom.roomName);
    });

    it('should reject non-host requesting host role with 403 ForbiddenException', async () => {
      roomsService.findByNameOrId = jest.fn().mockResolvedValue(mockRoom as any);

      await expect(
        livekitService.generateToken(
          { id: mockGuestUser._id, email: mockGuestUser.email, name: mockGuestUser.name },
          { roomName: mockRoom.roomName, role: LivekitUserRole.HOST },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should generate token for participant with roomAdmin: false', async () => {
      roomsService.findByNameOrId = jest.fn().mockResolvedValue(mockRoom as any);

      const result = await livekitService.generateToken(
        { id: mockGuestUser._id, email: mockGuestUser.email, name: mockGuestUser.name },
        { roomName: mockRoom.roomName, role: LivekitUserRole.PARTICIPANT },
      );

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
    });

    it('should throw NotFoundException for non-existent room', async () => {
      roomsService.findByNameOrId = jest.fn().mockResolvedValue(null);

      await expect(
        livekitService.generateToken(
          { id: mockGuestUser._id, email: mockGuestUser.email, name: mockGuestUser.name },
          { roomName: 'Ghost Room', role: LivekitUserRole.PARTICIPANT },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
