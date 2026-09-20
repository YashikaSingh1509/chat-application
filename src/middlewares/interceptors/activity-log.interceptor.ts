import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { ActivityLogService } from "src/modules/activity-log/activity-log.service";
import { ROLE_MANAGEMENT_CONSTANTS } from "src/modules/role/constants/role.contants";
import { STATICPAGE_MANAGEMENT_CONSTANTS } from "src/modules/static-page-management/constants/static-page.constant";
import { STREAMING_SERVICES_CONSTANTS } from "src/modules/streaming-services-management/constants/streaming-services.constant";
import { SUBADMIN_MANAGEMENT_CONSTANTS } from "src/modules/subAdmin/constants/subAdmin.contants";
import { VERSION_MANAGEMENT_CONSTANTS } from "src/modules/version-management/constants/version.constant";
import {
  AdminRepository,
  RoleRepository,
  StaticPageRepository,
  VersionRepository,
} from "src/database/repositories";

@Injectable()
export class AdminActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly adminRepository: AdminRepository,
    private readonly roleRepository: RoleRepository,
    private readonly staticPageRepository: StaticPageRepository,
    private readonly versionRepository: VersionRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const endpoint = String(req?.url?.split("?")?.[0] ?? "");
    const method = String(req?.method ?? "").toUpperCase();
    const user = req?.user;

    const adminId = String(user?.userId ?? user?.sub ?? user?.id ?? "");
    const isExcludedEndpoint =
      endpoint.includes("activity-logs") ||
      endpoint.includes("logout") ||
      endpoint.includes("login") ||
      endpoint.includes("password");

    if (!adminId || isExcludedEndpoint || method === "GET") {
      return next.handle();
    }

    const actionTaken = this.inferActionTaken(method, endpoint);
    if (!this.isTrackableAction(actionTaken)) {
      return next.handle();
    }

    const { module, entity, identifierKey } =
      this.resolveModuleConfig(endpoint);
    const resolvedIdentifierPromise = this.resolveIdentifier(
      actionTaken,
      module,
      identifierKey,
      req,
    );

    return next.handle().pipe(
      tap(() => {
        this.createActivityLog({
          adminId,
          adminName: this.getAdminName(user),
          role: this.getRole(user),
          email: String(user?.email ?? ""),
          module,
          actionTaken,
          entity,
          identifierKey,
          resolvedIdentifierPromise,
          req,
        });
      }),
    );
  }

  private MODULE_CONFIG = {
    [STATICPAGE_MANAGEMENT_CONSTANTS.PREFIX]: {
      module: "cms-management",
      entity: "page",
      identifierKey: "title",
    },
    [SUBADMIN_MANAGEMENT_CONSTANTS.PREFIX]: {
      module: "subadmin-management",
      entity: "subadmin",
      identifierKey: "email",
    },
    [STREAMING_SERVICES_CONSTANTS.PREFIX]: {
      module: "streaming-services",
      entity: "streaming",
      identifierKey: "name",
    },
    [ROLE_MANAGEMENT_CONSTANTS.PREFIX]: {
      module: "role-management",
      entity: "role",
      identifierKey: "name",
    },
    [VERSION_MANAGEMENT_CONSTANTS.PREFIX]: {
      module: "version-management",
      entity: "version",
      identifierKey: "version",
    },
  };

  private resolveModuleConfig(endpoint: string) {
    const cleaned = endpoint.replace(/^\/admin\/api\/v\d+\//, "");
    const prefix = cleaned.split("/").filter(Boolean)[0] || "";

    return (
      this.MODULE_CONFIG[prefix] || {
        module: prefix || "general",
        entity: prefix || "module",
        identifierKey: "name",
      }
    );
  }

  private inferActionTaken(method: string, endpoint: string): string {
    if (endpoint.includes("/activate")) return "activate";
    if (method === "POST") return "add";
    if (method === "PUT" || method === "PATCH") return "edit";
    if (method === "DELETE") return "delete";
    return "view";
  }

  private isTrackableAction(action: string): boolean {
    return ["add", "edit", "delete", "activate"].includes(action);
  }

  private async createActivityLog(params: {
    adminId: string;
    adminName: string;
    role: string;
    email: string;
    module: string;
    actionTaken: string;
    entity: string;
    identifierKey: string;
    resolvedIdentifierPromise?: Promise<string | undefined>;
    req: any;
  }): Promise<void> {
    const details = await this.buildDetails(
      params.actionTaken,
      params.entity,
      params.identifierKey,
      params.resolvedIdentifierPromise,
      params.req,
      params.module,
    );

    await this.activityLogService.createLog({
      adminId: params.adminId,
      adminName: params.adminName,
      role: params.role,
      email: params.email,
      module: params.module,
      actionTaken: params.actionTaken,
      actionDescription: details,
      ip: this.getIp(params.req),
    });
  }

  private async buildDetails(
    action: string,
    entity: string,
    identifierKey: string,
    resolvedIdentifierPromise: Promise<string | undefined> | undefined,
    req: any,
    module: string,
  ): Promise<string> {
    const labels: Record<string, string> = {
      add: "Created",
      edit: "Updated",
      delete: "Deleted",
      activate: "Activated",
    };

    const verb = labels[action] ?? "Action";

    const resolvedIdentifier = resolvedIdentifierPromise
      ? await resolvedIdentifierPromise
      : await this.resolveIdentifier(action, module, identifierKey, req);
    const identifier = resolvedIdentifier ?? "";

    return identifier ? `${verb} ${entity} ${identifier}` : `${verb} ${entity}`;
  }

  private async resolveIdentifier(
    action: string,
    module: string,
    identifierKey: string,
    req: any,
  ): Promise<string | undefined> {
    const bodyIdentifier = req?.body?.[identifierKey];
    if (bodyIdentifier) {
      return String(bodyIdentifier);
    }

    const paramId = req?.params?.id;
    if (!paramId) {
      return undefined;
    }

    const resolve =
      action === "delete" || action === "edit" || action === "activate";

    if (resolve && module === "subadmin-management") {
      const subAdmin = await this.adminRepository.findById(String(paramId));
      console.log("Resolved SubAdmin for Activity Log:", subAdmin);
      return subAdmin?.email ? String(subAdmin.email) : String(paramId);
    }

    if (resolve && module === "role-management") {
      const role = await this.roleRepository.findById(String(paramId), {
        users: false,
        permissions: false,
      });
      return role?.name ? String(role.name) : String(paramId);
    }

    if (resolve && module === "cms-management") {
      const staticPage = await this.staticPageRepository.findById(
        String(paramId),
      );
      return staticPage?.title ? String(staticPage.title) : String(paramId);
    }

    if (resolve && module === "version-management") {
      const version = await this.versionRepository.findById(String(paramId));
      return version?.version
        ? `${version.version} (${version.appType})`
        : String(paramId);
    }

    return String(paramId);
  }

  private getAdminName(user: any): string {
    return String(user?.fullName ?? user?.full_name ?? user?.email ?? "");
  }

  private getRole(user: any): string {
    return String(
      user?.role?.name ?? user?.userType ?? user?.user_type ?? "Unknown",
    );
  }

  private getIp(req: any): string {
    return String(req?.ip ?? req?.connection?.remoteAddress ?? "");
  }
}
