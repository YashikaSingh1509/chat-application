import compression from "@fastify/compress";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { ErrorInterceptor } from "./middlewares/interceptors/error.interceptor";
import { createDocument, preAuthenticationDocs, SWAGGER_CONFIG } from "./swagger";
import { IoAdapter } from "@nestjs/platform-socket.io";

import { contentParser } from "fastify-multer";
import { join } from "path";
import { loadSecretsToProcessEnv } from "./utils";

async function bootstrap() {
  await loadSecretsToProcessEnv();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 104857600, // 100 MB in bytes
      logger: {
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "SYS:standard",
          },
        },
      },
    }),
  );

  // Register the compression await app.register(compression, { encodings: ['gzip', 'deflate'] });
  await app.register(compression, { encodings: ["gzip", "deflate"] });

  app.register(contentParser);

  // Global configurations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({
    origin: "*",
    allowedHeaders: [
      "X-Requested-With",
      "X-HTTP-Method-Override",
      "Content-Type",
      "Accept",
      "Observe",
      "deviceId",
      "deviceType",
      "deviceToken",
      "language",
      "timeZone",
      "timezone",
      "Authorization",
      "api_key",
      "*",
    ],
    methods: "GET,PUT,POST,DELETE,UPDATE,PATCH,OPTIONS",
  });

  // Listen on configured port
  const configService = app.get(ConfigService);
  const port =
    configService.get("PORT") ||
    process.env["PORT"] ||
    process.env["ADMIN_PORT"] ||
    3005;
  const serviceUrl = configService.get("SERVICE_URL");
  const serviceName = configService.get("SERVICE_NAME") || "admin";

  app.setGlobalPrefix(`/${serviceName.toLowerCase()}/api/v1`);

  app.useGlobalInterceptors(
    new ErrorInterceptor(),
    // new SimpleResponseInterceptor(app.get(Reflector)),
  );

  app.useStaticAssets({
    root: join(__dirname, "../uploads"),
  });

  // Swagger setup
  createDocument(app);
  preAuthenticationDocs(app);

  await app.listen(port, "0.0.0.0");

  const localUrl = `http://localhost:${port}`;
  const swaggerPath = SWAGGER_CONFIG?.PATH || `${serviceName.toLowerCase()}/api-docs`;
  const primarySwaggerUrl = `${localUrl}/${swaggerPath}`;
  const directSwaggerUrl = `${localUrl}/api-docs`;

  const logger = new Logger("Swagger");
  logger.log(`📚 Swagger UI Documentation: ${primarySwaggerUrl}`);
  logger.log(`📚 Direct Swagger URL:       ${directSwaggerUrl}`);

  console.log(`\n================================================================`);
  console.log(`🚀 APPLICATION SERVER RUNNING ON: ${localUrl}`);
  console.log(`📚 SWAGGER DOCUMENTATION URL:    ${primarySwaggerUrl}`);
  console.log(`📚 ALTERNATIVE SWAGGER URL:      ${directSwaggerUrl}`);
  if (serviceUrl) {
    console.log(`🌐 SERVICE URL:                  ${serviceUrl}`);
  }
  console.log(`================================================================\n`);
}
bootstrap();
