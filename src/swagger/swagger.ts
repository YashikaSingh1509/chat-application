import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs";
import * as path from "path";
import { SWAGGER_CONFIG } from "./swagger.config";

/**
 * Creates an OpenAPI document for an application, via swagger.
 * @param app the nestjs application
 * @returns the OpenAPI document
 */
const apiDocumentationCredentials = {
  name: process.env.USER_NAME,
  pass: process.env.USER_PASS,
};
export function createDocument(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle(SWAGGER_CONFIG.TITLE)
    .setDescription(SWAGGER_CONFIG.DESCRIPTION)
    .setVersion(SWAGGER_CONFIG.VERSION)
    .addBasicAuth(
      {
        type: "http",
        scheme: "basic",
        description: "Basic authentication for API documentation access",
        name: "Authorization",
        in: "header",
      },
      "basic", // Auth scheme identifier
    )
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Bearer token for authentication",
        name: "Authorization",
        in: "header",
      },
      "bearer", // Auth scheme identifier
    );
  //add tags
  for (const tag of SWAGGER_CONFIG.tags) {
    const name = tag["name"];
    const description = tag["description"];
    options.addTag(name, description);
  }
  const config = options.build();

  const document = SwaggerModule.createDocument(app, config);

  const swaggerPath = path.resolve(process.cwd(), "swagger.json");
  fs.writeFileSync(swaggerPath, JSON.stringify(document, null, 2), {
    encoding: "utf8",
  });

  SwaggerModule.setup(SWAGGER_CONFIG.PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      deepObject: true,
    },
  });

  if (SWAGGER_CONFIG.PATH !== "api-docs") {
    SwaggerModule.setup("api-docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        deepObject: true,
      },
    });
  }
}

export function preAuthenticationDocs(app: INestApplication) {
  const httpAdapter = app.getHttpAdapter();

  httpAdapter.use("/api-docs", (req, res, next) => {
    function parseAuthHeader(input: string): { name: string; pass: string } {
      const [, encodedPart] = input.split(" ");

      const buff = Buffer.from(encodedPart, "base64");
      const text = buff.toString("ascii");
      const [name, pass] = text.split(":");

      return { name, pass };
    }

    function unauthorizedResponse(): void {
      if (httpAdapter.getType() === "fastify") {
        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", "Basic");
      } else {
        res.status(401);
        res.set("WWW-Authenticate", "Basic");
      }

      next();
    }

    if (!req.headers.authorization) {
      return unauthorizedResponse();
    }

    const credentials = parseAuthHeader(req.headers.authorization);

    if (
      credentials?.name !== apiDocumentationCredentials.name ||
      credentials?.pass !== apiDocumentationCredentials.pass
    ) {
      return unauthorizedResponse();
    }

    next();
  });
}
