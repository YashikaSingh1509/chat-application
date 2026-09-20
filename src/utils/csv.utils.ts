import { Readable } from "stream";
 
import csvParser = require("csv-parser");
import { Parser } from "json2csv";

export async function parseCsvBuffer(
  buffer: Buffer,
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    Readable.from(buffer)
      .pipe(csvParser({ mapHeaders: ({ header }: { header: string }) => header.replace(/\*/g, "").trim() }))
      .on("data", (row: Record<string, string>) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

export function generateCsv(
  fields: string[],
  data: Record<string, unknown>[],
): string {
  const parser = new Parser({ fields });
  return parser.parse(data);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
