import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { I18nContext } from "nestjs-i18n";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseMessageKey } from "../../common/decorators/response-message.decorator"; // Import custom decorator

@Injectable()
export class SimpleResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseObject<T>
> {
  private readonly logger = new Logger(SimpleResponseInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseObject<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const i18n = I18nContext.current();
    const lang = request.headers["language"] || I18nContext.current().lang;
    const statusCode = response.statusCode || 200; // Default to 200 if not set

    // Log incoming request with headers
    this.logRequestDetails(request);

    // Retrieve the message key from the @ResponseMessage decorator
    const messageKey = this.reflector.get<string>(
      ResponseMessageKey,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((_data) => {
        // If data is already standardized ({ success: true, data: ... })
        if (_data && typeof _data === "object" && "success" in _data) {
          return _data;
        }

        // If legacy [message, data] array pattern
        if (
          Array.isArray(_data) &&
          _data.length >= 2 &&
          typeof _data[0] === "string"
        ) {
          const [message, data] = _data;
          const code = (message || messageKey)?.toUpperCase();
          return {
            success: true,
            statusCode,
            message,
            code,
            data,
          } as any;
        }

        // Standardize all standard responses
        return {
          success: true,
          data: _data,
        } as any;
      }),
    );
  }

  private logRequestDetails(request: any): void {
    // Create a safe copy of headers (masking sensitive information)
    const safeHeaders = this.sanitizeHeaders(request.headers);

    const requestInfo = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      route: request.routerPath || request.route?.path,
      ip: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers["user-agent"],
      contentType: request.headers["content-type"],
      headers: safeHeaders,
      query: request.query,
      params: request.params,
    };

    this.logger.log(
      `Incoming Request: ${JSON.stringify(requestInfo, null, 2)}`,
    );
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = [
      "authorization",
      "cookie",
      "x-api-key",
      "x-auth-token",
    ];
    const safeHeaders = { ...headers };

    sensitiveHeaders.forEach((header) => {
      if (safeHeaders[header]) {
        safeHeaders[header] = "[MASKED]";
      }
    });

    return safeHeaders;
  }
}
