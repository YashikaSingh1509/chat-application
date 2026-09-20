import { regexContains } from "src/utils/mongo.utils";

/**
 * Splits a comma-separated search string into distinct trimmed terms.
 */
export const extractSearchTerms = (input?: string): string[] => {
  if (!input) return [];
  return input
    .split(",")
    .map((term) => term?.trim())
    .filter(Boolean)
    .filter((term, index, self) => self.indexOf(term) === index);
};

/** MongoDB `$or` of regex contains on string fields (multi-term, multi-column). */
export function buildMongoOrFromSearch(
  fields: string[],
  search?: string,
): Record<string, unknown> | null {
  const terms = extractSearchTerms(search);
  if (!fields.length || !terms.length) return null;
  const or: Record<string, unknown>[] = [];
  for (const term of terms) {
    const re = regexContains(term);
    for (const f of fields) {
      or.push({ [f]: re });
    }
  }
  return { $or: or };
}
