import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum LivekitUserRole {
  HOST = 'host',
  PARTICIPANT = 'participant',
}

export class GenerateLivekitTokenDto {
  @ApiProperty({
    example: 'Tech Interview Prep',
    description: 'The name or ID of the room to join',
  })
  @IsString()
  @IsNotEmpty({ message: 'roomName is required' })
  roomName: string;

  @ApiProperty({
    enum: LivekitUserRole,
    example: LivekitUserRole.HOST,
    description: 'The requested role: "host" or "participant"',
  })
  @IsEnum(LivekitUserRole, {
    message: 'role must be either "host" or "participant"',
  })
  @IsNotEmpty({ message: 'role is required' })
  role: LivekitUserRole;
}

