// src/modules/role/dtos/pagination.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { STATUS } from "../constants";

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: "Page number",
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of items per page",
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Search by name (case-insensitive)",
    example: "abc",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort by field",
    enum: [
      "createdAt",
      "name",
      /* 'totalUser', */ "permissionCount",
      "updatedAt",
    ],
    default: "createdAt",
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "DESC";

  @ApiPropertyOptional({
    description: "Status filter",
    enum: Object.values(STATUS),
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "Created from date (YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: "Created to date (YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  createdTo?: string;
}
