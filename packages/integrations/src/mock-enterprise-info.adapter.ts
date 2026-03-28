import type { EnterpriseInfoDTO, IEnterpriseInfoAdapter, SyncResult } from './enterprise-info.adapter';

const MOCK_ENTERPRISES: Record<string, EnterpriseInfoDTO> = {
  '91110000MA01ABCD12': {
    creditCode: '91110000MA01ABCD12',
    name: '北京华能热力有限公司',
    legalRepresentative: '张三',
    registeredCapital: '5000万元',
    establishDate: '2010-03-15',
    businessScope: '热力供应、能源技术咨询',
    registeredAddress: '北京市朝阳区能源大厦A座',
    industryCode: 'D4430',
    industryName: '热力生产和供应',
    contactPhone: '010-88886666',
    contactEmail: 'contact@huaneng-heat.com',
    status: 'active',
  },
  '91310000MA06WXYZ78': {
    creditCode: '91310000MA06WXYZ78',
    name: '上海绿能环保科技有限公司',
    legalRepresentative: '李四',
    registeredCapital: '3000万元',
    establishDate: '2015-07-20',
    businessScope: '环保技术开发、节能技术咨询',
    registeredAddress: '上海市浦东新区科技园B栋',
    industryCode: 'M7490',
    industryName: '其他专业技术服务',
    contactPhone: '021-66668888',
    contactEmail: 'info@greentech-sh.com',
    status: 'active',
  },
};

export class MockEnterpriseInfoAdapter implements IEnterpriseInfoAdapter {
  private failureRate: number;

  constructor(failureRate = 0) {
    this.failureRate = Math.max(0, Math.min(1, failureRate));
  }

  private shouldFail(): boolean {
    return Math.random() < this.failureRate;
  }

  async fetchEnterpriseInfo(creditCode: string): Promise<EnterpriseInfoDTO> {
    await this.simulateDelay();

    if (this.shouldFail()) {
      throw new Error('模拟外部系统连接失败');
    }

    const info = MOCK_ENTERPRISES[creditCode];
    if (info) {
      return { ...info };
    }

    return {
      creditCode,
      name: `模拟企业_${creditCode.slice(-6)}`,
      legalRepresentative: '模拟法人',
      registeredCapital: '1000万元',
      establishDate: '2020-01-01',
      businessScope: '能源相关业务',
      registeredAddress: '模拟地址',
      industryCode: 'D4400',
      industryName: '电力、热力生产和供应',
      contactPhone: '400-000-0000',
      contactEmail: 'mock@example.com',
      status: 'active',
    };
  }

  async syncEnterprise(enterpriseId: string): Promise<SyncResult> {
    await this.simulateDelay();

    if (this.shouldFail()) {
      return {
        status: 'failed',
        data: null,
        error: '模拟同步失败：外部系统不可用',
        syncedAt: new Date().toISOString(),
      };
    }

    const mockData: EnterpriseInfoDTO = {
      creditCode: `MOCK_${enterpriseId}`,
      name: `同步企业_${enterpriseId.slice(-6)}`,
      legalRepresentative: '同步法人',
      registeredCapital: '2000万元',
      establishDate: '2018-06-01',
      businessScope: '能源审计相关',
      registeredAddress: '同步地址',
      industryCode: 'D4430',
      industryName: '热力生产和供应',
      contactPhone: '400-111-2222',
      contactEmail: 'sync@example.com',
      status: 'active',
    };

    return {
      status: 'success',
      data: mockData,
      error: null,
      syncedAt: new Date().toISOString(),
    };
  }

  async checkConnection(): Promise<boolean> {
    await this.simulateDelay();
    return !this.shouldFail();
  }

  private simulateDelay(): Promise<void> {
    const delay = 50 + Math.random() * 150;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
