import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    description: 'User registered successfully with access token',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          _id: '66fa89c0f91a2b0012345678',
          name: 'John Doe',
          email: 'john.doe@example.com',
          profileImage: null,
          isOnline: false,
          createdAt: '2026-09-19T18:00:00.000Z',
          updatedAt: '2026-09-19T18:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed on input payload' })
  @ApiConflictResponse({ description: 'A user with this email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiOkResponse({
    description: 'User authenticated successfully with access token',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          _id: '66fa89c0f91a2b0012345678',
          name: 'John Doe',
          email: 'john.doe@example.com',
          profileImage: null,
          isOnline: false,
          createdAt: '2026-09-19T18:00:00.000Z',
          updatedAt: '2026-09-19T18:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed on input payload' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}

