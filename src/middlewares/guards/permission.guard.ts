import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { STATUS, USER_TYPE } from "src/common/constants";
import {
  PERMISSION_METADATA_KEY,
  RequiredPermission,
} from "src/common/decorators/permission.decorator";
import { AdminRepository } from "src/database/repositories";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly adminRepository: AdminRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission =
      this.reflector.getAllAndOverride<RequiredPermission>(
        PERMISSION_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request?.user as TokenData | undefined;
    if (!user?.userId) {
      throw new ForbiddenException("Permission denied");
    }

    if (user.userType === USER_TYPE.ADMIN) {
      (request.user as any).permissions = undefined;
      return true;
    }

    const admin = (await this.adminRepository.findByIdWithRole(
      user.userId,
    )) as any;

    const permissions: any[] = admin?.roleId?.permissions ?? [];

    // Build structured module→actions map
    const moduleActionMap: Record<string, Set<string>> = {};
    for (const p of permissions) {
      if (p?.status === STATUS.ACTIVE) {
        if (!moduleActionMap[p.module]) moduleActionMap[p.module] = new Set();
        moduleActionMap[p.module].add(p.action);
      }
    }

    const modulePermissions: ModulePermission[] = Object.entries(
      moduleActionMap,
    ).map(([module, actions]) => ({
      module,
      actions: [...actions] as ("read" | "write")[],
    }));
    (request.user as any).permissions = modulePermissions;

    const hasWrite = permissions.some(
      (p) =>
        p?.status === STATUS.ACTIVE &&
        p?.module === requiredPermission.module &&
        p?.action === "write",
    );
    if (hasWrite) return true;

    const hasRead = permissions.some(
      (p) =>
        p?.status === STATUS.ACTIVE &&
        p?.module === requiredPermission.module &&
        p?.action === "read",
    );

    if (requiredPermission.action === "read" && hasRead) return true;

    throw new ForbiddenException("You are not allowed to perform this action");
  }
}
