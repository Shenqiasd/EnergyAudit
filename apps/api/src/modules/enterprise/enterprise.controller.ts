import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { AdmissionService } from './admission.service';
import { EnterpriseService } from './enterprise.service';
import { ExternalBindingService } from './external-binding.service';

import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';

import type { EnterpriseListQuery } from './enterprise.service';

@Roles('enterprise_user', 'manager')
@Controller('enterprises')
export class EnterpriseController {
  constructor(
    private readonly enterpriseService: EnterpriseService,
    private readonly admissionService: AdmissionService,
    private readonly externalBindingService: ExternalBindingService,
  ) {}

  @Post()
  async create(@Body() dto: CreateEnterpriseDto) {
    return this.enterpriseService.create(dto);
  }

  @Get()
  async findAll(@Query() query: EnterpriseListQuery) {
    return this.enterpriseService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.enterpriseService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEnterpriseDto) {
    return this.enterpriseService.update(id, dto);
  }

  @Put(':id/admission/approve')
  async approve(
    @Param('id') id: string,
    @Body() body: { operatedBy: string; reason?: string },
  ) {
    return this.admissionService.transition(id, 'approve', body.operatedBy, body.reason);
  }

  @Put(':id/admission/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { operatedBy: string; reason?: string },
  ) {
    return this.admissionService.transition(id, 'reject', body.operatedBy, body.reason);
  }

  @Put(':id/admission/suspend')
  async suspend(
    @Param('id') id: string,
    @Body() body: { operatedBy: string; reason?: string },
  ) {
    return this.admissionService.transition(id, 'suspend', body.operatedBy, body.reason);
  }

  @Put(':id/admission/restore')
  async restore(
    @Param('id') id: string,
    @Body() body: { operatedBy: string; reason?: string },
  ) {
    return this.admissionService.transition(id, 'restore', body.operatedBy, body.reason);
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    return this.externalBindingService.syncEnterprise(id);
  }

  @Get(':id/binding')
  async getBinding(@Param('id') id: string) {
    return this.externalBindingService.getBinding(id);
  }
}
