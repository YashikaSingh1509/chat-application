import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AuthModule, UsersModule, RoomsModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class SocketModule {}
