import { SERVICE_NAME } from "src/common/constants";
import { fetchSecrets, loadSecretsToProcessEnv } from "../utils";
import * as path from "path";

// console.log("process.cwd() =>", process.cwd())
export const configuration = async () => {
  await loadSecretsToProcessEnv();

  return Object.freeze({
    APP_NAME: process.env["APP_NAME"],
    APP_URL: process.env[`APP_URL`],
    SERVICE_NAME: SERVICE_NAME,
    SERVICE_URL: process.env[`${SERVICE_NAME}_API_URL`],
    PORT: process.env[`${SERVICE_NAME}_PORT`],
    MONGO: {
      DB_NAME: process.env["DB_NAME"],
      DB_URL: process.env["DB_URL"],
    },
    MONGODB_URI: process.env["MONGODB_URI"],
    ADMIN_CREDENTIALS: {
      EMAIL: process.env["ADMIN_EMAIL"],
      PASSWORD: process.env["ADMIN_PASSWORD"],
      NAME: process.env["ADMIN_NAME"],
    },
    // JWT_PRIVATE_KEY: path.join(process.cwd(), "keys", "jwtRS256.key"),
    // JWT_PUBLIC_KEY: path.join(process.cwd(), "keys", "jwtRS256.key.pub"),
    JWT_PRIVATE_KEY:process.env[`JWT_PRIVATE_KEY`],
    JWT_PUBLIC_KEY: process.env[`JWT_PUBLIC_KEY`],
    TOKEN_INFO: {
      EXPIRATION_TIME: {
        ACCESS_TOKEN: "7d",
        REFRESH_TOKEN: "30d",
      },
      ISSUER: process.env["APP_URL"],
    },
    RATE_LIMIT: {
      MAX_REQUESTS: 5,
      WINDOW_SECONDS: 30, // 30 seconds
      WINDOW_SECONDS_TYPE: 30 * 60, // 30 minutes
    },
    JWT_ALGO: "RS256",
    MAIL: {
      SMTP: {
        HOST: process.env["SMTP_HOST"],
        PORT: process.env["SMTP_PORT"],
        USER: process.env["SMTP_USER"],
        PASSWORD: process.env["SMTP_PASSWORD"],
      },
    },
    REDIS: {
      HOST: process.env["REDIS_HOST"],
      PORT: process.env["REDIS_PORT"],
      PASSWORD: process.env["REDIS_PASSWORD"],
      TTL: 60, // 60s
      TTL_OTP: 10 * 60, //10m
    },
    GRPC: {
      ADMIN: process.env["GRPC_ADMIN"],
      USER: process.env["GRPC_USER"],
      AUTH: process.env["GRPC_AUTH"],
      CONTENT: process.env["GRPC_CONTENT"],
      NOTIFICATION: process.env["GRPC_NOTIFICATION"],
      PAYMENT: process.env["GRPC_PAYMENT"],
      CMS: process.env["CMS"],
      ANALYTICS: process.env["GRPC_ANALYTICS"],
    },
    GRPC_CLIENTS: {
      ADMIN: process.env["GRPC_ADMIN_CLIENT"],
      USER: process.env["GRPC_USER_CLIENT"],
      AUTH: process.env["GRPC_AUTH_CLIENT"],
      CONTENT: process.env["GRPC_CONTENT_CLIENT"],
      NOTIFICATION: process.env["GRPC_NOTIFICATION_CLIENT"],
      PAYMENT: process.env["GRPC_PAYMENT_CLIENT"],
      CMS: process.env["CMS_CLIENT"],
      ANALYTICS: process.env["GRPC_ANALYTICS_CLIENT"],
    },
    IS_SINGLE_DEVICE_LOGIN: {
      SUPER_ADMIN: false,
      ADMIN: false,
      SUBADMIN: false,
      USER: true,
    },
    BASIC_AUTH: {
      USER_NAME:
        process.env["BASIC_AUTH_USER_NAME"] ?? process.env["USER_NAME"],
      PASS: process.env["BASIC_AUTH_PASS"] ?? process.env["USER_PASS"],
    },
    USER_NAME: process.env["USER_NAME"],
    USER_PASS: process.env["USER_PASS"],
    JWT_PASS: process.env["JWT_PASS"],
    SERVER: {
      AWS_CDN: process.env["CLOUD_FRONT_URL"],
    },
    LIVEKIT: {
      API_KEY: process.env["LIVEKIT_API_KEY"] || "devkey",
      API_SECRET: process.env["LIVEKIT_API_SECRET"] || "secret",
      URL: process.env["LIVEKIT_URL"] || "wss://demo.livekit.cloud",
    },
  });
};
