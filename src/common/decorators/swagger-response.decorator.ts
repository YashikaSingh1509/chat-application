import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

export function SwaggerResponseDto() {
  return applyDecorators(
    ApiOkResponse({
      description: "Success",
    }),
    ApiCreatedResponse({
      description: "Created",
    }),
    ApiBadRequestResponse({
      description: "Bad Request",
    }),
    ApiNotFoundResponse({
      description: "Not Found",
    }),
    ApiUnauthorizedResponse({
      description: "Unauthorized",
    }),
    ApiInternalServerErrorResponse({
      description: "Internal Server Error",
    }),
  );
}
