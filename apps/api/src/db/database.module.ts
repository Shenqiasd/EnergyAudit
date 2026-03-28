import { Global, Module } from '@nestjs/common';

import { drizzleProvider } from './drizzle.provider';

export const DRIZZLE = Symbol('DRIZZLE');

@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
