import { Module } from '@nestjs/common';
import { MONGOOSE_FEATURE } from './models';
import { MongoServiceModule } from './mongodb/mongo.module';
import { BaseRepository } from './repositories/base.repository';
import { AdminRepository } from './repositories/admin.repository';

@Module({
  imports: [MongoServiceModule, MONGOOSE_FEATURE],
  providers: [BaseRepository, AdminRepository],
  exports: [MongoServiceModule, MONGOOSE_FEATURE, BaseRepository, AdminRepository],
})
export class DataBaseModule {}
