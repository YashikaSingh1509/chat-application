// device-headers.decorator.ts
import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { BasicApiHeaders } from "./basicHeaders.decorator";

export function AuthApiHeader() {
  return applyDecorators(
    ApiBearerAuth("bearer"), // Use proper bearer auth

    // ApiHeader({
    //     name: 'Authorization',
    //     description: 'Bearer token for authentication',
    //     required: true,
    //     example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    // })
  );
}

export function AuthApiHeaders() {
  return applyDecorators(AuthApiHeader(), BasicApiHeaders());
}
