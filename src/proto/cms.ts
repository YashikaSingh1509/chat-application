import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";
import { addMethods } from "src/utils/grpc.utils";

export const protoBufPackage = "clearlink.cms";
export const CMS_PACKAGE_NAME = "clearlink.cms";

export interface success {
  message: string;
  code: number;
}

export interface tierList {
  sort: string;
  sortOrder: string;
  select: string;
}

export interface tierListResponse {
  tiers: tierListItem[];
}

export interface tierListItem {
  title?: string | null;
  minFrequenceRange?: number | null;
  maxFrequenceRange?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  minlifetimeSpend?: number | null;
  maxlifetimeSpend?: number | null;
  colorScheme?: string | null;
  id?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface CMSServiceClient {
  tierList(
    request: tierList,
    metadata?: Metadata,
  ): Observable<tierListResponse>;
}

export function CMSServiceControllerMethods() {
  const grpcMethods: string[] = Object.keys({} as CMSServiceClient);
  return addMethods("CMSService", grpcMethods);
}
export const CMS_SERVICE_NAME = "CMSService";
