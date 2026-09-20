import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    if (err || !user) {
      const message =
        info?.name === 'TokenExpiredError'
          ? 'Authentication token has expired'
          : 'Invalid or missing authentication token';
      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}

