import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { MESSAGES } from "src/common/constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    if (err || !user) {
      const message =
        info?.name === "TokenExpiredError"
          ? MESSAGES?.ERROR?.SESSION_EXPIRED || "Authentication token has expired"
          : "Invalid or missing authentication token";
      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}
