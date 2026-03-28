import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { AuditProjectService } from './audit-project.service';
import { ProjectMemberService } from './project-member.service';

import type { AuditProjectListQuery, TransitionDto } from './audit-project.service';
import type { AddMemberDto } from './project-member.service';

@Controller('audit-projects')
export class AuditProjectController {
  constructor(
    private readonly projectService: AuditProjectService,
    private readonly memberService: ProjectMemberService,
  ) {}

  @Get()
  async findAll(@Query() query: AuditProjectListQuery) {
    return this.projectService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.projectService.findById(id);
  }

  @Put(':id/transition')
  async transition(@Param('id') id: string, @Body() dto: TransitionDto) {
    return this.projectService.transition(id, dto);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.memberService.getMembers(id);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.memberService.addMember(id, dto);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.memberService.removeMember(id, memberId);
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string) {
    return this.projectService.getTimeline(id);
  }
}
