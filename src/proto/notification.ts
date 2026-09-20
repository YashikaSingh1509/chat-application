import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";
import { addMethods } from "src/utils/grpc.utils";

export const protoBufPackage = "clearlink.notification";

export enum EMAIL_TEMPLATE_TYPE {
  CODE_VERIFICATION = "CODE_VERIFICATION",
  WELCOME = "WELCOME",
  PASSWORD_RESET = "PASSWORD_RESET",
  ACCOUNT_ACTIVATION = "ACCOUNT_ACTIVATION",
  LOGIN_NOTIFICATION = "LOGIN_NOTIFICATION",
  ORDER_CONFIRMATION = "ORDER_CONFIRMATION",
  SUB_ADMIN_WELCOME = "SUB_ADMIN_WELCOME",
  REPORT = "REPORT",
}

export interface SendEmailRequest {
  recipientEmail: string;
  templateType: EMAIL_TEMPLATE_TYPE;
  templateData: Record<string, string>;
  createdBy: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  emailLogId: string;
}

export interface GetEmailStatusRequest {
  emailLogId: string;
}

export interface GetEmailStatusResponse {
  status: string;
  errorMessage: string;
  sentAt: string;
}

export interface SendSmsRequest {
  recipientPhone: string;
  message: string;
}

export interface SendSmsResponse {
  success: boolean;
  message: string;
  successId: string;
}

export interface SendBulkNotificationRequest {
  userIds: string[];
  userType: string;
  title: string;
  body: string;
  data: Record<string, string>;
  createdBy: string;
  type?: string[];
}

export interface SendBulkNotificationResponse {
  success: boolean;
  message: string;
  pushLogId: string;
  successCount: number;
  failureCount: number;
  failedUserIds: string[];
}

export const NOTIFICATION_PACKAGE_NAME = "clearlink.notification";

export interface NotificationServiceClient {
  SendEmail(
    request: SendEmailRequest,
    metadata?: Metadata,
  ): Observable<SendEmailResponse>;
  GetEmailStatus(
    request: GetEmailStatusRequest,
    metadata?: Metadata,
  ): Observable<GetEmailStatusResponse>;
  SendSms(
    request: SendSmsRequest,
    metadata?: Metadata,
  ): Observable<SendSmsResponse>;
  SendBulkNotification(
    request: SendBulkNotificationRequest,
    metadata?: Metadata,
  ): Observable<SendBulkNotificationResponse>;
}

export function NotificationServiceControllerMethods() {
  const grpcMethods: string[] = Object.keys({} as NotificationServiceClient);
  return addMethods("NotificationService", grpcMethods);
}

export const NOTIFICATION_SERVICE_NAME = "NotificationService";
