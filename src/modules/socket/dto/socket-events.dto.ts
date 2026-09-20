import { IsNotEmpty, IsString } from 'class-validator';

export class JoinRoomSocketDto {
  @IsString()
  @IsNotEmpty({ message: 'roomId is required' })
  roomId: string;
}

export class LeaveRoomSocketDto {
  @IsString()
  @IsNotEmpty({ message: 'roomId is required' })
  roomId: string;
}

export class RoomMessageSocketDto {
  @IsString()
  @IsNotEmpty({ message: 'roomId is required' })
  roomId: string;

  @IsString()
  @IsNotEmpty({ message: 'message content cannot be empty' })
  message: string;
}

