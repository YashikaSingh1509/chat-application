import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";
import { addMethods } from "src/utils/grpc.utils";

export const protoBufPackage = "clearlink.admin";
export const ADMIN_PACKAGE_NAME = "clearlink.admin";

export interface Id {
  id: string;
}

export interface Email {
  email: string;
}

export interface ActivityLogRequest {
  adminId: string;
  adminName: string;
  role: string;
  email: string;
  endpoint: string;
  method: string;
  module: string;
  actionTaken: string;
  actionDescription: string;
  ip: string;
}

export interface ActivityLogResponse {
  success: boolean;
  message: string;
}

export interface userData {
  id: string;
  userType: string;
  email: string;
  fullName: string;
  status: string;
  password: string;
  salt: string;
}

export interface AdminServiceClient {
  findById(request: Id, metadata?: Metadata): Observable<userData>;
  isEmailExist(request: Email, metadata?: Metadata): Observable<userData>;
  createActivityLog(
    request: ActivityLogRequest,
    metadata?: Metadata,
  ): Observable<ActivityLogResponse>;
}

export function AdminServiceControllerMethods() {
  const grpcMethods: string[] = Object.keys({} as AdminServiceClient);
  return addMethods("AdminService", grpcMethods);
}
export const ADMIN_SERVICE_NAME = "AdminService";
