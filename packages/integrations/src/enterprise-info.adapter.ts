export interface EnterpriseInfoDTO {
  creditCode: string;
  name: string;
  legalRepresentative: string;
  registeredCapital: string;
  establishDate: string;
  businessScope: string;
  registeredAddress: string;
  industryCode: string;
  industryName: string;
  contactPhone: string;
  contactEmail: string;
  status: string;
}

export interface SyncResult {
  status: 'success' | 'partial' | 'failed';
  data: EnterpriseInfoDTO | null;
  error: string | null;
  syncedAt: string;
}

export interface IEnterpriseInfoAdapter {
  fetchEnterpriseInfo(creditCode: string): Promise<EnterpriseInfoDTO>;
  syncEnterprise(enterpriseId: string): Promise<SyncResult>;
  checkConnection(): Promise<boolean>;
}

export const ENTERPRISE_INFO_ADAPTER = Symbol('ENTERPRISE_INFO_ADAPTER');
