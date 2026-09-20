import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MESSAGES } from "src/common/constants";
import { AdminRepository } from "src/database/repositories";
import { RedisService } from "src/providers/redis";

export type RateLimitType = "USER" | "ATTEMPTS" | "OTP_VERIFY";

// Factory function to create rate limit guards
export function RateLimitGuard(type?: RateLimitType): Type<CanActivate> {
  @Injectable()
  class RateLimitGuardImpl implements CanActivate {
    constructor(
      private readonly redisService: RedisService,
      private readonly adminRepository: AdminRepository,
      private readonly configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const rateLimit = this.configService.get("RATE_LIMIT");

      await Promise.all([
        this.basicRateLimit(request, rateLimit),
        this.typeRateLimit(request, rateLimit, type),
      ]);

      return true;
    }

    async basicRateLimit(request: any, rateLimit: any) {
      const ip = request.ip || request.connection.remoteAddress;
      const deviceId =
        request.headers["deviceid"] || request.headers["device-id"];
      if (!deviceId) {
        throw new BadRequestException(MESSAGES.ERROR.MISSING_PARAMS);
      }
      const maxRequests = rateLimit.MAX_REQUESTS;

      const key = `rate-limit:${ip}:${deviceId}`;
      const windowInSeconds = rateLimit.WINDOW_SECONDS;
      const requestCount = await this.redisService.incr(key);

      if (parseInt(requestCount,10) === 1) {
        await this.redisService.set(key, requestCount, windowInSeconds);
      }

      if (parseInt(requestCount,10) > maxRequests) {
        throw new BadRequestException(MESSAGES.ERROR.RATE_LIMIT_EXCEED);
      }
    }

    async typeRateLimit(request: any, rateLimit: any, type?: RateLimitType) {
      if (Boolean(type)) {
        const maxRequests = rateLimit.MAX_REQUESTS;
        const email = request.body["email"];

        const windowInSeconds = rateLimit.WINDOW_SECONDS_TYPE;
        const attemptKey = RedisService.getKey({ email }, type);
        let attempts: any = await this.redisService.get(attemptKey);
        attempts = parseInt(attempts || "0",10);

        if (attempts >= maxRequests) {
          throw new BadRequestException(MESSAGES.ERROR.ATTEMPTS_EXHAUSTED);
        }
        await this.redisService.set(attemptKey, attempts + 1, windowInSeconds);
      }
    }
  }

  return RateLimitGuardImpl;
}
