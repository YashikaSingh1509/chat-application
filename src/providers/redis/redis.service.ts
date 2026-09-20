import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";
import { NODE_ENV, TOKEN_TYPE } from "src/common/constants";
import { RateLimitType } from "src/middlewares/guards";

export type RedisClientType = ReturnType<typeof createClient>;
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  protected redisClient;
  constructor(private configService: ConfigService) {}

  async connectToRedis() {
    try {
      const redisHost = this.configService.get<string>("REDIS.HOST");
      const redisPort = this.configService.get<number>("REDIS.PORT");
      const env = process.env.NODE_ENV;
      const isProduction =
        env === NODE_ENV.PROD ||
        env === NODE_ENV.PREPROD ||
        env === NODE_ENV.PRODUCTION;
      this.redisClient = createClient({
        socket: {
          host: redisHost,
          port: redisPort,
          tls: isProduction,
        },
      });

      await this.redisClient.connect();

      this.redisClient.on("ready", () => {
        this.logger.debug("Redis client connected to server.");
      });

      this.redisClient.on("connect", () => {
        this.logger.debug("Redis client connected.");
      });

      this.redisClient.on("error", (err) => {
        this.logger.error(`Redis error: ${err}`);
      });
      this.logger.debug("Connection to redis successfully!");
    } catch (error) {
      this.logger.error("Redis ERROR.", error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.warn("Redis client disconnected.");
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    parse?: boolean,
  ): Promise<string> {
    try {
      if (parse) {
        value = JSON.stringify(value) as any;
      }
      if (ttl) {
        return await this.redisClient.set(key, value, {
          EX: ttl, // TTL in seconds
        });
      } 
        return await this.redisClient.set(key, value);
      
    } catch (error) {
      console.error("Redis SET error:", { key, error });
      throw error;
    }
  }

  async get<T>(key: string, parse?: boolean): Promise<T> {
    try {
      if (parse) {
        return JSON.parse((await this.redisClient.get(key)) || "{}");
      }
      return await this.redisClient.get(key);
    } catch (error) {
      console.error("Redis GET error:", error);
      throw error;
    }
  }

  async getAllKeys(pattern: string): Promise<string[]> {
    try {
      const keys = await this.redisClient.keys(pattern);
      return keys;
    } catch (error) {
      console.error("Redis KEYS error:", { pattern, error });
      throw error;
    }
  }

  async del(key: string) {
    try {
      return await this.redisClient.del(key);
    } catch (error) {
      console.error("Redis DEL error:", { key, error });
      throw error;
    }
  }

  async exists(key: string) {
    try {
      return await this.redisClient.exists(key);
    } catch (error) {
      console.error("Redis EXISTS error:", { key, error });
      throw error;
    }
  }

  async incr(key: string) {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      console.error("Redis INCR error:", { key, error });
      throw error;
    }
  }

  async expire(key: string, seconds: number) {
    try {
      return await this.redisClient.expire(key, seconds);
    } catch (error) {
      console.error("Redis EXPIRE error:", { key, seconds, error });
      throw error;
    }
  }

  /** SET with EX — string payload (e.g. JSON). */
  async setEx(key: string, value: string, ttlSeconds: number) {
    return this.set(key, value, ttlSeconds);
  }

  static getKey(data: { email?: string }, type: RateLimitType) {
    const { email } = data;
    let key: string;
    switch (type) {
      case "USER":
        key = `USER_${email}`;
        break;
      case "OTP_VERIFY":
      case "ATTEMPTS":
        key = `${email}_${TOKEN_TYPE.OTP_VERIFY}_${type}`;
        break;
    }
    return key;
  }

  // ==========================================
  // PHASE 6: REAL-TIME PRESENCE & ROOM STATE
  // ==========================================

  /**
   * Check if Redis client is connected and ready
   */
  isClientReady(): boolean {
    return Boolean(this.redisClient && this.redisClient.isOpen);
  }

  /**
   * Mark user as online in Redis with a TTL (default: 300s = 5 minutes).
   * Key pattern: presence:user:<userId>
   */
  async setUserOnline(userId: string, ttlSeconds: number = 300): Promise<void> {
    if (!this.isClientReady()) {
      this.logger.debug(`Redis not connected, skipping setUserOnline for ${userId}`);
      return;
    }
    const key = `presence:user:${userId}`;
    const payload = JSON.stringify({
      status: 'online',
      userId,
      connectedAt: new Date().toISOString(),
    });
    try {
      await this.redisClient.set(key, payload, { EX: ttlSeconds });
      this.logger.debug(`Set user presence: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (err: any) {
      this.logger.error(`Error in setUserOnline for ${userId}: ${err.message}`);
    }
  }

  /**
   * Mark user as offline by removing their presence key from Redis.
   */
  async setUserOffline(userId: string): Promise<void> {
    if (!this.isClientReady()) {
      return;
    }
    const key = `presence:user:${userId}`;
    try {
      await this.redisClient.del(key);
      this.logger.debug(`Removed user presence: ${key}`);
    } catch (err: any) {
      this.logger.error(`Error in setUserOffline for ${userId}: ${err.message}`);
    }
  }

  /**
   * Check if a user is currently online in Redis.
   */
  async isUserOnline(userId: string): Promise<boolean> {
    if (!this.isClientReady()) {
      return false;
    }
    const key = `presence:user:${userId}`;
    try {
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    } catch (err: any) {
      this.logger.error(`Error in isUserOnline for ${userId}: ${err.message}`);
      return false;
    }
  }

  /**
   * Refresh the TTL of an active user's presence (heartbeat).
   */
  async refreshUserPresence(userId: string, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.isClientReady()) {
      return false;
    }
    const key = `presence:user:${userId}`;
    try {
      const refreshed = await this.redisClient.expire(key, ttlSeconds);
      return Boolean(refreshed);
    } catch (err: any) {
      this.logger.error(`Error refreshing presence for ${userId}: ${err.message}`);
      return false;
    }
  }

  /**
   * Add a user to the active room participant Set.
   * Key pattern: room:<roomId>:participants
   */
  async addRoomParticipant(roomId: string, userId: string): Promise<number> {
    if (!this.isClientReady()) {
      return 0;
    }
    const key = `room:${roomId}:participants`;
    try {
      await this.redisClient.sAdd(key, userId);
      return await this.redisClient.sCard(key);
    } catch (err: any) {
      this.logger.error(
        `Error in addRoomParticipant for room ${roomId}, user ${userId}: ${err.message}`,
      );
      return 0;
    }
  }

  /**
   * Remove a user from the active room participant Set.
   */
  async removeRoomParticipant(roomId: string, userId: string): Promise<number> {
    if (!this.isClientReady()) {
      return 0;
    }
    const key = `room:${roomId}:participants`;
    try {
      await this.redisClient.sRem(key, userId);
      return await this.redisClient.sCard(key);
    } catch (err: any) {
      this.logger.error(
        `Error in removeRoomParticipant for room ${roomId}, user ${userId}: ${err.message}`,
      );
      return 0;
    }
  }

  /**
   * Retrieve all active participant IDs for a room from Redis.
   */
  async getRoomParticipants(roomId: string): Promise<string[]> {
    if (!this.isClientReady()) {
      return [];
    }
    const key = `room:${roomId}:participants`;
    try {
      return await this.redisClient.sMembers(key);
    } catch (err: any) {
      this.logger.error(`Error in getRoomParticipants for room ${roomId}: ${err.message}`);
      return [];
    }
  }

  /**
   * Get active participant count for a room from Redis Set.
   */
  async getRoomParticipantCount(roomId: string): Promise<number> {
    if (!this.isClientReady()) {
      return 0;
    }
    const key = `room:${roomId}:participants`;
    try {
      return await this.redisClient.sCard(key);
    } catch (err: any) {
      this.logger.error(`Error in getRoomParticipantCount for room ${roomId}: ${err.message}`);
      return 0;
    }
  }

  /**
   * Clear all participants for a room (called when room is ended/closed).
   */
  async clearRoomParticipants(roomId: string): Promise<void> {
    if (!this.isClientReady()) {
      return;
    }
    const key = `room:${roomId}:participants`;
    try {
      await this.redisClient.del(key);
      this.logger.debug(`Cleared Redis room participants: ${key}`);
    } catch (err: any) {
      this.logger.error(`Error clearing room ${roomId} participants: ${err.message}`);
    }
  }
}
