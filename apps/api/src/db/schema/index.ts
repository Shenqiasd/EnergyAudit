import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

// ==================== Platform Core Objects ====================

export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isBuiltin: boolean('is_builtin').notNull().default(false),
});

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  group: text('group').notNull(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const dictionaries = pgTable(
  'dictionaries',
  {
    id: text('id').primaryKey(),
    category: text('category').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    parentCode: text('parent_code'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    metadata: text('metadata'),
  },
  (table) => [unique().on(table.category, table.code)],
);

export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  activeVersionId: text('active_version_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const templateVersions = pgTable(
  'template_versions',
  {
    id: text('id').primaryKey(),
    templateId: text('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    versionLabel: text('version_label'),
    isActive: boolean('is_active').notNull().default(false),
    moduleConfigSnapshot: text('module_config_snapshot'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.templateId, table.versionNumber)],
);

export const attachments = pgTable(
  'attachments',
  {
    id: text('id').primaryKey(),
    ownerType: text('owner_type').notNull(),
    ownerId: text('owner_id').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    mimeType: text('mime_type').notNull(),
    storagePath: text('storage_path').notNull(),
    uploadedBy: text('uploaded_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_attachments_owner').on(table.ownerType, table.ownerId)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    userRole: text('user_role').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    detail: text('detail'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_user').on(table.userId),
    index('idx_audit_logs_target').on(table.targetType, table.targetId),
    index('idx_audit_logs_created').on(table.createdAt),
  ],
);

// ==================== Enterprises & Users ====================

export const enterprises = pgTable('enterprises', {
  id: text('id').primaryKey(),
  unifiedSocialCreditCode: text('unified_social_credit_code').notNull().unique(),
  name: text('name').notNull(),
  admissionStatus: text('admission_status').notNull().default('pending_review'),
  industryCode: text('industry_code'),
  contactPerson: text('contact_person'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  address: text('address'),
  notes: text('notes'),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const enterpriseExternalBindings = pgTable(
  'enterprise_external_bindings',
  {
    id: text('id').primaryKey(),
    enterpriseId: text('enterprise_id')
      .notNull()
      .references(() => enterprises.id, { onDelete: 'cascade' }),
    externalSystem: text('external_system').notNull(),
    externalId: text('external_id').notNull(),
    syncStatus: text('sync_status').notNull().default('pending'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastSuccessfulSnapshot: text('last_successful_snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.externalSystem, table.externalId)],
);

export const userAccounts = pgTable('user_accounts', {
  id: text('id').primaryKey(),
  enterpriseId: text('enterprise_id').references(() => enterprises.id, {
    onDelete: 'set null',
  }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role').notNull(),
  status: text('status').notNull().default('active'),
  externalIdentityId: text('external_identity_id'),
  passwordHash: text('password_hash'),
  refreshToken: text('refresh_token'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==================== Business Runtime Objects ====================

export const auditBatches = pgTable('audit_batches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  status: text('status').notNull().default('draft'),
  businessType: text('business_type').notNull().default('energy_audit'),
  templateVersionId: text('template_version_id').references(
    () => templateVersions.id,
    { onDelete: 'set null' },
  ),
  description: text('description'),
  filingDeadline: timestamp('filing_deadline', { withTimezone: true }),
  reviewDeadline: timestamp('review_deadline', { withTimezone: true }),
  isOverdue: boolean('is_overdue').notNull().default(false),
  createdBy: text('created_by').references(() => userAccounts.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditProjects = pgTable(
  'audit_projects',
  {
    id: text('id').primaryKey(),
    enterpriseId: text('enterprise_id')
      .notNull()
      .references(() => enterprises.id, { onDelete: 'cascade' }),
    batchId: text('batch_id')
      .notNull()
      .references(() => auditBatches.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending_start'),
    businessType: text('business_type').notNull().default('energy_audit'),
    templateVersionId: text('template_version_id').references(
      () => templateVersions.id,
      { onDelete: 'set null' },
    ),
    deadline: timestamp('deadline', { withTimezone: true }),
    isOverdue: boolean('is_overdue').notNull().default(false),
    configComplete: boolean('config_complete').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.enterpriseId, table.batchId)],
);

export const projectMembers = pgTable(
  'project_members',
  {
    id: text('id').primaryKey(),
    auditProjectId: text('audit_project_id')
      .notNull()
      .references(() => auditProjects.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => userAccounts.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.auditProjectId, table.userId, table.role)],
);

export const enterpriseProfiles = pgTable('enterprise_profiles', {
  id: text('id').primaryKey(),
  auditProjectId: text('audit_project_id')
    .notNull()
    .references(() => auditProjects.id, { onDelete: 'cascade' }),
  enterpriseId: text('enterprise_id')
    .notNull()
    .references(() => enterprises.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  unifiedSocialCreditCode: text('unified_social_credit_code').notNull(),
  industryCode: text('industry_code'),
  contactPerson: text('contact_person'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  address: text('address'),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull().defaultNow(),
});

export const energyDefinitions = pgTable(
  'energy_definitions',
  {
    id: text('id').primaryKey(),
    enterpriseId: text('enterprise_id')
      .notNull()
      .references(() => enterprises.id, { onDelete: 'cascade' }),
    energyCode: text('energy_code').notNull(),
    name: text('name').notNull(),
    energyType: text('energy_type').notNull(),
    conversionFactor: numeric('conversion_factor').notNull(),
    measurementUnit: text('measurement_unit').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').default(0),
  },
  (table) => [unique().on(table.enterpriseId, table.energyCode)],
);

export const productDefinitions = pgTable(
  'product_definitions',
  {
    id: text('id').primaryKey(),
    enterpriseId: text('enterprise_id')
      .notNull()
      .references(() => enterprises.id, { onDelete: 'cascade' }),
    productCode: text('product_code').notNull(),
    name: text('name').notNull(),
    measurementUnit: text('measurement_unit').notNull(),
    unitDefinitionId: text('unit_definition_id'),
    processDescription: text('process_description'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').default(0),
  },
  (table) => [unique().on(table.enterpriseId, table.productCode)],
);

export const unitDefinitions = pgTable(
  'unit_definitions',
  {
    id: text('id').primaryKey(),
    enterpriseId: text('enterprise_id')
      .notNull()
      .references(() => enterprises.id, { onDelete: 'cascade' }),
    unitCode: text('unit_code').notNull(),
    name: text('name').notNull(),
    unitType: text('unit_type').notNull(),
    energyBoundaryDescription: text('energy_boundary_description'),
    associatedEnergyCodes: text('associated_energy_codes'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').default(0),
  },
  (table) => [unique().on(table.enterpriseId, table.unitCode)],
);

export const carbonEmissionFactors = pgTable('carbon_emission_factors', {
  id: text('id').primaryKey(),
  energyCode: text('energy_code').notNull(),
  name: text('name').notNull(),
  emissionFactor: numeric('emission_factor').notNull(),
  oxidationRate: numeric('oxidation_rate').notNull().default('1.0'),
  standardSource: text('standard_source'),
  applicableYear: integer('applicable_year'),
  measurementUnit: text('measurement_unit').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dataRecords = pgTable(
  'data_records',
  {
    id: text('id').primaryKey(),
    auditProjectId: text('audit_project_id')
      .notNull()
      .references(() => auditProjects.id, { onDelete: 'cascade' }),
    moduleCode: text('module_code').notNull(),
    status: text('status').notNull().default('draft'),
    templateVersionId: text('template_version_id').references(
      () => templateVersions.id,
      { onDelete: 'set null' },
    ),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    returnReason: text('return_reason'),
    returnedBy: text('returned_by').references(() => userAccounts.id, { onDelete: 'set null' }),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
    lockHolderId: text('lock_holder_id').references(() => userAccounts.id, {
      onDelete: 'set null',
    }),
    lockAcquiredAt: timestamp('lock_acquired_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.auditProjectId, table.moduleCode)],
);

export const dataItems = pgTable(
  'data_items',
  {
    id: text('id').primaryKey(),
    dataRecordId: text('data_record_id')
      .notNull()
      .references(() => dataRecords.id, { onDelete: 'cascade' }),
    fieldCode: text('field_code').notNull(),
    rawValue: text('raw_value'),
    calculatedValue: text('calculated_value'),
    manualOverrideValue: text('manual_override_value'),
    finalValue: text('final_value'),
    unit: text('unit'),
  },
  (table) => [unique().on(table.dataRecordId, table.fieldCode)],
);

export const importJobs = pgTable('import_jobs', {
  id: text('id').primaryKey(),
  auditProjectId: text('audit_project_id')
    .notNull()
    .references(() => auditProjects.id, { onDelete: 'cascade' }),
  moduleCode: text('module_code').notNull(),
  fileAttachmentId: text('file_attachment_id')
    .notNull()
    .references(() => attachments.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  totalRows: integer('total_rows'),
  successRows: integer('success_rows'),
  failedRows: integer('failed_rows'),
  errors: text('errors'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const validationResults = pgTable(
  'validation_results',
  {
    id: text('id').primaryKey(),
    dataRecordId: text('data_record_id')
      .notNull()
      .references(() => dataRecords.id, { onDelete: 'cascade' }),
    ruleCode: text('rule_code').notNull(),
    ruleType: text('rule_type').notNull(),
    moduleCode: text('module_code').notNull(),
    fieldCode: text('field_code'),
    severity: text('severity').notNull(),
    message: text('message').notNull(),
    fixSuggestion: text('fix_suggestion'),
    blocksSubmission: boolean('blocks_submission').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_validation_results_record').on(table.dataRecordId)],
);

export const calculationSnapshots = pgTable(
  'calculation_snapshots',
  {
    id: text('id').primaryKey(),
    auditProjectId: text('audit_project_id')
      .notNull()
      .references(() => auditProjects.id, { onDelete: 'cascade' }),
    calculationType: text('calculation_type').notNull(),
    result: text('result').notNull(),
    ruleVersionId: text('rule_version_id'),
    parametersSnapshot: text('parameters_snapshot'),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
    isLatest: boolean('is_latest').notNull().default(true),
  },
  (table) => [index('idx_calc_snapshots_project').on(table.auditProjectId)],
);

// ==================== Result Output Objects ====================

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  auditProjectId: text('audit_project_id')
    .notNull()
    .references(() => auditProjects.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  versionType: text('version_type').notNull(),
  status: text('status').notNull().default('not_generated'),
  templateVersionId: text('template_version_id').references(
    () => templateVersions.id,
    { onDelete: 'set null' },
  ),
  fileAttachmentId: text('file_attachment_id').references(() => attachments.id, {
    onDelete: 'set null',
  }),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chartOutputs = pgTable('chart_outputs', {
  id: text('id').primaryKey(),
  auditProjectId: text('audit_project_id')
    .notNull()
    .references(() => auditProjects.id, { onDelete: 'cascade' }),
  chartConfigCode: text('chart_config_code').notNull(),
  chartType: text('chart_type').notNull(),
  title: text('title').notNull(),
  data: text('data').notNull(),
  calculationSnapshotId: text('calculation_snapshot_id').references(
    () => calculationSnapshots.id,
    { onDelete: 'set null' },
  ),
  isMandatory: boolean('is_mandatory').notNull().default(false),
  embeddedInReport: boolean('embedded_in_report').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviewTasks = pgTable('review_tasks', {
  id: text('id').primaryKey(),
  auditProjectId: text('audit_project_id')
    .notNull()
    .references(() => auditProjects.id, { onDelete: 'cascade' }),
  reportId: text('report_id')
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  reviewerId: text('reviewer_id')
    .notNull()
    .references(() => userAccounts.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('pending_assignment'),
  conclusion: text('conclusion'),
  totalScore: numeric('total_score'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviewScores = pgTable('review_scores', {
  id: text('id').primaryKey(),
  reviewTaskId: text('review_task_id')
    .notNull()
    .references(() => reviewTasks.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  score: numeric('score').notNull(),
  maxScore: numeric('max_score').notNull(),
  comment: text('comment'),
});

export const reviewIssues = pgTable('review_issues', {
  id: text('id').primaryKey(),
  reviewTaskId: text('review_task_id')
    .notNull()
    .references(() => reviewTasks.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  severity: text('severity').notNull(),
  moduleCode: text('module_code'),
  fieldCode: text('field_code'),
  suggestion: text('suggestion'),
  requiresRectification: boolean('requires_rectification').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rectificationTasks = pgTable('rectification_tasks', {
  id: text('id').primaryKey(),
  auditProjectId: text('audit_project_id')
    .notNull()
    .references(() => auditProjects.id, { onDelete: 'cascade' }),
  reviewTaskId: text('review_task_id')
    .notNull()
    .references(() => reviewTasks.id, { onDelete: 'cascade' }),
  sourceIssueId: text('source_issue_id').references(() => reviewIssues.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending_issue'),
  deadline: timestamp('deadline', { withTimezone: true }),
  isOverdue: boolean('is_overdue').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rectificationProgress = pgTable('rectification_progress', {
  id: text('id').primaryKey(),
  rectificationTaskId: text('rectification_task_id')
    .notNull()
    .references(() => rectificationTasks.id, { onDelete: 'cascade' }),
  progressPercent: integer('progress_percent').notNull().default(0),
  note: text('note').notNull(),
  attachmentIds: text('attachment_ids'),
  recordedBy: text('recorded_by')
    .notNull()
    .references(() => userAccounts.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==================== Business Type & Module Visibility ====================

export const moduleVisibility = pgTable(
  'module_visibility',
  {
    id: text('id').primaryKey(),
    businessType: text('business_type').notNull(),
    moduleCode: text('module_code').notNull(),
    isVisible: boolean('is_visible').notNull().default(true),
    isRequired: boolean('is_required').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.businessType, table.moduleCode),
    index('idx_module_visibility_business_type').on(table.businessType),
  ],
);

export const businessTypeConfig = pgTable('business_type_config', {
  id: text('id').primaryKey(),
  businessType: text('business_type').notNull().unique(),
  label: text('label').notNull(),
  description: text('description'),
  defaultTemplateId: text('default_template_id'),
  reportTemplateId: text('report_template_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==================== Enterprise Admission & Sync Logs ====================

export const enterpriseApplications = pgTable(
  'enterprise_applications',
  {
    id: text('id').primaryKey(),
    enterpriseId: text('enterprise_id')
      .notNull()
      .references(() => enterprises.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    reason: text('reason'),
    operatedBy: text('operated_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_enterprise_applications_enterprise').on(table.enterpriseId),
    index('idx_enterprise_applications_created').on(table.createdAt),
  ],
);

export const syncLogs = pgTable(
  'sync_logs',
  {
    id: text('id').primaryKey(),
    enterpriseId: text('enterprise_id')
      .notNull()
      .references(() => enterprises.id, { onDelete: 'cascade' }),
    bindingId: text('binding_id')
      .notNull()
      .references(() => enterpriseExternalBindings.id, { onDelete: 'cascade' }),
    syncType: text('sync_type').notNull(),
    status: text('status').notNull(),
    requestPayload: text('request_payload'),
    responsePayload: text('response_payload'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_sync_logs_enterprise').on(table.enterpriseId),
    index('idx_sync_logs_binding').on(table.bindingId),
  ],
);

// ==================== Project Lifecycle ====================

export const projectStatusTransitions = pgTable(
  'project_status_transitions',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => auditProjects.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    transitionedAt: timestamp('transitioned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    userId: text('user_id').references(() => userAccounts.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
  },
  (table) => [
    index('idx_project_transitions_project').on(table.projectId),
    index('idx_project_transitions_timestamp').on(table.transitionedAt),
  ],
);

export const projectSnapshots = pgTable(
  'project_snapshots',
  {
    id: text('id').primaryKey(),
    auditProjectId: text('audit_project_id')
      .notNull()
      .references(() => auditProjects.id, { onDelete: 'cascade' }),
    snapshotType: text('snapshot_type').notNull(),
    data: text('data').notNull().default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_project_snapshots_project').on(table.auditProjectId)],
);

// ==================== Data Collection Framework ====================

export const dataModules = pgTable(
  'data_modules',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    fieldSchema: jsonb('field_schema'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_data_modules_category').on(table.category)],
);

export const dataFields = pgTable(
  'data_fields',
  {
    id: text('id').primaryKey(),
    moduleId: text('module_id')
      .notNull()
      .references(() => dataModules.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    fieldType: text('field_type').notNull().default('text'),
    constraints: jsonb('constraints'),
    displayRules: jsonb('display_rules'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.moduleId, table.code),
    index('idx_data_fields_module').on(table.moduleId),
  ],
);

export const validationRules = pgTable(
  'validation_rules',
  {
    id: text('id').primaryKey(),
    moduleCode: text('module_code').notNull(),
    ruleCode: text('rule_code').notNull().unique(),
    layer: integer('layer').notNull().default(1),
    severity: text('severity').notNull().default('error'),
    expression: text('expression').notNull(),
    message: text('message').notNull(),
    fieldCodes: text('field_codes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_validation_rules_module').on(table.moduleCode),
    index('idx_validation_rules_layer').on(table.layer),
  ],
);

export const calculationRules = pgTable(
  'calculation_rules',
  {
    id: text('id').primaryKey(),
    moduleCode: text('module_code').notNull(),
    ruleCode: text('rule_code').notNull().unique(),
    expression: text('expression').notNull(),
    dependencies: jsonb('dependencies'),
    outputFieldCode: text('output_field_code').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_calculation_rules_module').on(table.moduleCode)],
);

export const dataLocks = pgTable(
  'data_locks',
  {
    id: text('id').primaryKey(),
    recordId: text('record_id').notNull().unique(),
    userId: text('user_id').notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_data_locks_record').on(table.recordId),
    index('idx_data_locks_expires').on(table.expiresAt),
  ],
);

// ==================== Reporting & Benchmarks ====================

export const reportVersions = pgTable(
  'report_versions',
  {
    id: text('id').primaryKey(),
    reportId: text('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    versionType: text('version_type').notNull(),
    versionNumber: integer('version_number').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    fileUrl: text('file_url'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_report_versions_report').on(table.reportId)],
);

export const reportSections = pgTable(
  'report_sections',
  {
    id: text('id').primaryKey(),
    reportId: text('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    reportVersionId: text('report_version_id').references(() => reportVersions.id, { onDelete: 'cascade' }),
    sectionCode: text('section_code').notNull(),
    sectionName: text('section_name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    content: text('content'),
    charts: jsonb('charts'),
  },
  (table) => [index('idx_report_sections_report').on(table.reportId)],
);

export const chartConfigs = pgTable('chart_configs', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  chartType: text('chart_type').notNull(),
  moduleCode: text('module_code'),
  metrics: jsonb('metrics'),
  dimensions: jsonb('dimensions'),
});

export const benchmarkValues = pgTable(
  'benchmark_values',
  {
    id: text('id').primaryKey(),
    industryCode: text('industry_code').notNull(),
    indicatorCode: text('indicator_code').notNull(),
    benchmarkValue: numeric('benchmark_value').notNull(),
    year: integer('year'),
    source: text('source'),
  },
  (table) => [
    index('idx_benchmark_values_industry').on(table.industryCode),
    index('idx_benchmark_values_indicator').on(table.indicatorCode),
  ],
);

// ==================== Notification System ====================

// ==================== Config Override Engine ====================

export const configOverrides = pgTable(
  'config_overrides',
  {
    id: text('id').primaryKey(),
    scopeType: text('scope_type').notNull(), // 'platform' | 'batch_template' | 'enterprise_type' | 'enterprise'
    scopeId: text('scope_id'), // null for platform, batchId / industryCode / enterpriseId
    targetType: text('target_type').notNull(), // 'module' | 'field' | 'validation_rule'
    targetCode: text('target_code').notNull(), // moduleCode or fieldCode or ruleCode
    configJson: jsonb('config_json').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: text('created_by').references(() => userAccounts.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.scopeType, table.scopeId, table.targetType, table.targetCode),
    index('idx_config_overrides_scope').on(table.scopeType, table.scopeId),
    index('idx_config_overrides_target').on(table.targetType, table.targetCode),
  ],
);

// ==================== Validation Exceptions ====================

export const validationExceptions = pgTable(
  'validation_exceptions',
  {
    id: text('id').primaryKey(),
    dataRecordId: text('data_record_id')
      .notNull()
      .references(() => dataRecords.id, { onDelete: 'cascade' }),
    validationResultId: text('validation_result_id')
      .notNull()
      .references(() => validationResults.id, { onDelete: 'cascade' }),
    explanation: text('explanation').notNull(),
    submittedBy: text('submitted_by')
      .notNull()
      .references(() => userAccounts.id),
    approvedBy: text('approved_by').references(() => userAccounts.id),
    approvalStatus: text('approval_status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
    rejectionReason: text('rejection_reason'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_validation_exceptions_record').on(table.dataRecordId),
    index('idx_validation_exceptions_status').on(table.approvalStatus),
  ],
);

// ==================== Notification System ====================

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => userAccounts.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    relatedType: text('related_type'),
    relatedId: text('related_id'),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_notifications_recipient').on(table.recipientId),
    index('idx_notifications_unread').on(table.recipientId, table.isRead),
  ],
);
