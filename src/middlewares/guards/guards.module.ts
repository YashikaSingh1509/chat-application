import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { SuperAdminGuard } from "./super-admin.guard";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRATION"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SuperAdminGuard],
  exports: [JwtModule, SuperAdminGuard],
})
export class GuardsModule {}
