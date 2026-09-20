import { Global, Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { InjectConnection, MongooseModule } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { MongoConfigService } from "./mongo-config.service";

@Global()
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MongoConfigService,
    }),
  ],
  exports: [MongooseModule],
})
export class MongoServiceModule implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    if (this.connection.readyState === 1) {
      console.log("MongoDB connection established successfully.");
    } else {
      console.error("MongoDB connection is not ready.");
    }
  }
}
