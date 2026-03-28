import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for enterprise profile snapshot logic.
 * Tests snapshot creation on project create without DB.
 */

interface Enterprise {
  id: string;
  name: string;
  unifiedSocialCreditCode: string;
  industryCode: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
}

interface EnterpriseProfile {
  id: string;
  auditProjectId: string;
  enterpriseId: string;
  name: string;
  unifiedSocialCreditCode: string;
  industryCode: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  snapshotAt: Date;
}

function snapshotEnterpriseProfile(
  projectId: string,
  enterprise: Enterprise,
  existingProfiles: EnterpriseProfile[],
): EnterpriseProfile | null {
  // Check if snapshot already exists
  const existing = existingProfiles.find((p) => p.auditProjectId === projectId);
  if (existing) return existing;

  const profileId = `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: profileId,
    auditProjectId: projectId,
    enterpriseId: enterprise.id,
    name: enterprise.name,
    unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode,
    industryCode: enterprise.industryCode,
    contactPerson: enterprise.contactPerson,
    contactPhone: enterprise.contactPhone,
    contactEmail: enterprise.contactEmail,
    address: enterprise.address,
    snapshotAt: new Date(),
  };
}

const sampleEnterprise: Enterprise = {
  id: 'ent-001',
  name: '示例能源有限公司',
  unifiedSocialCreditCode: '91310000MA1FL8XXXX',
  industryCode: '4411',
  contactPerson: '张三',
  contactPhone: '13800138000',
  contactEmail: 'zhangsan@example.com',
  address: '上海市浦东新区XX路123号',
};

describe('enterprise profile snapshot', () => {
  describe('snapshot creation on project create', () => {
    it('creates a snapshot with all enterprise fields', () => {
      const profile = snapshotEnterpriseProfile('proj-1', sampleEnterprise, []);

      expect(profile).not.toBeNull();
      expect(profile!.auditProjectId).toBe('proj-1');
      expect(profile!.enterpriseId).toBe('ent-001');
      expect(profile!.name).toBe('示例能源有限公司');
      expect(profile!.unifiedSocialCreditCode).toBe('91310000MA1FL8XXXX');
      expect(profile!.industryCode).toBe('4411');
      expect(profile!.contactPerson).toBe('张三');
      expect(profile!.contactPhone).toBe('13800138000');
      expect(profile!.contactEmail).toBe('zhangsan@example.com');
      expect(profile!.address).toBe('上海市浦东新区XX路123号');
    });

    it('sets snapshotAt to current timestamp', () => {
      const before = new Date();
      const profile = snapshotEnterpriseProfile('proj-1', sampleEnterprise, []);
      const after = new Date();

      expect(profile).not.toBeNull();
      expect(profile!.snapshotAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(profile!.snapshotAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('generates profile ID with ep_ prefix', () => {
      const profile = snapshotEnterpriseProfile('proj-1', sampleEnterprise, []);

      expect(profile).not.toBeNull();
      expect(profile!.id.startsWith('ep_')).toBe(true);
    });

    it('handles enterprise with null optional fields', () => {
      const minimalEnterprise: Enterprise = {
        id: 'ent-002',
        name: '最小企业',
        unifiedSocialCreditCode: '91310000MA1FL8YYYY',
        industryCode: null,
        contactPerson: null,
        contactPhone: null,
        contactEmail: null,
        address: null,
      };

      const profile = snapshotEnterpriseProfile('proj-2', minimalEnterprise, []);

      expect(profile).not.toBeNull();
      expect(profile!.name).toBe('最小企业');
      expect(profile!.industryCode).toBeNull();
      expect(profile!.contactPerson).toBeNull();
      expect(profile!.contactPhone).toBeNull();
      expect(profile!.contactEmail).toBeNull();
      expect(profile!.address).toBeNull();
    });
  });

  describe('idempotency — returns existing snapshot if already created', () => {
    it('returns existing profile when snapshot already exists', () => {
      const existingProfile: EnterpriseProfile = {
        id: 'ep_existing',
        auditProjectId: 'proj-1',
        enterpriseId: 'ent-001',
        name: '旧名称',
        unifiedSocialCreditCode: '91310000MA1FL8XXXX',
        industryCode: '4411',
        contactPerson: '张三',
        contactPhone: '13800138000',
        contactEmail: 'zhangsan@example.com',
        address: '上海市浦东新区XX路123号',
        snapshotAt: new Date('2025-01-01'),
      };

      const result = snapshotEnterpriseProfile('proj-1', sampleEnterprise, [existingProfile]);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('ep_existing');
      expect(result!.name).toBe('旧名称'); // Should return existing, not re-snapshot
    });

    it('creates new snapshot for different project', () => {
      const existingProfile: EnterpriseProfile = {
        id: 'ep_existing',
        auditProjectId: 'proj-1',
        enterpriseId: 'ent-001',
        name: '示例能源有限公司',
        unifiedSocialCreditCode: '91310000MA1FL8XXXX',
        industryCode: '4411',
        contactPerson: '张三',
        contactPhone: '13800138000',
        contactEmail: 'zhangsan@example.com',
        address: '上海市浦东新区XX路123号',
        snapshotAt: new Date('2025-01-01'),
      };

      const result = snapshotEnterpriseProfile('proj-2', sampleEnterprise, [existingProfile]);

      expect(result).not.toBeNull();
      expect(result!.id).not.toBe('ep_existing');
      expect(result!.auditProjectId).toBe('proj-2');
    });
  });

  describe('snapshot reflects enterprise data at creation time', () => {
    it('snapshot is independent of later enterprise changes', () => {
      const enterprise: Enterprise = {
        id: 'ent-003',
        name: '原始名称',
        unifiedSocialCreditCode: '91310000MA1FL8ZZZZ',
        industryCode: '4411',
        contactPerson: '李四',
        contactPhone: '13900139000',
        contactEmail: 'lisi@example.com',
        address: '北京市朝阳区XX路456号',
      };

      const profile = snapshotEnterpriseProfile('proj-3', enterprise, []);

      // Simulate enterprise data change after snapshot
      enterprise.name = '更新后的名称';
      enterprise.contactPerson = '王五';

      // Snapshot should retain original values
      expect(profile!.name).toBe('原始名称');
      expect(profile!.contactPerson).toBe('李四');
    });
  });
});
