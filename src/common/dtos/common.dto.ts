import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsEnum } from "class-validator";
import { STATUS } from "../constants";

export class ListingDto {
  /**
   * The page number to return. Defaults to 1.
   */
  @ApiProperty({ type: "number", example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageNo?: number;

  /**
   * The maximum number of results to return per page. Defaults to 10.
   */
  @ApiProperty({ type: "number", example: 10, default: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  /**
   * The maximum number of results to return per page. Defaults to 10.
   */
  @ApiPropertyOptional({ type: "number", example: Date.now() })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  fromDate?: number;

  /**
   * The maximum number of results to return per page. Defaults to 10.
   */
  @ApiPropertyOptional({ type: "number", example: Date.now() })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  toDate?: number;

  @ApiPropertyOptional({
    name: "status",
    type: "string",
    enum: [...Object.values(STATUS)],
  })
  @IsOptional()
  @IsString()
  @IsEnum(Object.values(STATUS))
  status?: string;

  @ApiPropertyOptional({
    name: "searchKey",
    type: "string",
  })
  @IsOptional()
  @IsString()
  searchKey?: string;
}
