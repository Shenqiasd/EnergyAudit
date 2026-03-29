import { describe, expect, it } from 'vitest';

/**
 * Pure unit tests for report version management logic.
 * Tests version CRUD, comparison, and activation without DB.
 */

interface ReportVersion {
  id: string;
  reportId: string;
  versionType: string;
  versionNumber: number;
  isActive: boolean;
  fileUrl: string | null;
  createdBy: string | null;
  createdAt: Date;
}

interface SectionSnapshot {
  sectionCode: string;
  sectionName: string;
  sortOrder: number;
  content: string | null;
  reportVersionId: string;
}

interface VersionDiff {
  sectionCode: string;
  sectionName: string;
  v1Content: string | null;
  v2Content: string | null;
  changed: boolean;
}

function createVersion(
  reportId: string,
  versionType: string,
  existingVersions: ReportVersion[],
  fileUrl?: string,
  createdBy?: string,
): ReportVersion {
  const versionNumber = existingVersions.length + 1;
  const versionId = `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Deactivate all existing versions
  for (const v of existingVersions) {
    v.isActive = false;
  }

  return {
    id: versionId,
    reportId,
    versionType,
    versionNumber,
    isActive: true,
    fileUrl: fileUrl ?? null,
    createdBy: createdBy ?? null,
    createdAt: new Date(),
  };
}

function listVersions(versions: ReportVersion[], reportId: string): ReportVersion[] {
  return versions
    .filter((v) => v.reportId === reportId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

function compareVersions(
  v1Sections: SectionSnapshot[],
  v2Sections: SectionSnapshot[],
): VersionDiff[] {
  const allCodes = new Set([
    ...v1Sections.map((s) => s.sectionCode),
    ...v2Sections.map((s) => s.sectionCode),
  ]);

  const diffs: VersionDiff[] = [];

  for (const code of allCodes) {
    const s1 = v1Sections.find((s) => s.sectionCode === code);
    const s2 = v2Sections.find((s) => s.sectionCode === code);

    diffs.push({
      sectionCode: code,
      sectionName: s1?.sectionName ?? s2?.sectionName ?? code,
      v1Content: s1?.content ?? null,
      v2Content: s2?.content ?? null,
      changed: (s1?.content ?? null) !== (s2?.content ?? null),
    });
  }

  return diffs;
}

function setActiveVersion(
  versions: ReportVersion[],
  reportId: string,
  versionId: string,
): boolean {
  const target = versions.find((v) => v.id === versionId && v.reportId === reportId);
  if (!target) return false;

  for (const v of versions) {
    if (v.reportId === reportId) {
      v.isActive = false;
    }
  }
  target.isActive = true;
  return true;
}

describe('report version management', () => {
  describe('createVersion', () => {
    it('creates first version with versionNumber 1', () => {
      const versions: ReportVersion[] = [];
      const v = createVersion('report-1', 'system_draft', versions);

      expect(v.versionNumber).toBe(1);
      expect(v.isActive).toBe(true);
      expect(v.versionType).toBe('system_draft');
      expect(v.reportId).toBe('report-1');
      expect(v.id.startsWith('rv_')).toBe(true);
    });

    it('increments version number for subsequent versions', () => {
      const versions: ReportVersion[] = [];
      const v1 = createVersion('report-1', 'system_draft', versions);
      versions.push(v1);

      const v2 = createVersion('report-1', 'enterprise_revision', versions);
      expect(v2.versionNumber).toBe(2);
    });

    it('deactivates previous versions when creating new one', () => {
      const versions: ReportVersion[] = [];
      const v1 = createVersion('report-1', 'system_draft', versions);
      versions.push(v1);
      expect(v1.isActive).toBe(true);

      const v2 = createVersion('report-1', 'enterprise_revision', versions);
      versions.push(v2);

      expect(v1.isActive).toBe(false);
      expect(v2.isActive).toBe(true);
    });

    it('stores fileUrl and createdBy when provided', () => {
      const v = createVersion('report-1', 'final', [], 'https://example.com/report.pdf', 'user-123');

      expect(v.fileUrl).toBe('https://example.com/report.pdf');
      expect(v.createdBy).toBe('user-123');
    });

    it('sets fileUrl and createdBy to null when not provided', () => {
      const v = createVersion('report-1', 'system_draft', []);

      expect(v.fileUrl).toBeNull();
      expect(v.createdBy).toBeNull();
    });
  });

  describe('listVersions', () => {
    it('returns versions ordered by versionNumber descending', () => {
      const versions: ReportVersion[] = [];
      const v1 = createVersion('report-1', 'system_draft', versions);
      versions.push(v1);
      const v2 = createVersion('report-1', 'enterprise_revision', versions);
      versions.push(v2);
      const v3 = createVersion('report-1', 'final', versions);
      versions.push(v3);

      const listed = listVersions(versions, 'report-1');
      expect(listed.length).toBe(3);
      expect(listed[0].versionNumber).toBe(3);
      expect(listed[1].versionNumber).toBe(2);
      expect(listed[2].versionNumber).toBe(1);
    });

    it('filters by reportId', () => {
      const versions: ReportVersion[] = [];
      versions.push(createVersion('report-1', 'system_draft', []));
      versions.push(createVersion('report-2', 'system_draft', []));

      const listed = listVersions(versions, 'report-1');
      expect(listed.length).toBe(1);
      expect(listed[0].reportId).toBe('report-1');
    });

    it('returns empty array when no versions exist', () => {
      const listed = listVersions([], 'report-999');
      expect(listed).toEqual([]);
    });
  });

  describe('compareVersions', () => {
    it('detects changed sections between two versions', () => {
      const v1Sections: SectionSnapshot[] = [
        { sectionCode: 'overview', sectionName: '企业概况', sortOrder: 1, content: '原始内容', reportVersionId: 'v1' },
        { sectionCode: 'energy', sectionName: '能源消费', sortOrder: 2, content: '能源数据A', reportVersionId: 'v1' },
      ];

      const v2Sections: SectionSnapshot[] = [
        { sectionCode: 'overview', sectionName: '企业概况', sortOrder: 1, content: '修改后的内容', reportVersionId: 'v2' },
        { sectionCode: 'energy', sectionName: '能源消费', sortOrder: 2, content: '能源数据A', reportVersionId: 'v2' },
      ];

      const diffs = compareVersions(v1Sections, v2Sections);
      expect(diffs.length).toBe(2);

      const overviewDiff = diffs.find((d) => d.sectionCode === 'overview');
      expect(overviewDiff?.changed).toBe(true);
      expect(overviewDiff?.v1Content).toBe('原始内容');
      expect(overviewDiff?.v2Content).toBe('修改后的内容');

      const energyDiff = diffs.find((d) => d.sectionCode === 'energy');
      expect(energyDiff?.changed).toBe(false);
    });

    it('handles sections only in one version', () => {
      const v1Sections: SectionSnapshot[] = [
        { sectionCode: 'overview', sectionName: '企业概况', sortOrder: 1, content: '内容', reportVersionId: 'v1' },
      ];

      const v2Sections: SectionSnapshot[] = [
        { sectionCode: 'overview', sectionName: '企业概况', sortOrder: 1, content: '内容', reportVersionId: 'v2' },
        { sectionCode: 'new-section', sectionName: '新章节', sortOrder: 2, content: '新内容', reportVersionId: 'v2' },
      ];

      const diffs = compareVersions(v1Sections, v2Sections);
      expect(diffs.length).toBe(2);

      const newDiff = diffs.find((d) => d.sectionCode === 'new-section');
      expect(newDiff?.changed).toBe(true);
      expect(newDiff?.v1Content).toBeNull();
      expect(newDiff?.v2Content).toBe('新内容');
    });

    it('reports all unchanged when content is identical', () => {
      const sections: SectionSnapshot[] = [
        { sectionCode: 'a', sectionName: 'A', sortOrder: 1, content: '相同', reportVersionId: 'v1' },
        { sectionCode: 'b', sectionName: 'B', sortOrder: 2, content: '相同', reportVersionId: 'v1' },
      ];

      const diffs = compareVersions(sections, sections);
      expect(diffs.every((d) => !d.changed)).toBe(true);
    });

    it('handles empty sections in both versions', () => {
      const diffs = compareVersions([], []);
      expect(diffs).toEqual([]);
    });
  });

  describe('setActiveVersion', () => {
    it('activates specified version and deactivates others', () => {
      const versions: ReportVersion[] = [];
      const v1 = createVersion('report-1', 'system_draft', versions);
      versions.push(v1);
      const v2 = createVersion('report-1', 'enterprise_revision', versions);
      versions.push(v2);

      // v2 is active, switch back to v1
      const result = setActiveVersion(versions, 'report-1', v1.id);
      expect(result).toBe(true);
      expect(v1.isActive).toBe(true);
      expect(v2.isActive).toBe(false);
    });

    it('returns false for non-existent version', () => {
      const versions: ReportVersion[] = [];
      const result = setActiveVersion(versions, 'report-1', 'non-existent');
      expect(result).toBe(false);
    });

    it('returns false when version belongs to different report', () => {
      const versions: ReportVersion[] = [];
      const v1 = createVersion('report-1', 'system_draft', versions);
      versions.push(v1);

      const result = setActiveVersion(versions, 'report-2', v1.id);
      expect(result).toBe(false);
    });

    it('only deactivates versions of the same report', () => {
      const versions: ReportVersion[] = [];
      const v1r1 = createVersion('report-1', 'system_draft', []);
      versions.push(v1r1);
      const v1r2 = createVersion('report-2', 'system_draft', []);
      versions.push(v1r2);

      setActiveVersion(versions, 'report-1', v1r1.id);

      // report-2's version should be unaffected
      expect(v1r2.isActive).toBe(true);
    });
  });
});
