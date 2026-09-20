import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import * as generatePassword from "generate-password";
import * as moment from "moment";
import {
  AWS_SECRET_MANGER,
  DEFAULT_LANGUAGE,
  DEFAULT_TIMEZONE,
} from "src/common/constants";

export const fetchSecrets = async () => {
  const nodeEnv = process.env["NODE_ENV"] || "dev";
  console.log(`Fetching secrets for environment: ${nodeEnv}`);
  const region = process.env["AWS_DEFAULT_REGION"] || "us-east-1";
  const secretName = process.env["AWS_SECRETS"] || `clearlink-${nodeEnv}`;
  console.log(`Using AWS region: ${region}`);
  console.log(`Using secret name: ${secretName}`);

  const client = new SecretsManagerClient({
    region,
  });

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    }),
  );

  const rawSecret = response.SecretString
    ? response.SecretString
    : response.SecretBinary
      ? Buffer.from(response.SecretBinary as Uint8Array).toString("utf-8")
      : "{}";

  const parsed = JSON.parse(rawSecret) as Record<string, unknown>;
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined || value === null) continue;
    normalized[key] = String(value);
  }

  return normalized;
};

let secretsLoadPromise: Promise<void> | null = null;

export const loadSecretsToProcessEnv = async () => {
  if (process.env["NODE_ENV"] === "local") {
    return;
  }

  if (!secretsLoadPromise) {
    secretsLoadPromise = (async () => {
      const secrets = await fetchSecrets();
      for (const envKey of Object.keys(secrets)) {
        const value = secrets[envKey];
        if (value !== undefined && value !== null && value !== "") {
          process.env[envKey] = String(value);
        }
      }
    })();
  }

  await secretsLoadPromise;
};

export const generateCode = (expiresIn: number = 3 * 60 * 1000) => {
  const code = Math.floor(1000 + Math.random() * 9000);
  const currentTimeStamp = moment.utc().valueOf();
  const expiry = currentTimeStamp + expiresIn;
  return { code, expiry };
};

export const generateStrongPassword = function (length) {
  const password = generatePassword.generate({
    length: length,
    numbers: true,
    uppercase: true,
    lowercase: true,
    symbols: true,
    exclude: ",+!*()_-{}[];'`:/?<>.\"|~",
    strict: true,
  });
  return password;
};

export const generateExpiryTime = function (value: number) {
  return Math.floor((Date.now() + value * 60 * 1000) / 1000);
};

export const generateOtp = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const toTitleCase = function (value: string) {
  return value.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

export const snakeCaseToTitleCase = function (value: string) {
  return toTitleCase(value.replace(/_/g, " "));
};

export const buildTokenData = (
  email,
  user,
  accessTokenKey,
  refreshTokenKey,
) => {
  return {
    email: email || "",
    userId: user.userId,
    accessTokenKey: accessTokenKey,
    refreshTokenKey: refreshTokenKey,
    type: user.type,
    userType: user.userType,
    deviceId: user.deviceId,
    deviceToken: user.deviceToken,
    deviceType: user.deviceType,
    created: new Date().getTime(),
    timezone: user.headers?.["timezone"] || user.timezone || DEFAULT_TIMEZONE,
    language: user.headers?.["language"] || user.language || DEFAULT_LANGUAGE,
    phoneNo: user.fullPhoneNo || "",
  };
};

export const buildTokenPayload = (data: any, accessTokenKey: string) => {
  return {
    userId: data.userId,
    deviceToken: data.deviceToken,
    aud: data.userType,
    sub: data.userId,
    deviceType: data.deviceType,
    deviceId: data.deviceId,
    type: data.type,
    iat: Math.floor(Date.now() / 1000),
    prm: accessTokenKey,
    userType: data.userType,
  };
};

export const getFullPhoneNo = (user: any) => {
  if (!user) {
    return "";
  }

  if (user.countryCode || user.phone) {
    return ((user.countryCode || "") + (user.phone || "")).trim();
  }

  return user.fullPhoneNo || "";
};
