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
import { ConfigOverrideService } from './config-override.service';
import { BenchmarkService } from './benchmark.service';

import type { CreateDictionaryDto, UpdateDictionaryDto } from './dictionary.service';
import type { CreateEnergyDefinitionDto, UpdateEnergyDefinitionDto } from './energy-definition.service';
import type { CreateProductDefinitionDto, UpdateProductDefinitionDto } from './product-definition.service';
import type { CreateUnitDefinitionDto, UpdateUnitDefinitionDto } from './unit-definition.service';
import type { CreateCarbonEmissionFactorDto, UpdateCarbonEmissionFactorDto } from './carbon-emission-factor.service';
import type { SetOverrideDto } from './config-override.service';
import type { CreateBenchmarkDto, UpdateBenchmarkDto } from './benchmark.service';

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
    private readonly configOverrideService: ConfigOverrideService,
    private readonly benchmarkService: BenchmarkService,
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

  // ==================== Config Overrides ====================

  @Get('config-overrides')
  getConfigOverrides(
    @Query('scopeType') scopeType: string,
    @Query('scopeId') scopeId?: string,
    @Query('targetType') targetType?: string,
  ) {
    return this.configOverrideService.getOverrides(scopeType, scopeId, targetType);
  }

  @Put('config-overrides')
  setConfigOverride(@Body() dto: SetOverrideDto) {
    return this.configOverrideService.setOverride(dto);
  }

  @Delete('config-overrides/:id')
  deleteConfigOverride(@Param('id') id: string) {
    return this.configOverrideService.deleteOverride(id);
  }

  @Get('config-effective/:moduleCode')
  getEffectiveConfig(
    @Param('moduleCode') moduleCode: string,
    @Query('enterpriseId') enterpriseId?: string,
    @Query('batchId') batchId?: string,
    @Query('industryCode') industryCode?: string,
  ) {
    return this.configOverrideService.getEffectiveConfig(moduleCode, {
      enterpriseId,
      batchId,
      industryCode,
    });
  }

  // ==================== Benchmarks ====================

  @Get('benchmarks')
  getBenchmarks(
    @Query('industryCode') industryCode?: string,
    @Query('indicatorCode') indicatorCode?: string,
    @Query('applicableYear') applicableYear?: string,
  ) {
    return this.benchmarkService.findAll({
      industryCode,
      indicatorCode,
      applicableYear: applicableYear ? parseInt(applicableYear, 10) : undefined,
    });
  }

  @Post('benchmarks')
  createBenchmark(@Body() dto: CreateBenchmarkDto) {
    return this.benchmarkService.create(dto);
  }

  @Put('benchmarks/:id')
  updateBenchmark(@Param('id') id: string, @Body() dto: UpdateBenchmarkDto) {
    return this.benchmarkService.update(id, dto);
  }

  @Delete('benchmarks/:id')
  deleteBenchmark(@Param('id') id: string) {
    return this.benchmarkService.delete(id);
  }

  @Get('benchmarks/industry/:industryCode')
  getBenchmarksByIndustry(
    @Param('industryCode') industryCode: string,
    @Query('applicableYear') applicableYear?: string,
  ) {
    return this.benchmarkService.findByIndustry(
      industryCode,
      applicableYear ? parseInt(applicableYear, 10) : undefined,
    );
  }

  @Get('benchmarks/compare/:enterpriseId/:projectId')
  compareBenchmark(
    @Param('enterpriseId') enterpriseId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.benchmarkService.compareEnterprise(enterpriseId, projectId);
  }
}
