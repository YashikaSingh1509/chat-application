import { Injectable, Logger, Post } from "@nestjs/common";

import * as CryptoJS from "crypto-js";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EncryptionService {
  constructor(private readonly configService: ConfigService) {}

  encryptData(payload: string): any {
    const SECRET_KEY = CryptoJS.enc.Utf8.parse(
      this.configService.get("SECRET_KEY"),
    );
    const iv = CryptoJS.enc.Utf8.parse(this.configService.get("SECRET_IV"));
    const encodedPayload = CryptoJS.AES.encrypt(payload, SECRET_KEY, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    }).toString();

    return encodedPayload;
  }

  decryptData(encryptData: string) {
    const SECRET_KEY = CryptoJS.enc.Utf8.parse(
      this.configService.get("SECRET_KEY"),
    );
    const iv = CryptoJS.enc.Utf8.parse(this.configService.get("SECRET_IV"));
    const decrypted = CryptoJS.AES.decrypt(encryptData, SECRET_KEY, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
      keySize: 128 / 8,
    });
    const result = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    return result;
  }
}
