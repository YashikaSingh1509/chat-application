import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Name or title of the room',
    example: 'Tech Talk & Architecture Sync',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty({ message: 'Room name is required' })
  @MinLength(3, { message: 'Room name must be at least 3 characters long' })
  roomName: string;
}

