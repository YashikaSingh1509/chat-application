import {
  CallHandler,
  ExecutionContext,
  mixin,
  NestInterceptor,
  Type,
} from "@nestjs/common";
import multer from "fastify-multer";
import { Options } from "fastify-multer/lib/interfaces";
import { Observable } from "rxjs";

const DEFAULT_OPTIONS: Options = {
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};

export function FastifyFileInterceptor(
  fieldName: string,
  options: Options = {},
): Type<NestInterceptor> {
  class MixinInterceptor implements NestInterceptor {
    private readonly upload = multer({ ...DEFAULT_OPTIONS, ...options });

    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<any>> {
      const req = context.switchToHttp().getRequest();
      const reply = context.switchToHttp().getResponse();

      const handler = this.upload.single(fieldName) as (
        req: any,
        reply: any,
        done: (err?: any) => void,
      ) => void;

      await new Promise<void>((resolve, reject) => {
        handler(req, reply, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return next.handle();
    }
  }

  return mixin(MixinInterceptor);
}
