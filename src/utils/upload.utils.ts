import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MESSAGES, TIME_IN_SECS } from "src/common/constants";
import { runMulter } from "src/config/upload.config";
import { RedisService } from "src/providers/redis";
import * as xlsx from "xlsx";

@Injectable()
export class UploadServices {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async readExcel(req: Request, key: string) {
    try {
      const file = await runMulter(req, "file");

      if (!file) {
        throw new BadRequestException(MESSAGES.ERROR.INVALID_UPLOAD_FILE);
      }

      const workbook = xlsx.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

      return [rows, file.buffer];
    } catch (error) {
      console.log("Error reading file ==>", error);
      throw error;
    }
  }

  writeExcel(fileBuffer: any, errorMap: any) {
    try {
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const json = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
      });

      json.forEach((row, idx) => {
        const rowNum = idx + 1;
        row.Errors = errorMap[rowNum]?.join("; ") || "";
      });

      const newSheet = xlsx.utils.json_to_sheet(json);
      workbook.Sheets[sheetName] = newSheet;

      const outBuffer = xlsx.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      return [outBuffer];
    } catch (error) {
      console.log("Error writing file ==>", error);
      throw error;
    }
  }

  generateCDNUrl(prefix: string, folderName: string, fileName: string) {
    try {
      return `${this.configService.get("SERVER.AWS_CDN")}/${prefix}/${folderName}/${fileName}`;
    } catch (error) {
      console.log("Error generating CDN ==>", error);
      throw error;
    }
  }
}
