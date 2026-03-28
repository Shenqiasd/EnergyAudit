import { Module } from '@nestjs/common';

import { UserAccountController } from './user-account.controller';
import { UserAccountService } from './user-account.service';

@Module({
  controllers: [UserAccountController],
  providers: [UserAccountService],
  exports: [UserAccountService],
})
export class UserModule {}
