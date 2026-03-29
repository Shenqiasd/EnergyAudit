import { Module } from '@nestjs/common';

import { MasterDataController } from './master-data.controller';
import { DictionaryService } from './dictionary.service';
import { EnergyDefinitionService } from './energy-definition.service';
import { ProductDefinitionService } from './product-definition.service';
import { UnitDefinitionService } from './unit-definition.service';
import { CarbonEmissionFactorService } from './carbon-emission-factor.service';
import { ConfigCompletenessService } from './config-completeness.service';
import { BenchmarkService } from './benchmark.service';

@Module({
  controllers: [MasterDataController],
  providers: [
    DictionaryService,
    EnergyDefinitionService,
    ProductDefinitionService,
    UnitDefinitionService,
    CarbonEmissionFactorService,
    ConfigCompletenessService,
    BenchmarkService,
  ],
  exports: [
    DictionaryService,
    EnergyDefinitionService,
    ProductDefinitionService,
    UnitDefinitionService,
    CarbonEmissionFactorService,
    ConfigCompletenessService,
    BenchmarkService,
  ],
})
export class MasterDataModule {}
