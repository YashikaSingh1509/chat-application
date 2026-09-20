import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { I18nContext } from "nestjs-i18n";
import { EncryptionService } from "src/providers/encryption/encryption.service";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private httpAdapterHost: HttpAdapterHost,
    private readonly encryptionService: EncryptionService,
  ) {}
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception);
    const ctx = host.switchToHttp();
    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let type: string | string[];
    let error = "SOMETHING_WENT_WRONG";
    let msg = exception?.["response"]?.message ?? exception;
    let msgType;
    const { httpAdapter } = this.httpAdapterHost;
    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const req = ctx.getRequest();
      status = res["statusCode"] ? res["statusCode"] : status;
      const i18n = I18nContext.current();
      if (i18n) {
        type = res["message"];
        if (type instanceof Array) {
          msg = type[0];
        } else if (type) {
          const lang = req.headers["language"] || I18nContext.current().lang;
          // const lang = i18n.lang;
          if (path.includes("clinician/view-profile?redirect=login")) {
            console.log(type);
            type = "TOKEN_EXPIRED_CLINICIAN_VIEW_PROFILE";
          }
          msgType = type;
          // if translateMsgType is undefined i.e(en.undefined) then set msgType
          const translateMsgType = `${lang}.${msgType}`;
          const translatedMsg: string = i18n.t(translateMsgType, {
            lang: lang,
          }) as string;
          const message =
            translatedMsg !== translateMsgType ? translatedMsg : msgType;
          msg = message as string;
        }
      }
      error = res["error"];
    }

    // Derive semantic errorCode
    let errorCode = "INTERNAL_SERVER_ERROR";
    if (exception instanceof HttpException) {
      const res: any = exception.getResponse();
      if (typeof res === "object" && res?.errorCode) {
        errorCode = res.errorCode;
      } else if (typeof res === "object" && res?.error) {
        errorCode = String(res.error).toUpperCase().replace(/\s+/g, "_");
      } else {
        switch (status) {
          case HttpStatus.BAD_REQUEST:
            errorCode = "BAD_REQUEST";
            break;
          case HttpStatus.UNAUTHORIZED:
            errorCode = "UNAUTHORIZED";
            break;
          case HttpStatus.FORBIDDEN:
            errorCode = "FORBIDDEN";
            break;
          case HttpStatus.NOT_FOUND:
            errorCode = "NOT_FOUND";
            break;
          case HttpStatus.CONFLICT:
            errorCode = "CONFLICT";
            break;
          default:
            errorCode = `HTTP_${status}`;
        }
      }
    }

    const messageStr =
      typeof msg === "string"
        ? msg
        : Array.isArray(msg)
          ? msg[0]
          : typeof msg === "object" && msg?.message
            ? msg.message
            : "An error occurred";

    // Semantic error code refinements
    if (typeof messageStr === "string") {
      const lower = messageStr.toLowerCase();
      if (
        lower.includes("room") &&
        (status === HttpStatus.NOT_FOUND || lower.includes("not found"))
      ) {
        errorCode = "ROOM_NOT_FOUND";
      } else if (
        lower.includes("user") &&
        (status === HttpStatus.NOT_FOUND || lower.includes("not found"))
      ) {
        errorCode = "USER_NOT_FOUND";
      }
    }

    // Prepare the standardized response body
    const responseBody = {
      success: false,
      message: messageStr,
      errorCode,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    // Log the error response
    this.logger.error(responseBody);

    // Send the response
    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
