import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    // Check if user has Super Admin role
    if (!user.role || !user.role.isSuperAdmin) {
      throw new ForbiddenException(
        "Access denied. Super Admin privileges required.",
      );
    }

    return true;
  }
}
