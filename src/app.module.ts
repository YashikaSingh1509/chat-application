import { Module, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AcceptLanguageResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { configuration } from "./config/configuration";
import { DataBaseModule } from "./database";
import { AllExceptionsFilter } from "./middlewares/filters/exceptions.filter";
import { SimpleResponseInterceptor } from "./middlewares/interceptors/response.interceptor";
import { EncryptionModule } from "./providers/encryption";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { SocketModule } from "./modules/socket/socket.module";
import { LivekitModule } from "./modules/livekit/livekit.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: join(__dirname, "../src/", "/i18n/"),
        watch: true,
      },
      resolvers: [QueryResolver, AcceptLanguageResolver],
    }),
    DataBaseModule,
    EncryptionModule,
    // Assignment Feature Modules
    AuthModule,
    UsersModule,
    RoomsModule,
    SocketModule,
    LivekitModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SimpleResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    console.log("Chat application initialized successfully.");
  }
}
