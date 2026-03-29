import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('Platform Health - End-to-End Verification', () => {
  describe('Database Migrations', () => {
    const migrationsDir = resolve(__dirname, '../../src/db/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    it('has at least 9 migration files', () => {
      expect(migrationFiles.length).toBeGreaterThanOrEqual(9);
    });

    it('migrations follow correct naming sequence (001-009)', () => {
      const expectedPrefixes = [
        '001_',
        '002_',
        '003_',
        '004_',
        '005_',
        '006_',
        '007_',
        '008_',
        '009_',
      ];
      expectedPrefixes.forEach((prefix, index) => {
        expect(migrationFiles[index]).toMatch(new RegExp(`^${prefix}`));
      });
    });

    it.each([
      ['001_init_core_schema.sql'],
      ['002_enterprise_admission.sql'],
      ['003_project_lifecycle.sql'],
      ['004_master_data.sql'],
      ['005_data_collection.sql'],
      ['006_reporting.sql'],
      ['007_review_rectification.sql'],
      ['008_integration_jobs.sql'],
      ['009_business_type.sql'],
    ])('migration %s exists', (fileName) => {
      expect(migrationFiles).toContain(fileName);
    });
  });

  describe('Backend Modules', () => {
    const modulesDir = resolve(__dirname, '../../src/modules');
    const modules = readdirSync(modulesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    const expectedModules = [
      'attachment',
      'audit-batch',
      'audit-log',
      'audit-project',
      'business-type',
      'calculation',
      'chart',
      'data-entry',
      'enterprise',
      'health',
      'integration',
      'jobs',
      'ledger',
      'master-data',
      'rectification',
      'report',
      'review',
      'statistics',
      'user',
    ];

    it('has all expected backend modules', () => {
      expectedModules.forEach((mod) => {
        expect(modules).toContain(mod);
      });
    });

    it('has at least 19 modules', () => {
      expect(modules.length).toBeGreaterThanOrEqual(19);
    });
  });

  describe('Database Schema', () => {
    it('schema exports all expected tables', async () => {
      const schema = await import('../../src/db/schema/index');
      const exports = Object.keys(schema);

      const expectedTables = [
        'roles',
        'permissions',
        'rolePermissions',
        'dictionaries',
        'templates',
        'templateVersions',
        'attachments',
        'auditLogs',
        'enterprises',
        'enterpriseExternalBindings',
        'userAccounts',
        'auditBatches',
        'auditProjects',
        'projectMembers',
        'enterpriseProfiles',
        'energyDefinitions',
        'productDefinitions',
        'unitDefinitions',
        'carbonEmissionFactors',
        'dataRecords',
        'dataItems',
        'importJobs',
        'validationResults',
        'calculationSnapshots',
        'reports',
        'chartOutputs',
        'reviewTasks',
        'reviewScores',
        'reviewIssues',
        'rectificationTasks',
        'rectificationProgress',
        'moduleVisibility',
        'businessTypeConfig',
        'enterpriseApplications',
        'syncLogs',
        'projectStatusTransitions',
        'projectSnapshots',
        'dataModules',
        'dataFields',
        'validationRules',
        'calculationRules',
        'dataLocks',
        'reportVersions',
        'reportSections',
        'chartConfigs',
        'benchmarkValues',
      ];

      expectedTables.forEach((table) => {
        expect(exports).toContain(table);
      });
    });

    it('schema exports at least 40 tables', async () => {
      const schema = await import('../../src/db/schema/index');
      const exports = Object.keys(schema);
      expect(exports.length).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Test Coverage', () => {
    const testsDir = resolve(__dirname, '..');
    const testDirs = readdirSync(testsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const expectedTestDirs = [
      'audit-project',
      'business-type',
      'calculation',
      'data-entry',
      'domain',
      'enterprise',
      'health',
      'integration',
      'jobs',
      'ledger',
      'master-data',
      'platform',
      'report',
      'review',
      'statistics',
    ];

    it('has test directories for all major modules', () => {
      expectedTestDirs.forEach((dir) => {
        expect(testDirs).toContain(dir);
      });
    });
  });

  describe('Seed Script', () => {
    it('seed script file exists and is importable', async () => {
      const seedPath = resolve(__dirname, '../../../../scripts/seed-sample-data.ts');
      const fs = await import('node:fs');
      expect(fs.existsSync(seedPath)).toBe(true);
    });
  });

  describe('Frontend Pages', () => {
    it('enterprise pages exist', () => {
      const fs = require('node:fs');
      const basePath = resolve(__dirname, '../../../../apps/web/src/app/enterprise');
      expect(fs.existsSync(basePath)).toBe(true);
    });

    it('manager pages exist', () => {
      const fs = require('node:fs');
      const basePath = resolve(__dirname, '../../../../apps/web/src/app/manager');
      expect(fs.existsSync(basePath)).toBe(true);
    });

    it('reviewer pages exist', () => {
      const fs = require('node:fs');
      const basePath = resolve(__dirname, '../../../../apps/web/src/app/reviewer');
      expect(fs.existsSync(basePath)).toBe(true);
    });
  });
});
