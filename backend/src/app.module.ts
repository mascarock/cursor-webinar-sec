import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { FxModule } from './fx/fx.module';

@Module({
  imports: [DbModule, AuthModule, FxModule, GroupsModule],
})
export class AppModule {}
