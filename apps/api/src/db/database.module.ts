import { Global, Module } from '@nestjs/common';

import { DRIZZLE } from './db.constants';
import { drizzleProvider } from './drizzle.provider';

export { DRIZZLE };

@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
