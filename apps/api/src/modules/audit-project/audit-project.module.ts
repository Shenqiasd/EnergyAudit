import { Module } from '@nestjs/common';

import { AuditProjectController } from './audit-project.controller';
import { AuditProjectService } from './audit-project.service';
import { ProjectMemberService } from './project-member.service';

@Module({
  controllers: [AuditProjectController],
  providers: [AuditProjectService, ProjectMemberService],
  exports: [AuditProjectService, ProjectMemberService],
})
export class AuditProjectModule {}
