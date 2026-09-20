// device-headers.decorator.ts
import { applyDecorators } from "@nestjs/common";
import { ApiHeader } from "@nestjs/swagger";
import { DEFAULT_LANGUAGE, DEFAULT_TIMEZONE, PLATFORM } from "../constants";

export function BasicApiHeaders() {
  return applyDecorators(
    ApiHeader({
      name: "deviceId",
      description: "Device identifier",
      required: true,
      example: "abcd1234",
    }),
    ApiHeader({
      name: "deviceType",
      description: "Type of deviceType.",
      enum: Object.values(PLATFORM),
      required: true,
    }),
    ApiHeader({
      name: "deviceToken",
      description: "Device token for push notifications",
      required: false,
    }),
    ApiHeader({
      name: "timezone",
      description: "Device timezone",
      required: false,
      example: DEFAULT_TIMEZONE,
    }),
    ApiHeader({
      name: "language",
      description: "Language preference",
      required: false,
      example: DEFAULT_LANGUAGE,
    }),
  );
}
