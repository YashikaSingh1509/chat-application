import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";
import { addMethods } from "src/utils/grpc.utils";

// 'Empty' used when req receives no data

// import { Empty } from './google/protobuf/empty';

export const protoBufPackage = "clearlink.auth";

export interface authToken {
  token: string;
  originalRequest?: { [key: string]: string };
}

export interface userData {
  user_id: string;
  aud: string;
  sub: string;
  device_id: string;
  type: string;
  iat: number;
  prm: string;
  exp: number;
  iss: string;
  is_valid: boolean;
  email: string;
  fullName?: string;
  phoneNo?: string;
  deviceType?: string;
}

export interface UserTokenData {
  userId: string;
  deviceType: string;
  deviceId: string;
  deviceToken: string;
  type: string;
  userType: string;
  email?: string;
}

export interface userToken {
  accessToken: string;
  refreshToken: string;
}

export interface tokenData {
  userId: string;
  deviceType: string;
  deviceId: string;
  deviceToken: string;
  type: string;
  userType: string;
  sub: string;
  email?: string;
  fullName?: string;
}

export interface resetToken {
  resetToken: string;
}

export interface UserDetail {
  value: string;
  description: string;
}

export interface StatusResponse {
  message: string;
}
export interface LastLoginRequest {
  userId: string;
}
export interface LastLoginResponse {
  lastLogin: number;
}

export const AUTH_PACKAGE_NAME = "clearlink.auth";

export interface PreginedUrl {
  uploadType: string;
  filename: string;
}

export interface DeleteMedia {
  key: string;
}

export interface PreginedUrlResponse {
  presignedUrl: string;
  key: string;
}

export interface Upload {
  content: any;
  key: string;
  contentType: string;
}

export interface UploadResponse {
  fileUrl: string;
}

export interface PreSignedUrlsRequest {
  items: PreginedUrl[];
}

export interface PreSignedUrlsResponse {
  presignedUrls: PreginedUrlResponse[];
}

export interface AuthServiceClient {
  verifyToken(request: authToken, metadata?: Metadata): Observable<userData>;
  logout(
    request: UserTokenData,
    metadata?: Metadata,
  ): Observable<StatusResponse>;
  generateUserToken(
    request: UserTokenData,
    metadata?: Metadata,
  ): Observable<userToken>;
  createResetPasswordToken(
    request: tokenData,
    metadata?: Metadata,
  ): Observable<resetToken>;
  getLastLogin(
    request: LastLoginRequest,
    metadata?: Metadata,
  ): Observable<LastLoginResponse>;
  getPreSignedUrl(
    request: PreginedUrl,
    metadata?: Metadata,
  ): Observable<PreginedUrlResponse>;
  getPreSignedUrls(
    request: PreSignedUrlsRequest,
    metadata?: Metadata,
  ): Observable<PreSignedUrlsResponse>;
  deleteMedia(
    request: DeleteMedia,
    metadata?: Metadata,
  ): Observable<PreginedUrlResponse>;
  upload(request: Upload, metadata?: Metadata): Observable<UploadResponse>;
}

export function authServiceControllerMethods() {
  const grpcMethods: string[] = Object.keys({} as AuthServiceClient);
  return addMethods("AuthService", grpcMethods);
}

export const AUTH_SERVICE_NAME = "AuthService";
