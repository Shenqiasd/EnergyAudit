import { Module } from '@nestjs/common';

import { AdmissionService } from './admission.service';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';
import { ExternalBindingService } from './external-binding.service';

@Module({
  controllers: [EnterpriseController],
  providers: [EnterpriseService, AdmissionService, ExternalBindingService],
  exports: [EnterpriseService, AdmissionService, ExternalBindingService],
})
export class EnterpriseModule {}
