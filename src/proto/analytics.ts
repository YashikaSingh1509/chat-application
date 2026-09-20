import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export const protoBufPackage = "clearlink.analytics";

export interface RecordEventRequest {
  event_name: string;
  actor_id?: string;
  properties?: Record<string, string>;
}

export interface RecordEventResponse {
  success: boolean;
  event_id: string;
  message: string;
}

export interface GetSportsRequest {}

export interface GetSportsResponse {
  sports: string[];
}

export interface GetLeaguesRequest {
  sport: string;
}

export interface GetTeamsRequest {
  leagueId: string;
}

export interface LeagueInfo {
  id: string;
  name: string;
  alternate: string;
  country: string;
}

export interface GetLeaguesResponse {
  leagues: LeagueInfo[];
}

export interface TeamInfo {
  id: string;
  name: string;
  short_name: string;
}

export interface GetTeamsResponse {
  teams: TeamInfo[];
}

export const ANALYTICS_PACKAGE_NAME = "clearlink.analytics";

export interface AnalyticsServiceClient {
  RecordEvent(
    request: RecordEventRequest,
    metadata?: Metadata,
  ): Observable<RecordEventResponse>;
  GetSports(
    request: GetSportsRequest,
    metadata?: Metadata,
  ): Observable<GetSportsResponse>;
  GetLeagues(
    request: GetLeaguesRequest,
    metadata?: Metadata,
  ): Observable<GetLeaguesResponse>;
  GetTeams(
    request: GetTeamsRequest,
    metadata?: Metadata,
  ): Observable<GetTeamsResponse>;
}

export const ANALYTICS_SERVICE_NAME = "AnalyticsService";

