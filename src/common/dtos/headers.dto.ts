import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_TIMEZONE,
  LANGUAGES,
  PLATFORM,
} from "../constants";

export class DeviceParamsDto {
  @ApiProperty({
    description: "Type of the device",
    enum: Object.values(PLATFORM),
    example: PLATFORM.ANDROID,
  })
  @IsNotEmpty()
  @IsIn(Object.values(PLATFORM))
  readonly deviceType: string;

  @ApiProperty({
    description: "Device identifier",
    example: "abcd1234",
  })
  @IsString()
  @IsNotEmpty()
  readonly deviceId: string;

  @ApiProperty({
    description: "Timezone of the device",
    example: "IST",
  })
  @IsString()
  @IsNotEmpty()
  readonly timeZone?: string;

  @ApiProperty({
    name: "language",
    description: "Language preference for response",
    enum: LANGUAGES,
    example: "en",
  })
  @IsString()
  @IsNotEmpty()
  readonly language?: string;

  @IsString()
  @IsOptional()
  deviceToken?: string;

  @IsString()
  @IsOptional()
  remoteAddress?: string;

  @IsString()
  @IsOptional()
  readonly authorization?: string;
}

export const DeviceParams = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    return {
      authorization: headers["authorization"] || headers["Authorization"],
      deviceId: headers["deviceId"] || headers["deviceid"],
      deviceToken: headers["deviceToken"] || headers["devicetoken"],
      deviceType: headers["deviceType"] || headers["devicetype"],
      timezone: headers["timezone"] || DEFAULT_TIMEZONE,
      language: headers["language"] || DEFAULT_LANGUAGE,
      remoteAddress: request.ip || request.connection.remoteAddress,
    };
  },
);
