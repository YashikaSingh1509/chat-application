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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register / Create a new user' })
  @ApiCreatedResponse({
    description: 'User successfully created (password excluded)',
    schema: {
      example: {
        _id: '66fa89c0f91a2b0012345678',
        name: 'John Doe',
        email: 'john.doe@example.com',
        profileImage: 'https://example.com/avatar.jpg',
        isOnline: false,
        createdAt: '2026-09-19T17:15:00.000Z',
        updatedAt: '2026-09-19T17:15:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed on input payload' })
  @ApiConflictResponse({ description: 'User with this email already exists' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiOkResponse({
    description: 'List of all registered users (passwords excluded)',
    schema: {
      type: 'array',
      items: {
        example: {
          _id: '66fa89c0f91a2b0012345678',
          name: 'John Doe',
          email: 'john.doe@example.com',
          profileImage: null,
          isOnline: false,
          createdAt: '2026-09-19T17:15:00.000Z',
          updatedAt: '2026-09-19T17:15:00.000Z',
        },
      },
    },
  })
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * Protected route: Get authenticated user profile from JWT
   * Placed before ':id' to prevent route collision
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiOkResponse({
    description: 'Authenticated user profile (password excluded)',
    schema: {
      example: {
        _id: '66fa89c0f91a2b0012345678',
        name: 'John Doe',
        email: 'john.doe@example.com',
        profileImage: null,
        isOnline: false,
        createdAt: '2026-09-19T18:00:00.000Z',
        updatedAt: '2026-09-19T18:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, expired, or invalid Bearer token',
  })
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId string',
    example: '66fa89c0f91a2b0012345678',
  })
  @ApiOkResponse({ description: 'User found (password excluded)' })
  @ApiBadRequestResponse({ description: 'Invalid user ID format' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
