import { SetMetadata } from "@nestjs/common";
import { PermissionAction, PermissionModule } from "../constants";

export const PERMISSION_METADATA_KEY = "required_permission";

export interface RequiredPermission {
  module: PermissionModule | string;
  action: PermissionAction | string;
}

export const RequirePermission = (permission: RequiredPermission) =>
  SetMetadata(PERMISSION_METADATA_KEY, permission);
