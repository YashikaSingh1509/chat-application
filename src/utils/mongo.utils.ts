import { BadRequestException } from "@nestjs/common";
import { FilterQuery, Types } from "mongoose";

export function parseObjectId(value: string, field = "id"): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException(`Invalid ${field}`);
  }
  return new Types.ObjectId(value);
}

export function tryObjectId(value: string): Types.ObjectId | undefined {
  if (!value || !Types.ObjectId.isValid(value)) return undefined;
  return new Types.ObjectId(value);
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function regexContains(term: string): RegExp {
  return new RegExp(escapeRegex(term), "i");
}

export function orRegexFields<T>(
  fields: (keyof T & string)[],
  terms: string[],
): FilterQuery<T>[] {
  if (!terms.length || !fields.length) return [];
  const out: FilterQuery<T>[] = [];
  for (const term of terms) {
    for (const field of fields) {
      out.push({ [field]: regexContains(term) } as FilterQuery<T>);
    }
  }
  return out;
}
