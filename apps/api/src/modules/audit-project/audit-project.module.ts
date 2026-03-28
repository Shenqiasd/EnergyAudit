import { Module } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module';
import { AuditProjectController } from './audit-project.controller';
import { AuditProjectService } from './audit-project.service';
import { ProjectMemberService } from './project-member.service';

@Module({
  imports: [NotificationModule],
  controllers: [AuditProjectController],
  providers: [AuditProjectService, ProjectMemberService],
  exports: [AuditProjectService, ProjectMemberService],
})
export class AuditProjectModule {}
