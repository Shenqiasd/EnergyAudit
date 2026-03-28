/**
 * 示例数据种子脚本
 *
 * 用法: npx tsx scripts/seed-sample-data.ts
 * 需要环境变量: DATABASE_URL
 *
 * 本脚本向数据库插入一组完整的示例数据，涵盖企业、用户、批次、项目、
 * 基础配置、填报记录、计算快照、报告、审核和整改等全流程数据。
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../apps/api/src/db/schema/index';

// ---------------------------------------------------------------------------
// 数据库连接
// ---------------------------------------------------------------------------

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL 环境变量未设置');
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql, { schema });

// ---------------------------------------------------------------------------
// ID 生成辅助
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// 预定义 ID（便于跨表引用）
// ---------------------------------------------------------------------------

// 企业
const ENT_MANUFACTURING_ID = uid();
const ENT_ENERGY_ID = uid();
const ENT_CHEMICAL_ID = uid();

// 用户
const USER_ENT1_ID = uid();
const USER_ENT2_ID = uid();
const USER_MANAGER1_ID = uid();
const USER_MANAGER2_ID = uid();
const USER_REVIEWER1_ID = uid();

// 批次
const BATCH_AUDIT_2025_ID = uid();
const BATCH_DIAG_2026_ID = uid();

// 项目
const PROJECT_MANUFACTURING_ID = uid();
const PROJECT_ENERGY_ID = uid();
const PROJECT_CHEMICAL_ID = uid();

// 模板
const TEMPLATE_ID = uid();
const TEMPLATE_VERSION_ID = uid();

// 附件（报告用占位）
const ATTACHMENT_REPORT_ID = uid();

// 报告
const REPORT_MANUFACTURING_ID = uid();

// 审核
const REVIEW_TASK_COMPLETED_ID = uid();
const REVIEW_TASK_INREVIEW_ID = uid();

// 整改
const RECT_TASK_INPROGRESS_ID = uid();
const RECT_TASK_PENDING_ID = uid();

// 数据记录
const DATA_RECORD_1_ID = uid();
const DATA_RECORD_2_ID = uid();
const DATA_RECORD_3_ID = uid();
const DATA_RECORD_4_ID = uid();
const DATA_RECORD_5_ID = uid();
const DATA_RECORD_6_ID = uid();

// 审核问题
const REVIEW_ISSUE_1_ID = uid();
const REVIEW_ISSUE_2_ID = uid();

// 计算快照
const CALC_SNAPSHOT_ID = uid();

// ---------------------------------------------------------------------------
// 种子数据
// ---------------------------------------------------------------------------

async function seed() {
  console.log('开始种子数据插入...');

  // 1. 模板 & 模板版本
  console.log('  → 模板与版本');
  await db.insert(schema.templates).values({
    id: TEMPLATE_ID,
    code: 'energy-audit-v1',
    name: '能源审计标准模板',
    description: '十五五期间能源审计标准填报模板',
    activeVersionId: null,
  });
  await db.insert(schema.templateVersions).values({
    id: TEMPLATE_VERSION_ID,
    templateId: TEMPLATE_ID,
    versionNumber: 1,
    versionLabel: 'v1.0',
    isActive: true,
    publishedAt: new Date(),
  });

  // 2. 企业
  console.log('  → 企业');
  await db.insert(schema.enterprises).values([
    {
      id: ENT_MANUFACTURING_ID,
      unifiedSocialCreditCode: '91310000MA1FL8XQ30',
      name: '上海华盛精密制造有限公司',
      admissionStatus: 'approved',
      industryCode: 'C33',
      contactPerson: '张伟',
      contactPhone: '13800138001',
      contactEmail: 'zhangwei@huasheng.com',
      address: '上海市闵行区莘庄工业区',
    },
    {
      id: ENT_ENERGY_ID,
      unifiedSocialCreditCode: '91320000MA1GL9YR41',
      name: '江苏绿能热电集团有限公司',
      admissionStatus: 'approved',
      industryCode: 'D44',
      contactPerson: '李明',
      contactPhone: '13800138002',
      contactEmail: 'liming@lvneng.com',
      address: '江苏省南京市江宁经济技术开发区',
    },
    {
      id: ENT_CHEMICAL_ID,
      unifiedSocialCreditCode: '91330000MA1HM0ZS52',
      name: '浙江天成化工股份有限公司',
      admissionStatus: 'approved',
      industryCode: 'C26',
      contactPerson: '王芳',
      contactPhone: '13800138003',
      contactEmail: 'wangfang@tiancheng.com',
      address: '浙江省杭州市萧山区临江工业园',
    },
  ]);

  // 3. 用户
  console.log('  → 用户');
  await db.insert(schema.userAccounts).values([
    {
      id: USER_ENT1_ID,
      enterpriseId: ENT_MANUFACTURING_ID,
      email: 'zhangwei@huasheng.com',
      name: '张伟',
      phone: '13800138001',
      role: 'enterprise_user',
    },
    {
      id: USER_ENT2_ID,
      enterpriseId: ENT_ENERGY_ID,
      email: 'liming@lvneng.com',
      name: '李明',
      phone: '13800138002',
      role: 'enterprise_user',
    },
    {
      id: USER_MANAGER1_ID,
      email: 'admin@energy-audit.gov.cn',
      name: '陈管理',
      phone: '13900139001',
      role: 'manager',
    },
    {
      id: USER_MANAGER2_ID,
      email: 'manager2@energy-audit.gov.cn',
      name: '刘管理',
      phone: '13900139002',
      role: 'manager',
    },
    {
      id: USER_REVIEWER1_ID,
      email: 'reviewer@audit-expert.com',
      name: '赵审核',
      phone: '13700137001',
      role: 'reviewer',
    },
  ]);

  // 4. 审计批次
  console.log('  → 审计批次');
  await db.insert(schema.auditBatches).values([
    {
      id: BATCH_AUDIT_2025_ID,
      name: '2025年度重点用能单位能源审计',
      year: 2025,
      status: 'active',
      businessType: 'energy_audit',
      templateVersionId: TEMPLATE_VERSION_ID,
      description: '十五五规划首年度能源审计批次',
      filingDeadline: new Date('2025-09-30T23:59:59Z'),
      reviewDeadline: new Date('2025-12-31T23:59:59Z'),
      createdBy: USER_MANAGER1_ID,
    },
    {
      id: BATCH_DIAG_2026_ID,
      name: '2026年度节能诊断',
      year: 2026,
      status: 'draft',
      businessType: 'energy_diagnosis',
      templateVersionId: TEMPLATE_VERSION_ID,
      description: '2026年度节能诊断批次',
      filingDeadline: new Date('2026-09-30T23:59:59Z'),
      reviewDeadline: new Date('2026-12-31T23:59:59Z'),
      createdBy: USER_MANAGER1_ID,
    },
  ]);

  // 5. 审计项目
  console.log('  → 审计项目');
  await db.insert(schema.auditProjects).values([
    {
      id: PROJECT_MANUFACTURING_ID,
      enterpriseId: ENT_MANUFACTURING_ID,
      batchId: BATCH_AUDIT_2025_ID,
      status: 'in_review',
      businessType: 'energy_audit',
      templateVersionId: TEMPLATE_VERSION_ID,
      configComplete: true,
    },
    {
      id: PROJECT_ENERGY_ID,
      enterpriseId: ENT_ENERGY_ID,
      batchId: BATCH_AUDIT_2025_ID,
      status: 'filing',
      businessType: 'energy_audit',
      templateVersionId: TEMPLATE_VERSION_ID,
      configComplete: true,
    },
    {
      id: PROJECT_CHEMICAL_ID,
      enterpriseId: ENT_CHEMICAL_ID,
      batchId: BATCH_AUDIT_2025_ID,
      status: 'configuring',
      businessType: 'energy_audit',
      templateVersionId: TEMPLATE_VERSION_ID,
      configComplete: false,
    },
  ]);

  // 6. 项目成员
  console.log('  → 项目成员');
  await db.insert(schema.projectMembers).values([
    {
      id: uid(),
      auditProjectId: PROJECT_MANUFACTURING_ID,
      userId: USER_ENT1_ID,
      role: 'enterprise_contact',
    },
    {
      id: uid(),
      auditProjectId: PROJECT_ENERGY_ID,
      userId: USER_ENT2_ID,
      role: 'enterprise_contact',
    },
    {
      id: uid(),
      auditProjectId: PROJECT_MANUFACTURING_ID,
      userId: USER_REVIEWER1_ID,
      role: 'assigned_reviewer',
    },
  ]);

  // 7. 企业信息快照
  console.log('  → 企业信息快照');
  await db.insert(schema.enterpriseProfiles).values([
    {
      id: uid(),
      auditProjectId: PROJECT_MANUFACTURING_ID,
      enterpriseId: ENT_MANUFACTURING_ID,
      name: '上海华盛精密制造有限公司',
      unifiedSocialCreditCode: '91310000MA1FL8XQ30',
      industryCode: 'C33',
      contactPerson: '张伟',
      contactPhone: '13800138001',
    },
    {
      id: uid(),
      auditProjectId: PROJECT_ENERGY_ID,
      enterpriseId: ENT_ENERGY_ID,
      name: '江苏绿能热电集团有限公司',
      unifiedSocialCreditCode: '91320000MA1GL9YR41',
      industryCode: 'D44',
      contactPerson: '李明',
      contactPhone: '13800138002',
    },
  ]);

  // 8. 能源品种定义
  console.log('  → 能源品种定义');
  const energyDefs = [
    { code: 'electricity', name: '电力', type: 'secondary', factor: '0.1229', unit: 'kWh' },
    { code: 'raw-coal', name: '原煤', type: 'primary', factor: '0.7143', unit: 'kg' },
    { code: 'natural-gas', name: '天然气', type: 'primary', factor: '1.3300', unit: 'm³' },
    { code: 'diesel', name: '柴油', type: 'primary', factor: '1.4571', unit: 'kg' },
    { code: 'steam', name: '蒸汽', type: 'secondary', factor: '0.0341', unit: 'kg' },
  ];

  for (const ent of [ENT_MANUFACTURING_ID, ENT_ENERGY_ID, ENT_CHEMICAL_ID]) {
    await db.insert(schema.energyDefinitions).values(
      energyDefs.map((e) => ({
        id: uid(),
        enterpriseId: ent,
        energyCode: e.code,
        name: e.name,
        energyType: e.type,
        conversionFactor: e.factor,
        measurementUnit: e.unit,
      })),
    );
  }

  // 9. 产品定义（每企业2个产品）
  console.log('  → 产品定义');
  const productSets: Array<{ entId: string; products: Array<{ code: string; name: string; unit: string }> }> = [
    {
      entId: ENT_MANUFACTURING_ID,
      products: [
        { code: 'precision-parts', name: '精密零部件', unit: '件' },
        { code: 'mold-assembly', name: '模具组件', unit: '套' },
      ],
    },
    {
      entId: ENT_ENERGY_ID,
      products: [
        { code: 'thermal-power', name: '发电量', unit: 'MWh' },
        { code: 'heat-supply', name: '供热量', unit: 'GJ' },
      ],
    },
    {
      entId: ENT_CHEMICAL_ID,
      products: [
        { code: 'ethylene', name: '乙烯', unit: '吨' },
        { code: 'propylene', name: '丙烯', unit: '吨' },
      ],
    },
  ];
  for (const ps of productSets) {
    await db.insert(schema.productDefinitions).values(
      ps.products.map((p) => ({
        id: uid(),
        enterpriseId: ps.entId,
        productCode: p.code,
        name: p.name,
        measurementUnit: p.unit,
      })),
    );
  }

  // 10. 用能单元定义
  console.log('  → 用能单元定义');
  for (const ent of [ENT_MANUFACTURING_ID, ENT_ENERGY_ID, ENT_CHEMICAL_ID]) {
    await db.insert(schema.unitDefinitions).values([
      {
        id: uid(),
        enterpriseId: ent,
        unitCode: 'production-unit',
        name: '生产车间',
        unitType: 'production',
        energyBoundaryDescription: '主要生产工序能源消耗范围',
      },
      {
        id: uid(),
        enterpriseId: ent,
        unitCode: 'auxiliary-unit',
        name: '辅助车间',
        unitType: 'auxiliary',
        energyBoundaryDescription: '辅助系统（空压、制冷、照明等）',
      },
    ]);
  }

  // 11. 碳排放因子
  console.log('  → 碳排放因子');
  await db.insert(schema.carbonEmissionFactors).values([
    {
      id: uid(),
      energyCode: 'electricity',
      name: '电力碳排放因子（华东电网）',
      emissionFactor: '0.7921',
      oxidationRate: '1.0',
      standardSource: '生态环境部2024年公告',
      applicableYear: 2025,
      measurementUnit: 'tCO2/MWh',
      isDefault: true,
    },
    {
      id: uid(),
      energyCode: 'raw-coal',
      name: '原煤碳排放因子',
      emissionFactor: '2.6603',
      oxidationRate: '0.98',
      standardSource: 'IPCC 2006 指南',
      applicableYear: 2025,
      measurementUnit: 'tCO2/t',
      isDefault: true,
    },
    {
      id: uid(),
      energyCode: 'natural-gas',
      name: '天然气碳排放因子',
      emissionFactor: '2.1622',
      oxidationRate: '0.99',
      standardSource: 'IPCC 2006 指南',
      applicableYear: 2025,
      measurementUnit: 'tCO2/万m³',
      isDefault: true,
    },
    {
      id: uid(),
      energyCode: 'diesel',
      name: '柴油碳排放因子',
      emissionFactor: '3.0959',
      oxidationRate: '0.98',
      standardSource: 'IPCC 2006 指南',
      applicableYear: 2025,
      measurementUnit: 'tCO2/t',
      isDefault: true,
    },
    {
      id: uid(),
      energyCode: 'steam',
      name: '蒸汽碳排放因子',
      emissionFactor: '0.1100',
      oxidationRate: '1.0',
      standardSource: '地方标准',
      applicableYear: 2025,
      measurementUnit: 'tCO2/GJ',
      isDefault: true,
    },
  ]);

  // 12. 填报数据记录（制造业项目 3 个模块、能源项目 2 个模块、化工项目 1 个模块）
  console.log('  → 填报数据记录');
  await db.insert(schema.dataRecords).values([
    {
      id: DATA_RECORD_1_ID,
      auditProjectId: PROJECT_MANUFACTURING_ID,
      moduleCode: 'enterprise-profile',
      status: 'submitted',
      templateVersionId: TEMPLATE_VERSION_ID,
      submittedAt: new Date('2025-06-15T10:00:00Z'),
    },
    {
      id: DATA_RECORD_2_ID,
      auditProjectId: PROJECT_MANUFACTURING_ID,
      moduleCode: 'energy-consumption',
      status: 'submitted',
      templateVersionId: TEMPLATE_VERSION_ID,
      submittedAt: new Date('2025-06-20T14:30:00Z'),
    },
    {
      id: DATA_RECORD_3_ID,
      auditProjectId: PROJECT_MANUFACTURING_ID,
      moduleCode: 'carbon-emission',
      status: 'submitted',
      templateVersionId: TEMPLATE_VERSION_ID,
      submittedAt: new Date('2025-06-22T09:00:00Z'),
    },
    {
      id: DATA_RECORD_4_ID,
      auditProjectId: PROJECT_ENERGY_ID,
      moduleCode: 'enterprise-profile',
      status: 'saved',
      templateVersionId: TEMPLATE_VERSION_ID,
    },
    {
      id: DATA_RECORD_5_ID,
      auditProjectId: PROJECT_ENERGY_ID,
      moduleCode: 'energy-consumption',
      status: 'draft',
      templateVersionId: TEMPLATE_VERSION_ID,
    },
    {
      id: DATA_RECORD_6_ID,
      auditProjectId: PROJECT_CHEMICAL_ID,
      moduleCode: 'enterprise-profile',
      status: 'draft',
      templateVersionId: TEMPLATE_VERSION_ID,
    },
  ]);

  // 13. 填报数据项
  console.log('  → 填报数据项');
  await db.insert(schema.dataItems).values([
    // 制造业 - 企业概况
    { id: uid(), dataRecordId: DATA_RECORD_1_ID, fieldCode: 'enterprise-name', rawValue: '上海华盛精密制造有限公司', finalValue: '上海华盛精密制造有限公司' },
    { id: uid(), dataRecordId: DATA_RECORD_1_ID, fieldCode: 'industry-code', rawValue: 'C33', finalValue: 'C33' },
    { id: uid(), dataRecordId: DATA_RECORD_1_ID, fieldCode: 'employee-count', rawValue: '850', finalValue: '850', unit: '人' },
    // 制造业 - 能源消耗
    { id: uid(), dataRecordId: DATA_RECORD_2_ID, fieldCode: 'electricity-consumption', rawValue: '12500000', calculatedValue: '1536.25', finalValue: '12500000', unit: 'kWh' },
    { id: uid(), dataRecordId: DATA_RECORD_2_ID, fieldCode: 'natural-gas-consumption', rawValue: '800000', calculatedValue: '1064.00', finalValue: '800000', unit: 'm³' },
    { id: uid(), dataRecordId: DATA_RECORD_2_ID, fieldCode: 'diesel-consumption', rawValue: '50000', calculatedValue: '72.86', finalValue: '50000', unit: 'kg' },
    { id: uid(), dataRecordId: DATA_RECORD_2_ID, fieldCode: 'total-tce', calculatedValue: '2673.11', finalValue: '2673.11', unit: 'tce' },
    // 制造业 - 碳排放
    { id: uid(), dataRecordId: DATA_RECORD_3_ID, fieldCode: 'electricity-co2', calculatedValue: '9901.25', finalValue: '9901.25', unit: 'tCO2' },
    { id: uid(), dataRecordId: DATA_RECORD_3_ID, fieldCode: 'natural-gas-co2', calculatedValue: '1712.94', finalValue: '1712.94', unit: 'tCO2' },
    { id: uid(), dataRecordId: DATA_RECORD_3_ID, fieldCode: 'total-co2', calculatedValue: '11766.14', finalValue: '11766.14', unit: 'tCO2' },
    // 能源企业 - 企业概况（部分）
    { id: uid(), dataRecordId: DATA_RECORD_4_ID, fieldCode: 'enterprise-name', rawValue: '江苏绿能热电集团有限公司', finalValue: '江苏绿能热电集团有限公司' },
  ]);

  // 14. 计算快照
  console.log('  → 计算快照');
  await db.insert(schema.calculationSnapshots).values({
    id: CALC_SNAPSHOT_ID,
    auditProjectId: PROJECT_MANUFACTURING_ID,
    calculationType: 'comprehensive_energy',
    result: JSON.stringify({
      totalTce: 2673.11,
      byEnergy: [
        { code: 'electricity', tce: 1536.25 },
        { code: 'natural-gas', tce: 1064.0 },
        { code: 'diesel', tce: 72.86 },
      ],
      totalCo2: 11766.14,
    }),
    ruleVersionId: 'calc-rule-v1.0',
    parametersSnapshot: JSON.stringify({
      conversionFactors: { electricity: 0.1229, 'natural-gas': 1.33, diesel: 1.4571 },
    }),
    isLatest: true,
  });

  // 15. 附件（报告占位）
  console.log('  → 附件');
  await db.insert(schema.attachments).values({
    id: ATTACHMENT_REPORT_ID,
    ownerType: 'report',
    ownerId: REPORT_MANUFACTURING_ID,
    fileName: '华盛精密制造_2025年度能源审计报告_初稿.pdf',
    fileSize: 2048576,
    mimeType: 'application/pdf',
    storagePath: '/reports/2025/manufacturing-draft-v1.pdf',
    uploadedBy: 'system',
  });

  // 16. 报告
  console.log('  → 报告');
  await db.insert(schema.reports).values({
    id: REPORT_MANUFACTURING_ID,
    auditProjectId: PROJECT_MANUFACTURING_ID,
    version: 1,
    versionType: 'system_draft',
    status: 'draft_generated',
    templateVersionId: TEMPLATE_VERSION_ID,
    fileAttachmentId: ATTACHMENT_REPORT_ID,
    generatedAt: new Date('2025-07-01T08:00:00Z'),
  });

  // 17. 审核任务
  console.log('  → 审核任务');
  await db.insert(schema.reviewTasks).values([
    {
      id: REVIEW_TASK_COMPLETED_ID,
      auditProjectId: PROJECT_MANUFACTURING_ID,
      reportId: REPORT_MANUFACTURING_ID,
      reviewerId: USER_REVIEWER1_ID,
      status: 'completed',
      conclusion: '基本合格，需整改部分问题',
      totalScore: '82.5',
      assignedAt: new Date('2025-07-05T09:00:00Z'),
      completedAt: new Date('2025-07-15T16:00:00Z'),
    },
    {
      id: REVIEW_TASK_INREVIEW_ID,
      auditProjectId: PROJECT_MANUFACTURING_ID,
      reportId: REPORT_MANUFACTURING_ID,
      reviewerId: USER_REVIEWER1_ID,
      status: 'in_review',
      assignedAt: new Date('2025-07-20T09:00:00Z'),
    },
  ]);

  // 18. 审核评分
  console.log('  → 审核评分');
  await db.insert(schema.reviewScores).values([
    {
      id: uid(),
      reviewTaskId: REVIEW_TASK_COMPLETED_ID,
      category: '数据完整性',
      score: '85',
      maxScore: '100',
      comment: '主要模块数据填写完整，少数辅助数据缺失',
    },
    {
      id: uid(),
      reviewTaskId: REVIEW_TASK_COMPLETED_ID,
      category: '数据准确性',
      score: '80',
      maxScore: '100',
      comment: '能耗数据与实际基本一致，个别数据存在偏差',
    },
    {
      id: uid(),
      reviewTaskId: REVIEW_TASK_COMPLETED_ID,
      category: '能效分析',
      score: '82',
      maxScore: '100',
      comment: '能效对标分析较为到位',
    },
  ]);

  // 19. 审核问题
  console.log('  → 审核问题');
  await db.insert(schema.reviewIssues).values([
    {
      id: REVIEW_ISSUE_1_ID,
      reviewTaskId: REVIEW_TASK_COMPLETED_ID,
      description: '能源计量设备校准记录缺失，无法确认计量数据准确性',
      severity: 'major',
      moduleCode: 'equipment-management',
      suggestion: '补充近三年计量设备校准记录',
      requiresRectification: true,
    },
    {
      id: REVIEW_ISSUE_2_ID,
      reviewTaskId: REVIEW_TASK_COMPLETED_ID,
      description: '余热回收系统运行数据不完整',
      severity: 'minor',
      moduleCode: 'energy-saving-measures',
      suggestion: '补充余热回收系统运行台账数据',
      requiresRectification: true,
    },
  ]);

  // 20. 整改任务
  console.log('  → 整改任务');
  await db.insert(schema.rectificationTasks).values([
    {
      id: RECT_TASK_INPROGRESS_ID,
      auditProjectId: PROJECT_MANUFACTURING_ID,
      reviewTaskId: REVIEW_TASK_COMPLETED_ID,
      sourceIssueId: REVIEW_ISSUE_1_ID,
      title: '补充能源计量设备校准记录',
      description: '需补充近三年所有能源计量设备（电表、气表、水表）的校准证书和记录',
      status: 'in_progress',
      deadline: new Date('2025-08-15T23:59:59Z'),
    },
    {
      id: RECT_TASK_PENDING_ID,
      auditProjectId: PROJECT_MANUFACTURING_ID,
      reviewTaskId: REVIEW_TASK_COMPLETED_ID,
      sourceIssueId: REVIEW_ISSUE_2_ID,
      title: '补充余热回收系统运行数据',
      description: '需补充余热回收系统近12个月的运行台账，包括回收热量、运行时间、设备状态等',
      status: 'pending_claim',
      deadline: new Date('2025-08-30T23:59:59Z'),
    },
  ]);

  // 21. 整改进度
  console.log('  → 整改进度');
  await db.insert(schema.rectificationProgress).values({
    id: uid(),
    rectificationTaskId: RECT_TASK_INPROGRESS_ID,
    progressPercent: 40,
    note: '已联系计量检测机构，完成电表和气表校准，水表校准安排在下周进行',
    recordedBy: USER_ENT1_ID,
  });

  // 22. 字典数据
  console.log('  → 字典数据');
  await db.insert(schema.dictionaries).values([
    { id: uid(), category: 'industry', code: 'C26', name: '化学原料和化学制品制造业', sortOrder: 1 },
    { id: uid(), category: 'industry', code: 'C33', name: '金属制品业', sortOrder: 2 },
    { id: uid(), category: 'industry', code: 'D44', name: '电力、热力生产和供应业', sortOrder: 3 },
    { id: uid(), category: 'energy_type', code: 'primary', name: '一次能源', sortOrder: 1 },
    { id: uid(), category: 'energy_type', code: 'secondary', name: '二次能源', sortOrder: 2 },
    { id: uid(), category: 'unit_type', code: 'production', name: '生产单元', sortOrder: 1 },
    { id: uid(), category: 'unit_type', code: 'auxiliary', name: '辅助单元', sortOrder: 2 },
    { id: uid(), category: 'severity', code: 'critical', name: '严重', sortOrder: 1 },
    { id: uid(), category: 'severity', code: 'major', name: '重要', sortOrder: 2 },
    { id: uid(), category: 'severity', code: 'minor', name: '一般', sortOrder: 3 },
    { id: uid(), category: 'severity', code: 'suggestion', name: '建议', sortOrder: 4 },
  ]);

  console.log('种子数据插入完成！');
  console.log('');
  console.log('=== 数据摘要 ===');
  console.log(`企业: 3 (制造业/能源/化工)`);
  console.log(`用户: 5 (企业用户x2, 管理员x2, 审核员x1)`);
  console.log(`审计批次: 2 (2025能源审计, 2026节能诊断)`);
  console.log(`审计项目: 3 (in_review/filing/configuring)`);
  console.log(`能源品种: 5 x 3企业 = 15`);
  console.log(`产品定义: 2 x 3企业 = 6`);
  console.log(`用能单元: 2 x 3企业 = 6`);
  console.log(`碳排放因子: 5`);
  console.log(`填报记录: 6 (3+2+1模块)`);
  console.log(`计算快照: 1`);
  console.log(`报告: 1 (system_draft)`);
  console.log(`审核任务: 2 (completed + in_review)`);
  console.log(`审核评分: 3`);
  console.log(`审核问题: 2`);
  console.log(`整改任务: 2 (in_progress + pending_claim)`);
  console.log(`整改进度: 1`);
}

// ---------------------------------------------------------------------------
// 执行
// ---------------------------------------------------------------------------

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('种子数据插入失败:', error);
    process.exit(1);
  });
