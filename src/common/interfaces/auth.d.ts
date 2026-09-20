declare interface JwtPayload {
  aud: string;
  sub: string;
  iss: string;
  iat: number;
  deviceType?: string;
  deviceId?: string;
  prm: string;
}
