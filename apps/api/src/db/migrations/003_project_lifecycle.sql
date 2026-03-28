-- ============================================================
-- 003 项目生命周期管理
-- 审计项目状态流转记录、项目快照、额外索引
-- ============================================================

-- 项目状态流转记录表
CREATE TABLE IF NOT EXISTS project_status_transitions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES audit_projects(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_project_transitions_project ON project_status_transitions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_transitions_timestamp ON project_status_transitions(transitioned_at);

-- 项目配置/数据快照表
CREATE TABLE IF NOT EXISTS project_snapshots (
    id TEXT PRIMARY KEY,
    audit_project_id TEXT NOT NULL REFERENCES audit_projects(id) ON DELETE CASCADE,
    snapshot_type TEXT NOT NULL,
    data TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_snapshots_project ON project_snapshots(audit_project_id);

-- 审计项目额外索引
CREATE INDEX IF NOT EXISTS idx_audit_projects_status ON audit_projects(status);
CREATE INDEX IF NOT EXISTS idx_audit_projects_batch ON audit_projects(batch_id);
CREATE INDEX IF NOT EXISTS idx_audit_projects_enterprise ON audit_projects(enterprise_id);

-- 审计批次额外索引
CREATE INDEX IF NOT EXISTS idx_audit_batches_year ON audit_batches(year);
CREATE INDEX IF NOT EXISTS idx_audit_batches_status ON audit_batches(status);
