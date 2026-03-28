-- ============================================================
-- 002 企业准入工作流 & 同步日志
-- ============================================================

-- 企业准入申请表 (追踪准入工作流)
create table enterprise_applications (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  action text not null,
  from_status text not null,
  to_status text not null,
  reason text,
  operated_by text not null,
  created_at timestamptz not null default now()
);
create index idx_enterprise_applications_enterprise on enterprise_applications (enterprise_id);
create index idx_enterprise_applications_created on enterprise_applications (created_at);

-- 外部同步日志表
create table sync_logs (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  binding_id text not null references enterprise_external_bindings (id) on delete cascade,
  sync_type text not null,
  status text not null,
  request_payload text,
  response_payload text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index idx_sync_logs_enterprise on sync_logs (enterprise_id);
create index idx_sync_logs_binding on sync_logs (binding_id);

-- 企业表额外索引
create index idx_enterprises_credit_code on enterprises (unified_social_credit_code);

-- 外部绑定表额外索引
create index idx_external_bindings_external_id on enterprise_external_bindings (external_id);
