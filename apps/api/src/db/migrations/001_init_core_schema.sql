create table enterprises (
  id text primary key,
  unified_social_credit_code text not null unique,
  name text not null,
  status text not null
);

create table enterprise_external_bindings (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  external_system text not null,
  external_id text not null,
  sync_status text not null,
  unique (external_system, external_id)
);

create table user_accounts (
  id text primary key,
  enterprise_id text references enterprises (id) on delete set null,
  email text not null unique,
  role text not null,
  status text not null
);

create table audit_batches (
  id text primary key,
  name text not null,
  year integer not null,
  status text not null,
  template_version_id text
);

create table audit_projects (
  id text primary key,
  enterprise_id text not null references enterprises (id) on delete cascade,
  batch_id text not null references audit_batches (id) on delete cascade,
  status text not null,
  unique (enterprise_id, batch_id)
);

create table reports (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  version integer not null,
  version_type text not null,
  status text not null
);

create table review_tasks (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  report_id text not null references reports (id) on delete cascade,
  reviewer_id text not null references user_accounts (id) on delete restrict,
  status text not null
);

create table rectification_tasks (
  id text primary key,
  audit_project_id text not null references audit_projects (id) on delete cascade,
  review_task_id text not null references review_tasks (id) on delete cascade,
  title text not null,
  status text not null
);
