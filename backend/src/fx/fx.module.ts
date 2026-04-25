import { Global, Module } from '@nestjs/common';
import { FxService } from './fx.service';

@Global()
@Module({
  providers: [FxService],
  exports: [FxService],
})
export class FxModule {}
