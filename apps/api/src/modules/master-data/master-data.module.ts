import { Module } from '@nestjs/common';

import { MasterDataController } from './master-data.controller';
import { DictionaryService } from './dictionary.service';
import { EnergyDefinitionService } from './energy-definition.service';
import { ProductDefinitionService } from './product-definition.service';
import { UnitDefinitionService } from './unit-definition.service';
import { CarbonEmissionFactorService } from './carbon-emission-factor.service';
import { ConfigCompletenessService } from './config-completeness.service';
import { ConfigOverrideService } from './config-override.service';

@Module({
  controllers: [MasterDataController],
  providers: [
    DictionaryService,
    EnergyDefinitionService,
    ProductDefinitionService,
    UnitDefinitionService,
    CarbonEmissionFactorService,
    ConfigCompletenessService,
    ConfigOverrideService,
  ],
  exports: [
    DictionaryService,
    EnergyDefinitionService,
    ProductDefinitionService,
    UnitDefinitionService,
    CarbonEmissionFactorService,
    ConfigCompletenessService,
    ConfigOverrideService,
  ],
})
export class MasterDataModule {}
