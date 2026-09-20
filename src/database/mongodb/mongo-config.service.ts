import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from "@nestjs/mongoose";
import { NODE_ENV } from "src/common/constants";

@Injectable()
export class MongoConfigService implements MongooseOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createMongooseOptions(): MongooseModuleOptions {
    const env = process.env.NODE_ENV;
    const isProduction = env === NODE_ENV.PROD || env === NODE_ENV.PREPROD;

    const uri = this.buildUri();

    return {
      uri,
      retryWrites: true,
      maxPoolSize: isProduction ? 50 : 10,
      minPoolSize: isProduction ? 5 : 1,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      autoIndex: !isProduction,
      autoCreate: !isProduction,
    };
  }

  private buildUri(): string {
    const explicit = this.configService.get<string>("MONGODB_URI");
    const normalizedExplicit = this.normalizeEnvValue(explicit);
    if (normalizedExplicit) return normalizedExplicit;

    const mongo = this.configService.get<{
      DB_URL?: string;
      DB_NAME?: string;
      OPTIONS?: { user?: string; pass?: string };
      REPLICA_OPTION?: {
        authSource?: string;
        replicaSet?: string;
        ssl?: string;
      };
    }>("MONGO");

    if (mongo?.DB_URL) {
      let url = mongo.DB_URL;
      if (mongo.DB_NAME && !url.includes(mongo.DB_NAME)) {
        const sep = url.includes("?") ? "&" : "?";
        url = `${url}${sep}dbName=${encodeURIComponent(mongo.DB_NAME)}`;
      }
      return url;
    }

    const host =
      this.normalizeEnvValue(process.env["MONGODB_HOST"]) || "127.0.0.1";
    const port = this.normalizeEnvValue(process.env["MONGODB_PORT"]) || "27017";
    const db =
      this.normalizeEnvValue(process.env["MONGODB_DB_NAME"]) ||
      "clear_link_user";
    const user = this.normalizeEnvValue(process.env["MONGODB_USER"]);
    const pass = this.normalizeEnvValue(process.env["MONGODB_PASSWORD"]);

    // Check if MONGODB_HOST is already a full connection string
    if (host.startsWith("mongodb://") || host.startsWith("mongodb+srv://")) {
      console.log("Using MONGODB_HOST as full connection string");
      return host;
    }

    // Otherwise, construct URI from individual components
    if (user && pass) {
      return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}?authSource=admin`;
    }
    return `mongodb://${host}:${port}/${db}`;
  }

  /**
   * Supports loosely formatted .env values like:
   *   MONGODB_HOST= "mongodb+srv://.../db",
   */
  private normalizeEnvValue(value?: string): string | undefined {
    if (!value) return undefined;

    let normalized = value.trim();
    normalized = normalized.replace(/^[,\s]+|[,\s]+$/g, "");

    if (
      (normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'"))
    ) {
      normalized = normalized.slice(1, -1).trim();
    }

    return normalized || undefined;
  }
}
