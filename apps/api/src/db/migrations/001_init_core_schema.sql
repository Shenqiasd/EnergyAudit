-- ============================================================
-- 001 初始化核心 Schema
-- 对齐设计文档 第5章 核心业务对象与数据模型
-- ============================================================

-- ==================== 平台核心对象 ====================

-- 角色表
create table roles (
  id text primary key,
  code text not null unique,
  name text not null,
  description text,
  is_builtin boolean not null default false
);

-- 权限表
create table permissions (
  id text primary key,
  code text not null unique,
  name text not null,
  "group" text not null
);

-- 角色-权限关联表
create table role_permissions (
  role_id text not null references roles (id) on delete cascade,
  permission_id text not null references permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- 字典表
create table dictionaries (
  id text primary key,
  category text not null,
  code text not null,
  name text not null,
  parent_code text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata text,
  unique (category, code)
);

-- 模板主表
create table templates (
  id text primary key,
  code text not null unique,
  name text not null,
  description text,
  active_version_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 模板版本表
create table template_versions (
  id text primary key,
  template_id text not null references templates (id) on delete cascade,
  version_number integer not null,
  version_label text,
  is_active boolean not null default false,
  module_config_snapshot text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, version_number)
);

-- 回填模板外键
alter table templates
  add constraint fk_templates_active_version
  foreign key (active_version_id) references template_versions (id) on delete set null;

-- 统一附件表
create table attachments (
  id text primary key,
  owner_type text not null,
  owner_id text not null,
  file_name text not null,
  file_size bigint not null,
  mime_type text not null,
  storage_path text not null,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);
create index idx_attachments_owner on attachments (owner_type, owner_id);

-- 审计日志表
create table audit_logs (
  id text primary key,
  user_id text not null,
  user_role text not null,
  action text not null,
  target_type text,
  target_id text,
  detail text,
  ip_address text,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_user on audit_logs (user_id);
create index idx_audit_logs_target on audit_logs (target_type, target_id);
create index idx_audit_logs_created on audit_logs (created_at);

-- ==================== 企业与用户 ====================

-- 企业主档案 (对齐设计文档 6.1 企业准入状态)
create table enterprises (
  id text primary key,
  unified_social_credit_code text not null unique,
  name text not null,
  admission_status text not null default 'pending_review',
  industry_code text,
  contact_person text,
  contact_phone text,
  contact_email text,
  address text,
  notes text,
  expiry_date timestamptz,
  last_login_at timestamptz,
  sort_order integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 企业外部绑定 (对齐设计文档 11.4 绑定机制)
create table enterprise_external_bindings (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  external_system text not null,
  external_id text not null,
  sync_status text not null default 'pending',
  last_synced_at timestamptz,
  last_successful_snapshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_system, external_id)
);

-- 用户账号
create table user_accounts (
  id text primary key,
  enterprise_id text references enterprises (id) on delete set null,
  email text not null unique,
  name text not null,
  phone text,
  role text not null,
  status text not null default 'active',
  external_identity_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==================== 业务运行对象 ====================

-- 审计批次
create table audit_batches (
  id text primary key,
  name text not null,
  year integer not null,
  status text not null default 'draft',
  template_version_id text references template_versions (id) on delete set null,
  description text,
  filing_deadline timestamptz,
  review_deadline timestamptz,
  created_by text references user_accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 审计项目 (对齐设计文档 6.2 审计项目状态 12 状态)
create table audit_projects (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  batch_id text not null references audit_batches (id) on delete cascade,
  status text not null default 'pending_start',
  template_version_id text references template_versions (id) on delete set null,
  deadline timestamptz,
  is_overdue boolean not null default false,
  config_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enterprise_id, batch_id)
);

-- 项目成员
create table project_members (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  user_id text not null references user_accounts (id) on delete cascade,
  role text not null,
  joined_at timestamptz not null default now(),
  unique (audit_project_id, user_id, role)
);

-- 审计期企业信息快照
create table enterprise_profiles (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  enterprise_id text not null references enterprises (id) on delete cascade,
  name text not null,
  unified_social_credit_code text not null,
  industry_code text,
  contact_person text,
  contact_phone text,
  contact_email text,
  address text,
  snapshot_at timestamptz not null default now()
);

-- 企业级能源品种定义
create table energy_definitions (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  energy_code text not null,
  name text not null,
  energy_type text not null,
  conversion_factor numeric not null,
  measurement_unit text not null,
  is_active boolean not null default true,
  sort_order integer default 0,
  unique (enterprise_id, energy_code)
);

-- 企业级产品定义
create table product_definitions (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  product_code text not null,
  name text not null,
  measurement_unit text not null,
  unit_definition_id text,
  process_description text,
  is_active boolean not null default true,
  sort_order integer default 0,
  unique (enterprise_id, product_code)
);

-- 企业级单元定义
create table unit_definitions (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  unit_code text not null,
  name text not null,
  unit_type text not null,
  energy_boundary_description text,
  associated_energy_codes text,
  is_active boolean not null default true,
  sort_order integer default 0,
  unique (enterprise_id, unit_code)
);

-- 回填产品->单元外键
alter table product_definitions
  add constraint fk_product_unit
  foreign key (unit_definition_id) references unit_definitions (id) on delete set null;

-- 碳排放因子
create table carbon_emission_factors (
  id text primary key,
  energy_code text not null,
  name text not null,
  emission_factor numeric not null,
  oxidation_rate numeric not null default 1.0,
  standard_source text,
  applicable_year integer,
  measurement_unit text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 填报记录 (对齐设计文档 6.3 填报记录状态 7 状态)
create table data_records (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  module_code text not null,
  status text not null default 'draft',
  template_version_id text references template_versions (id) on delete set null,
  submitted_at timestamptz,
  return_reason text,
  lock_holder_id text references user_accounts (id) on delete set null,
  lock_acquired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (audit_project_id, module_code)
);

-- 字段级数据项
create table data_items (
  id text primary key,
  data_record_id text not null references data_records (id) on delete cascade,
  field_code text not null,
  raw_value text,
  calculated_value text,
  manual_override_value text,
  final_value text,
  unit text,
  unique (data_record_id, field_code)
);

-- 导入任务
create table import_jobs (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  module_code text not null,
  file_attachment_id text not null references attachments (id) on delete cascade,
  status text not null default 'pending',
  total_rows integer,
  success_rows integer,
  failed_rows integer,
  errors text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 校验结果 (对齐设计文档 9.6 执行结果结构)
create table validation_results (
  id text primary key,
  data_record_id text not null references data_records (id) on delete cascade,
  rule_code text not null,
  rule_type text not null,
  module_code text not null,
  field_code text,
  severity text not null,
  message text not null,
  fix_suggestion text,
  blocks_submission boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_validation_results_record on validation_results (data_record_id);

-- 计算结果快照 (对齐设计文档 9.8 关键计算原则)
create table calculation_snapshots (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  calculation_type text not null,
  result text not null,
  rule_version_id text,
  parameters_snapshot text,
  calculated_at timestamptz not null default now(),
  is_latest boolean not null default true
);
create index idx_calc_snapshots_project on calculation_snapshots (audit_project_id);

-- ==================== 结果输出对象 ====================

-- 报告 (对齐设计文档 6.4 报告状态 8 状态)
create table reports (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  version integer not null,
  version_type text not null,
  status text not null default 'not_generated',
  template_version_id text references template_versions (id) on delete set null,
  file_attachment_id text references attachments (id) on delete set null,
  generated_at timestamptz,
  submitted_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 图表输出
create table chart_outputs (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  chart_config_code text not null,
  chart_type text not null,
  title text not null,
  data text not null,
  calculation_snapshot_id text references calculation_snapshots (id) on delete set null,
  is_mandatory boolean not null default false,
  embedded_in_report boolean not null default false,
  created_at timestamptz not null default now()
);

-- 审核任务 (对齐设计文档 6.5 审核任务状态 7 状态)
create table review_tasks (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  report_id text not null references reports (id) on delete cascade,
  reviewer_id text not null references user_accounts (id) on delete restrict,
  status text not null default 'pending_assignment',
  conclusion text,
  total_score numeric,
  assigned_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 审核评分
create table review_scores (
  id text primary key,
  review_task_id text not null references review_tasks (id) on delete cascade,
  category text not null,
  score numeric not null,
  max_score numeric not null,
  comment text
);

-- 审核问题
create table review_issues (
  id text primary key,
  review_task_id text not null references review_tasks (id) on delete cascade,
  description text not null,
  severity text not null,
  module_code text,
  field_code text,
  suggestion text,
  requires_rectification boolean not null default false,
  created_at timestamptz not null default now()
);

-- 整改任务 (对齐设计文档 6.6 整改任务状态 7 状态)
create table rectification_tasks (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  review_task_id text not null references review_tasks (id) on delete cascade,
  source_issue_id text references review_issues (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending_issue',
  deadline timestamptz,
  is_overdue boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 整改进度
create table rectification_progress (
  id text primary key,
  rectification_task_id text not null references rectification_tasks (id) on delete cascade,
  progress_percent integer not null default 0,
  note text not null,
  attachment_ids text,
  recorded_by text not null references user_accounts (id) on delete restrict,
  created_at timestamptz not null default now()
);
