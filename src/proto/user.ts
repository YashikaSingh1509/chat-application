import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";
import { addMethods } from "src/utils/grpc.utils";

// 'Empty' used when req receives no data

// import { Empty } from './google/protobuf/empty';

export const protoBufPackage = "clearlink.user";

export interface authToken {
  token: string;
  originalRequest?: { [key: string]: string };
}

export interface Empty {}

export interface userData {
  data: string;
}

export interface servicesData {
  data: string;
}

export const USER_PACKAGE_NAME = "clearlink.user";

export interface UserServiceClient {
  verifyToken(request: authToken, metadata?: Metadata): Observable<userData>;
  getServices(request: Empty, metadata?: Metadata): Observable<servicesData>;
}

export function UserServiceControllerMethods() {
  const grpcMethods: string[] = Object.keys({} as UserServiceClient);
  return addMethods("UserService", grpcMethods);
}
export const USER_SERVICE_NAME = "UserService";
