import * as bcrypt from "bcrypt";

interface HashResult {
  salt: string;
  password: string;
}

export class Password {
  static async toHash(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  static async compare(
    storedPassword: string,
    suppliedPassword: string,
    salt: string,
  ): Promise<boolean> {
    const hash = await bcrypt.hash(suppliedPassword, salt);
    return storedPassword === hash;
  }

  static async hash(password: string): Promise<HashResult> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    return { salt, password: hash };
  }
}
