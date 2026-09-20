import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LivekitService } from './livekit.service';
import { GenerateLivekitTokenDto } from './dto/generate-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('LiveKit')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('livekit')
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate LiveKit WebRTC access token',
    description:
      'Validates room existence, active status, and user role before signing a LiveKit WebRTC access token. Participant identity is securely extracted from the authenticated JWT.',
  })
  @ApiOkResponse({
    description: 'Token successfully generated',
    schema: {
      example: {
        success: true,
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          serverUrl: 'wss://demo.livekit.cloud',
          roomName: 'Tech Interview Prep',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Room is inactive or payload is invalid',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Bearer authentication token',
  })
  @ApiForbiddenResponse({
    description: 'User is not authorized as host for this room',
  })
  @ApiNotFoundResponse({
    description: 'Room with the specified name or ID does not exist',
  })
  async generateToken(
    @CurrentUser() user: any,
    @Body() dto: GenerateLivekitTokenDto,
  ) {
    // Standardize user object from JWT payload
    const authenticatedUser = {
      id: user._id?.toString() || user.id || user.sub,
      email: user.email,
      name: user.name,
    };

    return this.livekitService.generateToken(authenticatedUser, dto);
  }
}

