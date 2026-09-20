declare interface Device {
  deviceType?: string;
  deviceId?: string;
  remoteAddress?: string;
  accessTokenKey?: string;
  timezone?: number;
  language?: string;
  lastLogin?: number;
  deviceToken?: string;
}

declare interface ModulePermission {
  module: string;
  actions: ("read" | "write")[];
}

declare interface TokenData extends Device {
  userId: string;
  sessionId?: string;
  fullName?: string;
  email?: string;
  userType?: string;
  countryCode?: string;
  phoneNo?: string;
  status?: number;
  created?: number;
  id?: string;
  permissions?: ModulePermission[];
}

declare interface verifyEmail {
  id: string;
}

declare interface LoginHistoryRequest extends Device {
  userId: string;
  email: string;
  fullName?: string;
  userType: string;
  status?: string;
  accessTokenKey: string;
  refreshTokenKey?: string;
  isLogin?: boolean;
  created?: number;
}

declare interface GenerateLoginHistoryWithTokenOptions {
  result: DataI;
  headers: {
    deviceid?: string;
    deviceType?: string;
    language?: string;
    timezone?: string;
  };
}
