import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { MESSAGES } from "src/common/constants";

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const i18n = I18nContext.current();
    const lang = request.headers["language"] || I18nContext.current().lang;
    let translatedMsg: string = i18n.t(
      `${lang}.${MESSAGES.ERROR.DEFAULT}`,
    ) as string;

    return next.handle().pipe(
      catchError((err) => {
        // Log the error
        this.logger.error("Error intercepted:", err);

        if (err instanceof HttpException) {
          return throwError(() => err);
        }

        if (err.message) {
          const code = `${lang}.${err.message}`;
          const message = i18n.t(code) as string;
          if (message !== code) translatedMsg = message;
        }

        return throwError(() => translatedMsg);
      }),
    );
  }
}
