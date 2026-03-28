import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { BusinessTypeService } from './business-type.service';

import type {
  CreateBusinessTypeDto,
  ModuleVisibilityDto,
  UpdateBusinessTypeDto,
} from './business-type.service';

@Controller('business-types')
export class BusinessTypeController {
  constructor(private readonly businessTypeService: BusinessTypeService) {}

  @Get()
  async getBusinessTypes() {
    return this.businessTypeService.getBusinessTypes();
  }

  @Post()
  async createBusinessType(@Body() dto: CreateBusinessTypeDto) {
    return this.businessTypeService.createBusinessType(dto);
  }

  @Get(':type/modules')
  async getModuleVisibility(@Param('type') type: string) {
    return this.businessTypeService.getModuleVisibility(type);
  }

  @Put(':type/modules')
  async setModuleVisibility(
    @Param('type') type: string,
    @Body() modules: ModuleVisibilityDto[],
  ) {
    return this.businessTypeService.setModuleVisibility(type, modules);
  }

  @Get(':type')
  async getBusinessType(@Param('type') type: string) {
    return this.businessTypeService.getBusinessType(type);
  }

  @Put(':type')
  async updateBusinessType(
    @Param('type') type: string,
    @Body() dto: UpdateBusinessTypeDto,
  ) {
    return this.businessTypeService.updateBusinessType(type, dto);
  }
}
