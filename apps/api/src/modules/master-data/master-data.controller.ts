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

import { Roles } from '../auth/roles.decorator';
import { DictionaryService } from './dictionary.service';
import { EnergyDefinitionService } from './energy-definition.service';
import { ProductDefinitionService } from './product-definition.service';
import { UnitDefinitionService } from './unit-definition.service';
import { CarbonEmissionFactorService } from './carbon-emission-factor.service';
import { ConfigCompletenessService } from './config-completeness.service';

import type { CreateDictionaryDto, UpdateDictionaryDto } from './dictionary.service';
import type { CreateEnergyDefinitionDto, UpdateEnergyDefinitionDto } from './energy-definition.service';
import type { CreateProductDefinitionDto, UpdateProductDefinitionDto } from './product-definition.service';
import type { CreateUnitDefinitionDto, UpdateUnitDefinitionDto } from './unit-definition.service';
import type { CreateCarbonEmissionFactorDto, UpdateCarbonEmissionFactorDto } from './carbon-emission-factor.service';

@Roles('enterprise_user', 'manager')
@Controller()
export class MasterDataController {
  constructor(
    private readonly dictionaryService: DictionaryService,
    private readonly energyDefinitionService: EnergyDefinitionService,
    private readonly productDefinitionService: ProductDefinitionService,
    private readonly unitDefinitionService: UnitDefinitionService,
    private readonly carbonEmissionFactorService: CarbonEmissionFactorService,
    private readonly configCompletenessService: ConfigCompletenessService,
  ) {}

  // ==================== Dictionaries ====================

  @Get('dictionaries')
  getDictionaries(@Query('category') category: string) {
    return this.dictionaryService.findByCategory(category);
  }

  @Post('dictionaries')
  createDictionary(@Body() dto: CreateDictionaryDto) {
    return this.dictionaryService.create(dto);
  }

  @Put('dictionaries/:id')
  updateDictionary(@Param('id') id: string, @Body() dto: UpdateDictionaryDto) {
    return this.dictionaryService.update(id, dto);
  }

  @Delete('dictionaries/:id')
  deleteDictionary(@Param('id') id: string) {
    return this.dictionaryService.delete(id);
  }

  // ==================== Energy Definitions ====================

  @Get('enterprises/:enterpriseId/energy-definitions')
  getEnergyDefinitions(@Param('enterpriseId') enterpriseId: string) {
    return this.energyDefinitionService.findByEnterprise(enterpriseId);
  }

  @Post('enterprises/:enterpriseId/energy-definitions')
  createEnergyDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Body() dto: CreateEnergyDefinitionDto,
  ) {
    return this.energyDefinitionService.create(enterpriseId, dto);
  }

  @Put('enterprises/:enterpriseId/energy-definitions/:id')
  updateEnergyDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEnergyDefinitionDto,
  ) {
    return this.energyDefinitionService.update(enterpriseId, id, dto);
  }

  @Delete('enterprises/:enterpriseId/energy-definitions/:id')
  deleteEnergyDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Param('id') id: string,
  ) {
    return this.energyDefinitionService.delete(enterpriseId, id);
  }

  // ==================== Product Definitions ====================

  @Get('enterprises/:enterpriseId/product-definitions')
  getProductDefinitions(@Param('enterpriseId') enterpriseId: string) {
    return this.productDefinitionService.findByEnterprise(enterpriseId);
  }

  @Post('enterprises/:enterpriseId/product-definitions')
  createProductDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Body() dto: CreateProductDefinitionDto,
  ) {
    return this.productDefinitionService.create(enterpriseId, dto);
  }

  @Put('enterprises/:enterpriseId/product-definitions/:id')
  updateProductDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDefinitionDto,
  ) {
    return this.productDefinitionService.update(enterpriseId, id, dto);
  }

  @Delete('enterprises/:enterpriseId/product-definitions/:id')
  deleteProductDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Param('id') id: string,
  ) {
    return this.productDefinitionService.delete(enterpriseId, id);
  }

  // ==================== Unit Definitions ====================

  @Get('enterprises/:enterpriseId/unit-definitions')
  getUnitDefinitions(@Param('enterpriseId') enterpriseId: string) {
    return this.unitDefinitionService.findByEnterprise(enterpriseId);
  }

  @Post('enterprises/:enterpriseId/unit-definitions')
  createUnitDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Body() dto: CreateUnitDefinitionDto,
  ) {
    return this.unitDefinitionService.create(enterpriseId, dto);
  }

  @Put('enterprises/:enterpriseId/unit-definitions/:id')
  updateUnitDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDefinitionDto,
  ) {
    return this.unitDefinitionService.update(enterpriseId, id, dto);
  }

  @Delete('enterprises/:enterpriseId/unit-definitions/:id')
  deleteUnitDefinition(
    @Param('enterpriseId') enterpriseId: string,
    @Param('id') id: string,
  ) {
    return this.unitDefinitionService.delete(enterpriseId, id);
  }

  // ==================== Carbon Emission Factors ====================

  @Get('carbon-emission-factors')
  getCarbonEmissionFactors(@Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.carbonEmissionFactorService.findAll(yearNum);
  }

  @Post('carbon-emission-factors')
  createCarbonEmissionFactor(@Body() dto: CreateCarbonEmissionFactorDto) {
    return this.carbonEmissionFactorService.create(dto);
  }

  @Put('carbon-emission-factors/:id')
  updateCarbonEmissionFactor(
    @Param('id') id: string,
    @Body() dto: UpdateCarbonEmissionFactorDto,
  ) {
    return this.carbonEmissionFactorService.update(id, dto);
  }

  // ==================== Config Completeness ====================

  @Get('enterprises/:enterpriseId/config-completeness')
  getConfigCompleteness(@Param('enterpriseId') enterpriseId: string) {
    return this.configCompletenessService.check(enterpriseId);
  }
}
